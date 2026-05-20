// services/matchingService.js
// CORRECTION : allMentors utilise le modele dynamique sur collection 'mentors'
//              au lieu de User.find({ role: 'mentor' }) qui retournait 0 résultats.

const Application   = require('../models/Application');
const Investor      = require('../models/Investor');
const User          = require('../models/User');
const Match         = require('../models/Match');
const mongoose      = require('mongoose');
const ollamaService = require('./ollamaService');

// Modele dynamique sur la collection 'mentors' (pas de fichier Mentor.js)
const Mentor = mongoose.models.Mentor
  || mongoose.model('Mentor', new mongoose.Schema({}, { strict: false, collection: 'mentors' }));

// Map categorie besoin -> mots-cles mentor/investisseur
const CATEGORY_KEYWORDS = {
  technique:   ['tech', 'product', 'engineering', 'cto', 'developpement', 'digital', 'software', 'developer'],
  commercial:  ['sales', 'commercial', 'business', 'b2b', 'distribution', 'vente', 'bd'],
  financier:   ['finance', 'fundraising', 'vc', 'investment', 'levee', 'capital', 'financement', 'investor', 'angel'],
  rh:          ['rh', 'recrutement', 'talent', 'hr', 'people', 'ressources humaines'],
  legal:       ['legal', 'juridique', 'compliance', 'droit', 'conformite', 'reglementaire', 'bct', 'regulatory'],
  marketing:   ['marketing', 'growth', 'gtm', 'croissance', 'digital', 'branding', 'acquisition'],
  partenariat: ['reseau', 'network', 'partenariat', 'ecosystem', 'partnerships', 'partnership'],
  autre:       [],
};

// Extraction JSON robuste depuis une reponse LLM
function extractJsonFromLLM(raw) {
  if (!raw) throw new Error('Empty LLM response');

  let clean = raw
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/```json\s*/gi, '').replace(/```\s*/g, '')
    .trim();

  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start)
    throw new Error('No JSON object found. Raw: ' + raw.substring(0, 100));

  let jsonStr = clean.substring(start, end + 1);

  try { return JSON.parse(jsonStr); } catch (_) {}
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(jsonStr); } catch (_) {}
  jsonStr = jsonStr.replace(/"([^"]*)"/g, (match) => match.replace(/\n/g, '\\n').replace(/\t/g, '\\t'));
  try { return JSON.parse(jsonStr); } catch (_) {}
  jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  try { return JSON.parse(jsonStr); } catch (_) {}
  jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');
  try { return JSON.parse(jsonStr); } catch (_) {}
  jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  try { return JSON.parse(jsonStr); } catch (finalErr) {
    throw new Error('JSON parse failed: ' + finalErr.message + '\nJSON: ' + jsonStr.substring(0, 200));
  }
}

class MatchingService {

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
      'idea': 'Pre-amorcage', 'prototype': 'Pre-amorcage', 'mvp': 'Amorcage',
      'early_traction': 'Amorcage', 'scaling': 'Serie A', 'croissance': 'Serie A',
      'pre-seed': 'Pre-amorcage', 'seed': 'Amorcage', 'series a': 'Serie A', 'series b': 'Serie B',
    };
    return mapping[stage?.toLowerCase()] || stage;
  }

  buildNeedsSummary(application) {
    const lines = [];
    const besoins     = application.besoins || [];
    const openBesoins = besoins.filter((b) => b.status !== 'resolu');

    if (openBesoins.length > 0) {
      const sorted = [...openBesoins].sort((a, b) => {
        const order = { critique: 0, haute: 1, moyenne: 2, faible: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      });
      sorted.forEach((b) => {
        const priorityLabel = { critique: 'CRITIQUE', haute: 'Haute', moyenne: 'Moyenne', faible: 'Faible' }[b.priority] || b.priority;
        lines.push(`Besoin ${priorityLabel} [${b.category}]: ${b.title}` + (b.description ? ` - ${b.description.substring(0, 100)}` : ''));
      });
    }

    const needs   = application.needs   || {};
    const project = application.project || {};
    const economy = application.economy || {};
    const team    = application.team    || {};

    if (needs.investorProfile)  lines.push(`Profil investisseur: ${needs.investorProfile}`);
    if (needs.fundingUrgency)   lines.push(`Urgence financement: ${needs.fundingUrgency}`);
    if (economy.useOfFunds)     lines.push(`Utilisation fonds: ${economy.useOfFunds}`);
    if (economy.currentRevenue) lines.push(`Revenus: ${economy.currentRevenue}`);
    if (needs.mentorProfile)    lines.push(`Profil mentor: ${needs.mentorProfile}`);
    if (needs.currentChallenge) lines.push(`Defi: ${needs.currentChallenge}`);
    if (needs.networkHelp)       lines.push('Besoin: reseau');
    if (needs.technicalHelp)     lines.push('Besoin: aide technique');
    if (needs.goToMarketHelp)    lines.push('Besoin: go-to-market');
    if (needs.internationalHelp) lines.push('Besoin: expansion internationale');
    if (needs.fundraisingHelp)   lines.push('Besoin: levee de fonds');
    if (needs.operationsHelp)    lines.push('Besoin: operations');
    if (project.targetMarket)   lines.push(`Marche cible: ${project.targetMarket}`);
    if (team.teamSize)           lines.push(`Equipe: ${team.teamSize} personnes`);

    return lines.length > 0 ? lines.join('\n') : 'Non renseignes - basez-vous sur le secteur et le stade.';
  }

  getOpenBesoinCategories(application) {
    return (application.besoins || []).filter((b) => b.status !== 'resolu').map((b) => b.category);
  }

  getShortNeedsSummary(application) {
    return this.buildNeedsSummary(application).substring(0, 400);
  }

  hardFilterJury(application, juryMembers) {
    const sector = (application.project?.sector || application.sector || '').toLowerCase();
    if (!sector) return juryMembers;
    return juryMembers.filter((jury) => {
      if (!jury.expertise?.length) return true;
      return jury.expertise.some((exp) => sector.includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector));
    });
  }

  hardFilterInvestors(application, investors) {
    const sector      = (application.project?.sector || application.sector || '').toLowerCase();
    const fundingGoal = this.extractAmount(application.economy?.fundingGoal);
    const hasFinancialNeed = (application.besoins || []).some((b) => b.category === 'financier' && b.status !== 'resolu');

    return investors.filter((investor) => {
      if (investor.active === false) return false;
      if (!hasFinancialNeed && investor.secteurs?.length > 0 && sector) {
        const hit = investor.secteurs.some((s) => sector.includes(s.toLowerCase()) || s.toLowerCase().includes(sector));
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
    const sector   = (application.project?.sector || application.sector || '').toLowerCase();
    const openCats = this.getOpenBesoinCategories(application);

    const filtered = mentors.filter((mentor) => {
      if (!mentor.expertise?.length) return true;
      const mentorText = mentor.expertise.join(' ').toLowerCase();
      const sectorMatch = sector
        ? mentor.expertise.some((exp) => sector.includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector))
        : false;
      const needsMatch = openCats.some((cat) => {
        const keywords = CATEGORY_KEYWORDS[cat] || [];
        return keywords.some((kw) => mentorText.includes(kw));
      });
      return sectorMatch || needsMatch;
    });

    return filtered.length > 0 ? filtered : mentors;
  }

  async scoreJuryWithLLM(application, juryMember) {
    const project = application.project || {};
    const prompt = `Tu es un systeme de matching pour MEDIANET Incubator Tunisia.
Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou apres, sans markdown.

STARTUP: ${project.startupName || 'N/A'} | Secteur: ${project.sector || 'N/A'} | Stade: ${project.stage || 'N/A'}
JURY: ${juryMember.name} | Expertise: ${juryMember.expertise?.join(', ') || 'Generaliste'}

{"score":75,"criteria":{"sectorAlignment":30,"stageRelevance":25,"addedValue":20},"reasoning":"Courte phrase","highlights":["Point fort"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 250 });
      const parsed   = extractJsonFromLLM(response);
      return {
        juryId: juryMember._id, juryName: juryMember.name, expertise: juryMember.expertise || [],
        score: Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
        criteria: parsed.criteria || {}, reasoning: parsed.reasoning || 'Expertise pertinente', highlights: parsed.highlights || [],
      };
    } catch (err) {
      console.error('scoreJuryWithLLM error:', err.message);
      return { juryId: juryMember._id, juryName: juryMember.name, expertise: juryMember.expertise || [], score: 50, criteria: {}, reasoning: 'Profil jury standard', highlights: [] };
    }
  }

  async scoreInvestorWithLLM(application, investor) {
    const project = application.project || {};
    const economy = application.economy || {};
    const prompt =
`Reponds UNIQUEMENT avec ce JSON sur UNE SEULE LIGNE, sans rien d'autre:
{"score":0,"criteria":{"sectorMatch":0,"stageMatch":0,"ticketMatch":0,"needsMatch":0,"startupQuality":0},"reasoning":"","highlights":[],"risks":[],"coveredNeeds":[]}

STARTUP: ${(project.startupName || application.startupName || 'N/A').substring(0, 30)} | Secteur: ${(project.sector || application.sector || 'N/A').substring(0, 20)} | Stade: ${project.stage || application.stage || 'N/A'} | Fonds: ${economy.fundingGoal || 'N/A'}
INVESTISSEUR: ${(investor.nom || investor.name || 'N/A').substring(0, 30)} | Secteurs: ${(investor.secteurs || []).slice(0, 3).join(', ') || 'Tous'} | Ticket: ${investor.ticketMin || 0}-${investor.ticketMax || 'inf'}

Score /100: sectorMatch/25 stageMatch/20 ticketMatch/20 needsMatch/20 startupQuality/15
Calcule et remplace les 0. reasoning=1 phrase. highlights=2 items max. risks=1 item max. coveredNeeds=1 item max.`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 250 });
      const parsed   = extractJsonFromLLM(response);
      return {
        investorId:   investor._id,
        investorName: investor.nom || investor.name,
        investorType: investor.type || 'Investisseur',
        score:        Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
        criteria:     parsed.criteria  || {},
        reasoning:    (parsed.reasoning || '').replace(/\n/g, ' '),
        highlights:   Array.isArray(parsed.highlights) ? parsed.highlights : [],
        risks:        Array.isArray(parsed.risks)       ? parsed.risks       : [],
        needsMatch:   Array.isArray(parsed.needsMatch)  ? parsed.needsMatch  : [],
      };
    } catch (error) {
      console.error('scoreInvestorWithLLM error:', error.message);
      return this._fallbackInvestorScore(application, investor);
    }
  }

  _fallbackInvestorScore(application, investor) {
    const project     = application.project || {};
    const economy     = application.economy || {};
    const needs       = application.needs   || {};
    const openBesoins = (application.besoins || []).filter((b) => b.status !== 'resolu');
    const score       = Math.min(75, this.fallbackScore(application, investor));
    const sector      = project.sector || application.sector || '';
    const sectorMatch = investor.secteurs?.some((s) => sector.toLowerCase().includes(s.toLowerCase()));
    const coveredNeeds = [];
    if ((needs.networkHelp || openBesoins.some((b) => b.category === 'partenariat')) && investor.network) coveredNeeds.push('Reseau et introductions');
    if (sectorMatch) coveredNeeds.push(`Expertise secteur ${sector}`);
    if (openBesoins.some((b) => b.category === 'financier')) coveredNeeds.push('Besoin de financement identifie');
    return {
      investorId: investor._id, investorName: investor.nom || investor.name, investorType: investor.type || 'Investisseur',
      score, criteria: {},
      reasoning: `${investor.nom || investor.name} investit dans ${investor.secteurs?.join(', ') || 'tous secteurs'} avec tickets ${investor.ticketMin || 0}-${investor.ticketMax || 'inf'} TND. ${sectorMatch ? `Alignement sectoriel confirme avec ${sector}.` : 'Profil generaliste compatible.'}`,
      highlights: sectorMatch ? [`Secteur ${sector} dans portfolio`, 'Ticket adapte'] : ['Investisseur actif en Tunisie', 'Profil generaliste'],
      risks: [`Verifier adequation ticket avec besoin ${economy.fundingGoal || 'N/A'}`],
      needsMatch: coveredNeeds,
    };
  }

  async scoreMentorWithLLM(application, mentor) {
    const project         = application.project || {};
    const needs           = application.needs   || {};
    const openBesoinsList = (application.besoins || []).filter((b) => b.status !== 'resolu');

    const mentorNeedsLines = [];
    openBesoinsList.forEach((b) => mentorNeedsLines.push(`[${b.priority}] ${b.category}: ${b.title}`));
    if (mentorNeedsLines.length === 0) {
      if (needs.mentorProfile)     mentorNeedsLines.push(needs.mentorProfile);
      if (needs.currentChallenge)  mentorNeedsLines.push(needs.currentChallenge);
      if (needs.technicalHelp)     mentorNeedsLines.push('aide technique');
      if (needs.goToMarketHelp)    mentorNeedsLines.push('go-to-market');
      if (needs.networkHelp)       mentorNeedsLines.push('reseau');
      if (needs.fundraisingHelp)   mentorNeedsLines.push('levee de fonds');
    }
    const shortNeeds = mentorNeedsLines.slice(0, 3).map((l) => l.substring(0, 50)).join(' | ') || 'non renseignes';

    const prompt =
`Reponds UNIQUEMENT avec ce JSON sur UNE SEULE LIGNE, sans rien d'autre:
{"score":0,"criteria":{"needsMatch":0,"sectorAlignment":0,"stageRelevance":0,"teamComplement":0},"reasoning":"","highlights":[],"coveredNeeds":[]}

STARTUP: ${(project.startupName || application.startupName || 'N/A').substring(0, 30)} | Secteur: ${(project.sector || application.sector || 'N/A').substring(0, 20)} | Stade: ${project.stage || application.stage || 'N/A'}
BESOINS: ${shortNeeds}
MENTOR: ${(mentor.name || mentor.email || 'N/A').substring(0, 30)} | Expertise: ${(mentor.expertise || []).slice(0, 3).join(', ') || 'Generaliste'}

Score /100: needsMatch/35 sectorAlignment/25 stageRelevance/20 teamComplement/20
Calcule et remplace les 0. reasoning=1 phrase. highlights=1 item. coveredNeeds=1 item.`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 400 });
      const parsed   = extractJsonFromLLM(response);
      return {
        mentorId:     mentor._id,
        mentorName:   mentor.name || mentor.email,
        expertise:    mentor.expertise || [],
        score:        Math.min(100, Math.max(0, parseInt(parsed.score) || 60)),
        criteria:     parsed.criteria    || {},
        reasoning:    parsed.reasoning   || `${mentor.name} accompagne ${project.startupName || application.startupName}`,
        highlights:   Array.isArray(parsed.highlights)   ? parsed.highlights   : mentor.expertise?.slice(0, 2) || [],
        coveredNeeds: Array.isArray(parsed.coveredNeeds) ? parsed.coveredNeeds : [],
      };
    } catch (err) {
      console.error('scoreMentorWithLLM error:', err.message);
      return this._fallbackMentorScore(application, mentor, openBesoinsList, needs);
    }
  }

  _fallbackMentorScore(application, mentor, openBesoinsList, needs) {
    const project    = application.project || {};
    const sector     = project.sector || application.sector || '';
    const mentorText = (mentor.expertise || []).join(' ').toLowerCase();
    const expertiseMatch = (mentor.expertise || []).some((exp) =>
      sector.toLowerCase().includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector.toLowerCase())
    );
    const coveredNeeds = [];
    openBesoinsList.forEach((b) => {
      const keywords = CATEGORY_KEYWORDS[b.category] || [];
      if (keywords.some((kw) => mentorText.includes(kw))) coveredNeeds.push(`${b.category}: ${b.title}`);
    });
    if (coveredNeeds.length === 0) {
      if (needs.technicalHelp   && mentorText.match(/tech|product|engineering|cto|software/)) coveredNeeds.push('Aide technique/produit');
      if (needs.goToMarketHelp  && mentorText.match(/marketing|sales|growth|gtm/)) coveredNeeds.push('Go-to-market');
      if (needs.fundraisingHelp && mentorText.match(/finance|fundraising|vc|investment/)) coveredNeeds.push('Levee de fonds');
    }
    let score = 45;
    if (expertiseMatch) score += 20;
    if (coveredNeeds.length > 0) score += Math.min(25, coveredNeeds.length * 10);
    openBesoinsList.forEach((b) => {
      const keywords = CATEGORY_KEYWORDS[b.category] || [];
      if (keywords.some((kw) => mentorText.includes(kw))) {
        if (b.priority === 'critique') score += 8;
        else if (b.priority === 'haute') score += 5;
        else if (b.priority === 'moyenne') score += 2;
      }
    });
    return {
      mentorId: mentor._id, mentorName: mentor.name || mentor.email, expertise: mentor.expertise || [],
      score: Math.min(85, score), criteria: {},
      reasoning: `${mentor.name || mentor.email} apporte son expertise en ${mentor.expertise?.join(', ') || 'management'}. ${coveredNeeds.length > 0 ? `Couvre ${coveredNeeds.length} besoin(s).` : 'Profil generaliste.'}`,
      highlights: mentor.expertise?.length ? mentor.expertise.slice(0, 2) : ['Management', 'Strategie'],
      coveredNeeds,
    };
  }

  fallbackScore(application, investor) {
    let score         = 40;
    const sector      = (application.project?.sector || application.sector || '').toLowerCase();
    const fundingGoal = this.extractAmount(application.economy?.fundingGoal);
    const needs       = application.needs   || {};
    const besoins     = application.besoins || [];
    if (investor.secteurs?.some((s) => sector.includes(s.toLowerCase()))) score += 25;
    if (fundingGoal > 0 && fundingGoal <= (investor.ticketMax || Infinity)) score += 15;
    if (fundingGoal > 0 && fundingGoal >= (investor.ticketMin || 0))        score += 15;
    if ((needs.networkHelp || besoins.some((b) => b.category === 'partenariat')) && investor.network) score += 5;
    return Math.min(100, score);
  }

  async persistInvestorMatches(application, scoredInvestors, adminUserId) {
    const startupId = application._id;
    const results   = [];
    for (const scored of scoredInvestors) {
      try {
        const match = await Match.findOneAndUpdate(
          { startup: startupId, investor: scored.investorId },
          { $set: { matchScore: scored.score }, $setOnInsert: { startup: startupId, investor: scored.investorId, status: 'pending_founder_validation', createdBy: adminUserId } },
          { upsert: true, new: true }
        );
        results.push(match);
        console.log(`     OK Match: startup=${startupId} <-> investor=${scored.investorId} (${scored.score}/100)`);
      } catch (err) {
        if (err.code !== 11000) console.error(`     WARN Match upsert error for investor ${scored.investorId}:`, err.message);
      }
    }
    return results;
  }

  async matchApplication(applicationId, adminUserId = null) {
    console.log(`\n Matching pour application ${applicationId}`);

    const application = await Application.findById(applicationId).select(
      'project economy team needs besoins matching status applicant startupName founderName sector stage location'
    );
    if (!application) throw new Error(`Application ${applicationId} non trouvee`);

    const status      = application.status;
    const startupName = application.project?.startupName || application.startupName || 'Inconnu';
    const openBesoins = (application.besoins || []).filter((b) => b.status !== 'resolu');
    const oldNeedsKeys = application.needs ? Object.keys(application.needs) : [];

    console.log(`  Statut: ${status} - ${startupName}`);

    const hasProject = application.project?.startupName || application.startupName;
    const hasEconomy = application.economy?.fundingGoal;
    const hasNeeds   = openBesoins.length > 0 || oldNeedsKeys.length > 0;

    if (!hasProject) throw new Error('Informations incompletes : nom du projet manquant');
    if (!hasEconomy && ['accepted', 'approved', 'interview', 'active'].includes(status))
      throw new Error("Informations incompletes : objectif de financement manquant");
    if (!hasNeeds && ['accepted', 'approved', 'interview', 'active'].includes(status))
      throw new Error('Aucun besoin renseigne : impossible de generer un matching pertinent');

    if (!adminUserId) {
      const admin = await User.findOne({ role: 'admin' }).select('_id');
      adminUserId = admin?._id || null;
    }

    application.matching = { ...application.matching, status: 'processing' };
    await application.save();

    try {
      let result = {};

      if (['draft', 'submitted', 'reviewing', 'pending'].includes(status)) {
        console.log('  Mode: Evaluation (Jury)');
        const allJury  = await User.find({ role: 'jury', isActive: true });
        const filtered = this.hardFilterJury(application, allJury);
        const pool     = filtered.length > 0 ? filtered : allJury;
        const scoredJury = [];
        for (const jury of pool.slice(0, 5)) {
          const score = await this.scoreJuryWithLLM(application, jury);
          scoredJury.push(score);
        }
        scoredJury.sort((a, b) => b.score - a.score);
        const topJury = scoredJury.slice(0, 3);
        application.matching = { jury: topJury, investors: [], mentors: [], generatedAt: new Date(), lastUpdated: new Date(), status: 'completed' };
        result = { success: true, applicationId: application._id, startupName, mode: 'evaluation', jury: topJury };
      }

      else if (['accepted', 'approved', 'interview', 'active'].includes(status)) {
        console.log('  Mode: Accompagnement (Investisseurs + Mentors)');

        const allInvestors = await Investor.find({ active: { $ne: false } });

        // ─────────────────────────────────────────────────────────────────
        // CORRECTION PRINCIPALE : utiliser Mentor (collection 'mentors')
        // au lieu de User.find({ role: 'mentor' }) qui retourne 0 resultats
        // ─────────────────────────────────────────────────────────────────
        const allMentors = await Mentor.find({});
        console.log(`  - ${allInvestors.length} investisseurs, ${allMentors.length} mentors disponibles`);

        let investorPool = this.hardFilterInvestors(application, allInvestors);
        if (investorPool.length === 0) { console.log('  WARN: Fallback tous investisseurs'); investorPool = allInvestors; }

        let mentorPool = this.hardFilterMentors(application, allMentors);
        console.log(`  - Pool final: ${investorPool.length} investisseurs, ${mentorPool.length} mentors`);

        const scoredInvestors = [];
        for (const investor of investorPool.slice(0, 8)) {
          const score = await this.scoreInvestorWithLLM(application, investor);
          scoredInvestors.push(score);
          console.log(`     - ${investor.nom || investor.name}: ${score.score}/100`);
        }
        scoredInvestors.sort((a, b) => b.score - a.score);
        const topInvestors = scoredInvestors.slice(0, 5);
        await this.persistInvestorMatches(application, topInvestors, adminUserId);

        const scoredMentors = [];
        for (const mentor of mentorPool.slice(0, 6)) {
          const score = await this.scoreMentorWithLLM(application, mentor);
          scoredMentors.push(score);
          console.log(`     - ${mentor.name}: ${score.score}/100`);
        }
        scoredMentors.sort((a, b) => b.score - a.score);
        const topMentors = scoredMentors.slice(0, 3);

        application.matching = {
          investors: topInvestors, mentors: topMentors, jury: [],
          generatedAt: new Date(), lastUpdated: new Date(), status: 'completed',
        };
        result = {
          success: true, applicationId: application._id, startupName, mode: 'accompaniment',
          investors: topInvestors, mentors: topMentors,
          noInvestorFound: topInvestors.length === 0, noMentorFound: topMentors.length === 0,
        };
      } else {
        throw new Error(`Statut non supporte pour le matching: ${status}`);
      }

      await application.save();
      console.log(`OK Matching termine - ${startupName} (${result.investors?.length || 0} investisseurs, ${result.mentors?.length || 0} mentors)\n`);
      return result;

    } catch (error) {
      console.error('ERREUR matching:', error);
      application.matching = { ...application.matching, status: 'failed', lastUpdated: new Date() };
      await application.save();
      throw error;
    }
  }

  async getMatches(applicationId) {
    const application = await Application.findById(applicationId).select(
      'project.startupName project.sector project.stage status matching needs besoins startupName sector stage'
    );
    if (!application) throw new Error('Application non trouvee');
    const openBesoins = (application.besoins || []).filter((b) => b.status !== 'resolu');
    const hasOldNeeds = !!(application.needs && Object.keys(application.needs).length > 0);
    return {
      startupName:  application.project?.startupName || application.startupName,
      sector:       application.project?.sector      || application.sector,
      stage:        application.project?.stage       || application.stage,
      status:       application.status,
      hasNeeds:     openBesoins.length > 0 || hasOldNeeds,
      besoinCount:  openBesoins.length,
      jury:         application.matching?.jury      || [],
      investors:    application.matching?.investors || [],
      mentors:      application.matching?.mentors   || [],
      generatedAt:  application.matching?.generatedAt,
      matchStatus:  application.matching?.status,
    };
  }
}

module.exports = new MatchingService();