// services/matchingService.js
// ✅ Fixes :
//   1. Application.findById() inclut maintenant le champ `needs` (était ignoré)
//   2. Prompts LLM raccourcis pour éviter le timeout Ollama sur Mistral local
//   3. num_predict réduit à 400 (suffisant pour le JSON de matching)

const Application   = require('../models/Application');
const Investor      = require('../models/Investor');
const User          = require('../models/User');
const Match         = require('../models/Match');
const ollamaService = require('./ollamaService');

class MatchingService {

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  extractAmount(amountStr) {
    if (!amountStr) return 0;
    const match = String(amountStr).match(/(\d+(?:\.\d+)?)/);
    if (!match) return 0;
    let amount = parseFloat(match[1]);
    const lower = String(amountStr).toLowerCase();
    if (lower.includes('k')) amount *= 1_000;
    if (lower.includes('m')) amount *= 1_000_000;
    return amount;
  }

  normalizeStage(stage) {
    const mapping = {
      'idea':           'Pré-amorçage',
      'prototype':      'Pré-amorçage',
      'mvp':            'Amorçage',
      'early_traction': 'Amorçage',
      'scaling':        'Série A',
      'croissance':     'Série A',
      'pre-seed':       'Pré-amorçage',
      'seed':           'Amorçage',
      'series a':       'Série A',
      'series b':       'Série B',
    };
    return mapping[stage?.toLowerCase()] || stage;
  }

  // ✅ FIX 1 : buildNeedsSummary reçoit l'application complète avec needs chargés
  buildNeedsSummary(application) {
    const needs   = application.needs   || {};
    const project = application.project || {};
    const economy = application.economy || {};
    const team    = application.team    || {};

    const lines = [];

    if (needs.investorProfile)  lines.push(`Profil investisseur: ${needs.investorProfile}`);
    if (needs.fundingUrgency)   lines.push(`Urgence: ${needs.fundingUrgency}`);
    if (economy.useOfFunds)     lines.push(`Utilisation fonds: ${economy.useOfFunds}`);
    if (economy.currentRevenue) lines.push(`Revenus: ${economy.currentRevenue}`);
    if (needs.mentorProfile)    lines.push(`Profil mentor: ${needs.mentorProfile}`);
    if (needs.currentChallenge) lines.push(`Défi: ${needs.currentChallenge}`);

    // Booléens — ne les ajouter que s'ils sont vrais pour raccourcir le prompt
    if (needs.networkHelp)       lines.push('Besoin: réseau/introductions');
    if (needs.technicalHelp)     lines.push('Besoin: aide technique');
    if (needs.goToMarketHelp)    lines.push('Besoin: go-to-market');
    if (needs.internationalHelp) lines.push('Besoin: expansion internationale');
    if (needs.fundraisingHelp)   lines.push('Besoin: levée de fonds');
    if (needs.operationsHelp)    lines.push('Besoin: structuration opérationnelle');

    if (project.targetMarket)   lines.push(`Marché: ${project.targetMarket}`);
    if (team.teamSize)          lines.push(`Équipe: ${team.teamSize} personnes`);

    return lines.length > 0
      ? lines.join('\n')
      : 'Non renseignés — basez-vous sur le secteur et le stade.';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HARD FILTERS (inchangés)
  // ═══════════════════════════════════════════════════════════════════════════

  hardFilterJury(application, juryMembers) {
    const sector = application.project?.sector?.toLowerCase();
    if (!sector) return juryMembers;
    return juryMembers.filter(jury => {
      if (!jury.expertise?.length) return true;
      return jury.expertise.some(exp =>
        sector.includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector)
      );
    });
  }

  hardFilterInvestors(application, investors) {
    const sector      = application.project?.sector?.toLowerCase();
    const fundingGoal = this.extractAmount(application.economy?.fundingGoal);

    return investors.filter(investor => {
      if (investor.active === false) return false;
      if (investor.secteurs?.length > 0 && sector) {
        const hit = investor.secteurs.some(s =>
          sector.includes(s.toLowerCase()) || s.toLowerCase().includes(sector)
        );
        if (!hit) return false;
      }
      if (fundingGoal > 0) {
        if (investor.ticketMax && fundingGoal > investor.ticketMax * 2) return false;
        if (investor.ticketMin && fundingGoal < investor.ticketMin / 2) return false;
      }
      return true;
    });
  }

  hardFilterMentors(application, mentors) {
    const sector = application.project?.sector?.toLowerCase();
    return mentors.filter(mentor => {
      if (!mentor.expertise?.length) return true;
      return mentor.expertise.some(exp =>
        sector?.includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector || '')
      );
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM SCORING — JURY
  // ✅ FIX 2 : prompt raccourci pour réduire le temps d'inférence
  // ═══════════════════════════════════════════════════════════════════════════

  async scoreJuryWithLLM(application, juryMember) {
    const project = application.project || {};

    // Prompt compact — une seule ligne par section
    const prompt = `Évalue l'adéquation jury-startup. JSON uniquement, pas de texte avant/après.
STARTUP: ${project.startupName || 'N/A'} | Secteur: ${project.sector || 'N/A'} | Stade: ${project.stage || 'N/A'}
JURY: ${juryMember.name} | Expertise: ${juryMember.expertise?.join(', ') || 'Généraliste'}
SCORING: sectorAlignment(0-40) stageRelevance(0-30) addedValue(0-30)
JSON: {"score":<0-100>,"criteria":{"sectorAlignment":<0-40>,"stageRelevance":<0-30>,"addedValue":<0-30>},"reasoning":"<1 phrase>","highlights":["<point1>"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 200 });
      const clean    = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const start    = clean.indexOf('{');
      const end      = clean.lastIndexOf('}');
      const parsed   = JSON.parse(clean.substring(start, end + 1));
      return {
        juryId:     juryMember._id,
        juryName:   juryMember.name,
        expertise:  juryMember.expertise || [],
        score:      Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
        criteria:   parsed.criteria   || {},
        reasoning:  parsed.reasoning  || 'Expertise pertinente',
        highlights: parsed.highlights || [],
      };
    } catch {
      return {
        juryId:     juryMember._id,
        juryName:   juryMember.name,
        expertise:  juryMember.expertise || [],
        score:      50,
        criteria:   {},
        reasoning:  'Profil jury standard',
        highlights: [],
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM SCORING — INVESTOR
  // ✅ FIX 2 : prompt raccourci, besoins inclus
  // ═══════════════════════════════════════════════════════════════════════════

  async scoreInvestorWithLLM(application, investor) {
    const project = application.project || {};
    const economy = application.economy || {};
    const team    = application.team    || {};

    const needsSummary = this.buildNeedsSummary(application);

    // Prompt compact — sections courtes, JSON attendu minimal
    const prompt = `Matching startup-investisseur MEDIANET Incubator. JSON uniquement.
STARTUP: ${project.startupName || 'N/A'} | Secteur: ${project.sector || 'N/A'} | Stade: ${project.stage || 'N/A'} | Financement: ${economy.fundingGoal || 'N/A'} | Fondateur: ${team.founderName || 'N/A'}
BESOINS: ${needsSummary.substring(0, 300)}
INVESTISSEUR: ${investor.nom || investor.name || 'N/A'} | Type: ${investor.type || 'N/A'} | Secteurs: ${investor.secteurs?.join(', ') || 'Tous'} | Stades: ${investor.stages?.join(', ') || 'Tous'} | Ticket: ${investor.ticketMin || 0}-${investor.ticketMax || '∞'} TND | Valeur: ${(investor.valueAdd || investor.description || 'N/A').substring(0, 80)}
SCORING(100pts): sectorMatch(0-25) stageMatch(0-20) ticketMatch(0-20) needsMatch(0-20) startupQuality(0-15)
JSON: {"score":<0-100>,"criteria":{"sectorMatch":<0-25>,"stageMatch":<0-20>,"ticketMatch":<0-20>,"needsMatch":<0-20>,"startupQuality":<0-15>},"reasoning":"<2 phrases>","highlights":["<point1>","<point2>"],"risks":["<risque1>"],"needsMatch":["<besoin couvert>"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 400 });
      const clean    = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const start    = clean.indexOf('{');
      const end      = clean.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON');
      const parsed = JSON.parse(clean.substring(start, end + 1));

      return {
        investorId:   investor._id,
        investorName: investor.nom || investor.name,
        investorType: investor.type || 'Investisseur',
        score:        Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
        criteria:     parsed.criteria  || {},
        reasoning:    parsed.reasoning || `${investor.nom || investor.name} correspond au profil de ${project.startupName}`,
        highlights:   Array.isArray(parsed.highlights) ? parsed.highlights : [],
        risks:        Array.isArray(parsed.risks)       ? parsed.risks       : [],
        needsMatch:   Array.isArray(parsed.needsMatch)  ? parsed.needsMatch  : [],
      };
    } catch (error) {
      console.error('scoreInvestorWithLLM error:', error.message);
      return this._fallbackInvestorScore(application, investor);
    }
  }

  // Fallback rule-based — capé à 75 pour le distinguer d'un vrai score LLM
  _fallbackInvestorScore(application, investor) {
    const project     = application.project || {};
    const economy     = application.economy || {};
    const needs       = application.needs   || {};
    const rawScore    = this.fallbackScore(application, investor);
    const score       = Math.min(75, rawScore);
    const sectorMatch = investor.secteurs?.some(s =>
      project.sector?.toLowerCase().includes(s.toLowerCase())
    );

    const coveredNeeds = [];
    if (needs.networkHelp      && investor.network)       coveredNeeds.push('Réseau et introductions');
    if (needs.internationalHelp && investor.international) coveredNeeds.push('Expansion internationale');
    if (sectorMatch)                                       coveredNeeds.push(`Expertise secteur ${project.sector}`);

    return {
      investorId:   investor._id,
      investorName: investor.nom || investor.name,
      investorType: investor.type || 'Investisseur',
      score,
      criteria:     {},
      reasoning:    `${investor.nom || investor.name} investit dans ${investor.secteurs?.join(', ') || 'tous secteurs'} ` +
                    `avec tickets ${investor.ticketMin || 0}–${investor.ticketMax || '∞'} TND. ` +
                    (sectorMatch
                      ? `Alignement sectoriel confirmé avec ${project.sector}.`
                      : `Profil généraliste compatible avec ${project.startupName}.`),
      highlights: sectorMatch
        ? [`Secteur ${project.sector} dans portfolio`, `Ticket adapté au stade ${project.stage}`]
        : ['Investisseur actif en Tunisie', 'Profil généraliste'],
      risks:      [`Vérifier adéquation ticket avec besoin ${economy.fundingGoal || 'N/A'}`],
      needsMatch: coveredNeeds,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM SCORING — MENTOR
  // ✅ FIX 2 : prompt raccourci, besoins inclus
  // ═══════════════════════════════════════════════════════════════════════════

  async scoreMentorWithLLM(application, mentor) {
    const project = application.project || {};
    const needs   = application.needs   || {};

    const mentorNeedsLines = [];
    if (needs.mentorProfile)     mentorNeedsLines.push(needs.mentorProfile);
    if (needs.currentChallenge)  mentorNeedsLines.push(needs.currentChallenge);
    if (needs.technicalHelp)     mentorNeedsLines.push('aide technique');
    if (needs.goToMarketHelp)    mentorNeedsLines.push('go-to-market');
    if (needs.networkHelp)       mentorNeedsLines.push('réseau');
    if (needs.internationalHelp) mentorNeedsLines.push('expansion internationale');
    if (needs.fundraisingHelp)   mentorNeedsLines.push('levée de fonds');
    if (needs.operationsHelp)    mentorNeedsLines.push('opérations');

    const mentorNeedsSummary = mentorNeedsLines.length > 0
      ? mentorNeedsLines.join(', ')
      : 'non renseignés';

    const prompt = `Matching mentor-startup MEDIANET Incubator. JSON uniquement.
STARTUP: ${project.startupName || 'N/A'} | Secteur: ${project.sector || 'N/A'} | Stade: ${project.stage || 'N/A'}
BESOINS MENTOR: ${mentorNeedsSummary}
MENTOR: ${mentor.name || mentor.email || 'N/A'} | Expertise: ${mentor.expertise?.join(', ') || 'Généraliste'} | Exp: ${mentor.experience || 'N/A'} ans
SCORING(100pts): needsMatch(0-35) sectorAlignment(0-25) stageRelevance(0-20) teamComplement(0-20)
JSON: {"score":<0-100>,"criteria":{"needsMatch":<0-35>,"sectorAlignment":<0-25>,"stageRelevance":<0-20>,"teamComplement":<0-20>},"reasoning":"<2 phrases>","highlights":["<point1>"],"coveredNeeds":["<besoin couvert>"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 300 });
      const clean    = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const start    = clean.indexOf('{');
      const end      = clean.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON');
      const parsed = JSON.parse(clean.substring(start, end + 1));
      return {
        mentorId:     mentor._id,
        mentorName:   mentor.name || mentor.email,
        expertise:    mentor.expertise || [],
        score:        Math.min(100, Math.max(0, parseInt(parsed.score) || 60)),
        criteria:     parsed.criteria    || {},
        reasoning:    parsed.reasoning   || `${mentor.name} accompagne ${project.startupName}`,
        highlights:   Array.isArray(parsed.highlights)   ? parsed.highlights   : mentor.expertise?.slice(0, 2) || [],
        coveredNeeds: Array.isArray(parsed.coveredNeeds) ? parsed.coveredNeeds : [],
      };
    } catch {
      const expertiseMatch = mentor.expertise?.some(exp =>
        project.sector?.toLowerCase().includes(exp.toLowerCase())
      );
      const coveredNeeds = [];
      if (needs.technicalHelp   && mentor.expertise?.some(e => ['tech','product','engineering','cto'].includes(e.toLowerCase())))
        coveredNeeds.push('Aide technique/produit');
      if (needs.goToMarketHelp  && mentor.expertise?.some(e => ['marketing','sales','growth','gtm'].includes(e.toLowerCase())))
        coveredNeeds.push('Go-to-market');
      if (needs.fundraisingHelp && mentor.expertise?.some(e => ['finance','fundraising','vc','investment'].includes(e.toLowerCase())))
        coveredNeeds.push('Levée de fonds');

      return {
        mentorId:     mentor._id,
        mentorName:   mentor.name || mentor.email,
        expertise:    mentor.expertise || [],
        score:        expertiseMatch ? 70 : 55,
        criteria:     {},
        reasoning:    `${mentor.name || mentor.email} apporte son expertise en ${mentor.expertise?.join(', ') || 'management'} pour ${project.startupName}.`,
        highlights:   mentor.expertise?.length ? mentor.expertise.slice(0, 2) : ['Management', 'Stratégie'],
        coveredNeeds,
      };
    }
  }

  // Rule-based fallback score
  fallbackScore(application, investor) {
    let score         = 40;
    const sector      = application.project?.sector?.toLowerCase();
    const fundingGoal = this.extractAmount(application.economy?.fundingGoal);
    const needs       = application.needs || {};

    if (investor.secteurs?.some(s => sector?.includes(s.toLowerCase()))) score += 25;
    if (fundingGoal > 0 && fundingGoal <= (investor.ticketMax || Infinity))  score += 15;
    if (fundingGoal > 0 && fundingGoal >= (investor.ticketMin || 0))         score += 15;
    if (needs.networkHelp      && investor.network)       score += 5;
    if (needs.internationalHelp && investor.international) score += 5;
    return Math.min(100, score);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSIST MATCH DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async persistInvestorMatches(application, scoredInvestors, adminUserId) {
    const startupId = application._id;
    const results   = [];

    for (const scored of scoredInvestors) {
      try {
        const match = await Match.findOneAndUpdate(
          { startup: startupId, investor: scored.investorId },
          {
            $set: { matchScore: scored.score },
            $setOnInsert: {
              startup:   startupId,
              investor:  scored.investorId,
              status:    'pending_founder_validation',
              createdBy: adminUserId,
            },
          },
          { upsert: true, new: true }
        );
        results.push(match);
        console.log(`     ✓ Match upserted: startup=${startupId} ↔ investor=${scored.investorId} (${scored.score}/100)`);
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`     ⚠ Match upsert error for investor ${scored.investorId}:`, err.message);
        }
      }
    }
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN MATCHING ENTRY POINT
  // ✅ FIX 1 : findById() sélectionne explicitement le champ `needs`
  //            pour qu'il soit disponible dans buildNeedsSummary()
  // ═══════════════════════════════════════════════════════════════════════════

  async matchApplication(applicationId, adminUserId = null) {
    console.log(`\n🔍 Matching pour application ${applicationId}`);

    // ✅ Ajout de `needs` dans la sélection — c'était la cause du "non renseignés"
    const application = await Application.findById(applicationId).select(
      'project economy team needs matching status applicant'
    );
    if (!application) throw new Error(`Application ${applicationId} non trouvée`);

    const status      = application.status;
    const startupName = application.project?.startupName || 'Inconnu';

    // ✅ Vérification enrichie — log les champs de needs pour débogage
    const needsKeys = application.needs ? Object.keys(application.needs) : [];
    const hasNeeds  = needsKeys.length > 0;
    console.log(`📋 Statut: ${status} — ${startupName}`);
    console.log(`   Besoins spécifiques: ${hasNeeds ? `✅ renseignés (${needsKeys.join(', ')})` : '⚠ non renseignés (matching générique)'}`);

    if (!adminUserId) {
      const admin = await User.findOne({ role: 'admin' }).select('_id');
      adminUserId = admin?._id || null;
    }

    application.matching = { ...application.matching, status: 'processing' };
    await application.save();

    try {
      let result = {};

      // ── Phase évaluation → scoring jury ──────────────────────────────────
      if (['draft', 'submitted', 'reviewing', 'pending'].includes(status)) {
        console.log('   → Mode: Évaluation (Jury)');

        const allJury  = await User.find({ role: 'jury', isActive: true });
        const filtered = this.hardFilterJury(application, allJury);
        const pool     = filtered.length > 0 ? filtered : allJury;

        console.log(`   - ${allJury.length} jury trouvés, ${pool.length} dans le pool`);

        const scoredJury = [];
        for (const jury of pool.slice(0, 5)) {
          const score = await this.scoreJuryWithLLM(application, jury);
          scoredJury.push(score);
          console.log(`     • ${jury.name}: ${score.score}/100`);
        }
        scoredJury.sort((a, b) => b.score - a.score);
        const topJury = scoredJury.slice(0, 3);

        application.matching = {
          jury:        topJury,
          investors:   [],
          mentors:     [],
          generatedAt: new Date(),
          lastUpdated: new Date(),
          status:      'completed',
        };
        result = { success: true, applicationId: application._id, startupName, mode: 'evaluation', jury: topJury };
      }

      // ── Phase incubation → scoring investisseurs + mentors ───────────────
      else if (['accepted', 'approved', 'interview', 'active'].includes(status)) {
        console.log('   → Mode: Accompagnement (Investisseurs + Mentors)');

        const allInvestors = await Investor.find({ active: { $ne: false } });
        const allMentors   = await User.find({ role: 'mentor', isActive: true });
        console.log(`   - ${allInvestors.length} investisseurs, ${allMentors.length} mentors disponibles`);

        let investorPool = this.hardFilterInvestors(application, allInvestors);
        if (investorPool.length === 0) {
          console.log('   ⚠ Aucun investisseur après filtre → fallback sur tous');
          investorPool = allInvestors;
        }

        let mentorPool = this.hardFilterMentors(application, allMentors);
        if (mentorPool.length === 0) mentorPool = allMentors;

        console.log(`   - Pool: ${investorPool.length} investisseurs, ${mentorPool.length} mentors`);

        // Score investisseurs (top 8 candidats → garder top 5)
        const scoredInvestors = [];
        for (const investor of investorPool.slice(0, 8)) {
          const score = await this.scoreInvestorWithLLM(application, investor);
          scoredInvestors.push(score);
          console.log(`     • ${investor.nom || investor.name}: ${score.score}/100`);
        }
        scoredInvestors.sort((a, b) => b.score - a.score);
        const topInvestors = scoredInvestors.slice(0, 5);

        await this.persistInvestorMatches(application, topInvestors, adminUserId);

        // Score mentors (top 5 candidats → garder top 3)
        const scoredMentors = [];
        for (const mentor of mentorPool.slice(0, 5)) {
          const score = await this.scoreMentorWithLLM(application, mentor);
          scoredMentors.push(score);
          console.log(`     • ${mentor.name}: ${score.score}/100`);
        }
        scoredMentors.sort((a, b) => b.score - a.score);
        const topMentors = scoredMentors.slice(0, 3);

        application.matching = {
          investors:   topInvestors,
          mentors:     topMentors,
          jury:        [],
          generatedAt: new Date(),
          lastUpdated: new Date(),
          status:      'completed',
        };
        result = {
          success:       true,
          applicationId: application._id,
          startupName,
          mode:          'accompaniment',
          investors:     topInvestors,
          mentors:       topMentors,
        };
      } else {
        throw new Error(`Statut non supporté pour le matching: ${status}`);
      }

      await application.save();
      console.log(`✅ Matching terminé pour ${startupName}\n`);
      return result;

    } catch (error) {
      console.error('❌ Erreur matching:', error);
      application.matching = { ...application.matching, status: 'failed', lastUpdated: new Date() };
      await application.save();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ MATCHES
  // ═══════════════════════════════════════════════════════════════════════════

  async getMatches(applicationId) {
    const application = await Application.findById(applicationId)
      .select('project.startupName project.sector project.stage status matching needs');
    if (!application) throw new Error('Application non trouvée');
    return {
      startupName:  application.project?.startupName,
      sector:       application.project?.sector,
      stage:        application.project?.stage,
      status:       application.status,
      hasNeeds:     !!(application.needs && Object.keys(application.needs).length > 0),
      jury:         application.matching?.jury      || [],
      investors:    application.matching?.investors || [],
      mentors:      application.matching?.mentors   || [],
      generatedAt:  application.matching?.generatedAt,
      matchStatus:  application.matching?.status,
    };
  }
}

module.exports = new MatchingService();