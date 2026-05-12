// src/controllers/startupController.js
// Contrôleur Startup unifié — gère candidat + fondateur
// isFounder = applications.some(a => a.status === 'accepted')

const User         = require('../models/User');
const mongoose     = require('mongoose');

// ─────────────────────────────────────────────────────
// HELPER — vérifie si l'utilisateur est fondateur
// ─────────────────────────────────────────────────────
const checkIsFounder = (user) => {
  return user.applications?.some(a => a.status === 'accepted') ?? false;
};

// ─────────────────────────────────────────────────────
// GET /api/startup/me
// Retourne le profil complet de l'utilisateur startup
// incluant isFounder (virtual), applications, kpis
// ─────────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -refreshTokenHash -resetCode -emailVerifyToken');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const profile = user.toJSON(); // inclut le virtual isFounder

    return res.status(200).json({
      user: profile,
      isFounder: checkIsFounder(user),
      applicationCount: user.applications?.length ?? 0,
      acceptedCount: user.applications?.filter(a => a.status === 'accepted').length ?? 0,
    });
  } catch (err) {
    console.error('[getMyProfile]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// PATCH /api/startup/profile
// Mise à jour du profil startup (infos générales + startupProfile)
// ─────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      startupName, sector, stage, website, linkedin, description,
      teamSize, location, foundedYear,
    } = req.body;

    const updates = {};
    if (name) updates.name = name;

    const profileFields = { startupName, sector, stage, website, linkedin, description, teamSize, location, foundedYear };
    Object.entries(profileFields).forEach(([key, val]) => {
      if (val !== undefined) updates[`startupProfile.${key}`] = val;
    });

    if (req.file) {
      updates['startupProfile.logoUrl'] = `/uploads/logos/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshTokenHash -resetCode');

    return res.status(200).json({ message: 'Profil mis à jour.', user: user.toJSON() });
  } catch (err) {
    console.error('[updateProfile]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/startup/applications
// Liste toutes les candidatures de l'utilisateur
// ─────────────────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('applications');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const applications = user.applications.map(app => ({
      ...app.toObject(),
      isAccepted: app.status === 'accepted',
    }));

    return res.status(200).json({
      applications,
      isFounder: checkIsFounder(user),
      total: applications.length,
    });
  } catch (err) {
    console.error('[getMyApplications]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /api/startup/applications
// Soumettre une nouvelle candidature
// ─────────────────────────────────────────────────────
exports.submitApplication = async (req, res) => {
  try {
    const {
      programmeId, programmeName, type,
      startupName, sector, stage, website, description,
      founderName, founderEmail, founderPhone, teamSize,
      businessModel, targetMarket, fundingNeeded, competitors, usp,
      revenue, customers, achievements,
      videoUrl,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    // Vérifier si déjà candidat actif pour ce programme
    if (programmeId) {
      const existingActive = user.applications.find(
        a => a.programmeId?.toString() === programmeId &&
             !['rejected', 'waitlist'].includes(a.status)
      );
      if (existingActive) {
        return res.status(409).json({
          message: 'Vous avez déjà une candidature active pour ce programme.',
          applicationId: existingActive._id,
        });
      }
    }

    // Documents uploadés
    const documents = [];
    if (req.files?.businessPlan?.[0]) {
      documents.push({ name: 'Business Plan', url: `/uploads/docs/${req.files.businessPlan[0].filename}`, type: 'business_plan' });
    }
    if (req.files?.pitchDeck?.[0]) {
      documents.push({ name: 'Pitch Deck', url: `/uploads/docs/${req.files.pitchDeck[0].filename}`, type: 'pitch_deck' });
    }
    if (req.files?.financials?.[0]) {
      documents.push({ name: 'Projections financières', url: `/uploads/docs/${req.files.financials[0].filename}`, type: 'financials' });
    }

    const newApplication = {
      programmeId:   programmeId || null,
      programmeName: programmeName || 'Candidature spontanée',
      type:          type || 'programme',
      status:        'pending',
      appliedAt:     new Date(),
      formResponses: {
        startupName, sector, stage, website, description,
        founderName, founderEmail, founderPhone, teamSize,
        businessModel, targetMarket, fundingNeeded, competitors, usp,
        revenue, customers, achievements, videoUrl,
      },
      timelineSteps: [
        { step: 'submitted',  status: 'done',    label: 'Candidature soumise',    date: new Date() },
        { step: 'reviewing',  status: 'active',  label: 'En cours d\'évaluation', date: null },
        { step: 'interview',  status: 'pending', label: 'Entretien',               date: null },
        { step: 'decision',   status: 'pending', label: 'Décision finale',         date: null },
      ],
    };

    user.applications.push(newApplication);

    // Mettre à jour startupProfile si vide
    if (startupName && !user.startupProfile?.startupName) {
      user.startupProfile = {
        ...user.startupProfile,
        startupName, sector, stage, website, description,
      };
    }

    await user.save();

    const savedApp = user.applications[user.applications.length - 1];

    return res.status(201).json({
      message: 'Candidature soumise avec succès.',
      application: savedApp,
      isFounder: checkIsFounder(user),
    });
  } catch (err) {
    console.error('[submitApplication]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/startup/applications/:appId/status
// Détail d'une candidature + timeline
// ─────────────────────────────────────────────────────
exports.getApplicationStatus = async (req, res) => {
  try {
    const { appId } = req.params;
    const user = await User.findById(req.user._id).select('applications');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const app = user.applications.id(appId);
    if (!app) return res.status(404).json({ message: 'Candidature non trouvée.' });

    return res.status(200).json({ application: app.toObject() });
  } catch (err) {
    console.error('[getApplicationStatus]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/startup/kpis
// KPIs de la startup — FONDATEUR UNIQUEMENT
// ─────────────────────────────────────────────────────
exports.getKPIs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('applications kpis');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (!checkIsFounder(user)) {
      return res.status(403).json({
        message: 'Accès réservé aux fondateurs (candidature acceptée requise).',
        code: 'NOT_FOUNDER',
      });
    }

    return res.status(200).json({
      kpis: user.kpis ?? [],
      isFounder: true,
    });
  } catch (err) {
    console.error('[getKPIs]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /api/startup/kpis
// Ajouter/mettre à jour les KPIs mensuels
// ─────────────────────────────────────────────────────
exports.upsertKPI = async (req, res) => {
  try {
    const { month, revenue, teamSize, users, mrr, note } = req.body;
    if (!month) return res.status(422).json({ message: 'Le mois est requis (ex: 2026-04).' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (!checkIsFounder(user)) {
      return res.status(403).json({ message: 'Accès réservé aux fondateurs.', code: 'NOT_FOUNDER' });
    }

    const existingIdx = user.kpis.findIndex(k => k.month === month);
    if (existingIdx >= 0) {
      if (revenue   !== undefined) user.kpis[existingIdx].revenue   = revenue;
      if (teamSize  !== undefined) user.kpis[existingIdx].teamSize  = teamSize;
      if (users     !== undefined) user.kpis[existingIdx].users     = users;
      if (mrr       !== undefined) user.kpis[existingIdx].mrr       = mrr;
      if (note      !== undefined) user.kpis[existingIdx].note      = note;
    } else {
      user.kpis.push({ month, revenue, teamSize, users, mrr, note });
    }

    await user.save();
    return res.status(200).json({ message: 'KPIs mis à jour.', kpis: user.kpis });
  } catch (err) {
    console.error('[upsertKPI]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/startup/mentoring
// Sessions de mentorat + mentors assignés — FONDATEUR UNIQUEMENT
// ─────────────────────────────────────────────────────
exports.getMentoringData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('applications matchingSuggestions')
      .populate({
        path: 'matchingSuggestions.mentors.mentorId',
        select: 'name email startupProfile role',
      });

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (!checkIsFounder(user)) {
      return res.status(403).json({
        message: 'Accès réservé aux fondateurs.',
        code: 'NOT_FOUNDER',
      });
    }

    // Récupérer le mentor assigné depuis la candidature acceptée
    const acceptedApp = user.applications.find(a => a.status === 'accepted');
    let assignedMentor = null;
    if (acceptedApp?.assignedMentor) {
      assignedMentor = await User.findById(acceptedApp.assignedMentor)
        .select('name email role');
    }

    return res.status(200).json({
      isFounder: true,
      assignedMentor,
      mentorSuggestions: user.matchingSuggestions?.mentors ?? [],
      sessions: [], // TODO: implémenter le modèle Session
    });
  } catch (err) {
    console.error('[getMentoringData]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /api/startup/mentoring/sessions
// Réserver une session de mentorat — FONDATEUR UNIQUEMENT
// ─────────────────────────────────────────────────────
exports.bookMentoringSession = async (req, res) => {
  try {
    const { mentorId, date, time, topic, notes } = req.body;

    if (!mentorId || !date || !time || !topic) {
      return res.status(422).json({ message: 'mentorId, date, time et topic sont requis.' });
    }

    const user = await User.findById(req.user._id).select('applications');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (!checkIsFounder(user)) {
      return res.status(403).json({ message: 'Accès réservé aux fondateurs.', code: 'NOT_FOUNDER' });
    }

    const mentor = await User.findById(mentorId).select('name email role');
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ message: 'Mentor non trouvé.' });
    }

    // TODO: Implémenter le modèle Session et la logique de réservation complète
    // Pour l'instant on retourne une confirmation fictive
    const sessionDate = new Date(`${date}T${time}:00`);

    return res.status(201).json({
      message: 'Session réservée avec succès.',
      session: {
        id:          new mongoose.Types.ObjectId(),
        mentorId,
        mentorName:  mentor.name,
        date:        sessionDate,
        topic,
        notes:       notes || '',
        status:      'confirmed',
        bookedAt:    new Date(),
      },
    });
  } catch (err) {
    console.error('[bookMentoringSession]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/startup/investors
// Investisseurs recommandés — FONDATEUR UNIQUEMENT
// ─────────────────────────────────────────────────────
exports.getInvestorMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('applications matchingSuggestions')
      .populate({
        path: 'matchingSuggestions.investors.investorId',
        select: 'name email role',
      });

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (!checkIsFounder(user)) {
      return res.status(403).json({
        message: 'Accès réservé aux fondateurs.',
        code: 'NOT_FOUNDER',
      });
    }

    return res.status(200).json({
      isFounder: true,
      investors: user.matchingSuggestions?.investors ?? [],
    });
  } catch (err) {
    console.error('[getInvestorMatches]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// ADMIN — GET /api/startup/admin/list
// Liste toutes les startups (admin seulement)
// ─────────────────────────────────────────────────────
exports.adminListStartups = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sector, isFounder: founderFilter } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { role: { $in: ['startup', 'founder', 'applicant'] } };
    if (sector) filter['startupProfile.sector'] = sector;

    let users = await User.find(filter)
      .select('-passwordHash -refreshTokenHash -resetCode -emailVerifyToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filtrer par isFounder côté app si demandé
    if (founderFilter === 'true') {
      users = users.filter(u => checkIsFounder(u));
    } else if (founderFilter === 'false') {
      users = users.filter(u => !checkIsFounder(u));
    }

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      startups: users.map(u => ({ ...u.toJSON(), isFounder: checkIsFounder(u) })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('[adminListStartups]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// ADMIN — PATCH /api/startup/admin/:userId/application/:appId/status
// Modifier le statut d'une candidature
// ─────────────────────────────────────────────────────
exports.adminUpdateApplicationStatus = async (req, res) => {
  try {
    const { userId, appId } = req.params;
    const { status, note } = req.body;

    const VALID_STATUSES = ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'waitlist'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(422).json({ message: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const app = user.applications.id(appId);
    if (!app) return res.status(404).json({ message: 'Candidature non trouvée.' });

    app.status    = status;
    app.decidedAt = ['accepted', 'rejected'].includes(status) ? new Date() : app.decidedAt;

    // Mettre à jour la timeline
    const stepMap = { reviewing: 'reviewing', interview: 'interview', accepted: 'decision', rejected: 'decision' };
    if (stepMap[status]) {
      const step = app.timelineSteps.find(s => s.step === stepMap[status]);
      if (step) {
        step.status = status === 'rejected' ? 'rejected' : 'done';
        step.date   = new Date();
        if (note) step.note = note;
      }
    }

    await user.save();

    return res.status(200).json({
      message: `Statut mis à jour : ${status}`,
      application: app.toObject(),
      isFounder: checkIsFounder(user),
    });
  } catch (err) {
    console.error('[adminUpdateApplicationStatus]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};