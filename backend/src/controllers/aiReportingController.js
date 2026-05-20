// src/controllers/aiReportingController.js
const { generateReport } = require('../services/aiReportingService');
const Application    = require('../models/Application');
const JuryEvaluation = require('../models/JuryEvaluation');
const AiReport       = require('../models/AiReport');

function normalizeScores(evaluation) {
  const scoresObj = { team: 0, innovation: 0, market: 0, business: 0, traction: 0 };
  if (Array.isArray(evaluation.scores)) {
    evaluation.scores.forEach(s => {
      const id = (s.criteriaId || '').toLowerCase();
      if (scoresObj.hasOwnProperty(id)) scoresObj[id] = s.score || 0;
    });
  }
  return {
    ...evaluation,
    scores:        scoresObj,
    jurorName:     evaluation.juryName,
    feedback:      evaluation.globalRemark || '',
    jurySubmitted: ['submitted', 'reviewed'].includes(evaluation.status),
    totalScore:    evaluation.totalScore || 0,
  };
}

// POST /api/admin/ai-reporting/generate
exports.generate = async (req, res) => {
  try {
    const { applicationId, forceRegenerate = false } = req.body;
    if (!applicationId) return res.status(400).json({ message: 'applicationId requis' });

    // Return cached unless force-regenerate
    if (!forceRegenerate) {
      const existing = await AiReport.findOne({ applicationId });
      if (existing) return res.json({ report: existing, cached: true });
    }

    const app = await Application.findById(applicationId).lean();
    if (!app) return res.status(404).json({ message: 'Candidature non trouvée' });

    const rawEvals   = await JuryEvaluation.find({ applicationId }).lean();
    const evaluations = rawEvals.map(normalizeScores);
    const submitted   = evaluations.filter(e => e.jurySubmitted);

    if (submitted.length === 0) {
      return res.status(422).json({ message: 'Aucune évaluation soumise pour cette candidature' });
    }

    const result = await generateReport(app, evaluations);

    // Upsert to MongoDB
    const saved = await AiReport.findOneAndUpdate(
      { applicationId },
      { ...result, applicationId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ report: saved, cached: false });

  } catch (err) {
    console.error('[aiReporting] generate error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/ai-reporting/:applicationId
exports.getReport = async (req, res) => {
  try {
    const report = await AiReport.findOne({ applicationId: req.params.applicationId });
    if (!report) return res.status(404).json({ message: 'Aucun rapport généré' });
    return res.json({ report });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/ai-reporting/:applicationId
exports.deleteReport = async (req, res) => {
  await AiReport.deleteOne({ applicationId: req.params.applicationId });
  return res.status(204).send();
};