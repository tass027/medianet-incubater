// src/controllers/startupApplicationController.js
// POST /api/startup/applications  — soumettre une candidature
// GET  /api/startup/applications  — mes candidatures (utilisé par status page)

const User      = require('../models/User');
const mongoose  = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/startup/applications
// ─────────────────────────────────────────────────────────────────────────────
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    // Supporte multipart/form-data ET application/json
    const body = req.body;

    const {
      programmeId,
      programmeName,
      // Champs communs issus du formulaire dynamique
      startupName,
      sector,
      stage,
      website,
      description,
      founderName,
      founderEmail,
      founderPhone,
      teamSize,
      businessModel,
      targetMarket,
      fundingNeeded,
      competitors,
      usp,
      revenue,
      customers,
      achievements,
      videoUrl,
    } = body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    // ── Vérifier doublon ────────────────────────────────────────────────────
    if (programmeId && programmeId !== '') {
      const alreadyApplied = (user.applications || []).some(
        a => a.programmeId?.toString() === programmeId.toString() &&
             !['rejected', 'withdrawn'].includes(a.status)
      );
      if (alreadyApplied) {
        return res.status(409).json({
          success: false,
          message: 'Vous avez déjà soumis une candidature pour ce programme.',
          code: 'ALREADY_APPLIED',
        });
      }
    }

    // ── Construire formResponses ────────────────────────────────────────────
    // On collecte TOUS les champs du body comme réponses formulaire
    // pour être compatible avec n'importe quel schéma dynamique
    const formResponses = {
      startupName:   startupName   || user.startupProfile?.startupName || '',
      sector:        sector        || user.startupProfile?.sector       || '',
      stage:         stage         || user.startupProfile?.stage        || '',
      website:       website       || user.startupProfile?.website      || '',
      description:   description   || '',
      founderName:   founderName   || user.name  || '',
      founderEmail:  founderEmail  || user.email || '',
      founderPhone:  founderPhone  || '',
      teamSize:      teamSize      || '',
      businessModel: businessModel || '',
      targetMarket:  targetMarket  || '',
      fundingNeeded: fundingNeeded || '',
      competitors:   competitors   || '',
      usp:           usp           || '',
      revenue:       revenue       || '',
      customers:     customers     || '',
      achievements:  achievements  || '',
      videoUrl:      videoUrl      || '',
    };

    // Ajouter tous les autres champs dynamiques du body
    const knownKeys = new Set([
      'programmeId','programmeName','startupName','sector','stage','website',
      'description','founderName','founderEmail','founderPhone','teamSize',
      'businessModel','targetMarket','fundingNeeded','competitors','usp',
      'revenue','customers','achievements','videoUrl',
    ]);
    Object.entries(body).forEach(([k, v]) => {
      if (!knownKeys.has(k)) formResponses[k] = v;
    });

    // ── Mettre à jour le profil startup si vide ─────────────────────────────
    if (!user.startupProfile?.startupName && startupName) {
      user.startupProfile = {
        ...(user.startupProfile || {}),
        startupName,
        sector,
        stage,
        website,
        description,
      };
    }

    // ── Documents uploadés ──────────────────────────────────────────────────
    const documents = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        documents.push({
          name:       file.originalname,
          path:       file.path,
          mimetype:   file.mimetype,
          size:       file.size,
          uploadedAt: new Date(),
          status:     'pending',
        });
      });
    }

    // ── Créer la nouvelle candidature ───────────────────────────────────────
    const newApplication = {
      programmeId:   programmeId && programmeId !== ''
        ? new mongoose.Types.ObjectId(programmeId)
        : null,
      programmeName: programmeName || 'Candidature Spontanée',
      type:          programmeId && programmeId !== '' ? 'programme' : 'spontaneous',
      status:        'pending',   // statut initial = en attente
      formResponses,
      documents,
      appliedAt:     new Date(),
      timelineSteps: [
        {
          step:   'submitted',
          label:  'Candidature soumise',
          status: 'done',
          date:   new Date(),
        },
        {
          step:   'reviewing',
          label:  "En cours d'évaluation",
          status: 'pending',
          date:   null,
        },
        {
          step:   'interview',
          label:  'Entretien',
          status: 'pending',
          date:   null,
        },
        {
          step:   'decision',
          label:  'Décision finale',
          status: 'pending',
          date:   null,
        },
      ],
    };

    user.applications.push(newApplication);
    await user.save();

    const savedApp = user.applications[user.applications.length - 1];

    return res.status(201).json({
      success:       true,
      message:       'Candidature soumise avec succès !',
      applicationId: savedApp._id,
      programmeName: savedApp.programmeName,
      status:        savedApp.status,
    });

  } catch (err) {
    console.error('[submitApplication]', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la soumission.',
      error:   err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/applications
// Retourne toutes les candidatures du user connecté
// Utilisé par la page /dashboard/startup/status
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('applications name email startupProfile')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const applications = (user.applications || [])
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    return res.status(200).json({
      success: true,
      applications,
      total: applications.length,
    });

  } catch (err) {
    console.error('[getMyApplications]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};