// src/controllers/sessionController.js
const Session      = require('../models/Session');
const User         = require('../models/User');
const Application  = require('../models/Application');
const notificationService = require('../services/notificationService');
const { sendSessionEmails } = require('../services/sessionEmailService');

// ─── HELPERS ─────────────────────────────────────────────────────────────────


function resolveStartupName(startup) {
  return (
    startup?.project?.startupName ||
    startup?.startupName          ||
    startup?.name                 ||
    'Startup'
  );
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const { type, status, startupId, mentorId } = req.query;
    const filter = {};
    if (type      && type   !== 'all') filter.type      = type;
    if (status    && status !== 'all') filter.status    = status;
    if (startupId) filter.startupId = startupId;
    if (mentorId)  filter.mentorId  = mentorId;

    const sessions = await Session.find(filter)
      .populate('mentorId',         'name email expertise company')
      .populate('startupId',        'project team programmeName')
      .populate('selectedStartups', 'project programmeName')
      .sort({ date: 1 }).lean();

    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[sessions.getAll]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE (workshop / conference / pitching / masterclass) ──────────────────

exports.create = async (req, res) => {
  try {
    const body       = req.body;
    const startupIds = (body.selectedStartups || []).filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    const session    = await Session.create({ ...body, selectedStartups: startupIds, createdBy: req.user?._id });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error('[sessions.create]', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

exports.update = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    ).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session introuvable.' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

exports.remove = async (req, res) => {
  try {
    const s = await Session.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Session introuvable.' });
    res.json({ success: true, message: 'Session supprimée.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE MENTORING (admin) — notify mentor + startup ───────────────────────

exports.createMentoring = async (req, res) => {
  try {
    const { mentorId, startupId, notifyMentor = true, notifyStartup = true, emailBody, ...rest } = req.body;

    if (!mentorId || !startupId)
      return res.status(400).json({ success: false, message: 'mentorId et startupId sont requis.' });

    const [mentor, startup] = await Promise.all([
      User.findById(mentorId).lean(),
      Application.findById(startupId).lean(),
    ]);
    if (!mentor)  return res.status(404).json({ success: false, message: 'Mentor introuvable.' });
    if (!startup) return res.status(404).json({ success: false, message: 'Startup introuvable.' });

    const session = await Session.create({
      ...rest,
      mentorId: mentor._id, startupId: startup._id,
      notifyMentor: Boolean(notifyMentor),
      mentorStatus: 'pending',
      createdBy: req.user?._id,
    });

    const startupName  = resolveStartupName(startup);
    const founderEmail = startup?.team?.founderEmail || startup?.email || null;
    const acceptUrl    = `${process.env.FRONTEND_URL}/mentor/sessions/${session._id}/accept`;
    const declineUrl   = `${process.env.FRONTEND_URL}/mentor/sessions/${session._id}/decline`;

    // ── Emails (non-blocking) ─────────────────────────────────────────────────
    sendSessionEmails({
      session: {
        ...session.toObject(), topic: rest.title,
        meetingLink: rest.meetLink || '',
        notes: rest.mentorNote || '',
        acceptUrl, declineUrl,
      },
      mentor,
      startup: { ...startup, email: founderEmail, name: startupName },
      notifyAdmin: false,
      notifyStartup: Boolean(notifyStartup),
      notifyMentor:  Boolean(notifyMentor),
      emailMessage: emailBody || '',
    }).catch(e => console.error('[sessions] email error:', e.message));

    // ── In-app notifications ──────────────────────────────────────────────────
    if (notifyMentor) {
      await notificationService.create({
        recipientId:   mentor._id,
        recipientRole: 'mentor',
        type:          'mentoring_request',
        title:         'Invitation — Session de mentorat',
        body:          `Vous êtes invité(e) à accompagner ${startupName} : "${rest.title}"`,
        link:          `/dashboard/mentor/sessions`,
        data:          { sessionId: session._id, startupName },
      });
    }

    if (notifyStartup && startup.applicant) {
      await notificationService.create({
        recipientId:   startup.applicant,
        recipientRole: 'startup',
        type:          'session_assigned',
        title:         'Session planifiée',
        body:          `Une session "${rest.title}" a été planifiée avec ${mentor.name}.`,
        link:          `/dashboard/startup/status`,
        data:          { sessionId: session._id, mentorName: mentor.name },
      });
    }

    const populated = await Session.findById(session._id)
      .populate('mentorId',  'name email expertise company')
      .populate('startupId', 'project team programmeName')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[sessions.createMentoring]', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── MENTOR DECISION ─────────────────────────────────────────────────────────

exports.mentorDecision = async (req, res) => {
  try {
    const { decision, note } = req.body;
    if (!['accepted', 'declined', 'rescheduled'].includes(decision))
      return res.status(400).json({ success: false, message: 'Décision invalide.' });

    const newStatus = decision === 'accepted' ? 'upcoming' : decision === 'declined' ? 'cancelled' : 'pending';

    const session = await Session.findByIdAndUpdate(req.params.id, {
      mentorStatus: decision, mentorDecisionAt: new Date(),
      mentorDecisionNote: note || '', status: newStatus,
    }, { new: true })
      .populate('mentorId',  'name email')
      .populate('startupId', 'project team applicant')
      .lean();

    if (!session) return res.status(404).json({ success: false, message: 'Session introuvable.' });

    // Notify startup
    if (session.startupId?.applicant) {
      const label = decision === 'accepted' ? 'accepté' : decision === 'declined' ? 'décliné' : 'proposé un autre créneau pour';
      await notificationService.create({
        recipientId:   session.startupId.applicant,
        recipientRole: 'startup',
        type:          'mentor_decision',
        title:         `Session ${decision === 'accepted' ? 'confirmée' : 'mise à jour'}`,
        body:          `${session.mentorId?.name || 'Le mentor'} a ${label} la session "${session.title}".`,
        link:          `/dashboard/startup/status`,
        data:          { sessionId: session._id, decision },
      });
    }

    res.json({ success: true, data: session });
  } catch (err) {
    console.error('[sessions.mentorDecision]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET MENTOR SESSIONS ──────────────────────────────────────────────────────

exports.getMentorSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ mentorId: req.user._id })
      .populate('startupId', 'project team programmeName')
      .sort({ date: 1 }).lean();
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MENTOR CREATE OWN SESSION ────────────────────────────────────────────────

exports.mentorCreate = async (req, res) => {
  try {
    const { startupId, notifyStartup = true, emailBody, ...rest } = req.body;
    if (!startupId) return res.status(400).json({ success: false, message: 'startupId requis.' });

    const startup = await Application.findById(startupId).lean();
    if (!startup) return res.status(404).json({ success: false, message: 'Startup introuvable.' });

    const session = await Session.create({
      ...rest, mentorId: req.user._id, startupId: startup._id,
      notifyMentor: false, mentorStatus: 'accepted', status: 'upcoming',
      createdBy: req.user._id,
    });

    const startupName  = resolveStartupName(startup);
    const founderEmail = startup?.team?.founderEmail || startup?.email || null;

    sendSessionEmails({
      session: { ...session.toObject(), topic: rest.title, meetingLink: rest.meetLink || '', notes: '' },
      mentor:  req.user,
      startup: { ...startup, email: founderEmail, name: startupName },
      notifyAdmin: true, notifyStartup: Boolean(notifyStartup), notifyMentor: false,
      emailMessage: emailBody || '',
    }).catch(e => console.error('[sessions.mentorCreate] email:', e.message));

    if (notifyStartup && startup.applicant) {
      await notificationService.create({
        recipientId:   startup.applicant,
        recipientRole: 'startup',
        type:          'session_assigned',
        title:         'Nouvelle session planifiée',
        body:          `${req.user.name} a planifié "${rest.title}".`,
        link:          `/dashboard/startup/status`,
        data:          { sessionId: session._id, mentorName: req.user.name },
      });
    }

    const populated = await Session.findById(session._id)
      .populate('startupId', 'project team programmeName').lean();

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[sessions.mentorCreate]', err);
    res.status(400).json({ success: false, message: err.message });
  }
};