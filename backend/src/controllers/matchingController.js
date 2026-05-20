// src/controllers/matchingController.js
// CORRECTIONS :
//  1. getByApplication : lit application.matching (résultats du service IA)
//  2. triggerSync      : synchronise aussi application.aiMatches après le matching
//     pour que la page admin startups (onglet Matching IA) affiche les résultats
//  3. validateMatch    : utilise bien le modèle Investor (pas User) pour les refs
//  4. rematchAll       : exporté correctement

const matchingService = require('../services/matchingService');
const Application     = require('../models/Application');
const Match           = require('../models/Match');

const TRIGGER_STATUSES = ['accepted', 'approved', 'reviewing', 'submitted', 'pending', 'interview', 'active'];

// ── Helper : convertit les résultats matchingService → format aiMatches (Application) ──
function buildAiMatchesFromResult(result) {
  const aiMatches = [];

  // Investisseurs
  (result.investors || []).forEach((inv) => {
    aiMatches.push({
      type:         'investor',
      targetId:     inv.investorId,
      targetModel:  'Investor',
      targetName:   inv.investorName  || inv.name || '',
      targetCompany:inv.investorType  || '',
      score:        inv.score         || 0,
      reasons:      [
        ...(inv.highlights || []),
        inv.reasoning ? inv.reasoning.substring(0, 120) : '',
      ].filter(Boolean).slice(0, 3),
      status:       'suggested',
      generatedAt:  new Date(),
    });
  });

  // Mentors
  (result.mentors || []).forEach((men) => {
    aiMatches.push({
      type:         'mentor',
      targetId:     men.mentorId,
      targetModel:  'User',
      targetName:   men.mentorName || men.name || '',
      targetCompany:(men.expertise || []).join(', '),
      score:        men.score      || 0,
      reasons:      [
        ...(men.highlights    || []),
        ...(men.coveredNeeds  || []),
        men.reasoning ? men.reasoning.substring(0, 120) : '',
      ].filter(Boolean).slice(0, 3),
      status:       'suggested',
      generatedAt:  new Date(),
    });
  });

  return aiMatches.sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/trigger/:applicationId
// Asynchrone — réponse immédiate
// ═══════════════════════════════════════════════════════════════════════════
exports.trigger = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature introuvable' });
    }
    if (!TRIGGER_STATUSES.includes(application.status)) {
      return res.status(400).json({
        message: `Statut non supporté (actuel: "${application.status}"). Valides: ${TRIGGER_STATUSES.join(', ')}`,
      });
    }

    // ── VALIDATION : Informations incomplètes ────────────────────────────────
    const hasProject = application.project?.startupName || application.startupName;
    const hasEconomy = application.economy?.fundingGoal;
    const openBesoins = (application.besoins || []).filter((b) => b.status !== 'resolu');
    const oldNeeds = application.needs ? Object.keys(application.needs).length > 0 : false;
    const hasNeeds = openBesoins.length > 0 || oldNeeds;

    if (!hasProject) {
      return res.status(400).json({ 
        message: 'Les informations saisies sont incomplètes — nom du projet manquant' 
      });
    }

    if (!hasEconomy && ['accepted', 'approved', 'interview', 'active'].includes(application.status)) {
      return res.status(400).json({ 
        message: 'Les informations saisies sont incomplètes — objectif de financement manquant' 
      });
    }

    if (!hasNeeds && ['accepted', 'approved', 'interview', 'active'].includes(application.status)) {
      return res.status(400).json({ 
        message: 'Les besoins ne sont pas renseignés — impossible de générer un matching pertinent' 
      });
    }

    res.json({ message: 'Matching lancé — résultats disponibles dans 30-60s', applicationId });

    matchingService.matchApplication(applicationId).catch((err) => {
      console.error('[matchingController.trigger] Erreur asynchrone:', err.message);
    });
  } catch (err) {
    console.error('[matchingController.trigger]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/trigger/:applicationId/sync
// Synchrone — attend la fin, PUIS synchronise application.aiMatches
// ═══════════════════════════════════════════════════════════════════════════
exports.triggerSync = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature introuvable' });
    }
    if (!TRIGGER_STATUSES.includes(application.status)) {
      return res.status(400).json({
        message: `Statut non supporté (actuel: "${application.status}"). Valides: ${TRIGGER_STATUSES.join(', ')}`,
      });
    }

    const adminUserId = req.user?._id || null;
    const result      = await matchingService.matchApplication(applicationId, adminUserId);

    // ── CORRECTION : synchroniser application.aiMatches après le matching ──
    // Permet à la page admin startups (onglet "Matching IA") de lire les résultats
    const aiMatches = buildAiMatchesFromResult(result);
    await Application.findByIdAndUpdate(applicationId, { aiMatches });

    // ── Messages informatifs selon les résultats ──────────────────────────
    let message = null;
    const warnings = [];
    
    if (result.noInvestorFound) {
      warnings.push('Aucun investisseur compatible n\'est disponible');
    }
    if (result.noMentorFound) {
      warnings.push('Aucun mentor compatible n\'est trouvé');
    }
    
    if (warnings.length > 0) {
      message = warnings.join('; ');
    }

    res.json({ success: true, data: { ...result, aiMatches }, message });
  } catch (err) {
    console.error('[matchingController.triggerSync]', err);
    
    // ── Gestion des erreurs spécifiques ──────────────────────────────────
    if (err.message?.includes('Aucun besoin renseigné')) {
      return res.status(400).json({ 
        message: 'Les besoins ne sont pas renseignés — impossible de générer un matching pertinent' 
      });
    }
    if (err.message?.includes('Informations incomplètes')) {
      return res.status(400).json({ 
        message: 'Les informations saisies sont incomplètes — veuillez renseigner le projet et les besoins' 
      });
    }
    
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/matching/:applicationId
// Retourne application.matching (résultats IA) + application.aiMatches (format admin)
// ═══════════════════════════════════════════════════════════════════════════
exports.getByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
 
    // CORRECTION : sélectionner aussi besoins[]
    const application = await Application.findById(applicationId).select(
      'project.startupName project.sector project.stage economy.fundingGoal ' +
      'matching needs besoins aiMatches status'
    );
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
 
    // CORRECTION : lire besoins[] en priorité pour hasNeeds
    const openBesoins = (application.besoins || []).filter(
      (b) => b.status !== 'resolu'
    );
    const hasOldNeeds = !!(
      application.needs && Object.keys(application.needs).length > 0
    );
    const hasNeeds    = openBesoins.length > 0 || hasOldNeeds;
 
    const data = {
      startupName:  application.project?.startupName,
      sector:       application.project?.sector,
      stage:        application.project?.stage,
      fundingGoal:  application.economy?.fundingGoal,
 
      // CORRECTION : hasNeeds basé sur besoins[] ET needs{}
      hasNeeds,
      besoinCount:  openBesoins.length,
 
      // Résultats matching IA
      investors:    application.matching?.investors   || [],
      mentors:      application.matching?.mentors     || [],
      jury:         application.matching?.jury        || [],
      generatedAt:  application.matching?.generatedAt,
      status:       application.matching?.status,
      matchStatus:  application.matching?.status,
 
      // Format admin page
      aiMatches:    application.aiMatches || [],
    };
 
    res.json({ success: true, data });
  } catch (err) {
    console.error('[matchingController.getByApplication]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/matching/candidate/:investorId  (géré dans la route, pas ici)
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/rematch-all
// ═══════════════════════════════════════════════════════════════════════════
exports.rematchAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter     = status
      ? { status }
      : { status: { $nin: ['draft'] } };

    const applications = await Application.find(filter);
    const results      = [];

    for (const app of applications) {
      try {
        const result    = await matchingService.matchApplication(app._id);
        const aiMatches = buildAiMatchesFromResult(result);
        await Application.findByIdAndUpdate(app._id, { aiMatches });
        results.push({
          id:      app._id,
          name:    app.project?.startupName || app.startupName,
          success: true,
          matches: (result.investors?.length || 0) + (result.mentors?.length || 0),
        });
      } catch (err) {
        results.push({
          id:      app._id,
          name:    app.project?.startupName || app.startupName,
          success: false,
          error:   err.message,
        });
      }
    }

    res.json({ success: true, total: applications.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/matching/:applicationId/validate
// Valide ou rejette un match investisseur
// ═══════════════════════════════════════════════════════════════════════════
exports.validateMatch = async (req, res) => {
  try {
    const { applicationId }      = req.params;
    const { investorId, action } = req.body;

    if (!investorId || !action) {
      return res.status(400).json({ message: 'investorId et action sont requis' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    // ── Mise à jour dans application.matching (format matchingService) ──
    const investors = application.matching?.investors || [];
    const investor  = investors.find((i) => i.investorId?.toString() === investorId);
    if (investor) {
      investor.status = action === 'approve' ? 'approved' : 'rejected';
      application.matching.lastUpdated = new Date();
      application.markModified('matching');
    }

    // ── Mise à jour dans application.aiMatches (format page admin) ──
    const aiMatches = application.aiMatches || [];
    const aiMatch   = aiMatches.find(
      (m) => m.type === 'investor' && m.targetId?.toString() === investorId
    );
    if (aiMatch) {
      aiMatch.status = action === 'approve' ? 'accepted' : 'rejected';
      application.markModified('aiMatches');
    }

    await application.save();

    // ── Si approuvé : créer/mettre à jour un document Match + ajouter à investorIds ──
    if (action === 'approve') {
      const adminUser = req.user?._id;
      try {
        await Match.findOneAndUpdate(
          { startup: applicationId, investor: investorId },
          {
            $set:       { matchScore: investor?.score || aiMatch?.score || 75 },
            $setOnInsert: {
              startup:   applicationId,
              investor:  investorId,
              status:    'pending_founder_validation',
              createdBy: adminUser,
            },
          },
          { upsert: true, new: true }
        );
      } catch (matchErr) {
        if (matchErr.code !== 11000) {
          console.error('[validateMatch] Erreur création Match:', matchErr.message);
        }
      }

      // Ajouter à investorIds sur l'application
      await Application.findByIdAndUpdate(applicationId, {
        $addToSet: { investorIds: investorId },
      });
    }

    res.json({
      success: true,
      message: `Investisseur ${action === 'approve' ? 'approuvé' : 'rejeté'}`,
    });
  } catch (err) {
    console.error('[validateMatch]', err);
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/matching/:applicationId/validate-mentor
// ═══════════════════════════════════════════════════════════════════════════
exports.validateMentor = async (req, res) => {
  try {
    const { applicationId }    = req.params;
    const { mentorId, action } = req.body;

    if (!mentorId || !action) {
      return res.status(400).json({ message: 'mentorId et action sont requis' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    // ── Mise à jour dans application.matching ──
    const mentors = application.matching?.mentors || [];
    const mentor  = mentors.find((m) => m.mentorId?.toString() === mentorId);
    if (mentor) {
      mentor.status = action === 'approve' ? 'approved' : 'rejected';
      application.matching.lastUpdated = new Date();
      application.markModified('matching');
    }

    // ── Mise à jour dans application.aiMatches ──
    const aiMatches = application.aiMatches || [];
    const aiMatch   = aiMatches.find(
      (m) => m.type === 'mentor' && m.targetId?.toString() === mentorId
    );
    if (aiMatch) {
      aiMatch.status = action === 'approve' ? 'accepted' : 'rejected';
      application.markModified('aiMatches');
    }

    await application.save();

    // Si approuvé : ajouter à mentorIds
    if (action === 'approve') {
      await Application.findByIdAndUpdate(applicationId, {
        $addToSet: { mentorIds: mentorId },
      });
    }

    res.json({
      success: true,
      message: `Mentor ${action === 'approve' ? 'approuvé' : 'rejeté'}`,
      mentor:  mentor || aiMatch,
    });
  } catch (err) {
    console.error('[validateMentor]', err);
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/:applicationId/send-email
// ═══════════════════════════════════════════════════════════════════════════
exports.sendMatchEmail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { type, targetId, targetEmail, targetName, startupName, message } = req.body;

    if (!type || !targetEmail || !targetName) {
      return res.status(400).json({ message: 'type, targetEmail et targetName sont requis' });
    }

    const application = await Application.findById(applicationId).populate('applicant', 'name email');
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    const nodemailer  = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const startup      = application.project?.startupName || startupName;
    const founder      = application.team?.founderName    || application.applicant?.name || '';
    const founderEmail = application.team?.founderEmail   || application.applicant?.email || '';

    const TEMPLATES = {
      investor: {
        subject: `🚀 Opportunité d'investissement — ${startup} | MEDIANET Incubator`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#00526e,#006d94);padding:30px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;">💼 Opportunité d'Investissement</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">MEDIANET Incubator Tunisia</p>
          </div>
          <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
            <p>Bonjour <strong>${targetName}</strong>,</p>
            <p>Notre algorithme IA a identifié une correspondance entre votre profil et la startup <strong>${startup}</strong>.</p>
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
              <p><strong>Startup:</strong> ${startup}</p>
              <p><strong>Secteur:</strong> ${application.project?.sector || 'N/A'}</p>
              <p><strong>Fondateur:</strong> ${founder} — <a href="mailto:${founderEmail}">${founderEmail}</a></p>
              ${message ? `<p style="font-style:italic;">${message}</p>` : ''}
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center;">MEDIANET Incubator — Tunis, Tunisie</p>
          </div></div>`,
      },
      mentor: {
        subject: `🎓 Mission de Mentorat — ${startup} | MEDIANET Incubator`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:30px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;">🎓 Mission de Mentorat</h1>
          </div>
          <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
            <p>Bonjour <strong>${targetName}</strong>,</p>
            <p>Nous vous proposons d'accompagner <strong>${startup}</strong> dans notre programme d'incubation.</p>
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
              <p><strong>Secteur:</strong> ${application.project?.sector || 'N/A'}</p>
              <p><strong>Fondateur:</strong> ${founder} — <a href="mailto:${founderEmail}">${founderEmail}</a></p>
              ${message ? `<p style="font-style:italic;">${message}</p>` : ''}
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center;">MEDIANET Incubator — Tunis, Tunisie</p>
          </div></div>`,
      },
      candidate: {
        subject: `🎉 Mise en relation confirmée pour ${startup} | MEDIANET Incubator`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:30px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;">🎉 Mise en relation confirmée</h1>
          </div>
          <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
            <p>Bonjour <strong>${founder}</strong>,</p>
            <p>MEDIANET a validé une mise en relation pour <strong>${startup}</strong> avec <strong>${targetName}</strong>.</p>
            <p>Contact : <a href="mailto:${targetEmail}">${targetEmail}</a></p>
            ${message ? `<p style="font-style:italic;">${message}</p>` : ''}
            <p style="color:#9ca3af;font-size:12px;text-align:center;">MEDIANET Incubator — Tunis, Tunisie</p>
          </div></div>`,
      },
    };

    const tpl = TEMPLATES[type];
    if (!tpl) {
      return res.status(400).json({ message: `Type inconnu: "${type}". Valeurs: investor, mentor, candidate` });
    }

    await transporter.sendMail({
      from:    `"MEDIANET Incubator" <${process.env.SMTP_USER}>`,
      to:      targetEmail,
      subject: tpl.subject,
      html:    tpl.html,
    });

    res.json({ success: true, message: `Email envoyé à ${targetEmail}` });
  } catch (err) {
    console.error('[sendMatchEmail]', err);
    res.status(500).json({ message: err.message });
  }
};