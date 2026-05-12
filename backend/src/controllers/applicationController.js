// src/controllers/applicationController.js
const AiScore = require('../models/AiScore');
const { generateScore } = require('../services/ollamaService');
const crypto      = require('crypto');
const Application = require('../models/Application');
const Notification= require('../models/Notification');
const { readableSize } = require('../middlewares/uploadMiddleware');
const {
  sendApplicationConfirmation,
  sendStatusUpdate,
} = require('../config/mailer');

// ─────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────

// Calcule le % de complétion d'une candidature
function calculateProgress(app) {
  let score = 0;

  // Infos projet remplies (30 pts)
  if (app.project?.startupName) score += 10;
  if (app.project?.description) score += 10;
  if (app.project?.problem)     score += 10;

  // Équipe (20 pts)
  if (app.team?.founderName)  score += 10;
  if (app.team?.teamSize)     score += 10;

  // Économie (10 pts)
  if (app.economy?.businessModel) score += 10;

  // Documents (40 pts — les plus importants)
  const hasBP = app.documents.some(d => d.docType === 'businessPlan');
  const hasPD = app.documents.some(d => d.docType === 'pitchDeck');
  const hasFi = app.documents.some(d => d.docType === 'financials');
  const hasCV = app.documents.some(d => d.docType === 'teamCVs');
  if (hasBP) score += 20;
  if (hasPD) score += 10;
  if (hasFi) score += 5;
  if (hasCV) score += 5;

  return Math.min(score, 100);
}

// ─────────────────────────────────────────────────────────────
// GET /api/applications/me
// Récupère la candidature du candidat connecté
// ─────────────────────────────────────────────────────────────
exports.getMyApplication = async (req, res) => {
  try {
    const app = await Application.findOne({ applicant: req.user._id });

    if (!app) {
      return res.status(404).json({ message: 'Aucune candidature trouvée.' });
    }

    // Incrémenter les vues à chaque consultation
    app.stats.views    = (app.stats.views || 0) + 1;
    app.stats.lastView = new Date();
    await app.save();

    res.status(200).json(app);
  } catch (err) {
    console.error('[getMyApplication]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/applications
// Crée une nouvelle candidature (soumission complète)
// Body (multipart/form-data) :
//   project  : JSON string
//   team     : JSON string
//   economy  : JSON string
// ─────────────────────────────────────────────────────────────
exports.createApplication = async (req, res) => {
  try {
    const application = await Application.create(req.body);
    
    // ✅ AJOUTE CES LIGNES — trigger auto scoring
    const aiScore = await AiScore.create({ 
      applicationId: application._id, 
      status: 'pending' 
    });
    
    generateScore(application.toObject())
      .then(async (result) => {
        aiScore.scores     = result.scores;
        aiScore.total      = result.total;
        aiScore.summary    = result.summary;
        aiScore.strengths  = result.strengths;
        aiScore.weaknesses = result.weaknesses;
        aiScore.status     = 'completed';
        await aiScore.save();
        console.log(`✅ Auto-score: ${application.startupName} → ${result.total}/100`);
      })
      .catch(async (err) => {
        aiScore.status = 'failed';
        await aiScore.save();
        console.error(`❌ Auto-score failed:`, err.message);
      });

    res.status(201).json({ success: true, application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!application) return res.status(404).json({ message: 'Non trouvée' });

    // ✅ CHAMPS QUI DÉCLENCHENT UN RE-SCORE
    const scoringFields = ['problem','solution','market','team','traction',
                           'sector','stage','description','targetMarket'];
    const hasChanged = scoringFields.some(f => req.body[f] !== undefined);

    if (hasChanged) {
      // Reset le score existant → pending
      await AiScore.findOneAndUpdate(
        { applicationId: application._id },
        { status: 'pending', scores: null, total: null, summary: null },
        { upsert: true }
      );

      // Re-score en arrière-plan
      const aiScore = await AiScore.findOne({ applicationId: application._id });
      generateScore(application.toObject())
        .then(async (result) => {
          Object.assign(aiScore, { ...result, status: 'completed' });
          await aiScore.save();
          console.log(`🔄 Re-scored: ${application.startupName} → ${result.total}/100`);
        })
        .catch(async () => {
          aiScore.status = 'failed';
          await aiScore.save();
        });
    }

    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// PATCH /api/applications/:id/draft
// Sauvegarde partielle d'un brouillon
// ─────────────────────────────────────────────────────────────
exports.saveDraft = async (req, res) => {
  try {
    const app = await Application.findOne({
      _id:       req.params.id,
      applicant: req.user._id,
    });

    if (!app) {
      return res.status(404).json({ message: 'Candidature introuvable.' });
    }
    if (app.status !== 'draft') {
      return res.status(403).json({ message: 'Candidature déjà soumise, modification impossible.' });
    }

    const { project, team, economy } = req.body;
    if (project)  app.project  = { ...app.project,  ...project };
    if (team)     app.team     = { ...app.team,     ...team };
    if (economy)  app.economy  = { ...app.economy,  ...economy };

    app.progress = calculateProgress(app);
    await app.save();

    res.status(200).json(app);
  } catch (err) {
    console.error('[saveDraft]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/applications/:id/documents
// Upload d'un document attaché à la candidature
// Champs multipart : file (fichier), docType (string)
// ─────────────────────────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  try {
    const app = await Application.findOne({
      _id:       req.params.id,
      applicant: req.user._id,
    });

    if (!app) {
      return res.status(404).json({ message: 'Candidature introuvable.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    const docType = req.body.docType || 'other';
    const ALLOWED_TYPES = ['businessPlan', 'pitchDeck', 'financials', 'teamCVs', 'other'];
    if (!ALLOWED_TYPES.includes(docType)) {
      return res.status(400).json({ message: `docType invalide. Valeurs acceptées : ${ALLOWED_TYPES.join(', ')}` });
    }

    // Remplacer l'ancien document du même type s'il existe
    app.documents = app.documents.filter(d => d.docType !== docType);

    // URL d'accès — en production remplacer par URL S3
    const fileUrl = `${process.env.API_URL || 'http://localhost:5000'}/uploads/documents/${req.file.filename}`;

    app.documents.push({
      name:       req.file.originalname,
      docType,
      filename:   req.file.filename,
      url:        fileUrl,
      size:       readableSize(req.file.size),
      mimeType:   req.file.mimetype,
      status:     'pending',
      uploadedAt: new Date(),
    });

    // Recalculer la progression
    app.progress = calculateProgress(app);
    await app.save();

    res.status(200).json({
      document: app.documents[app.documents.length - 1],
      progress: app.progress,
    });
  } catch (err) {
    console.error('[uploadDocument]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/applications/:id/documents/:docId
// Supprime un document d'une candidature
// ─────────────────────────────────────────────────────────────
exports.deleteDocument = async (req, res) => {
  try {
    const app = await Application.findOne({
      _id:       req.params.id,
      applicant: req.user._id,
    });

    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    const docIndex = app.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ message: 'Document introuvable.' });

    // Optionnel : supprimer le fichier physique
    const fs   = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../uploads/documents', app.documents[docIndex].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    app.documents.splice(docIndex, 1);
    app.progress = calculateProgress(app);
    await app.save();

    res.status(200).json({ message: 'Document supprimé.', progress: app.progress });
  } catch (err) {
    console.error('[deleteDocument]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// ── ROUTES ADMIN ─────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────

// GET /api/admin/applications?page=1&limit=20&status=reviewing&sector=FinTech
exports.adminListApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sector, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (sector) filter['project.sector'] = sector;
    if (search) filter['project.startupName'] = { $regex: search, $options: 'i' };

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('applicant', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(filter),
    ]);

    res.status(200).json({
      applications,
      pagination: {
        total,
        page:       parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        limit:      parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[adminListApplications]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/admin/applications/:id
exports.adminGetApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('applicant', 'name email role createdAt');

    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    res.status(200).json(app);
  } catch (err) {
    console.error('[adminGetApplication]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/admin/applications/:id/status
// Body: { status, notes, expectedDate }
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status, notes, expectedDate } = req.body;

    const VALID_STATUSES = ['reviewing', 'interview', 'approved', 'rejected', 'accepted'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Statut invalide. Valeurs : ${VALID_STATUSES.join(', ')}` });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    const prevStatus = app.status;
    app.status = status;

    // Mettre à jour la progression selon le statut
    const progressMap = {
      reviewing: 40,
      interview: 65,
      approved:  90,
      accepted:  100,
      rejected:  100,
    };
    app.progress = progressMap[status] || app.progress;

    // Ajouter à la timeline
    app.timeline.push({
      step:         status === 'accepted' ? 'approved' : status,
      date:         new Date(),
      notes:        notes || null,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      completed:    true,
    });

    await app.save();

    // Notification in-app au candidat
    const statusLabels = {
      reviewing: "Votre candidature est en cours d'évaluation.",
      interview: 'Un entretien a été programmé pour votre candidature.',
      approved:  'Félicitations ! Votre candidature a été approuvée.',
      accepted:  'Félicitations ! Vous avez été accepté dans le programme MEDIANET.',
      rejected:  "Votre candidature n'a pas été retenue cette fois.",
    };

    await Notification.create({
      user:    app.applicant,
      message: statusLabels[status] || `Statut mis à jour : ${status}`,
      type:    ['approved', 'accepted'].includes(status) ? 'success' :
               status === 'rejected' ? 'error' : 'info',
      link:    '/dashboard/applicant/status',
    });

    // Email au candidat
    try {
      const candidat = await require('../models/User').findById(app.applicant).select('email name');
      if (candidat) {
        await sendStatusUpdate(candidat.email, candidat.name, status, app.project.startupName, notes);
      }
    } catch (mailErr) {
      console.warn('[adminUpdateStatus] Email non envoyé :', mailErr.message);
    }

    res.status(200).json({ message: 'Statut mis à jour.', application: app });
  } catch (err) {
    console.error('[adminUpdateStatus]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/admin/applications/:id/feedback
// Body: { score, evaluator, evaluatorTitle, comments, strengths[], improvements[], categories[] }
exports.adminAddFeedback = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    app.feedback = {
      ...req.body,
      evaluatedAt: new Date(),
    };
    await app.save();

    // Notifier le candidat
    await Notification.create({
      user:    app.applicant,
      message: 'L\'évaluation de votre candidature est disponible.',
      type:    'info',
      link:    '/dashboard/applicant/status',
    });

    res.status(200).json({ message: 'Évaluation enregistrée.', feedback: app.feedback });
  } catch (err) {
    console.error('[adminAddFeedback]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/admin/applications/:id/documents/:docId/status
// Body: { status: 'approved' | 'rejected' }
exports.adminUpdateDocStatus = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    const doc = app.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document introuvable.' });

    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    doc.status = status;
    await app.save();

    res.status(200).json({ message: 'Statut document mis à jour.', document: doc });
  } catch (err) {
    console.error('[adminUpdateDocStatus]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/admin/applications/stats
// Statistiques globales pour le dashboard admin
exports.adminStats = async (req, res) => {
  try {
    const [total, byStatus, bySector] = await Promise.all([
      Application.countDocuments(),
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $group: { _id: '$project.sector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const statusMap = {};
    byStatus.forEach(s => { statusMap[s._id] = s.count; });

    res.status(200).json({
      total,
      byStatus: statusMap,
      bySector,
      acceptanceRate: total > 0
        ? Math.round(((statusMap.accepted || 0) / total) * 100)
        : 0,
    });
  } catch (err) {
    console.error('[adminStats]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};