const User           = require('../models/User');
const Application    = require('../models/Application');
const MentorSession  = require('../models/MentorSession');
const MentorFeedback = require('../models/MentorFeedback');
const MentorReport   = require('../models/MentorReport');
const MentorResource = require('../models/MentorResource');
const Programme      = require('../models/Programme');
const { sendSessionEmails } = require('../services/sessionEmailService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const notFound = (res, entity = 'Resource') =>
  res.status(404).json({ success: false, message: `${entity} not found` });

const forbidden = (res) =>
  res.status(403).json({ success: false, message: 'Access denied' });

const isAssigned = (mentor, startupId) =>
  mentor.assignedStartups.some((id) => id.toString() === startupId.toString());

const getStartupName = (startup) => {
  if (startup.startupName)         return startup.startupName;
  if (startup.project?.startupName) return startup.project.startupName;
  if (startup.projectName)          return startup.projectName;
  if (startup.companyName)          return startup.companyName;
  if (startup.name)                 return startup.name;
  return 'Sans nom';
};

const getFounderName = (startup) => {
  if (startup.founder)             return startup.founder;
  if (startup.founderName)         return startup.founderName;
  if (startup.team?.founderName)   return startup.team.founderName;
  if (startup.fullName)            return startup.fullName;
  return '';
};

const getSector = (startup) => {
  if (startup.sector)         return startup.sector;
  if (startup.project?.sector) return startup.project.sector;
  return '';
};

const getStage = (startup) => {
  if (startup.stage)         return startup.stage;
  if (startup.project?.stage) return startup.project.stage;
  return '';
};

// ─── STARTUPS ────────────────────────────────────────────────────────────────

/**
 * GET /api/mentor/startups
 * Retourne les startups assignées avec programmeId/programmeName pour groupement frontend
 */
exports.getMyStartups = async (req, res) => {
  try {
    const mentor = await User.findById(req.user._id).populate('assignedStartups');
    if (!mentor) return notFound(res, 'Mentor');

    const startupIds = mentor.assignedStartups.map((s) => s._id);

    if (startupIds.length === 0) {
      return res.json({ success: true, startups: [] });
    }

    const [allSessions, feedbackCounts, allFeedbacks] = await Promise.all([
      MentorSession.find({
        mentorId:  req.user._id,
        startupId: { $in: startupIds },
      }).sort({ date: -1 }).lean(),

      MentorFeedback.aggregate([
        { $match: { mentorId: req.user._id, startupId: { $in: startupIds } } },
        { $group: { _id: '$startupId', count: { $sum: 1 } } },
      ]),

      MentorFeedback.find({
        mentorId:  req.user._id,
        startupId: { $in: startupIds },
      }).lean(),
    ]);

    // Maps sessions
    const lastSessionMap = {};
    const nextSessionMap = {};
    const now = new Date();

    allSessions.forEach((s) => {
      const key = s.startupId.toString();
      if (s.status === 'done') {
        if (!lastSessionMap[key] || s.date > lastSessionMap[key]) lastSessionMap[key] = s.date;
      } else if (s.status === 'scheduled' && s.date >= now) {
        if (!nextSessionMap[key] || s.date < nextSessionMap[key]) nextSessionMap[key] = s.date;
      }
    });

    // Map feedbacks
    const feedbackCountMap = {};
    feedbackCounts.forEach((f) => { feedbackCountMap[f._id.toString()] = f.count; });

    const avgRatingMap = {};
    const ratingSumMap = {};
    allFeedbacks.forEach((fb) => {
      const key = fb.startupId.toString();
      ratingSumMap[key] = (ratingSumMap[key] || 0) + (fb.rating || 0);
      avgRatingMap[key] = ratingSumMap[key] / (feedbackCountMap[key] || 1);
    });

    const startups = mentor.assignedStartups.map((startup) => {
      const id = startup._id.toString();

      // Progress
      let progress = startup.progress || 0;
      if (progress === 0 && startup.economy) {
        const rev  = parseInt(startup.economy?.monthlyRevenue) || 0;
        const cust = startup.economy?.customers || 0;
        if      (rev  > 50000) progress = 90;
        else if (rev  > 20000) progress = 70;
        else if (rev  > 5000)  progress = 50;
        else if (rev  > 0)     progress = 30;
        else if (cust > 100)   progress = 40;
        else if (cust > 10)    progress = 20;
        else if (cust > 0)     progress = 10;
      }
      if (progress === 0 && feedbackCountMap[id] > 0) {
        progress = Math.min(15 + feedbackCountMap[id] * 5, 100);
      }

      // Status
      let status = startup.status || 'pending';
      if (status === 'accepted') status = 'active';
      if (status === 'pending' && (feedbackCountMap[id] > 0 || lastSessionMap[id])) {
        status = 'active';
      }

      return {
        _id:           startup._id,
        name:          getStartupName(startup),
        sector:        getSector(startup),
        stage:         getStage(startup),
        founder:       getFounderName(startup),
        progress,
        lastSession:   lastSessionMap[id]   || null,
        nextSession:   nextSessionMap[id]   || null,
        feedbackCount: feedbackCountMap[id] || 0,
        avgRating:     avgRatingMap[id]     || 0,
        status,
        // Champs pour le groupement par programme côté frontend
        programmeId:   startup.programmeId   || null,
        programmeName: startup.programmeName || null,
        type:          startup.type          || 'spontaneous',
      };
    });

    res.json({ success: true, startups });
  } catch (err) {
    console.error('getMyStartups:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/mentor/startups/:id
 * Profil complet d'une startup
 */
exports.getStartupById = async (req, res) => {
  try {
    const mentor = await User.findById(req.user._id);
    if (!isAssigned(mentor, req.params.id)) return forbidden(res);

    const startup = await Application.findById(req.params.id).lean();
    if (!startup) return notFound(res, 'Startup');

    const formattedStartup = {
      ...startup,
      startupName: getStartupName(startup),
      projectName: getStartupName(startup),
      companyName: getStartupName(startup),
      founderName: getFounderName(startup),
      fullName:    getFounderName(startup),
      sector:      getSector(startup),
      stage:       getStage(startup),
    };

    const [sessions, feedbacks, reports] = await Promise.all([
      MentorSession.find({ mentorId: req.user._id, startupId: req.params.id })
        .sort({ date: -1 }).lean(),
      MentorFeedback.find({ mentorId: req.user._id, startupId: req.params.id })
        .sort({ createdAt: -1 }).lean(),
      MentorReport.find({ mentorId: req.user._id, startupId: req.params.id })
        .sort({ 'period.year': -1, 'period.month': -1 }).lean(),
    ]);

    res.json({ success: true, startup: formattedStartup, sessions, feedbacks, reports });
  } catch (err) {
    console.error('getStartupById:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/mentor/startups/:id/kpis
 */
exports.getStartupKPIs = async (req, res) => {
  try {
    const mentor = await User.findById(req.user._id);
    if (!isAssigned(mentor, req.params.id)) return forbidden(res);

    const startup = await Application.findById(req.params.id)
      .select('kpis metrics progress economy').lean();
    if (!startup) return notFound(res, 'Startup');

    let kpis = {};
    if (startup.kpis && Array.isArray(startup.kpis) && startup.kpis.length > 0) {
      const lastKpi = startup.kpis[startup.kpis.length - 1];
      kpis = {
        'CA mensuel':   lastKpi.revenue  || 0,
        'MRR':          lastKpi.mrr      || 0,
        'Utilisateurs': lastKpi.users    || 0,
        'Taille équipe':lastKpi.teamSize || 0,
      };
    } else if (startup.economy) {
      kpis = {
        'CA mensuel':    startup.economy.monthlyRevenue || 0,
        'Clients':       startup.economy.customers      || 0,
        'Taux croissance':startup.economy.growthRate    || '0%',
      };
    } else if (startup.metrics) {
      kpis = startup.metrics;
    }

    res.json({ success: true, kpis });
  } catch (err) {
    console.error('getStartupKPIs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SESSIONS ────────────────────────────────────────────────────────────────

exports.getMySessions = async (req, res) => {
  try {
    const { startupId, status, from, to } = req.query;
    const query = { mentorId: req.user._id };
    if (startupId) query.startupId = startupId;
    if (status)    query.status    = status;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to)   query.date.$lte = new Date(to);
    }

    const sessions = await MentorSession.find(query)
      .populate('startupId').sort({ date: 1 }).lean();

    const formattedSessions = sessions.map((session) => ({
      ...session,
      startupId: session.startupId ? {
        ...session.startupId,
        projectName: getStartupName(session.startupId),
        companyName: getStartupName(session.startupId),
        founderName: getFounderName(session.startupId),
      } : null,
    }));

    res.json({ success: true, sessions: formattedSessions });
  } catch (err) {
    console.error('getMySessions:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { startupId, date, duration, topic, notes, meetingLink, notify = {} } = req.body;

    const mentor = await User.findById(req.user._id);
    if (!isAssigned(mentor, startupId)) return forbidden(res);

    const session = await MentorSession.create({
      mentorId:    req.user._id,
      startupId,
      date:        new Date(date),
      duration:    duration    || 60,
      topic,
      notes:       notes       || '',
      meetingLink: meetingLink || '',
      status:      'scheduled',
    });

    await session.populate('startupId');

    const formattedSession = {
      ...session.toObject(),
      startupId: session.startupId ? {
        ...(session.startupId.toObject ? session.startupId.toObject() : session.startupId),
        projectName: getStartupName(session.startupId),
        companyName: getStartupName(session.startupId),
        founderName: getFounderName(session.startupId),
      } : null,
    };

    if (notify.admin || notify.startup) {
      sendSessionEmails({
        session,
        mentor,
        startup:       session.startupId,
        notifyAdmin:   !!notify.admin,
        notifyStartup: !!notify.startup,
        emailMessage:  notify.emailMessage || '',
        testEmail:     notify.testEmail    || null,
      });
    }

    res.status(201).json({
      success: true,
      session: formattedSession,
      notified: { admin: !!notify.admin, startup: !!notify.startup },
    });
  } catch (err) {
    console.error('createSession:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await MentorSession.findOne({ _id: req.params.id, mentorId: req.user._id });
    if (!session) return notFound(res, 'Session');

    ['date', 'duration', 'topic', 'notes', 'meetingLink', 'status'].forEach((field) => {
      if (req.body[field] !== undefined) session[field] = req.body[field];
    });
    await session.save();

    await session.populate('startupId');
    const formattedSession = {
      ...session.toObject(),
      startupId: session.startupId ? {
        ...session.startupId,
        projectName: getStartupName(session.startupId),
        companyName: getStartupName(session.startupId),
      } : null,
    };

    res.json({ success: true, session: formattedSession });
  } catch (err) {
    console.error('updateSession:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await MentorSession.findOneAndDelete({ _id: req.params.id, mentorId: req.user._id });
    if (!session) return notFound(res, 'Session');
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    console.error('deleteSession:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── FEEDBACK ────────────────────────────────────────────────────────────────

exports.getAllFeedback = async (req, res) => {
  try {
    const { startupId } = req.query;
    const query = { mentorId: req.user._id };
    if (startupId) query.startupId = startupId;

    const feedbacks = await MentorFeedback.find(query)
      .populate('startupId').sort({ createdAt: -1 }).lean();

    const formattedFeedbacks = feedbacks.map((fb) => ({
      ...fb,
      startupId: fb.startupId ? {
        ...fb.startupId,
        projectName: getStartupName(fb.startupId),
        companyName: getStartupName(fb.startupId),
        founderName: getFounderName(fb.startupId),
      } : null,
    }));

    res.json({ success: true, feedbacks: formattedFeedbacks });
  } catch (err) {
    console.error('getAllFeedback:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const { startupId, sessionId, rating, comment, axes, milestones, visibility } = req.body;

    const mentor = await User.findById(req.user._id);
    if (!isAssigned(mentor, startupId)) return forbidden(res);

    const feedback = await MentorFeedback.create({
      mentorId:   req.user._id,
      startupId,
      sessionId:  sessionId  || null,
      rating,
      comment,
      axes:       axes       || {},
      milestones: milestones || [],
      visibility: visibility || 'startup',
    });

    await feedback.populate('startupId');
    const formattedFeedback = {
      ...feedback.toObject(),
      startupId: feedback.startupId ? {
        ...feedback.startupId,
        projectName: getStartupName(feedback.startupId),
        companyName: getStartupName(feedback.startupId),
      } : null,
    };

    res.status(201).json({ success: true, feedback: formattedFeedback });
  } catch (err) {
    console.error('createFeedback:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFeedbackByStartup = async (req, res) => {
  try {
    const mentor = await User.findById(req.user._id);
    if (!isAssigned(mentor, req.params.startupId)) return forbidden(res);

    const feedbacks = await MentorFeedback.find({
      mentorId:  req.user._id,
      startupId: req.params.startupId,
    }).sort({ createdAt: -1 }).lean();

    res.json({ success: true, feedbacks });
  } catch (err) {
    console.error('getFeedbackByStartup:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────

exports.getMyReports = async (req, res) => {
  try {
    const { startupId } = req.query;
    const query = { mentorId: req.user._id };
    if (startupId) query.startupId = startupId;

    const reports = await MentorReport.find(query)
      .populate('startupId')
      .sort({ 'period.year': -1, 'period.month': -1 }).lean();

    const formattedReports = reports.map((report) => ({
      ...report,
      startupId: report.startupId ? {
        ...report.startupId,
        projectName: getStartupName(report.startupId),
        companyName: getStartupName(report.startupId),
      } : null,
    }));

    res.json({ success: true, reports: formattedReports });
  } catch (err) {
    console.error('getMyReports:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { startupId, period, milestones, axes, overallProgress, recommendations, status } = req.body;

    const mentor = await User.findById(req.user._id);
    if (!isAssigned(mentor, startupId)) return forbidden(res);

    const report = await MentorReport.findOneAndUpdate(
      { mentorId: req.user._id, startupId, 'period.month': period.month, 'period.year': period.year },
      {
        milestones:      milestones      || [],
        axes:            axes            || {},
        overallProgress: overallProgress || 0,
        recommendations: recommendations || '',
        status:          status          || 'draft',
      },
      { upsert: true, new: true }
    );

    await report.populate('startupId');
    const formattedReport = {
      ...report.toObject(),
      startupId: report.startupId ? {
        ...report.startupId,
        projectName: getStartupName(report.startupId),
        companyName: getStartupName(report.startupId),
      } : null,
    };

    res.status(201).json({ success: true, report: formattedReport });
  } catch (err) {
    console.error('createReport:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RESOURCES ───────────────────────────────────────────────────────────────

exports.getResources = async (req, res) => {
  try {
    const { startupId } = req.query;
    const query = { mentorId: req.user._id };
    if (startupId) {
      query.$or = [
        { targetStartups: { $size: 0 } },
        { targetStartups: startupId },
      ];
    }

    const resources = await MentorResource.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, resources });
  } catch (err) {
    console.error('getResources:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const { title, description, type, url, targetStartups, tags } = req.body;

    const resource = await MentorResource.create({
      mentorId:       req.user._id,
      title,
      description:    description    || '',
      type,
      url:            url            || '',
      targetStartups: targetStartups || [],
      tags:           tags           || [],
    });

    res.status(201).json({ success: true, resource });
  } catch (err) {
    console.error('createResource:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await MentorResource.findOneAndDelete({ _id: req.params.id, mentorId: req.user._id });
    if (!resource) return notFound(res, 'Resource');
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    console.error('deleteResource:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};