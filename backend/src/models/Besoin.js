// services/matchingService.js
// CORRECTIONS Sprint 5 :
//  1. scoreInvestorWithLLM / scoreMentorWithLLM : extraction JSON plus robuste
//     (regex fallback, strip trailing garbage, retry sans markdown)
//  2. getMatches : hasNeeds lit maintenant besoins[] en priorité
//  3. hardFilterMentors : fallback élargi si pool vide après filtrage
//  4. _fallbackMentorScore : scoring par catégorie de besoin étendu
//  5. buildNeedsSummary : inchangé (déjà correct Sprint 5)
// FIX : scoreInvestorWithLLM et scoreMentorWithLLM utilisaient "async function"
//       au lieu de la syntaxe méthode de classe → SyntaxError corrigée.
//       La définition dupliquée de scoreMentorWithLLM a été supprimée.

const Application   = require('../models/Application');
const Investor      = require('../models/Investor');
const User          = require('../models/User');
const Match         = require('../models/Match');
const ollamaService = require('./ollamaService');

// ── Map catégorie besoin → mots-clés mentor/investisseur ──────────────────────
const CATEGORY_KEYWORDS = {
  technique:   ['tech', 'product', 'engineering', 'cto', 'développement', 'digital', 'software', 'developer'],
  commercial:  ['sales', 'commercial', 'business', 'b2b', 'distribution', 'vente', 'bd'],
  financier:   ['finance', 'fundraising', 'vc', 'investment', 'levée', 'capital', 'financement', 'investor', 'angel'],
  rh:          ['rh', 'recrutement', 'talent', 'hr', 'people', 'ressources humaines'],
  legal:       ['legal', 'juridique', 'compliance', 'droit', 'conformité', 'réglementaire', 'bct', 'regulatory'],
  marketing:   ['marketing', 'growth', 'gtm', 'croissance', 'digital', 'branding', 'acquisition'],
  partenariat: ['réseau', 'network', 'partenariat', 'ecosystem', 'partnerships', 'partnership'],
  autre:       [],
};

// ── Extraction JSON robuste depuis une réponse LLM ────────────────────────────
function extractJsonFromLLM(raw) {
  if (!raw) throw new Error('Empty LLM response');

  // 1. Normaliser les fins de ligne et supprimer les caractères de contrôle
  let clean = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Guillemets typographiques → guillemets droits
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Supprimer caractères de contrôle sauf \n \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Supprimer markdown
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 2. Extraire uniquement le bloc JSON (premier { ... dernier })
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found. Raw: ' + raw.substring(0, 100));
  }
  let jsonStr = clean.substring(start, end + 1);

  // 3. Tentative parse directe
  try {
    return JSON.parse(jsonStr);
  } catch (_) {}

  // 4. Nettoyages progressifs

  // 4a. Supprimer trailing commas avant } ou ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(jsonStr); } catch (_) {}

  // 4b. Remplacer sauts de ligne dans les valeurs string par \n échappé
  jsonStr = jsonStr.replace(/"([^"]*)"/g, (match) =>
    match.replace(/\n/g, '\\n').replace(/\t/g, '\\t')
  );
  try { return JSON.parse(jsonStr); } catch (_) {}

  // 4c. Clés sans guillemets → ajouter guillemets
  jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  try { return JSON.parse(jsonStr); } catch (_) {}

  // 4d. Guillemets simples → doubles (avec précaution)
  jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');
  try { return JSON.parse(jsonStr); } catch (_) {}

  // 4e. Supprimer tous les sauts de ligne résiduels hors strings
  jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  try { return JSON.parse(jsonStr); } catch (finalErr) {
    throw new Error('JSON parse failed after all fixes: ' + finalErr.message +
      '\nJSON was: ' + jsonStr.substring(0, 200));
  }
}

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

  // ═══════════════════════════════════════════════════════════════════════════
  // buildNeedsSummary — lit besoins[] (Sprint 5) ET needs{} (rétrocompat)
  // ═══════════════════════════════════════════════════════════════════════════

  buildNeedsSummary(application) {
    const lines = [];

    // ── 1. Nouveau format : besoins[] ─────────────────────────────────────
    const besoins     = application.besoins || [];
    const openBesoins = besoins.filter((b) => b.status !== 'resolu');

    if (openBesoins.length > 0) {
      const sorted = [...openBesoins].sort((a, b) => {
        const order = { critique: 0, haute: 1, moyenne: 2, faible: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      });

      sorted.forEach((b) => {
        const priorityLabel = {
          critique: '🔴 CRITIQUE',
          haute:    '🟠 Haute',
          moyenne:  '🟡 Moyenne',
          faible:   '🟢 Faible',
        }[b.priority] || b.priority;

        lines.push(
          `Besoin ${priorityLabel} [${b.category}]: ${b.title}` +
          (b.description ? ` — ${b.description.substring(0, 100)}` : '')
        );
      });
    }

    // ── 2. Ancien format : needs{} ────────────────────────────────────────
    const needs   = application.needs   || {};
    const project = application.project || {};
    const economy = application.economy || {};
    const team    = application.team    || {};

    if (needs.investorProfile)  lines.push(`Profil investisseur souhaité: ${needs.investorProfile}`);
    if (needs.fundingUrgency)   lines.push(`Urgence financement: ${needs.fundingUrgency}`);
    if (economy.useOfFunds)     lines.push(`Utilisation des fonds: ${economy.useOfFunds}`);
    if (economy.currentRevenue) lines.push(`Revenus actuels: ${economy.currentRevenue}`);
    if (needs.mentorProfile)    lines.push(`Profil mentor souhaité: ${needs.mentorProfile}`);
    if (needs.currentChallenge) lines.push(`Défi principal: ${needs.currentChallenge}`);

    if (needs.networkHelp)       lines.push('Besoin: réseau et introductions');
    if (needs.technicalHelp)     lines.push('Besoin: aide technique / produit');
    if (needs.goToMarketHelp)    lines.push('Besoin: stratégie go-to-market');
    if (needs.internationalHelp) lines.push('Besoin: expansion internationale');
    if (needs.fundraisingHelp)   lines.push('Besoin: levée de fonds');
    if (needs.operationsHelp)    lines.push('Besoin: structuration opérationnelle');

    if (project.targetMarket) lines.push(`Marché cible: ${project.targetMarket}`);
    if (team.teamSize)         lines.push(`Taille équipe: ${team.teamSize} personnes`);

    return lines.length > 0
      ? lines.join('\n')
      : 'Non renseignés — basez-vous sur le secteur et le stade.';
  }

  // ── Extrait les catégories de besoins ouverts ─────────────────────────────
  getOpenBesoinCategories(application) {
    return (application.besoins || [])
      .filter((b) => b.status !== 'resolu')
      .map((b) => b.category);
  }

  // ── Résumé court pour les prompts LLM (max 400 chars) ────────────────────
  getShortNeedsSummary(application) {
    const summary = this.buildNeedsSummary(application);
    return summary.substring(0, 400);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HARD FILTERS
  // ═══════════════════════════════════════════════════════════════════════════

  hardFilterJury(application, juryMembers) {
    const sector = (application.project?.sector || application.sector || '').toLowerCase();
    if (!sector) return juryMembers;
    return juryMembers.filter((jury) => {
      if (!jury.expertise?.length) return true;
      return jury.expertise.some(
        (exp) => sector.includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector)
      );
    });
  }

  hardFilterInvestors(application, investors) {
    const sector      = (application.project?.sector || application.sector || '').toLowerCase();
    const fundingGoal = this.extractAmount(application.economy?.fundingGoal);

    const hasFinancialNeed = (application.besoins || []).some(
      (b) => b.category === 'financier' && b.status !== 'resolu'
    );

    return investors.filter((investor) => {
      if (investor.active === false) return false;

      if (!hasFinancialNeed && investor.secteurs?.length > 0 && sector) {
        const hit = investor.secteurs.some(
          (s) => sector.includes(s.toLowerCase()) || s.toLowerCase().includes(sector)
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
    const sector   = (application.project?.sector || application.sector || '').toLowerCase();
    const openCats = this.getOpenBesoinCategories(application);

    const filtered = mentors.filter((mentor) => {
      if (!mentor.expertise?.length) return true;

      const mentorText = mentor.expertise.join(' ').toLowerCase();

      const sectorMatch = sector
        ? mentor.expertise.some(
            (exp) => sector.includes(exp.toLowerCase()) || exp.toLowerCase().includes(sector)
          )
        : false;

      const needsMatch = openCats.some((cat) => {
        const keywords = CATEGORY_KEYWORDS[cat] || [];
        return keywords.some((kw) => mentorText.includes(kw));
      });

      return sectorMatch || needsMatch;
    });

    // Si le filtre est trop restrictif → retourner tous les mentors
    return filtered.length > 0 ? filtered : mentors;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM SCORING — JURY
  // ═══════════════════════════════════════════════════════════════════════════

  async scoreJuryWithLLM(application, juryMember) {
    const project = application.project || {};
    const prompt = `Tu es un système de matching pour MEDIANET Incubator Tunisia.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown.

STARTUP: ${project.startupName || 'N/A'} | Secteur: ${project.sector || 'N/A'} | Stade: ${project.stage || 'N/A'}
JURY: ${juryMember.name} | Expertise: ${juryMember.expertise?.join(', ') || 'Généraliste'}

Évalue l'adéquation jury-startup. Critères: sectorAlignment(0-40) stageRelevance(0-30) addedValue(0-30)

{"score":75,"criteria":{"sectorAlignment":30,"stageRelevance":25,"addedValue":20},"reasoning":"Courte phrase","highlights":["Point fort"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 250 });
      const parsed   = extractJsonFromLLM(response);
      return {
        juryId:     juryMember._id,
        juryName:   juryMember.name,
        expertise:  juryMember.expertise || [],
        score:      Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
        criteria:   parsed.criteria   || {},
        reasoning:  parsed.reasoning  || 'Expertise pertinente',
        highlights: parsed.highlights || [],
      };
    } catch (err) {
      console.error('scoreJuryWithLLM error:', err.message);
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
  // FIX: "async function scoreInvestorWithLLM" → "async scoreInvestorWithLLM"
  // ═══════════════════════════════════════════════════════════════════════════

  async scoreInvestorWithLLM(application, investor) {
    const project      = application.project || {};
    const economy      = application.economy || {};
    const needsSummary = this.getShortNeedsSummary(application);

    const prompt =
`Matching startup-investisseur. Réponds UNIQUEMENT avec du JSON valide sur une seule ligne, sans markdown ni texte.

STARTUP: ${project.startupName || application.startupName || 'N/A'} | Secteur: ${project.sector || application.sector || 'N/A'} | Stade: ${project.stage || application.stage || 'N/A'} | Besoin financement: ${economy.fundingGoal || 'N/A'}
BESOINS: ${needsSummary.replace(/\n/g, ' | ')}
INVESTISSEUR: ${investor.nom || investor.name || 'N/A'} | Type: ${investor.type || 'N/A'} | Secteurs: ${(investor.secteurs || []).join(', ') || 'Tous'} | Ticket: ${investor.ticketMin || 0}-${investor.ticketMax || 'illimite'} TND

Scores: sectorMatch/25 stageMatch/20 ticketMatch/20 needsMatch/20 startupQuality/15

Exemple de réponse attendue (une ligne):
{"score":80,"criteria":{"sectorMatch":20,"stageMatch":15,"ticketMatch":18,"needsMatch":17,"startupQuality":10},"reasoning":"Raison courte.","highlights":["point1","point2"],"risks":["risque1"],"needsMatch":["besoin couvert"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 300 });
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
    const project      = application.project || {};
    const economy      = application.economy || {};
    const needs        = application.needs   || {};
    const openBesoins  = (application.besoins || []).filter((b) => b.status !== 'resolu');
    const rawScore     = this.fallbackScore(application, investor);
    const score        = Math.min(75, rawScore);

    const sector      = project.sector || application.sector || '';
    const sectorMatch = investor.secteurs?.some((s) =>
      sector.toLowerCase().includes(s.toLowerCase())
    );

    const coveredNeeds = [];
    if ((needs.networkHelp || openBesoins.some((b) => b.category === 'partenariat')) && investor.network)
      coveredNeeds.push('Réseau et introductions');
    if ((needs.internationalHelp || openBesoins.some((b) => b.title?.toLowerCase().includes('international'))) && investor.international)
      coveredNeeds.push('Expansion internationale');
    if (sectorMatch) coveredNeeds.push(`Expertise secteur ${sector}`);
    if (openBesoins.some((b) => b.category === 'financier'))
      coveredNeeds.push('Besoin de financement identifié');

    return {
      investorId:   investor._id,
      investorName: investor.nom || investor.name,
      investorType: investor.type || 'Investisseur',
      score,
      criteria:     {},
      reasoning:
        `${investor.nom || investor.name} investit dans ${investor.secteurs?.join(', ') || 'tous secteurs'} ` +
        `avec tickets ${investor.ticketMin || 0}–${investor.ticketMax || '∞'} TND. ` +
        (sectorMatch
          ? `Alignement sectoriel confirmé avec ${sector}.`
          : `Profil généraliste compatible.`),
      highlights: sectorMatch
        ? [`Secteur ${sector} dans portfolio`, 'Ticket adapté']
        : ['Investisseur actif en Tunisie', 'Profil généraliste'],
      risks:      [`Vérifier adéquation ticket avec besoin ${economy.fundingGoal || 'N/A'}`],
      needsMatch: coveredNeeds,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM SCORING — MENTOR
  // FIX: "async function scoreMentorWithLLM" → "async scoreMentorWithLLM"
  //      Suppression de la définition dupliquée (deux méthodes existaient).
  // ═══════════════════════════════════════════════════════════════════════════

  async scoreMentorWithLLM(application, mentor) {
    const project         = application.project || {};
    const needs           = application.needs   || {};
    const openBesoinsList = (application.besoins || []).filter((b) => b.status !== 'resolu');

    // Construire liste besoins depuis nouveau format en priorité
    const mentorNeedsLines = [];
    openBesoinsList.forEach((b) => {
      mentorNeedsLines.push(`[${b.priority}] ${b.category}: ${b.title}`);
    });

    // Fallback ancien format
    if (mentorNeedsLines.length === 0) {
      if (needs.mentorProfile)     mentorNeedsLines.push(needs.mentorProfile);
      if (needs.currentChallenge)  mentorNeedsLines.push(needs.currentChallenge);
      if (needs.technicalHelp)     mentorNeedsLines.push('aide technique');
      if (needs.goToMarketHelp)    mentorNeedsLines.push('go-to-market');
      if (needs.networkHelp)       mentorNeedsLines.push('réseau');
      if (needs.internationalHelp) mentorNeedsLines.push('expansion internationale');
      if (needs.fundraisingHelp)   mentorNeedsLines.push('levée de fonds');
      if (needs.operationsHelp)    mentorNeedsLines.push('opérations');
    }

    const mentorNeedsSummary = mentorNeedsLines.length > 0
      ? mentorNeedsLines.slice(0, 6).join('\n')
      : 'non renseignés';

    const prompt = `Tu es un système de matching pour MEDIANET Incubator Tunisia.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown.

STARTUP: ${project.startupName || application.startupName || 'N/A'}
Secteur: ${project.sector || application.sector || 'N/A'}
Stade: ${project.stage || application.stage || 'N/A'}

BESOINS PRIORITAIRES:
${mentorNeedsSummary}

MENTOR: ${mentor.name || mentor.email || 'N/A'}
Expertise: ${mentor.expertise?.join(', ') || 'Généraliste'}
Expérience: ${mentor.experience || 'N/A'} ans

SCORING (total 100pts):
- needsMatch: 0-35 pts (besoins startup couverts par expertise mentor)
- sectorAlignment: 0-25 pts (alignement sectoriel)
- stageRelevance: 0-20 pts (pertinence stade)
- teamComplement: 0-20 pts (complémentarité équipe)

FORMAT EXACT ATTENDU:
{"score":72,"criteria":{"needsMatch":28,"sectorAlignment":18,"stageRelevance":15,"teamComplement":11},"reasoning":"Deux phrases max.","highlights":["Point 1"],"coveredNeeds":["Besoin couvert"]}`;

    try {
      const response = await ollamaService.generate(prompt, { num_predict: 350 });
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
      sector.toLowerCase().includes(exp.toLowerCase()) ||
      exp.toLowerCase().includes(sector.toLowerCase())
    );

    const coveredNeeds = [];
    openBesoinsList.forEach((b) => {
      const keywords = CATEGORY_KEYWORDS[b.category] || [];
      if (keywords.some((kw) => mentorText.includes(kw))) {
        coveredNeeds.push(`${b.category}: ${b.title}`);
      }
    });

    if (coveredNeeds.length === 0) {
      if (needs.technicalHelp   && mentorText.match(/tech|product|engineering|cto|software/))
        coveredNeeds.push('Aide technique/produit');
      if (needs.goToMarketHelp  && mentorText.match(/marketing|sales|growth|gtm/))
        coveredNeeds.push('Go-to-market');
      if (needs.fundraisingHelp && mentorText.match(/finance|fundraising|vc|investment/))
        coveredNeeds.push('Levée de fonds');
    }

    let score = 45;
    if (expertiseMatch)          score += 20;
    if (coveredNeeds.length > 0) score += Math.min(25, coveredNeeds.length * 10);
    openBesoinsList.forEach((b) => {
      const keywords = CATEGORY_KEYWORDS[b.category] || [];
      if (keywords.some((kw) => mentorText.includes(kw))) {
        if (b.priority === 'critique') score += 8;
        else if (b.priority === 'haute') score += 5;
        else if (b.priority === 'moyenne') score += 2;
      }
    });
    score = Math.min(85, score);

    return {
      mentorId:     mentor._id,
      mentorName:   mentor.name || mentor.email,
      expertise:    mentor.expertise || [],
      score,
      criteria:     {},
      reasoning:    `${mentor.name || mentor.email} apporte son expertise en ${mentor.expertise?.join(', ') || 'management'} pour ${project.startupName || application.startupName}. ${coveredNeeds.length > 0 ? `Couvre ${coveredNeeds.length} besoin(s) identifié(s).` : 'Profil généraliste applicable.'}`,
      highlights:   mentor.expertise?.length ? mentor.expertise.slice(0, 2) : ['Management', 'Stratégie'],
      coveredNeeds,
    };
  }

  // ── Fallback rule-based score ─────────────────────────────────────────────
  fallbackScore(application, investor) {
    let score         = 40;
    const sector      = (application.project?.sector || application.sector || '').toLowerCase();
    const fundingGoal = this.extractAmount(application.economy?.fundingGoal);
    const needs       = application.needs   || {};
    const besoins     = application.besoins || [];

    if (investor.secteurs?.some((s) => sector.includes(s.toLowerCase()))) score += 25;
    if (fundingGoal > 0 && fundingGoal <= (investor.ticketMax || Infinity))  score += 15;
    if (fundingGoal > 0 && fundingGoal >= (investor.ticketMin || 0))         score += 15;
    if ((needs.networkHelp || besoins.some((b) => b.category === 'partenariat')) && investor.network)
      score += 5;
    if ((needs.internationalHelp || besoins.some((b) => b.title?.toLowerCase().includes('international'))) && investor.international)
      score += 5;
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
            $set:         { matchScore: scored.score },
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
        console.log(`     ✓ Match: startup=${startupId} ↔ investor=${scored.investorId} (${scored.score}/100)`);
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
  // ═══════════════════════════════════════════════════════════════════════════

  async matchApplication(applicationId, adminUserId = null) {
    console.log(`\n🔍 Matching pour application ${applicationId}`);

    const application = await Application.findById(applicationId).select(
      'project economy team needs besoins matching status applicant ' +
      'startupName founderName sector stage location'
    );
    if (!application) throw new Error(`Application ${applicationId} non trouvée`);

    const status      = application.status;
    const startupName = application.project?.startupName || application.startupName || 'Inconnu';

    const oldNeedsKeys   = application.needs   ? Object.keys(application.needs)  : [];
    const newBesoinsList = application.besoins || [];
    const openBesoins    = newBesoinsList.filter((b) => b.status !== 'resolu');

    console.log(`📋 Statut: ${status} — ${startupName}`);

    if (openBesoins.length > 0) {
      console.log(`   ✅ Besoins (nouveau format): ${openBesoins.length} besoin(s) ouvert(s)`);
      openBesoins.forEach((b) =>
        console.log(`      [${b.priority}] ${b.category}: ${b.title}`)
      );
    } else if (oldNeedsKeys.length > 0) {
      console.log(`   ✅ Besoins (ancien format): ${oldNeedsKeys.join(', ')}`);
    } else {
      console.log(`   ⚠ Besoins non renseignés → matching générique par secteur/stade`);
    }

    if (!adminUserId) {
      const admin = await User.findOne({ role: 'admin' }).select('_id');
      adminUserId = admin?._id || null;
    }

    application.matching = { ...application.matching, status: 'processing' };
    await application.save();

    try {
      let result = {};

      // ── Phase évaluation → Jury ───────────────────────────────────────────
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

      // ── Phase accompagnement → Investisseurs + Mentors ────────────────────
      else if (['accepted', 'approved', 'interview', 'active'].includes(status)) {
        console.log('   → Mode: Accompagnement (Investisseurs + Mentors)');

        const allInvestors = await Investor.find({ active: { $ne: false } });
        const allMentors   = await User.find({ role: 'mentor', isActive: true });
        console.log(`   - ${allInvestors.length} investisseurs, ${allMentors.length} mentors disponibles`);

        let investorPool = this.hardFilterInvestors(application, allInvestors);
        if (investorPool.length === 0) {
          console.log('   ⚠ Aucun investisseur après filtre → fallback tous investisseurs');
          investorPool = allInvestors;
        }

        let mentorPool = this.hardFilterMentors(application, allMentors);
        if (mentorPool.length === allMentors.length && allMentors.length > 0) {
          console.log('   ℹ Filtre mentor élargi (fallback tous mentors)');
        }

        console.log(`   - Pool final: ${investorPool.length} investisseurs, ${mentorPool.length} mentors`);

        // Score investisseurs
        const scoredInvestors = [];
        for (const investor of investorPool.slice(0, 8)) {
          const score = await this.scoreInvestorWithLLM(application, investor);
          scoredInvestors.push(score);
          console.log(`     • ${investor.nom || investor.name}: ${score.score}/100`);
        }
        scoredInvestors.sort((a, b) => b.score - a.score);
        const topInvestors = scoredInvestors.slice(0, 5);

        await this.persistInvestorMatches(application, topInvestors, adminUserId);

        // Score mentors
        const scoredMentors = [];
        for (const mentor of mentorPool.slice(0, 6)) {
          const score = await this.scoreMentorWithLLM(application, mentor);
          scoredMentors.push(score);
          console.log(`     • ${mentor.name}: ${score.score}/100`);
        }
        scoredMentors.sort((a, b) => b.score - a.score);
        const topMentors = scoredMentors.slice(0, 3);

        if (topInvestors.length === 0) console.log('   ⚠ alt [Aucun investisseur compatible]');
        if (topMentors.length === 0)   console.log('   ⚠ alt [Aucun mentor compatible]');

        application.matching = {
          investors:   topInvestors,
          mentors:     topMentors,
          jury:        [],
          generatedAt: new Date(),
          lastUpdated: new Date(),
          status:      'completed',
        };
        result = {
          success:         true,
          applicationId:   application._id,
          startupName,
          mode:            'accompaniment',
          investors:       topInvestors,
          mentors:         topMentors,
          noInvestorFound: topInvestors.length === 0,
          noMentorFound:   topMentors.length === 0,
        };
      } else {
        throw new Error(`Statut non supporté pour le matching: ${status}`);
      }

      await application.save();
      console.log(`✅ Matching terminé — ${startupName} (${result.investors?.length || 0} investisseurs, ${result.mentors?.length || 0} mentors)\n`);
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
  // CORRECTION : hasNeeds lit maintenant besoins[] en priorité
  // ═══════════════════════════════════════════════════════════════════════════

  async getMatches(applicationId) {
    const application = await Application.findById(applicationId).select(
      'project.startupName project.sector project.stage status matching needs besoins startupName sector stage'
    );
    if (!application) throw new Error('Application non trouvée');

    const openBesoins    = (application.besoins || []).filter((b) => b.status !== 'resolu');
    const hasOldNeeds    = !!(application.needs && Object.keys(application.needs).length > 0);
    const hasNeeds       = openBesoins.length > 0 || hasOldNeeds;

    return {
      startupName:  application.project?.startupName || application.startupName,
      sector:       application.project?.sector      || application.sector,
      stage:        application.project?.stage       || application.stage,
      status:       application.status,
      hasNeeds,
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