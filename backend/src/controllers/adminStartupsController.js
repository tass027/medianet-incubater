// src/controllers/adminStartupsController.js
// CORRECTION Sprint 5 :
//  - generateAiMatching délègue au matchingService (évite la duplication + utilise Investor model)
//  - updateAiMatch synchronise aussi application.matching pour cohérence

const Application    = require('../models/Application');
const matchingService = require('../services/matchingService');

// ── Helper normalisation ──────────────────────────────────────────────────────
function normalizeApp(app) {
  return {
    ...app,
    id:           app._id?.toString(),
    name:         app.startupName  || app.project?.startupName || 'Sans nom',
    founder:      app.founderName  || app.project?.founderName || '—',
    sector:       app.sector       || app.project?.sector      || '—',
    stage:        app.stage        || app.project?.stage       || '—',
    location:     app.location     || app.project?.location    || '—',
    logo:         app.logo         || (app.startupName ? app.startupName.substring(0, 2).toUpperCase() : '??'),
    score:        app.score        || 0,
    investorIds:  (app.investorIds  || []).map(String),
    mentorIds:    (app.mentorIds    || []).map(String),
    besoins:      app.besoins      || [],
    aiMatches:    app.aiMatches    || [],
    sessionHistory:    app.sessionHistory    || [],
    startupFormations: app.startupFormations || [],
    applicationStatus: app.status,
  };
}

function mapStatusFilter(uiStatus) {
  const map = {
    active:    { $in: ['accepted', 'approved'] },
    paused:    'paused',
    graduated: 'graduated',
  };
  return map[uiStatus] ?? uiStatus;
}

// ── GET /api/admin/startups ───────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { sector, status, search } = req.query;
    const filter = { status: { $in: ['accepted', 'approved'] } };

    if (status && status !== 'all') filter.status = mapStatusFilter(status);

    if (sector && sector !== 'all') {
      filter.$or = [{ sector }, { 'project.sector': sector }];
    }

    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      const searchOr = [
        { startupName: re }, { founderName: re }, { sector: re },
        { 'project.startupName': re }, { 'project.sector': re },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const apps = await Application.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: apps.map(normalizeApp) });
  } catch (err) {
    console.error('[adminStartups.getAll]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/startups/:id ──────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/startups/:id/assign ──────────────────────────────────────
exports.assign = async (req, res) => {
  try {
    const { investorIds, mentorIds } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { investorIds: investorIds ?? [], mentorIds: mentorIds ?? [] },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });

    // ── Notifications via notificationService (remplace emailService) ─────
    const notificationService = require('../services/notificationService');
    const startupName = app.project?.startupName || app.startupName || 'Startup';

    // Notifier les mentors nouvellement assignés
    const User = require('../models/User');
    for (const mentorId of (mentorIds || [])) {
      notificationService.create({
        recipientId:   mentorId,
        recipientRole: 'mentor',
        type:          'assignment',
        title:         'Nouvelle startup assignée',
        body:          `Vous avez été assigné à la startup ${startupName}`,
        link:          `/dashboard/mentor/startups`,
        data:          { startupId: req.params.id, startupName },
      }).catch((err) => console.warn('[assign] notif mentor error:', err.message));
    }
    // Notifier la startup incubée (step 12 du diagramme de séquence)
    const startupUserId = app.applicant?._id || app.userId || app.founderId;
    if (startupUserId) {
      notificationService.create({
        recipientId:   startupUserId,
        recipientRole: 'startup',
        type:          'assignment',
        title:         'Mentor et investisseur assignés',
        body:          `Votre startup ${startupName} a été mise en relation avec ${mentorIds.length} mentor(s) et ${investorIds.length} investisseur(s).`,
        link:          `/dashboard/startup/matching`,
        data:          { startupId: req.params.id, mentorIds, investorIds },
      }).catch((err) => console.warn('[assign] notif startup error:', err.message));
    }
    // Notifier les investisseurs nouvellement assignés
    for (const investorId of (investorIds || [])) {
      notificationService.create({
        recipientId:   investorId,
        recipientRole: 'investor',
        type:          'assignment',
        title:         'Nouvelle startup assignée',
        body:          `Vous avez été associé à la startup ${startupName}`,
        link:          `/dashboard/investor/startups`,
        data:          { startupId: req.params.id, startupName },
      }).catch((err) => console.warn('[assign] notif investor error:', err.message));
    }

    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/startups/:id/timeline ────────────────────────────────────
exports.updateTimeline = async (req, res) => {
  try {
    const { timelinePhase, timelineProgress, timelineNotes } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { timelinePhase, timelineProgress, timelineNotes },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/startups/:id/besoins ─────────────────────────────────────
// adminStartupsController.js — exports.updateBesoins
exports.updateBesoins = async (req, res) => {
  try {
    const { besoins } = req.body;
    if (!Array.isArray(besoins)) {
      return res.status(400).json({ success: false, message: 'besoins doit être un tableau' });
    }
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { besoins },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });

    // ✅ FIX : lancer le matching automatiquement en arrière-plan
    matchingService.matchApplication(req.params.id).catch((err) =>
      console.error('[updateBesoins] matching auto error:', err.message)
    );

    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/startups/:id/session-history ──────────────────────────────
exports.addSessionHistory = async (req, res) => {
  try {
    const session = { ...req.body, createdAt: new Date() };
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $push: { sessionHistory: session } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/startups/:id/session-history/:sessionId ─────────────────
exports.removeSessionHistory = async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $pull: { sessionHistory: { _id: req.params.sessionId } } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/startups/:id/formations ───────────────────────────────────
exports.addFormation = async (req, res) => {
  try {
    const formation = { ...req.body, sentAt: new Date().toISOString() };
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $push: { startupFormations: formation } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/startups/:id/formations/:formationId ───────────────────
exports.removeFormation = async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $pull: { startupFormations: { _id: req.params.formationId } } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: normalizeApp(app) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// AI MATCHING — délègue au matchingService (corrigé)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/startups/:id/ai-matching/generate
 * CORRECTION : délègue à matchingService au lieu de dupliquer la logique.
 * matchingService utilise le modèle Investor (pas User) + Ollama LLM.
 */
exports.generateAiMatching = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });

    const adminUserId = req.user?._id || null;

    // ── Délégation au service IA ──────────────────────────────────────────
    const result = await matchingService.matchApplication(req.params.id, adminUserId);

    // ── Conversion résultats → format aiMatches pour la page admin ────────
    const aiMatches = [];
    
    (result.investors || []).forEach((inv) => {
      aiMatches.push({
        type:     'investor',
        targetId: inv.investorId?.toString(), // ← toString() pour comparaison frontend
        score:    inv.score || 0,
        reasons:  [...(inv.highlights || []).slice(0, 2)].filter(Boolean),
        status:   'suggested',
        generatedAt: new Date(),
      });
    });

    (result.mentors || []).forEach((men) => {
      aiMatches.push({
        type:     'mentor',
        targetId: men.mentorId?.toString(), // ← toString()
        score:    men.score || 0,
        reasons:  [...(men.coveredNeeds || men.highlights || []).slice(0, 2)].filter(Boolean),
        status:   'suggested',
        generatedAt: new Date(),
      });
    });

    aiMatches.sort((a, b) => b.score - a.score);

    // ── Persistance ───────────────────────────────────────────────────────
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { aiMatches },
      { new: true }
    ).lean();

    // ── Messages informatifs selon les résultats ──────────────────────────
    let message = `${aiMatches.length} recommandation(s) générée(s) par l'IA`;
    const warnings = [];
    
    if (result.noInvestorFound) {
      warnings.push('Aucun investisseur compatible n\'est disponible');
    }
    if (result.noMentorFound) {
      warnings.push('Aucun mentor compatible n\'est trouvé');
    }
    
    if (warnings.length > 0) {
      message += ' — ' + warnings.join('; ');
    }

    res.json({
      success:    true,
      data:       normalizeApp(updated),
      matchCount: aiMatches.length,
      message,
    });
  } catch (err) {
    console.error('[adminStartups.generateAiMatching]', err);
    
    // ── Gestion des erreurs spécifiques ──────────────────────────────────
    if (err.message?.includes('Aucun besoin renseigné')) {
      return res.status(400).json({
        success: false,
        message: 'Les besoins ne sont pas renseignés — impossible de générer un matching pertinent',
      });
    }
    if (err.message?.includes('Informations incomplètes')) {
      return res.status(400).json({
        success: false,
        message: 'Les informations saisies sont incomplètes — veuillez renseigner le projet et les besoins',
      });
    }
    
    // Fallback si le service IA (Ollama) n'est pas disponible
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('ollama')) {
      return res.status(503).json({
        success: false,
        message: 'Service IA temporairement indisponible. Vérifiez qu\'Ollama est démarré.',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/admin/startups/:id/ai-matching/:matchId
 * Accepter ou rejeter une suggestion.
 * Si accepté : ajoute automatiquement à investorIds / mentorIds.
 */
exports.updateAiMatch = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "status doit être 'accepted' ou 'rejected'" });
    }

    // ── Mise à jour du sous-document aiMatches ────────────────────────────
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, 'aiMatches._id': req.params.matchId },
      { $set: { 'aiMatches.$.status': status } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Match introuvable' });

    // ── Si accepté : ajouter à investorIds/mentorIds ──────────────────────
    if (status === 'accepted') {
      const match = (app.aiMatches || []).find(
        (m) => m._id?.toString() === req.params.matchId
      );
      if (match) {
        const field = match.type === 'investor' ? 'investorIds' : 'mentorIds';
        await Application.findByIdAndUpdate(req.params.id, {
          $addToSet: { [field]: match.targetId },
        });

        // ── Synchroniser aussi application.matching (pour matchingController) ──
        const fullApp = await Application.findById(req.params.id);
        if (fullApp?.matching) {
          const matchingArr = match.type === 'investor'
            ? fullApp.matching.investors
            : fullApp.matching.mentors;
          const idField = match.type === 'investor' ? 'investorId' : 'mentorId';
          const target  = (matchingArr || []).find(
            (m) => m[idField]?.toString() === match.targetId?.toString()
          );
          if (target) {
            target.status = 'approved';
            fullApp.matching.lastUpdated = new Date();
            fullApp.markModified('matching');
            await fullApp.save();
          }
        }
      }
    }

    const refreshed = await Application.findById(req.params.id).lean();
    res.json({ success: true, data: normalizeApp(refreshed) });
  } catch (err) {
    console.error('[adminStartups.updateAiMatch]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/startups/:id/ai-matching
 */
exports.getAiMatches = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .select('aiMatches matching startupName project.startupName').lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });

    // Lire depuis aiMatches[] en priorité, sinon construire depuis matching{}
    let data = app.aiMatches || [];

    if (data.length === 0 && app.matching) {
      // Convertir application.matching → format aiMatches pour le frontend
      (app.matching.investors || []).forEach((inv) => {
        data.push({
          type:      'investor',
          targetId:  inv.investorId,
          score:     inv.score || 0,
          reasons:   inv.highlights || [],
          status:    'suggested',
        });
      });
      (app.matching.mentors || []).forEach((men) => {
        data.push({
          type:      'mentor',
          targetId:  men.mentorId,
          score:     men.score || 0,
          reasons:   men.coveredNeeds || men.highlights || [],
          status:    'suggested',
        });
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};