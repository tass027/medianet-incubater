// src/controllers/Admindashboardcontroller.js
// Chargement sécurisé — ne crashe pas si un modèle est absent

const safeRequire = (path) => {
  try { return require(path); }
  catch (e) {
    console.warn(`[Dashboard] Modèle absent (ignoré): ${path}`);
    return null;
  }
};

// ── Modèles obligatoires ──────────────────────────────────────
const User        = require('../models/User');
const Application = require('../models/Application');
const Programme   = require('../models/Programme');
const Notification= require('../models/Notification');

// ── Modèles optionnels (null si absent) ──────────────────────
const MentorSession  = safeRequire('../models/MentorSession');
const Session        = safeRequire('../models/Session');
const Mentor         = safeRequire('../models/Mentor');
const Investor       = safeRequire('../models/Investor');
const Jury           = safeRequire('../models/Jury');
const JuryEvaluation = safeRequire('../models/JuryEvaluation');
const MentorFeedback = safeRequire('../models/MentorFeedback');
const AiScore        = safeRequire('../models/AiScore');
const FormResponse   = safeRequire('../models/FormResponse');

// ── Helper: countDocuments sécurisé ──────────────────────────
const safeCount = async (Model, filter = {}) => {
  if (!Model) return 0;
  try { return await Model.countDocuments(filter); }
  catch (e) { return 0; }
};

// ── Helper: aggregate sécurisé ───────────────────────────────
const safeAggregate = async (Model, pipeline) => {
  if (!Model) return [];
  try { return await Model.aggregate(pipeline); }
  catch (e) { return []; }
};

// ── Helper: find sécurisé ────────────────────────────────────
const safeFind = async (Model, query = {}, options = {}) => {
  if (!Model) return [];
  try {
    let q = Model.find(query);
    if (options.sort)   q = q.sort(options.sort);
    if (options.limit)  q = q.limit(options.limit);
    if (options.select) q = q.select(options.select);
    return await q.lean();
  } catch (e) { return []; }
};

// ─── Helpers temps ────────────────────────────────────────────
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/stats
// ══════════════════════════════════════════════════════════════
exports.getStats = async (req, res) => {
  try {
    const now              = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);
    const weekAgo          = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, usersThisMonth, usersLastMonth, activeUsers,
      totalApplications, appsThisMonth, appsLastMonth, pendingApps, approvedApps,
      totalProgrammes, activeProgrammes,
      totalMentors, totalInvestors, totalJury,
      totalSessions, totalMentorSessions, totalEvaluations, totalFormResponses,
      mentorUsersCount, investorUsersCount, juryUsersCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      User.countDocuments({ updatedAt: { $gte: weekAgo } }),
      Application.countDocuments(),
      Application.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Application.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Application.countDocuments({ status: { $in: ['pending', 'Pending', 'en_attente', 'submitted', 'Submitted'] } }),
      Application.countDocuments({ status: { $in: ['approved', 'Approved', 'acceptee', 'accepted'] } }),
      Programme.countDocuments(),
      Programme.countDocuments({ status: { $in: ['active', 'Active', 'ouvert', 'open'] } }),
      safeCount(Mentor),
      safeCount(Investor),
      safeCount(Jury),
      safeCount(Session),
      safeCount(MentorSession),
      safeCount(JuryEvaluation),
      safeCount(FormResponse),
      User.countDocuments({ role: { $in: ['mentor', 'Mentor'] } }),
      User.countDocuments({ role: { $in: ['investor', 'Investor', 'investisseur'] } }),
      User.countDocuments({ role: { $in: ['jury', 'Jury'] } }),
    ]);

    const trend = (curr, prev) => {
      if (!prev) return { pct: '+0%', dir: 'up' };
      const p = Math.round(((curr - prev) / prev) * 100);
      return { pct: p >= 0 ? `+${p}%` : `${p}%`, dir: p >= 0 ? 'up' : 'down' };
    };

    const successRate = totalApplications > 0
      ? Math.round((approvedApps / totalApplications) * 100) : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          thisMonth: usersThisMonth,
          trend: trend(usersThisMonth, usersLastMonth),
          activeThisWeek: activeUsers,
          mentors:   totalMentors   || mentorUsersCount,
          investors: totalInvestors || investorUsersCount,
          jury:      totalJury      || juryUsersCount,
        },
        applications: {
          total: totalApplications,
          thisMonth: appsThisMonth,
          trend: trend(appsThisMonth, appsLastMonth),
          pending: pendingApps,
          approved: approvedApps,
          successRate,
          formResponses: totalFormResponses,
        },
        programmes: {
          total: totalProgrammes,
          active: activeProgrammes,
        },
        sessions: {
          total: totalMentorSessions || totalSessions,
          evaluations: totalEvaluations,
        }
      }
    });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/applications-timeline
// ══════════════════════════════════════════════════════════════
exports.getApplicationsTimeline = async (req, res) => {
  try {
    const since = monthsAgo(11);

    const data = await Application.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('fr-FR', { month: 'short' }),
        yr: d.getFullYear(), mo: d.getMonth() + 1,
        total: 0, pending: 0, approved: 0, rejected: 0, review: 0
      });
    }

    data.forEach(({ _id, count }) => {
      const slot = months.find(m => m.yr === _id.year && m.mo === _id.month);
      if (!slot) return;
      slot.total += count;
      const s = (_id.status || '').toLowerCase();
      if      (s.includes('pend') || s.includes('attente') || s.includes('submit')) slot.pending  += count;
      else if (s.includes('approv') || s.includes('accept'))                         slot.approved += count;
      else if (s.includes('reject') || s.includes('refus'))                          slot.rejected += count;
      else                                                                            slot.review   += count;
    });

    res.json({ success: true, data: months });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/applications-by-status
// ══════════════════════════════════════════════════════════════
exports.getApplicationsByStatus = async (req, res) => {
  try {
    const raw = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const colorMap = {
      pending: '#f59e0b', en_attente: '#f59e0b', submitted: '#f59e0b',
      review: '#3b82f6', en_examen: '#3b82f6', reviewing: '#3b82f6',
      interview: '#8b5cf6', entretien: '#8b5cf6',
      approved: '#10b981', acceptee: '#10b981', accepted: '#10b981',
      rejected: '#ef4444', refusee: '#ef4444', refused: '#ef4444',
    };
    const labelMap = {
      pending: 'En attente', en_attente: 'En attente', submitted: 'Soumise',
      review: 'En examen',   en_examen: 'En examen',   reviewing: 'En examen',
      interview: 'Entretien', entretien: 'Entretien',
      approved: 'Approuvée', acceptee: 'Approuvée', accepted: 'Approuvée',
      rejected: 'Rejetée',   refusee: 'Rejetée',   refused: 'Rejetée',
    };

    const data = raw.map(d => ({
      name:  labelMap[(d._id || '').toLowerCase()] || d._id || 'Autre',
      value: d.count,
      color: colorMap[(d._id || '').toLowerCase()] || '#6b7280',
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/users-by-role
// ══════════════════════════════════════════════════════════════
exports.getUsersByRole = async (req, res) => {
  try {
    const data = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const colors = ['#00669A', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

    res.json({
      success: true,
      data: data.map((d, i) => ({
        role:  d._id || 'Non défini',
        count: d.count,
        color: colors[i % colors.length],
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/user-growth
// ══════════════════════════════════════════════════════════════
exports.getUserGrowth = async (req, res) => {
  try {
    const since = monthsAgo(11);

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, role: '$role' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('fr-FR', { month: 'short' }),
        yr: d.getFullYear(), mo: d.getMonth() + 1,
        total: 0, startup: 0, mentor: 0, investor: 0, jury: 0, admin: 0
      });
    }

    data.forEach(({ _id, count }) => {
      const slot = months.find(m => m.yr === _id.year && m.mo === _id.month);
      if (!slot) return;
      slot.total += count;
      const r = (_id.role || '').toLowerCase();
      if      (r.includes('startup') || r.includes('candidat') || r.includes('founder')) slot.startup  += count;
      else if (r.includes('mentor'))                                                       slot.mentor   += count;
      else if (r.includes('invest'))                                                       slot.investor += count;
      else if (r.includes('jury'))                                                         slot.jury     += count;
      else if (r.includes('admin'))                                                        slot.admin    += count;
      else                                                                                 slot.startup  += count;
    });

    res.json({ success: true, data: months });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/programmes-overview
// Replace the existing function in Admindashboardcontroller.js
// ══════════════════════════════════════════════════════════════
exports.getProgrammesOverview = async (req, res) => {
  try {
    const programmes = await Programme.find({}).lean();

    const appsByProg = await Application.aggregate([
      {
        $group: {
          _id: '$programmeId', 
          count: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [
                { $in: ['$status', ['approved', 'Approved', 'acceptee', 'accepted']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const progMap = {};
    appsByProg.forEach(a => {
      if (a._id) progMap[a._id.toString()] = a;
    });

    const statusTranslation = {
      published: 'Actif',
      active:    'Actif',
      open:      'Actif',
      ouvert:    'Actif',
      closed:    'Fermé',
      inactive:  'Fermé',
      draft:     'Brouillon',
      scheduled: 'Planifié',
    };

    const data = programmes.map(p => {
      const stats     = progMap[p._id.toString()] || { count: 0, approved: 0 };
      const rawStatus = (p.status || '').toLowerCase();

      return {
        id:             p._id,
        name:           p.titre || p.title || p.name || 'Sans nom', // ← 'titre' is the real field
        sector:         p.sector || '',
        status:         p.status || 'draft',
        statusLabel:    statusTranslation[rawStatus] || p.status || '—',
        isActive:       ['published', 'active', 'open', 'ouvert'].includes(rawStatus),
        applications:   stats.count,
        approved:       stats.approved,
        conversionRate: stats.count > 0
          ? Math.round((stats.approved / stats.count) * 100)
          : 0,
      };
    });

    // Active programmes first, then by application count descending
    data.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.applications - a.applications;
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[getProgrammesOverview]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/evaluations-scores
// ══════════════════════════════════════════════════════════════
exports.getEvaluationsScores = async (req, res) => {
  try {
    const bucket = (scores) => {
      const buckets = [
        { range: '0-20',   min: 0,  max: 20,  count: 0 },
        { range: '21-40',  min: 21, max: 40,  count: 0 },
        { range: '41-60',  min: 41, max: 60,  count: 0 },
        { range: '61-80',  min: 61, max: 80,  count: 0 },
        { range: '81-100', min: 81, max: 100, count: 0 },
      ];
      scores.forEach(v => {
        const num = typeof v === 'number' ? v : parseFloat(v) || 0;
        const normalized = num > 1 ? num : num * 100;
        const b = buckets.find(b => normalized >= b.min && normalized <= b.max);
        if (b) b.count++;
      });
      return buckets;
    };

    let aiRaw = [];
    if (AiScore) {
      try {
        const docs = await AiScore.find({}).select('score totalScore overallScore').lean();
        aiRaw = docs.map(d => d.score || d.totalScore || d.overallScore || 0);
      } catch (e) {}
    }
    if (!aiRaw.length) {
      const apps = await Application.find({ aiScore: { $exists: true, $ne: null } }).select('aiScore').lean();
      aiRaw = apps.map(a => a.aiScore || 0);
    }

    let juryRaw = [];
    if (JuryEvaluation) {
      try {
        const docs = await JuryEvaluation.find({}).select('score totalScore finalScore').lean();
        juryRaw = docs.map(d => d.score || d.totalScore || d.finalScore || 0);
      } catch (e) {}
    }

    const avg = (arr) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

    res.json({
      success: true,
      data: {
        ai:      bucket(aiRaw),
        jury:    bucket(juryRaw),
        avgAi:   avg(aiRaw),
        avgJury: avg(juryRaw),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/charts/sessions-activity
// ══════════════════════════════════════════════════════════════
exports.getSessionsActivity = async (req, res) => {
  try {
    const since = monthsAgo(5);
    const Model = MentorSession || Session;

    const data = await safeAggregate(Model, [
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('fr-FR', { month: 'short' }),
        yr: d.getFullYear(), mo: d.getMonth() + 1,
        completed: 0, scheduled: 0, cancelled: 0
      });
    }

    data.forEach(({ _id, count }) => {
      const slot = months.find(m => m.yr === _id.year && m.mo === _id.month);
      if (!slot) return;
      const s = (_id.status || '').toLowerCase();
      if      (s.includes('complet') || s.includes('terminé') || s.includes('done')) slot.completed += count;
      else if (s.includes('cancel')  || s.includes('annul'))                         slot.cancelled += count;
      else                                                                             slot.scheduled += count;
    });

    res.json({ success: true, data: months });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/recent-applications
// ══════════════════════════════════════════════════════════════
exports.getRecentApplications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const apps = await Application.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user',      'name email firstName lastName')
      .populate('programme', 'name title')
      .lean();

    const data = apps.map(app => {
      const user = app.user || {};
      const name = user.name
        || `${user.firstName || ''} ${user.lastName || ''}`.trim()
        || app.applicantName || 'Candidat';
      const prog = app.programme || {};
      return {
        id:            app._id,
        applicantName: name,
        email:         user.email || app.email || '',
        programmeName: prog.name || prog.title || 'Programme inconnu',
        status:        app.status || 'pending',
        aiScore:       app.aiScore || null,
        time:          timeAgo(app.createdAt),
        createdAt:     app.createdAt,
        initials:      name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??',
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/top-mentors
// ══════════════════════════════════════════════════════════════
exports.getTopMentors = async (req, res) => {
  try {
    const SessionModel = MentorSession || Session;
    if (!SessionModel) return res.json({ success: true, data: [] });

    const sessionStats = await safeAggregate(SessionModel, [
      { $group: { _id: '$mentor', sessions: { $sum: 1 }, completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'terminé', 'done']] }, 1, 0] } } } },
      { $sort: { sessions: -1 } },
      { $limit: 6 }
    ]);

    const mentorIds = sessionStats.map(s => s._id).filter(Boolean);
    let nameMap = {};

    // Essayer collection Mentor
    if (Mentor && mentorIds.length) {
      try {
        const mentors = await Mentor.find({ _id: { $in: mentorIds } }).populate('user', 'name email').lean();
        mentors.forEach(m => {
          nameMap[m._id.toString()] = {
            name: m.user?.name || m.name || 'Mentor',
            speciality: m.speciality || m.expertise || m.domain || 'Général'
          };
        });
      } catch (e) {}
    }

    // Fallback User
    if (!Object.keys(nameMap).length && mentorIds.length) {
      const users = await User.find({ _id: { $in: mentorIds } }).select('name firstName lastName').lean();
      users.forEach(u => {
        nameMap[u._id.toString()] = {
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Mentor',
          speciality: 'Général'
        };
      });
    }

    let feedbackMap = {};
    if (MentorFeedback && mentorIds.length) {
      try {
        const fb = await MentorFeedback.aggregate([
          { $match: { mentor: { $in: mentorIds } } },
          { $group: { _id: '$mentor', avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
        ]);
        fb.forEach(f => { feedbackMap[f._id?.toString()] = f; });
      } catch (e) {}
    }

    const data = sessionStats.map(stat => {
      const info     = nameMap[stat._id?.toString()] || { name: 'Mentor', speciality: 'Général' };
      const feedback = feedbackMap[stat._id?.toString()] || {};
      return {
        id:         stat._id,
        name:       info.name,
        initials:   info.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        speciality: info.speciality,
        sessions:   stat.sessions,
        completed:  stat.completed,
        avgRating:  feedback.avgRating ? Math.round(feedback.avgRating * 10) / 10 : null,
        feedbacks:  feedback.total || 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/activity-feed
// ══════════════════════════════════════════════════════════════
exports.getActivityFeed = async (req, res) => {
  try {
    const [recentApps, recentUsers, recentSessions, recentEvals, recentNotifs] = await Promise.all([
      Application.find().sort({ createdAt: -1 }).limit(4)
        .populate('user',      'name firstName lastName')
        .populate('programme', 'name title')
        .lean(),
      User.find().sort({ createdAt: -1 }).limit(3)
        .select('name firstName lastName role createdAt').lean(),
      safeFind(MentorSession || Session, {}, { sort: { createdAt: -1 }, limit: 3 }),
      safeFind(JuryEvaluation, {}, { sort: { createdAt: -1 }, limit: 3 }),
      Notification.find({ read: false }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    const feed = [
      ...recentApps.map(a => ({
        type: 'application', icon: '📋',
        message: `Nouvelle candidature: ${a.user?.name || `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim() || 'Candidat'}`,
        sub: a.programme?.name || a.programme?.title || 'Programme',
        time: timeAgo(a.createdAt), ts: a.createdAt, color: '#3b82f6'
      })),
      ...recentUsers.map(u => ({
        type: 'user', icon: '👤',
        message: `Nouvel utilisateur: ${u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}`,
        sub: u.role || 'Utilisateur',
        time: timeAgo(u.createdAt), ts: u.createdAt, color: '#8b5cf6'
      })),
      ...recentSessions.map(s => ({
        type: 'session', icon: '🎯',
        message: 'Session mentorat planifiée',
        sub: s.status || 'Programmée',
        time: timeAgo(s.createdAt), ts: s.createdAt, color: '#10b981'
      })),
      ...recentEvals.map(e => ({
        type: 'evaluation', icon: '⭐',
        message: 'Évaluation jury soumise',
        sub: `Score: ${e.score || e.totalScore || e.finalScore || '—'}`,
        time: timeAgo(e.createdAt), ts: e.createdAt, color: '#f59e0b'
      })),
      ...recentNotifs.map(n => ({
        type: 'notification', icon: '🔔',
        message: n.title || n.message || 'Nouvelle notification',
        sub: n.type || '',
        time: timeAgo(n.createdAt), ts: n.createdAt, color: '#06b6d4'
      })),
    ];

    feed.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    res.json({ success: true, data: feed.slice(0, 12) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/performance-metrics
// ══════════════════════════════════════════════════════════════
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, approved, mentorSessions, completedSessions, totalUsers, activeUsers] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ['approved', 'Approved', 'acceptee', 'accepted'] } }),
      safeCount(MentorSession || Session),
      safeCount(MentorSession || Session, { status: { $in: ['completed', 'terminé', 'done'] } }),
      User.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: monthAgo } }),
    ]);

    let withAiScore = 0;
    if (AiScore) {
      try { withAiScore = await AiScore.countDocuments(); } catch (e) {}
    }
    if (!withAiScore) {
      withAiScore = await Application.countDocuments({ aiScore: { $exists: true, $ne: null } });
    }

    const conversionRate    = total > 0          ? Math.round((approved          / total)          * 100) : 0;
    const aiCoverage        = total > 0          ? Math.round((withAiScore       / total)          * 100) : 0;
    const sessionCompletion = mentorSessions > 0 ? Math.round((completedSessions / mentorSessions) * 100) : 0;
    const userEngagement    = totalUsers > 0     ? Math.round((activeUsers       / totalUsers)     * 100) : 0;

    const metrics = [
      { label: 'Taux de Conversion',     value: conversionRate,    target: 30, icon: '🎯' },
      { label: 'Couverture IA',           value: aiCoverage,        target: 80, icon: '🤖' },
      { label: 'Sessions Complétées',     value: sessionCompletion, target: 70, icon: '✅' },
      { label: 'Engagement Utilisateurs', value: userEngagement,    target: 60, icon: '📈' },
    ];

    const overall = Math.round(metrics.reduce((s, m) => s + m.value, 0) / metrics.length);
    res.json({ 
      success: true, 
      data: { 
        data: metrics,  // nested data for consistency with frontend
        overall 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/admin/dashboard/notifications-summary
// ══════════════════════════════════════════════════════════════
exports.getNotificationsSummary = async (req, res) => {
  try {
    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ read: false }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 }, unread: { $sum: { $cond: ['$read', 0, 1] } } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({ success: true, data: { total, unread, byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};