// src/controllers/candidaturesController.js
// Gère la page /dashboard/startup/candidatures
// FIX: lit depuis le modèle Application (collection séparée) au lieu de user.applications

const mongoose    = require('mongoose');
const Programme   = require('../models/Programme');
const Application = require('../models/Application');

// ─── Constantes ──────────────────────────────────────────────────────────────
const VALID_STATUSES = ['draft', 'pending', 'reviewing', 'interview', 'approved', 'accepted', 'rejected', 'waitlist'];
const MAX_LIMIT      = 200;
const DEFAULT_LIMIT  = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validatePagination = (page, limit) => {
  let p = parseInt(page)  || 1;
  let l = parseInt(limit) || DEFAULT_LIMIT;
  if (p < 1) p = 1;
  if (l < 1) l = DEFAULT_LIMIT;
  if (l > MAX_LIMIT) l = MAX_LIMIT;
  return { page: p, limit: l };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/candidatures
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyCandidatures = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page, limit } = validatePagination(req.query.page, req.query.limit);

    let { status } = req.query;
    if (status && status !== 'all' && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status invalide. Valeurs acceptées: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // ── Construire la query ──────────────────────────────────────────────────
    const query = { userId };
    if (status && status !== 'all') query.status = status;

    // ── Récupérer depuis Application (source de vérité) ──────────────────────
    const total        = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ── Enrichir avec les programmes ─────────────────────────────────────────
    const programmeIds = [...new Set(
      applications.map(a => a.programmeId).filter(Boolean)
    )];

    let programmesMap = {};
    if (programmeIds.length > 0) {
      const programmes = await Programme.find(
        { _id: { $in: programmeIds } },
        { titre: 1, sector: 1, deadline: 1, status: 1, fundingAmount: 1, duration: 1 }
      ).lean();
      programmes.forEach(p => { programmesMap[p._id.toString()] = p; });
    }

    // ── Mapper vers le format attendu par le front ───────────────────────────
    const mapped = applications.map(app => {
      const prog = programmesMap[app.programmeId?.toString()] || null;
      // applyController stocke les réponses dans app.answers
      const r    = app.answers || app.formResponses || {};

      return {
        _id:           app._id,
        programmeId:   app.programmeId   || null,
        programmeName: app.programmeName || prog?.titre || 'Candidature spontanée',
        type:          app.type          || 'programme',
        status:        app.status        || 'pending',
        appliedAt:     app.submittedAt   || app.appliedAt || app.createdAt || null,
        decidedAt:     app.decidedAt     || null,

        programme: prog ? {
          sector:        prog.sector,
          deadline:      prog.deadline,
          fundingAmount: prog.fundingAmount,
          duration:      prog.duration,
          status:        prog.status,
        } : null,

        formResponses: {
          startupName:   r.projectName    || r.startupName   || '',
          sector:        r.sector         || prog?.sector     || '',
          stage:         r.stage          || '',
          description:   r.description    || '',
          founderName:   app.founderName  || r.founderName    || '',
          founderEmail:  app.founderEmail || r.founderEmail   || '',
          teamSize:      r.teamSize       || '',
          fundingNeeded: r.fundingNeeded  || null,
          website:       r.website        || '',
          revenue:       r.revenue        || null,
          customers:     r.customers      || null,
          achievements:  r.achievements   || null,
        },

        timelineSteps: app.timelineSteps || [
          {
            step:   'submitted',
            status: 'done',
            label:  'Candidature soumise',
            date:   app.submittedAt || app.createdAt,
          },
          {
            step:   'reviewing',
            status: ['reviewing'].includes(app.status) ? 'active' : 'pending',
            label:  "En cours d'évaluation",
            date:   null,
          },
          {
            step:   'interview',
            status: app.status === 'interview' ? 'active'
                  : app.status === 'accepted'  ? 'done'
                  : 'pending',
            label:  'Entretien',
            date:   null,
          },
          {
            step:   'decision',
            status: ['accepted', 'rejected'].includes(app.status) ? 'done' : 'pending',
            label:  'Décision finale',
            date:   app.decidedAt || null,
          },
        ],

        aiScore:    app.aiScore   || null,
        documents:  app.documents || [],
        isAccepted: app.status === 'accepted',
        isRejected: app.status === 'rejected',
        isActive:   !['rejected', 'accepted', 'waitlist'].includes(app.status),
      };
    });

    // ── Stats globales (toutes candidatures, pas seulement la page) ──────────
    const allApps = await Application.find({ userId }).select('status').lean();
    const stats = {
      total:     allApps.length,
      pending:   allApps.filter(a => a.status === 'pending').length,
      reviewing: allApps.filter(a => a.status === 'reviewing').length,
      interview: allApps.filter(a => a.status === 'interview').length,
      accepted:  allApps.filter(a => a.status === 'accepted').length,
      rejected:  allApps.filter(a => a.status === 'rejected').length,
      active:    allApps.filter(a => !['rejected', 'accepted', 'waitlist'].includes(a.status)).length,
    };

    return res.status(200).json({
      success:      true,
      applications: mapped,
      stats,
      isFounder:    allApps.some(a => a.status === 'accepted'),
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error('[getMyCandidatures] Erreur:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des candidatures.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/candidatures/:appId
// ─────────────────────────────────────────────────────────────────────────────
exports.getCandidatureById = async (req, res) => {
  try {
    const { appId } = req.params;
    const userId    = req.user._id || req.user.id;

    if (!appId || !isValidObjectId(appId)) {
      return res.status(400).json({ success: false, message: 'ID de candidature invalide.' });
    }

    // Sécurité : userId doit correspondre
    const app = await Application.findOne({ _id: appId, userId }).lean();

    if (!app) {
      return res.status(404).json({ success: false, message: 'Candidature introuvable.' });
    }

    let programme = null;
    if (app.programmeId) {
      programme = await Programme.findById(app.programmeId)
        .select('titre sector deadline fundingAmount duration status benefits')
        .lean();
    }

    const r = app.answers || app.formResponses || {};

    return res.status(200).json({
      success: true,
      application: {
        _id:           app._id,
        programmeId:   app.programmeId,
        programmeName: app.programmeName || programme?.titre || 'Candidature spontanée',
        status:        app.status,
        appliedAt:     app.submittedAt || app.appliedAt || app.createdAt,
        decidedAt:     app.decidedAt   || null,
        formResponses: {
          startupName:   r.projectName    || r.startupName   || '',
          sector:        r.sector         || programme?.sector || '',
          stage:         r.stage          || '',
          description:   r.description    || '',
          founderName:   app.founderName  || r.founderName    || '',
          founderEmail:  app.founderEmail || r.founderEmail   || '',
          teamSize:      r.teamSize       || '',
          fundingNeeded: r.fundingNeeded  || null,
          website:       r.website        || '',
          ...r,
        },
        timelineSteps: app.timelineSteps || [],
        aiScore:       app.aiScore       || null,
        documents:     app.documents     || [],
        programme,
      },
    });

  } catch (err) {
    console.error('[getCandidatureById] Erreur:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/startup/candidatures/:appId
// ─────────────────────────────────────────────────────────────────────────────
exports.withdrawCandidature = async (req, res) => {
  try {
    const { appId } = req.params;
    const userId    = req.user._id || req.user.id;

    if (!appId || !isValidObjectId(appId)) {
      return res.status(400).json({ success: false, message: 'ID de candidature invalide.' });
    }

    const app = await Application.findOne({ _id: appId, userId });

    if (!app) {
      return res.status(404).json({ success: false, message: 'Candidature introuvable.' });
    }

    if (!['draft', 'pending'].includes(app.status)) {
      return res.status(403).json({
        success: false,
        message: `Impossible de retirer une candidature en statut "${app.status}".`,
        code:    'WITHDRAW_NOT_ALLOWED',
      });
    }

    await Application.deleteOne({ _id: appId });

    console.log(`✅ Candidature ${appId} retirée par ${userId}`);
    return res.status(200).json({ success: true, message: 'Candidature retirée avec succès.' });

  } catch (err) {
    console.error('[withdrawCandidature] Erreur:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};