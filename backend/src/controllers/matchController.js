// controllers/matchController.js
const nodemailer  = require('nodemailer');
const Match       = require('../models/Match');
const Application = require('../models/Application');

// ── Transporter nodemailer ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendMatchEmail({ toEmail, subject, bodyHtml }) {
  if (!toEmail || !process.env.GMAIL_USER) return;
  try {
    await transporter.sendMail({
      from:  `"MediaNet Incubator" <${process.env.GMAIL_USER}>`,
      to:    toEmail,
      subject,
      html:  bodyHtml,
    });
    console.log(`✅ [matchController] Email envoyé à ${toEmail}`);
  } catch (err) {
    console.error(`⚠️ [matchController] Échec email:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: resolve the Startup ObjectId from the logged-in user
//
// Strategy (tries each in order until one works):
//   1. req.user.startupId          (explicit field on User)
//   2. req.user.startup            (ref field on User)
//   3. Look up Application owned by this user and grab its startupId
//   4. Return null → caller returns 404
// ─────────────────────────────────────────────────────────────────────────────
async function resolveStartupId(user) {
  // 1 & 2 — direct fields on User
  const direct = user.startupId || user.startup || null;
  if (direct) return direct;

  // 3 — find via Application (Application._id est le startupId)
  try {
    const app = await Application.findOne({
      $or: [
        { applicant:  user._id },
        { userId:     user._id },
        { user:       user._id },
        { founder:    user._id },
        { email:      user.email },
      ],
      // Accepter tous les statuts actifs — pas juste accepted (pouvant être draft/submitted aussi)
      status: { $in: ['submitted', 'pending', 'reviewing', 'interview', 'accepted', 'approved'] },
    })
      .sort({ createdAt: -1 })
      .select('_id startup startupId startupRef')
      .lean();

    if (app) {
      // Priorité : champ dédié sinon _id de l'application elle-même
      return app.startup || app.startupId || app.startupRef || app._id;
    }
  } catch (err) {
    console.error('[resolveStartupId] Application lookup failed:', err.message);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG  GET /api/startup/matches/debug
// Returns what the server sees for this user — remove in production
// ─────────────────────────────────────────────────────────────────────────────
exports.debugMatch = async (req, res) => {
  try {
    const startupId = await resolveStartupId(req.user);

    // Count all matches for this startup regardless of status
    const allMatches = startupId
      ? await Match.find({ startup: startupId }).select('status matchScore investor').lean()
      : [];

    return res.json({
      success:   true,
      user: {
        id:        req.user._id,
        email:     req.user.email,
        role:      req.user.role,
        isFounder: req.user.isFounder,
        startupId: req.user.startupId,
        startup:   req.user.startup,
      },
      resolvedStartupId: startupId,
      matchCount: allMatches.length,
      matches:    allMatches,
    });
  } catch (err) {
    console.error('[debugMatch]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/matches
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyMatches = async (req, res) => {
  try {
    const startupId = await resolveStartupId(req.user);

    if (!startupId) {
      // Return empty array — don't 404, the UI handles "no matches yet"
      console.warn(`[getMyMatches] No startupId for user ${req.user._id} (${req.user.email})`);
      return res.json({ success: true, data: [], _debug: 'startupId not found on user' });
    }

    const matches = await Match.find({ startup: startupId })
      .populate('investor', 'nom secteurs stades ticketMin ticketMax localisation bio type entreprise')
      .sort({ matchScore: -1 })
      .lean();

    const data = matches.map(m => ({
      id:              m._id,
      name:            m.investor?.nom,
      // Support both field names used across different Investor model versions
      focus:           m.investor?.secteurs || [],
      stage:           m.investor?.stades || [],
      investmentRange: (m.investor?.ticketMin && m.investor?.ticketMax)
        ? `${(m.investor.ticketMin / 1000).toFixed(0)}K - ${(m.investor.ticketMax / 1000000).toFixed(1)}M TND`
        : null,
      location:        m.investor?.localisation,
      description:     m.investor?.bio,
      investorType:    m.investor?.type,
      company:         m.investor?.entreprise,
      match:           m.matchScore,
      status:          m.status,
      sessionDate:     m.sessionDate         || null,
      sessionLink:     m.sessionLink         || null,
      refuseReason:    m.founderRefuseReason || null,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[getMyMatches]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/startup/matches/:matchId
// ─────────────────────────────────────────────────────────────────────────────
exports.getMatchDetail = async (req, res) => {
  try {
    const { matchId } = req.params;
    const startupId   = await resolveStartupId(req.user);

    // Build query — if we couldn't resolve startupId, still try by matchId alone
    // (safer: check ownership via startupId when available)
    const query = startupId
      ? { _id: matchId, startup: startupId }
      : { _id: matchId };

    const match = await Match.findOne(query).populate('investor');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match introuvable' });
    }

    return res.json({ success: true, data: match });
  } catch (err) {
    console.error('[getMatchDetail]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/matches/:matchId/validate
// pending_founder_validation → founder_validated
// ─────────────────────────────────────────────────────────────────────────────
exports.validateMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const startupId   = await resolveStartupId(req.user);

    const query = startupId ? { _id: matchId, startup: startupId } : { _id: matchId };
    const match = await Match.findOne(query).populate('investor', 'name');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match introuvable' });
    }
    if (match.status !== 'pending_founder_validation') {
      return res.status(400).json({
        success: false,
        message: `Action non autorisée depuis le statut "${match.status}"`,
      });
    }

    match.status             = 'founder_validated';
    match.founderValidatedAt = new Date();
    await match.save();

    await sendMatchEmail({
      toEmail: req.user.email,
      subject: `Match validé — ${match.investor?.name || 'Investisseur'}`,
      bodyHtml: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#10b981;">Match validé ✓</h2>
          <p style="color:#334155;">Bonjour <strong>${req.user.name || ''}</strong>,</p>
          <p style="color:#334155;">Vous avez accepté le match avec <strong>${match.investor?.name || "l'investisseur"}</strong>. L'équipe MEDIANET va organiser la prochaine étape.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard/startup/matches"
               style="background:#10b981;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              Voir mes matches
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">MediaNet Innovation Platform</p>
        </div>`,
    });

    return res.json({ success: true, message: 'Match validé avec succès', data: { status: match.status } });
  } catch (err) {
    console.error('[validateMatch]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/matches/:matchId/refuse
// pending_founder_validation → founder_rejected
// ─────────────────────────────────────────────────────────────────────────────
exports.refuseMatch = async (req, res) => {
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
    const match = await Match.findOne(query).populate('investor', 'name');

    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    if (match.status !== 'pending_founder_validation') {
      return res.status(400).json({ success: false, message: `Action non autorisée depuis le statut "${match.status}"` });
    }

    match.status              = 'founder_rejected';
    match.founderRefuseReason = reason.trim();
    match.founderRejectedAt   = new Date();
    await match.save();

    await sendMatchEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] Match refusé par ${req.user.name || 'un fondateur'}`,
      bodyHtml: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#ef4444;">Match refusé</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;color:#64748b;">Fondateur</td><td style="padding:8px;font-weight:600;">${req.user.name || '-'}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Email</td><td style="padding:8px;">${req.user.email || '-'}</td></tr>
            <tr><td style="padding:8px;color:#64748b;">Investisseur</td><td style="padding:8px;">${match.investor?.name || '-'}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Raison</td><td style="padding:8px;color:#dc2626;">${reason}</td></tr>
          </table>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">MediaNet Innovation Platform</p>
        </div>`,
    });

    return res.json({ success: true, message: 'Refus enregistré', data: { status: match.status } });
  } catch (err) {
    console.error('[refuseMatch]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/matches/:matchId/session/confirm
// session_proposed → session_confirmed
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmSession = async (req, res) => {
  try {
    const { matchId } = req.params;
    const startupId   = await resolveStartupId(req.user);

    const query = startupId ? { _id: matchId, startup: startupId } : { _id: matchId };
    const match = await Match.findOne(query).populate('investor', 'name');

    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    if (match.status !== 'session_proposed') {
      return res.status(400).json({ success: false, message: `Action non autorisée depuis le statut "${match.status}"` });
    }
    if (!match.sessionDate) {
      return res.status(400).json({ success: false, message: 'Aucune session proposée pour ce match' });
    }

    match.status             = 'session_confirmed';
    match.sessionConfirmedAt = new Date();
    await match.save();

    const dateFmt = new Date(match.sessionDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeFmt = new Date(match.sessionDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    await sendMatchEmail({
      toEmail: req.user.email,
      subject: `Session confirmée — ${match.investor?.name || 'Investisseur'} — ${dateFmt}`,
      bodyHtml: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#10b981;">Session confirmée ✓</h2>
          <p style="color:#334155;">Bonjour <strong>${req.user.name || ''}</strong>,</p>
          <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
            <p style="margin:0 0 6px;color:#064e3b;font-weight:600;">Détails de la session</p>
            <p style="margin:0 0 4px;color:#065f46;font-size:14px;">📅 ${dateFmt} à ${timeFmt}</p>
            <p style="margin:0 0 4px;color:#065f46;font-size:14px;">🤝 ${match.investor?.name || 'Investisseur'}</p>
            ${match.sessionLink ? `<p style="margin:8px 0 0;font-size:14px;">🔗 <a href="${match.sessionLink}" style="color:#10b981;font-weight:600;">Rejoindre la session</a></p>` : ''}
          </div>
          ${match.sessionLink ? `<div style="text-align:center;margin:24px 0;"><a href="${match.sessionLink}" style="background:#10b981;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Rejoindre la session</a></div>` : ''}
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">MediaNet Innovation Platform</p>
        </div>`,
    });

    await sendMatchEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] Session confirmée — ${req.user.name || ''} × ${match.investor?.name || ''}`,
      bodyHtml: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#10b981;">Session confirmée</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;color:#64748b;">Fondateur</td><td style="padding:8px;font-weight:600;">${req.user.name || '-'}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Investisseur</td><td style="padding:8px;">${match.investor?.name || '-'}</td></tr>
            <tr><td style="padding:8px;color:#64748b;">Date</td><td style="padding:8px;">${dateFmt} à ${timeFmt}</td></tr>
          </table>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">MediaNet Innovation Platform</p>
        </div>`,
    });

    return res.json({
      success: true, message: 'Session confirmée',
      data: { status: match.status, sessionDate: match.sessionDate, sessionLink: match.sessionLink },
    });
  } catch (err) {
    console.error('[confirmSession]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/startup/matches/:matchId/session/refuse
// session_proposed → session_refused
// ─────────────────────────────────────────────────────────────────────────────
exports.refuseSession = async (req, res) => {
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
    const match = await Match.findOne(query).populate('investor', 'name');

    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    if (match.status !== 'session_proposed') {
      return res.status(400).json({ success: false, message: `Action non autorisée depuis le statut "${match.status}"` });
    }

    match.status              = 'session_refused';
    match.founderRefuseReason = reason.trim();
    match.sessionRefusedAt    = new Date();
    await match.save();

    await sendMatchEmail({
      toEmail: process.env.ADMIN_EMAIL,
      subject: `[MEDIANET] Session refusée — ${req.user.name || ''} × ${match.investor?.name || ''}`,
      bodyHtml: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#ef4444;">Session refusée</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;color:#64748b;">Fondateur</td><td style="padding:8px;font-weight:600;">${req.user.name || '-'}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Email</td><td style="padding:8px;">${req.user.email || '-'}</td></tr>
            <tr><td style="padding:8px;color:#64748b;">Investisseur</td><td style="padding:8px;">${match.investor?.name || '-'}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Raison</td><td style="padding:8px;color:#dc2626;">${reason}</td></tr>
          </table>
          <p style="color:#64748b;font-size:13px;">Vous pouvez proposer une nouvelle date depuis le panneau admin.</p>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">MediaNet Innovation Platform</p>
        </div>`,
    });

    return res.json({ success: true, message: 'Refus de session enregistré', data: { status: match.status } });
  } catch (err) {
    console.error('[refuseSession]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};