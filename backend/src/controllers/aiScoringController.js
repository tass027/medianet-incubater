// src/controllers/aiScoringController.js
// ✅ FIX : lit les champs imbriqués project/team/economy du seed enrichi

const AiScore     = require('../models/AiScore');
const Application = require('../models/Application');
const { generateScore } = require('../services/ollamaService');

// ─── Mapper Application → objet pour le scoring IA ─────────────
// Lit en priorité les champs imbriqués (project/team/economy)
// puis les champs racine comme fallback
function mapApplicationForScoring(application) {
  const app = application.toObject ? application.toObject() : application;

  // ── project ──────────────────────────────────────────────────
  const project  = app.project  || {};
  const team     = app.team     || {};
  const economy  = app.economy  || {};
  const fr       = app.formResponses || {};

  const name = project.startupName || app.startupName || app.name || 'N/A';
  const sector = project.sector || app.sector || 'N/A';
  const stage  = project.stage  || app.stage  || 'N/A';
  const location = project.location || app.location || 'Tunisie';

  // Problème — plusieurs sources possibles par ordre de priorité
  const problem =
    project.problem ||
    fr.problem ||
    fr.q9 ||           // FinTech form q9 = "Problème résolu et solution proposée"
    fr.q4 ||           // AgriTech form q4 = "Problème résolu"
    app.problem ||
    project.description ||
    app.description ||
    'N/A';

  // Solution
  const solution =
    project.solution ||
    fr.solution ||
    fr.q5 ||           // EdTech form q5 = "Description de la solution éducative"
    app.solution ||
    'N/A';

  // Marché
  const market =
    economy.marketSize ||
    economy.targetMarket ||
    fr.targetMarket ||
    fr.q10 ||          // FinTech q10 = "Marché cible"
    app.targetMarket ||
    'N/A';

  // Modèle économique
  const businessModel =
    economy.businessModel ||
    fr.businessModel ||
    fr.q4 ||           // FinTech q4 = "Modèle de revenus"
    fr.q8 ||           // EdTech q8 = "Modèle économique"
    app.businessModel ||
    'N/A';

  // Équipe — bio complète si disponible
  const teamDescription =
    (team.founderBio
      ? `${team.founderName || ''} — ${team.founderRole || 'Fondateur'} — ${team.founderBio} — Équipe : ${team.teamSize || '?'} personnes`
      : null) ||
    (team.founderName
      ? `${team.founderName} (${team.founderRole || 'Fondateur'}), équipe de ${team.teamSize || '?'} personnes`
      : null) ||
    app.founder ||
    app.founderName ||
    'N/A';

  // Traction — chiffres réels
  const revenueMonthly = economy.monthlyRevenue || fr.revenue
    ? `${economy.monthlyRevenue || Math.round((Number(fr.revenue) || 0) / 12)} TND/mois`
    : null;
  const customers = economy.customers || fr.customers || app.customers || 0;

  const traction =
    economy.traction ||
    fr.traction ||
    (revenueMonthly || customers
      ? `${revenueMonthly || '0 TND/mois'}, ${customers} clients actifs${economy.growthRate ? ', croissance ' + economy.growthRate : ''}`
      : null) ||
    app.traction ||
    'Aucune traction documentée';

  // Concurrents
  const competitors =
    economy.competitors ||
    project.competitors ||
    fr.competitors ||
    app.competitors ||
    'Non documenté';

  return {
    name,
    sector,
    stage,
    location,
    problem,
    solution,
    market,
    businessModel,
    team: teamDescription,
    traction,
    competitors,
    // Champs imbriqués complets transmis au service Ollama
    project,
    team: team,
    economy,
    formResponses: fr,
  };
}

// ─────────────────────────────────────────────────────────────────
// POST /ai-scoring/trigger/:applicationId
// ─────────────────────────────────────────────────────────────────
exports.triggerScoring = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application non trouvée' });
    }

    // Créer ou réinitialiser l'entrée AiScore
    let aiScore = await AiScore.findOne({ applicationId });
    if (!aiScore) {
      aiScore = await AiScore.create({ applicationId, status: 'pending' });
    } else {
      aiScore.status = 'pending';
      await aiScore.save();
    }

    // Mapper les données avec lecture des champs imbriqués
    const appData = mapApplicationForScoring(application);

    console.log(`🔍 Scoring ${appData.name || applicationId}:`);
    console.log(`   problem  : ${String(appData.problem).substring(0, 80)}...`);
    console.log(`   market   : ${String(appData.market).substring(0, 60)}`);
    console.log(`   team     : ${String(typeof appData.team === 'object' ? appData.team?.founderBio || appData.team?.founderName : appData.team).substring(0, 60)}`);
    console.log(`   traction : ${String(appData.traction).substring(0, 60)}`);

    // Lancer le scoring en arrière-plan (non-bloquant)
    generateScore(appData)
      .then(async (result) => {
        aiScore.scores     = result.scores;
        aiScore.total      = result.total;
        aiScore.summary    = result.summary;
        aiScore.strengths  = result.strengths;
        aiScore.weaknesses = result.weaknesses;
        aiScore.criteriaJustification = result.criteriaJustification || {}; // ✅
        aiScore.status     = 'completed';
        await aiScore.save();

        // ✅ Mettre à jour aussi l'application pour affichage immédiat
        await Application.findByIdAndUpdate(applicationId, {
          'aiScore.scores':     result.scores,
          'aiScore.total':      result.total,
          'aiScore.summary':    result.summary,
          'aiScore.strengths':  result.strengths,
          'aiScore.weaknesses': result.weaknesses,
          'aiScore.generatedAt': new Date(),
          'aiScore.model':      'mistral',
          totalScore: result.total,
          detailedScores: {
            team:       result.scores.team,
            innovation: result.scores.solution,
            market:     result.scores.market,
            business:   result.scores.problem,
            traction:   result.scores.traction,
          },
        });

        console.log(`✅ Score ${appData.name} → ${result.total}/100`);
        console.log(`   Détail: problème=${result.scores.problem} marché=${result.scores.market} équipe=${result.scores.team} solution=${result.scores.solution} traction=${result.scores.traction}`);
      })
      .catch(async (err) => {
        aiScore.status = 'failed';
        await aiScore.save();
        console.error(`❌ Score failed pour ${appData.name}:`, err.message);
      });

    res.json({
      message:    'Scoring lancé',
      scoreId:    aiScore._id,
      status:     'pending',
      startup:    appData.name,
    });

  } catch (err) {
    console.error('[triggerScoring]', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /ai-scoring/:applicationId
// ─────────────────────────────────────────────────────────────────
exports.getScore = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Chercher dans AiScore d'abord
    const aiScore = await AiScore.findOne({ applicationId }).sort({ createdAt: -1 });

    if (aiScore && aiScore.status === 'completed') {
      return res.json(aiScore);
    }

    // Fallback : lire depuis Application.aiScore si disponible
    const application = await Application.findById(applicationId).select('aiScore totalScore detailedScores startupName');
    if (application?.aiScore?.total > 0) {
      return res.json({
        applicationId,
        scores:     application.aiScore.scores,
        total:      application.aiScore.total,
        summary:    application.aiScore.summary,
        strengths:  application.aiScore.strengths,
        weaknesses: application.aiScore.weaknesses,
        status:     'completed',
        generatedAt: application.aiScore.generatedAt,
        _fromApplication: true,
      });
    }

    if (aiScore) return res.json(aiScore); // pending ou failed

    return res.status(404).json({ message: 'Aucun score trouvé' });

  } catch (err) {
    console.error('[getScore]', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /ai-scoring/rescore/:applicationId
// ─────────────────────────────────────────────────────────────────
exports.rescoreApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application non trouvée' });
    }

    // Supprimer l'ancien score
    await AiScore.deleteOne({ applicationId });

    // Relancer le scoring
    return exports.triggerScoring(req, res);

  } catch (err) {
    console.error('[rescoreApplication]', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};