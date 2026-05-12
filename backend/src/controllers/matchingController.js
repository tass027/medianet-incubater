// src/controllers/matchingController.js
const matchingService = require('../services/matchingService');
const Application     = require('../models/Application');
const Match           = require('../models/Match');
const MentorMatch     = require('../models/MentorMatch');

const TRIGGER_STATUSES = ['accepted', 'approved', 'reviewing', 'submitted', 'pending', 'interview', 'active'];

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/trigger/:applicationId
// Déclenche le matching en arrière-plan (réponse immédiate)
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
        message: `Statut non supporté pour le matching (actuel: "${application.status}"). Statuts valides: ${TRIGGER_STATUSES.join(', ')}`,
      });
    }

    res.json({ message: 'Matching lancé — résultats disponibles dans 30-60s', applicationId });

    matchingService.matchApplication(applicationId).catch(err => {
      console.error('[matchingController.trigger] Erreur asynchrone:', err.message);
    });

  } catch (err) {
    console.error('[matchingController.trigger]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/trigger/:applicationId/sync
// Version synchrone — attend la fin du matching (pour tests et admin UI)
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
        message: `Statut non supporté pour le matching (actuel: "${application.status}"). Statuts valides: ${TRIGGER_STATUSES.join(', ')}`,
      });
    }

    const adminUserId = req.user?._id || null;
    const result = await matchingService.matchApplication(applicationId, adminUserId);
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('[matchingController.triggerSync]', err);
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/matching/:applicationId
// Retourne tous les matches pour une candidature donnée
// ═══════════════════════════════════════════════════════════════════════════
exports.getByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .select('project.startupName project.sector project.stage economy.fundingGoal matching needs');

    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    const data = {
      startupName:  application.project?.startupName,
      sector:       application.project?.sector,
      stage:        application.project?.stage,
      fundingGoal:  application.economy?.fundingGoal,
      hasNeeds:     !!(application.needs && Object.keys(application.needs).length > 0),
      investors:    application.matching?.investors   || [],
      mentors:      application.matching?.mentors     || [],
      jury:         application.matching?.jury        || [],
      generatedAt:  application.matching?.generatedAt,
      status:       application.matching?.status,
    };

    res.json({ success: true, data });

  } catch (err) {
    console.error('[matchingController.getByApplication]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/matching/candidate/:candidateId
// Matches d'un investisseur/mentor spécifique (page investisseurs)
// ═══════════════════════════════════════════════════════════════════════════
exports.getByCandidateId = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const applications = await Application.find({
      'matching.investors.investorId': candidateId,
      status: { $in: ['accepted', 'approved'] },
    }).select('project.startupName project.sector matching.investors');

    const matches = applications
      .map(app => {
        const match = app.matching?.investors?.find(
          i => i.investorId?.toString() === candidateId
        );
        return {
          applicationId: app._id,
          startupName:   app.project?.startupName,
          sector:        app.project?.sector,
          score:         match?.score      || 0,
          reasoning:     match?.reasoning  || '',
          needsMatch:    match?.needsMatch || [],
          status:        match?.status     || 'pending',
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({ success: true, data: matches });

  } catch (err) {
    console.error('[matchingController.getByCandidateId]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/rematch-all
// Relance le matching sur toutes les candidatures (hors draft)
// ═══════════════════════════════════════════════════════════════════════════
exports.rematchAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : { status: { $nin: ['draft'] } };

    const applications = await Application.find(filter);
    const results      = [];

    for (const app of applications) {
      try {
        const result = await matchingService.matchApplication(app._id);
        results.push({
          id:      app._id,
          name:    app.project?.startupName,
          success: true,
          matches: (result.investors?.length || 0) + (result.jury?.length || 0),
        });
      } catch (err) {
        results.push({
          id:      app._id,
          name:    app.project?.startupName,
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
// Valide ou rejette un match investisseur, crée un document Match si approuvé
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

    const investors = application.matching?.investors || [];
    const investor  = investors.find(i => i.investorId?.toString() === investorId);
    if (!investor) {
      return res.status(404).json({ message: 'Correspondance investisseur non trouvée' });
    }

    investor.status                  = action === 'approve' ? 'approved' : 'rejected';
    application.matching.lastUpdated = new Date();
    application.markModified('matching');
    await application.save();

    // Si approuvé → créer/mettre à jour un document Match
    if (action === 'approve') {
      const startupId = application._id; // FIX: application._id = startup reference
      const adminUser = req.user?._id;

      try {
        await Match.findOneAndUpdate(
          { startup: startupId, investor: investorId },
          {
            $set: {
              matchScore: investor.score || 75,
              status:     'pending_founder_validation',
            },
            $setOnInsert: {
              startup:   startupId,
              investor:  investorId,
              createdBy: adminUser,
            },
          },
          { upsert: true, new: true }
        );
        console.log(`[validateMatch] Match créé/mis à jour: startup=${startupId}, investor=${investorId}`);
      } catch (matchErr) {
        console.error('[validateMatch] Erreur création Match:', matchErr.message);
      }
    }

    res.json({ success: true, message: `Correspondance ${investor.status}` });

  } catch (err) {
    console.error('[validateMatch]', err);
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/matching/:applicationId/validate-mentor
// Valide ou rejette un match mentor
// ═══════════════════════════════════════════════════════════════════════════
exports.validateMentor = async (req, res) => {
  try {
    const { applicationId }  = req.params;
    const { mentorId, action } = req.body;

    if (!mentorId || !action) {
      return res.status(400).json({ message: 'mentorId et action sont requis' });
    }

    const application = await Application.findById(applicationId)
      .populate('applicant', 'name email');
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    const mentors = application.matching?.mentors || [];
    const mentor  = mentors.find(m => m.mentorId?.toString() === mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Correspondance mentor non trouvée' });
    }

    mentor.status                    = action === 'approve' ? 'approved' : 'rejected';
    application.matching.lastUpdated = new Date();
    application.markModified('matching');
    await application.save();

    res.json({ success: true, message: `Mentor ${mentor.status}`, mentor });

  } catch (err) {
    console.error('[validateMentor]', err);
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/matching/:applicationId/send-email
// Envoie un email à un investisseur, mentor, ou au candidat
// ═══════════════════════════════════════════════════════════════════════════
exports.sendMatchEmail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { type, targetId, targetEmail, targetName, startupName, message } = req.body;

    if (!type || !targetEmail || !targetName) {
      return res.status(400).json({ message: 'type, targetEmail et targetName sont requis' });
    }

    const application = await Application.findById(applicationId)
      .populate('applicant', 'name email');
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    const nodemailer  = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const startup      = application.project?.startupName || startupName;
    const founder      = application.team?.founderName    || application.applicant?.name;
    const founderEmail = application.team?.founderEmail   || application.applicant?.email;

    let subject, html;

    if (type === 'investor') {
      subject = `🚀 Opportunité d'investissement — ${startup} | MEDIANET Incubator`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#00526e,#006d94);padding:30px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">💼 Opportunité d'Investissement</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">MEDIANET Incubator Tunisia</p>
          </div>
          <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
            <p style="color:#374151;font-size:16px;">Bonjour <strong>${targetName}</strong>,</p>
            <p style="color:#374151;">Notre algorithme IA a identifié une correspondance prometteuse entre votre profil d'investissement et la startup <strong>${startup}</strong>.</p>
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#00526e;margin:0 0 12px;">📊 Profil Startup</h3>
              <p style="margin:4px 0;color:#374151;"><strong>Startup:</strong> ${startup}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Secteur:</strong> ${application.project?.sector || 'N/A'}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Stade:</strong> ${application.project?.stage || 'N/A'}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Fondateur:</strong> ${founder}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Contact:</strong> ${founderEmail}</p>
              ${message ? `<p style="margin:12px 0 0;color:#374151;font-style:italic;">${message}</p>` : ''}
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="mailto:${founderEmail}" style="background:#006d94;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">📧 Contacter la Startup</a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;">MEDIANET Incubator — Tunis, Tunisie | <a href="https://medianet.tn" style="color:#006d94;">medianet.tn</a></p>
          </div>
        </div>`;

    } else if (type === 'mentor') {
      subject = `🎓 Mission de Mentorat — ${startup} | MEDIANET Incubator`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:30px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">🎓 Mission de Mentorat</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">MEDIANET Incubator Tunisia</p>
          </div>
          <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
            <p style="color:#374151;font-size:16px;">Bonjour <strong>${targetName}</strong>,</p>
            <p style="color:#374151;">Nous avons sélectionné votre profil pour accompagner la startup <strong>${startup}</strong> dans le cadre de notre programme d'incubation.</p>
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#1d4ed8;margin:0 0 12px;">🚀 Startup à accompagner</h3>
              <p style="margin:4px 0;color:#374151;"><strong>Startup:</strong> ${startup}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Secteur:</strong> ${application.project?.sector || 'N/A'}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Stade:</strong> ${application.project?.stage || 'N/A'}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Fondateur:</strong> ${founder}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Contact:</strong> ${founderEmail}</p>
              ${message ? `<p style="margin:12px 0 0;color:#374151;font-style:italic;">${message}</p>` : ''}
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="mailto:${founderEmail}" style="background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">📧 Contacter la Startup</a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;">MEDIANET Incubator — Tunis, Tunisie</p>
          </div>
        </div>`;

    } else if (type === 'candidate') {
      subject = `🎉 Bonne nouvelle pour ${startup} ! | MEDIANET Incubator`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:30px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">🎉 Mise en relation confirmée</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">MEDIANET Incubator Tunisia</p>
          </div>
          <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
            <p style="color:#374151;font-size:16px;">Bonjour <strong>${founder}</strong>,</p>
            <p style="color:#374151;">Excellente nouvelle ! MEDIANET Incubator a validé une mise en relation pour votre startup <strong>${startup}</strong>.</p>
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#059669;margin:0 0 12px;">🤝 Votre nouveau contact</h3>
              <p style="margin:4px 0;color:#374151;"><strong>Nom:</strong> ${targetName}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Email:</strong> ${targetEmail}</p>
              ${message ? `<p style="margin:12px 0 0;color:#374151;font-style:italic;">${message}</p>` : ''}
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="mailto:${targetEmail}" style="background:#059669;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">📧 Contacter ${targetName}</a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;">MEDIANET Incubator — Tunis, Tunisie</p>
          </div>
        </div>`;

    } else {
      return res.status(400).json({ message: `Type d'email inconnu: "${type}". Valeurs acceptées: investor, mentor, candidate` });
    }

    await transporter.sendMail({
      from:    `"MEDIANET Incubator" <${process.env.SMTP_USER}>`,
      to:      targetEmail,
      subject,
      html,
    });

    res.json({ success: true, message: `Email envoyé à ${targetEmail}` });

  } catch (err) {
    console.error('[sendMatchEmail]', err);
    res.status(500).json({ message: err.message });
  }
};