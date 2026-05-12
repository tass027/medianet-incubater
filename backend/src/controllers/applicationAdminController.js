// controllers/applicationController.js  — PARTIE ADMIN À AJOUTER
// Ajoutez ces fonctions à votre applicationController.js existant
// OU remplacez entièrement le fichier avec ce contenu complet

const mongoose = require('mongoose');
const db       = mongoose.connection;

const appCol  = () => db.collection('applications');
const userCol = () => db.collection('users');
const juryCol = () => db.collection('jury');

// ════════════════════════════════════════════════════════════════
// GET /api/applications/admin/all
// Liste toutes les candidatures pour l'admin (avec filtres)
// ════════════════════════════════════════════════════════════════
exports.adminGetAllApplications = async (req, res) => {
  try {
    const { search, status, sector, programme, type, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { startupName:  { $regex: search, $options: 'i' } },
        { founderName:  { $regex: search, $options: 'i' } },
        { founderEmail: { $regex: search, $options: 'i' } },
        { sector:       { $regex: search, $options: 'i' } },
      ];
    }
    if (status    && status !== 'all')    filter.status = status;
    if (sector    && sector !== 'all')    filter.sector = sector;
    if (type      && type !== 'all')      filter.type   = type;
    if (programme && programme !== 'all') {
      if (programme === 'null' || programme === 'spontaneous') {
        filter.programmeName = null;
      } else {
        filter.programmeName = { $regex: programme, $options: 'i' };
      }
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await appCol().countDocuments(filter);
    const apps  = await appCol()
      .find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Mapper en format attendu par le frontend
    const mapped = apps.map(app => ({
      id:          app._id.toString(),
      _id:         app._id,
      startupName: app.startupName || app.formResponses?.startupName || 'N/A',
      founder:     app.founderName  || 'N/A',
      email:       app.founderEmail || 'N/A',
      sector:      app.sector       || app.formResponses?.sector || 'N/A',
      stage:       app.stage        || app.formResponses?.stage  || 'N/A',
      location:    app.location     || app.formResponses?.location || 'Tunisie',
      amount:      app.formResponses?.fundingNeeded || 'N/A',
      description: app.formResponses?.description   || '',
      status:      app.status,
      type:        app.type || 'programme',
      programmeName: app.programmeName || null,
      submittedAt:   app.appliedAt   || app.createdAt,
      lastUpdated:   app.updatedAt   || app.appliedAt,
      decidedAt:     app.decidedAt   || null,
      notified:      app.notified    || false,
      adminDecisionRemark: app.notes || '',
      juryAssigned:  app.juryAssigned || [],
      documents:     app.documents || ['Dossier de candidature'],
      statusHistory: app.timelineSteps?.map(s => ({
        status: s.step,
        label:  s.label,
        date:   s.date,
        by:     'Système',
      })) || [],
      detailedScores: app.aiScore?.scores
        ? {
            team:       app.aiScore.scores.team      || 0,
            innovation: app.aiScore.scores.solution  || 0,
            market:     app.aiScore.scores.market    || 0,
            business:   app.aiScore.scores.problem   || 0,
            traction:   app.aiScore.scores.traction  || 0,
          }
        : { team: 0, innovation: 0, market: 0, business: 0, traction: 0 },
      totalScore: app.aiScore?.total || 0,
      aiSummary:  app.aiScore?.summary || '',
      formResponses: app.formResponses || {},
    }));

    res.json({
      success: true,
      applications: mapped,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('[adminGetAllApplications]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /api/applications/admin/:id
// Détail d'une candidature
// ════════════════════════════════════════════════════════════════
exports.adminGetApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const app = await appCol().findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!app) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    res.json({ success: true, application: { ...app, id: app._id.toString() } });
  } catch (err) {
    console.error('[adminGetApplication]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// PATCH /api/applications/admin/:id/status
// Changer le statut d'une candidature
// ════════════════════════════════════════════════════════════════
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, decisionRemark } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const validStatuses = ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'approved', 'submitted'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Statut invalide' });

    const remark = note || decisionRemark || '';

    // Construire la nouvelle étape timeline
    const newStep = {
      step:   status,
      label:  getStepLabel(status),
      status: 'active',
      date:   new Date(),
      by:     req.user?.name || 'Admin',
    };

    const updateData = {
      status,
      updatedAt: new Date(),
      $push: { timelineSteps: newStep },
    };

    if (remark) updateData.notes = remark;
    if (['accepted', 'rejected', 'approved'].includes(status)) {
      updateData.decidedAt = new Date();
    }

    // Séparer $push du reste pour MongoDB
    const { $push, ...setFields } = updateData;
    const result = await appCol().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: setFields, $push },
      { returnDocument: 'after' }
    );

    if (!result)
      return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    res.json({
      success: true,
      message: `Statut mis à jour : ${status}`,
      application: { ...result, id: result._id.toString() },
    });
  } catch (err) {
    console.error('[adminUpdateStatus]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
// PATCH /api/applications/admin/:id/scores
// Sauvegarder les scores admin
// ════════════════════════════════════════════════════════════════
exports.adminUpdateScores = async (req, res) => {
  try {
    const { id } = req.params;
    const { scores, remarks, totalScore } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const result = await appCol().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          'adminEvaluation.scores':     scores,
          'adminEvaluation.remarks':    remarks || {},
          'adminEvaluation.totalScore': totalScore,
          'adminEvaluation.evaluatedAt': new Date(),
          'adminEvaluation.evaluatedBy': req.user?.name || 'Admin',
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result)
      return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    res.json({ success: true, message: 'Scores sauvegardés', application: { ...result, id: result._id.toString() } });
  } catch (err) {
    console.error('[adminUpdateScores]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// PATCH /api/applications/admin/:id/jury
// Assigner jury à une candidature
// ════════════════════════════════════════════════════════════════
exports.adminAssignJury = async (req, res) => {
  try {
    const { id } = req.params;
    const { juryIds = [], juryNames = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const result = await appCol().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          juryAssigned:    juryNames,
          juryAssignedIds: juryIds,
          updatedAt:       new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result)
      return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    res.json({ success: true, message: 'Jury assigné', application: { ...result, id: result._id.toString() } });
  } catch (err) {
    console.error('[adminAssignJury]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// PATCH /api/applications/admin/:id/notify
// Marquer comme notifié
// ════════════════════════════════════════════════════════════════
exports.adminMarkNotified = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    await appCol().updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { notified: true, notifiedAt: new Date(), updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Candidat marqué comme notifié' });
  } catch (err) {
    console.error('[adminMarkNotified]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /api/applications/admin/stats
// Stats globales pour le dashboard
// ════════════════════════════════════════════════════════════════
exports.adminGetStats = async (req, res) => {
  try {
    const [total, pending, reviewing, interview, accepted, rejected, submitted] = await Promise.all([
      appCol().countDocuments({}),
      appCol().countDocuments({ status: 'pending' }),
      appCol().countDocuments({ status: 'reviewing' }),
      appCol().countDocuments({ status: 'interview' }),
      appCol().countDocuments({ status: { $in: ['accepted', 'approved'] } }),
      appCol().countDocuments({ status: 'rejected' }),
      appCol().countDocuments({ status: 'submitted' }),
    ]);

    const withScores = await appCol()
      .find({ 'aiScore.total': { $exists: true, $gt: 0 } })
      .project({ 'aiScore.total': 1 })
      .toArray();

    const averageScore = withScores.length
      ? Math.round(withScores.reduce((a, b) => a + (b.aiScore?.total || 0), 0) / withScores.length)
      : 0;

    res.json({
      success: true,
      stats: { total, pending, reviewing, interview, accepted, rejected, submitted, averageScore },
    });
  } catch (err) {
    console.error('[adminGetStats]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ── helper ────────────────────────────────────────────────────
function getStepLabel(status) {
  const labels = {
    submitted:  'Candidature soumise',
    pending:    'En attente',
    reviewing:  'En cours d\'évaluation',
    interview:  'Entretien',
    accepted:   'Acceptée',
    approved:   'Acceptée',
    rejected:   'Rejetée',
  };
  return labels[status] || status;
}