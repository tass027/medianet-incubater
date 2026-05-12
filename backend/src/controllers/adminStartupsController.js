// src/controllers/adminStartupsController.js
const Application = require('../models/Application');

function mapStatusFilter(uiStatus) {
  const map = {
    active:    { $in: ['accepted', 'approved'] },
    paused:    'paused',
    graduated: 'graduated',
  };
  return map[uiStatus] ?? uiStatus;
}

// GET /api/admin/startups
exports.getAll = async (req, res) => {
  try {
    const { sector, status, search } = req.query;

    const filter = {
      status: { $in: ['accepted', 'approved'] },
    };

    if (status && status !== 'all') {
      filter.status = mapStatusFilter(status);
    }

    if (sector && sector !== 'all') {
      filter.$or = [{ sector }, { 'project.sector': sector }];
    }

    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      const searchOr = [
        { startupName:          re },
        { founderName:          re },
        { sector:               re },
        { 'project.startupName':re },
        { 'project.sector':     re },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const apps = await Application.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: apps });
  } catch (err) {
    console.error('[adminStartups.getAll]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/startups/:id/assign
exports.assign = async (req, res) => {
  try {
    const { investorIds, mentorIds } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      {
        assignedInvestorIds: investorIds ?? [],
        assignedMentorIds:   mentorIds   ?? [],
        investorIds:         investorIds ?? [],
        mentorIds:           mentorIds   ?? [],
      },
      { new: true }
    ).lean();

    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.assign]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/startups/:id/timeline
exports.updateTimeline = async (req, res) => {
  try {
    const { timelinePhase, timelineProgress, timelineNotes } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { timelinePhase, timelineProgress, timelineNotes },
      { new: true }
    ).lean();

    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.updateTimeline]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/startups/:id/besoins
exports.updateBesoins = async (req, res) => {
  try {
    const { besoins } = req.body;
    if (!Array.isArray(besoins)) {
      return res.status(400).json({ success: false, message: 'besoins doit être un tableau' });
    }
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { besoins, updatedAt: new Date() },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.updateBesoins]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/startups/:id/session-history
exports.addSessionHistory = async (req, res) => {
  try {
    const session = { ...req.body, createdAt: new Date() };
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $push: { sessionHistory: session } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.addSessionHistory]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/startups/:id/session-history/:sessionId
exports.removeSessionHistory = async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $pull: { sessionHistory: { _id: req.params.sessionId } } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.removeSessionHistory]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/startups/:id/formations
exports.addFormation = async (req, res) => {
  try {
    const formation = { ...req.body, sentAt: new Date().toISOString() };
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $push: { startupFormations: formation } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.addFormation]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/startups/:id/formations/:formationId
exports.removeFormation = async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $pull: { startupFormations: { _id: req.params.formationId } } },
      { new: true }
    ).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Startup introuvable' });
    res.json({ success: true, data: app });
  } catch (err) {
    console.error('[adminStartups.removeFormation]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};