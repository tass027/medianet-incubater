// controllers/mentorMatchController.js
// Handles founder-side actions on mentor recommendations & sessions
// Mirrors the logic of matchController.js (investor matching)

const nodemailer    = require('nodemailer');
const MentorMatch   = require('../models/MentorMatch');
const Application   = require('../models/Application');

// ── Nodemailer ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmail({ toEmail, subject, bodyHtml }) {
  if (!toEmail || !process.env.GMAIL_USER) return;
  try {
    await transporter.sendMail({
      from: `"MediaNet Incubator" <${process.env.GMAIL_USER}>`,
      to:   toEmail,
      subject,
      html: bodyHtml,
    });
    console.log(`✅ [mentorMatchController] Email → ${toEmail}`);
  } catch (err) {
    console.error(`⚠️ [mentorMatchController] Email failed:`, err.message);
  }
}

// ── Resolve startupId (same strategy as matchController) ─────────────────────
async function resolveStartupId(user) {
  const direct = user.startupId || user.startup || null;
  if (direct) return direct;

  try {
    const app = await Application.findOne({
      $or: [
        { applicant: user._id },
        { userId:    user._id },
        { user:      user._id },
        { founder:   user._id },
        { email:     user.email },
      ],
      status: { $in: ['submitted', 'pending', 'reviewing', 'interview', 'accepted', 'approved'] },
    })
      .sort({ createdAt: -1 })
      .select('_id startup startupId startupRef')
      .lean();

    if (app) return app.startup || app.startupId || app.startupRef || app._id;
  } catch (err) {
    console.error('[resolveStartupId] Application lookup failed:', err.message);
  }
  return null;
}

// ── Email template helper ─────────────────────────────────────────────────────
function emailWrapper(color, title, rows, extra = '') {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="color:${color};">${title}</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${rows.map((r, i) => `
          <tr style="${i % 2 === 1 ? 'background:#f8fafc;' : ''}">
            <td style="padding:8px;color:#64748b;">${r[0]}</td>
            <td style="padding:8px;font-weight:600;">${r[1] || '-'}</td>
          </tr>`).join('')}
      </table>
      ${extra}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">MediaNet Innovation Platform</p>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/mentor-matches
// List all mentor recommendations for the logged-in startup
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyMentorMatches = async (req, res) => {
  try {
    const startupId = await resolveStartupId(req.user);
    if (!startupId) {
      return res.json({ success: true, data: [], _debug: 'startupId not found' });
    }

    const matches = await MentorMatch.find({ startup: startupId })
      .populate('mentor', 'nom prenom titre bio photo expertise experience langue format disponible')
      .sort({ matchScore: -1, createdAt: -1 })
      .lean();

    const data = matches.map(m => ({
      id:                  m._id,
      matchScore:          m.matchScore,
      recommendationStatus: m.recommendationStatus,
      sessionStatus:       m.sessionStatus,
      sessionType:         m.sessionType,
      sessionDate:         m.sessionDate    || null,
      sessionLink:         m.sessionLink    || null,
      sessionLocation:     m.sessionLocation || null,
      sessionDuration:     m.sessionDuration || null,
      founderRefuseReason: m.founderRefuseReason || null,
      sessionRefuseReason: m.sessionRefuseReason || null,
      adminNote:           m.adminRecommendationNote || null,
      adminSessionNote:    m.adminSessionNote || null,
      mentor: m.mentor ? {
        id:          m.mentor._id,
        name:        `${m.mentor.prenom || ''} ${m.mentor.nom || ''}`.trim() || m.mentor.nom || 'Mentor',
        title:       m.mentor.titre      || '',
        bio:         m.mentor.bio        || '',
        photo:       m.mentor.photo      || null,
        expertise:   m.mentor.expertise  || [],
        experience:  m.mentor.experience || '',
        language:    m.mentor.langue     || '',
        format:      m.mentor.format     || '',
        available:   m.mentor.disponible ?? true,
      } : null,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[getMyMentorMatches]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/mentor-matches/:matchId
// ─────────────────────────────────────────────────────────────────────────────
exports.getMentorMatchDetail = async (req, res) => {
  try {
    const { matchId } = req.params;
    const startupId   = await resolveStartupId(req.user);

    const query = startupId
      ? { _id: matchId, startup: startupId }
      : { _id: matchId };

    const match = await MentorMatch.findOne(query)
      .populate('mentor')
      .lean();

    if (!match) return res.status(404).json({ success: false, message: 'Match mentor introuvable' });

    return res.json({ success: true, data: match });
  } catch (err) {
    console.error('[getMentorMatchDetail]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/mentor-matches/:matchId/validate
// pending_founder_validation → founder_validated
// ─────────────────────────────────────────────────────────────────────────────
exports.validateMentorRecommendation = async (req, res) => {
  try {
    const { matchId } = req.params;
    const startupId   = await resolveStartupId(req.user);

    const query = startupId ? { _id: matchId, startup: startupId } : { _id: matchId };
    const match = await MentorMatch.findOne(query).populate('mentor', 'prenom nom');

    if (!match) return res.status(404).json({ success: false, message: 'Match mentor introuvable' });
    if (match.recommendationStatus !== 'pending_founder_validation') {
      return res.status(400).json({
        success: false,
        message: `Action non autorisée depuis le statut "${match.recommendationStatus}"`,
      });
    }

    match.recommendationStatus  = 'founder_validated';
    match.founderValidatedAt    = new Date();
    await match.save();

    const mentorName = match.mentor
      ? `${match.mentor.prenom || ''} ${match.mentor.nom || ''}`.trim()
      : 'le mentor';

    await sendEmail({
      toEmail: req.user.email,
      subject: `Recommandation acceptée — ${mentorName}`,
      bodyHtml: emailWrapper('#10b981', 'Recommandation mentor acceptée ✓', [
        ['Fondateur', req.user.name || req.user.email],
        ['Mentor',    mentorName],
        ['Statut',    'Accepté — L\'équipe MEDIANET va organiser la suite'],
      ]),
    });

    await sendEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] Recommandation mentor acceptée — ${req.user.name || req.user.email}`,
      bodyHtml: emailWrapper('#10b981', 'Recommandation mentor acceptée', [
        ['Fondateur', req.user.name || '-'],
        ['Email',     req.user.email],
        ['Mentor',    mentorName],
      ]),
    });

    return res.json({
      success: true,
      message: 'Recommandation acceptée',
      data: { recommendationStatus: match.recommendationStatus },
    });
  } catch (err) {
    console.error('[validateMentorRecommendation]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/mentor-matches/:matchId/refuse
// pending_founder_validation → founder_rejected
// ─────────────────────────────────────────────────────────────────────────────
exports.refuseMentorRecommendation = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { reason }  = req.body;
    const startupId   = await resolveStartupId(req.user);

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Une justification d'au moins 10 caractères est requise" });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: 'La justification ne peut pas dépasser 500 caractères' });
    }

    const query = startupId ? { _id: matchId, startup: startupId } : { _id: matchId };
    const match = await MentorMatch.findOne(query).populate('mentor', 'prenom nom');

    if (!match) return res.status(404).json({ success: false, message: 'Match mentor introuvable' });
    if (match.recommendationStatus !== 'pending_founder_validation') {
      return res.status(400).json({ success: false, message: `Action non autorisée depuis le statut "${match.recommendationStatus}"` });
    }

    match.recommendationStatus = 'founder_rejected';
    match.founderRefuseReason  = reason.trim();
    match.founderRejectedAt    = new Date();
    await match.save();

    const mentorName = match.mentor
      ? `${match.mentor.prenom || ''} ${match.mentor.nom || ''}`.trim()
      : 'le mentor';

    await sendEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] Recommandation mentor refusée — ${req.user.name || req.user.email}`,
      bodyHtml: emailWrapper('#ef4444', 'Recommandation mentor refusée', [
        ['Fondateur', req.user.name || '-'],
        ['Email',     req.user.email],
        ['Mentor',    mentorName],
        ['Raison',    reason],
      ]),
    });

    return res.json({
      success: true,
      message: 'Refus enregistré. L\'admin a été notifié.',
      data: { recommendationStatus: match.recommendationStatus, founderRefuseReason: match.founderRefuseReason },
    });
  } catch (err) {
    console.error('[refuseMentorRecommendation]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/mentor-matches/:matchId/session/confirm
// session_proposed → session_confirmed
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmMentorSession = async (req, res) => {
  try {
    const { matchId } = req.params;
    const startupId   = await resolveStartupId(req.user);

    const query = startupId ? { _id: matchId, startup: startupId } : { _id: matchId };
    const match = await MentorMatch.findOne(query).populate('mentor', 'prenom nom');

    if (!match) return res.status(404).json({ success: false, message: 'Match mentor introuvable' });
    if (match.sessionStatus !== 'session_proposed') {
      return res.status(400).json({ success: false, message: `Action non autorisée depuis le statut de session "${match.sessionStatus}"` });
    }
    if (!match.sessionDate) {
      return res.status(400).json({ success: false, message: 'Aucune session proposée pour ce match' });
    }

    match.sessionStatus      = 'session_confirmed';
    match.sessionConfirmedAt = new Date();
    await match.save();

    const mentorName = match.mentor
      ? `${match.mentor.prenom || ''} ${match.mentor.nom || ''}`.trim()
      : 'le mentor';
    const dateFmt = new Date(match.sessionDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeFmt = new Date(match.sessionDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const typeLabel = {
      mentoring: 'Séance de mentorat',
      conference: 'Conférence',
      workshop: 'Workshop',
      pitch: 'One-to-one pitch',
      other: 'Événement',
    }[match.sessionType] || match.sessionType || 'Session';

    await sendEmail({
      toEmail: req.user.email,
      subject: `${typeLabel} confirmé — ${mentorName} — ${dateFmt}`,
      bodyHtml: emailWrapper('#10b981', `${typeLabel} confirmé ✓`, [
        ['Type',     typeLabel],
        ['Mentor',   mentorName],
        ['Date',     `${dateFmt} à ${timeFmt}`],
        ['Durée',    match.sessionDuration || '-'],
        ['Lieu/Lien', match.sessionLink || match.sessionLocation || '-'],
      ], match.sessionLink
        ? `<div style="text-align:center;margin:24px 0;"><a href="${match.sessionLink}" style="background:#10b981;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Rejoindre la session</a></div>`
        : ''),
    });

    await sendEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] ${typeLabel} confirmé — ${req.user.name || ''} × ${mentorName}`,
      bodyHtml: emailWrapper('#10b981', `${typeLabel} confirmé`, [
        ['Fondateur', req.user.name || '-'],
        ['Email',     req.user.email],
        ['Mentor',    mentorName],
        ['Date',      `${dateFmt} à ${timeFmt}`],
      ]),
    });

    return res.json({
      success: true,
      message: 'Session confirmée. Un email de confirmation vous a été envoyé.',
      data: {
        sessionStatus:   match.sessionStatus,
        sessionDate:     match.sessionDate,
        sessionLink:     match.sessionLink,
        sessionLocation: match.sessionLocation,
      },
    });
  } catch (err) {
    console.error('[confirmMentorSession]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/mentor-matches/:matchId/session/refuse
// session_proposed → session_refused
// ─────────────────────────────────────────────────────────────────────────────
exports.refuseMentorSession = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { reason }  = req.body;
    const startupId   = await resolveStartupId(req.user);

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Une justification d'au moins 10 caractères est requise" });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: 'La justification ne peut pas dépasser 500 caractères' });
    }

    const query = startupId ? { _id: matchId, startup: startupId } : { _id: matchId };
    const match = await MentorMatch.findOne(query).populate('mentor', 'prenom nom');

    if (!match) return res.status(404).json({ success: false, message: 'Match mentor introuvable' });
    if (match.sessionStatus !== 'session_proposed') {
      return res.status(400).json({ success: false, message: `Action non autorisée depuis le statut "${match.sessionStatus}"` });
    }

    match.sessionStatus      = 'session_refused';
    match.sessionRefuseReason = reason.trim();
    match.sessionRefusedAt   = new Date();
    await match.save();

    const mentorName = match.mentor
      ? `${match.mentor.prenom || ''} ${match.mentor.nom || ''}`.trim()
      : 'le mentor';
    const typeLabel = {
      mentoring: 'Séance de mentorat',
      conference: 'Conférence',
      workshop: 'Workshop',
      pitch: 'One-to-one pitch',
      other: 'Événement',
    }[match.sessionType] || match.sessionType || 'Session';

    await sendEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] ${typeLabel} refusé — ${req.user.name || ''} × ${mentorName}`,
      bodyHtml: emailWrapper('#ef4444', `${typeLabel} refusé`, [
        ['Fondateur', req.user.name || '-'],
        ['Email',     req.user.email],
        ['Mentor',    mentorName],
        ['Type',      typeLabel],
        ['Raison',    reason],
      ], `<p style="color:#64748b;font-size:13px;">Vous pouvez proposer une nouvelle date depuis le panneau admin.</p>`),
    });

    return res.json({
      success: true,
      message: 'Refus de session enregistré. L\'admin peut proposer une nouvelle date.',
      data: { sessionStatus: match.sessionStatus },
    });
  } catch (err) {
    console.error('[refuseMentorSession]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};