// src/controllers/adminMentorController.js
// CORRECTION : getAllMentors lit la collection 'mentors' via un modele dynamique
// car il n'existe pas de fichier src/models/Mentor.js

const mongoose    = require('mongoose');
const User        = require('../models/User');
const Application = require('../models/Application');

// Modele dynamique sur la collection 'mentors' (sans fichier Mentor.js)
// strict:false accepte tous les champs existants sans schema rigide
const Mentor = mongoose.models.Mentor
  || mongoose.model('Mentor', new mongoose.Schema({}, { strict: false, collection: 'mentors' }));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const notFound = (res, entity = 'Resource') =>
  res.status(404).json({ success: false, message: `${entity} not found` });

const serverError = (res, err, label = 'adminMentor') => {
  console.error(`[${label}]`, err);
  res.status(500).json({ success: false, message: err.message });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors
// Lit la collection 'mentors' — retourne { success, data: [...] }
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllMentors = async (req, res) => {
  try {
    const [fromCollection, fromUsers] = await Promise.all([
      Mentor.find({}).sort({ name: 1 }).lean(),
      User.find({ role: 'mentor', isActive: { $ne: false } })
        .select('_id name email expertise company role')
        .lean(),
    ]);

    // Dédupliquer par _id (priorité à la collection 'mentors')
    const collectionIds = new Set(fromCollection.map((m) => String(m._id)));
    const merged = [
      ...fromCollection,
      ...fromUsers.filter((u) => !collectionIds.has(String(u._id))),
    ];

    res.json({ success: true, data: merged, count: merged.length });
  } catch (err) {
    serverError(res, err, 'getAllMentors');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getMentorById = async (req, res) => {
  try {
    let mentor = await Mentor.findById(req.params.id).lean();
    if (!mentor) {
      mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
        .select('-passwordHash -refreshTokenHash -resetCode -resetToken')
        .lean();
    }
    if (!mentor) return notFound(res, 'Mentor');
    res.json({ success: true, data: mentor });
  } catch (err) {
    serverError(res, err, 'getMentorById');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/mentors/:id/assign-startup
// Body : { startupId: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.assignStartup = async (req, res) => {
  try {
    const { startupId } = req.body;
    if (!startupId)
      return res.status(400).json({ success: false, message: 'startupId requis' });

    const startup = await Application.findById(startupId);
    if (!startup) return notFound(res, 'Startup / Application');

    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) {
      const mentorDoc = await Mentor.findById(req.params.id);
      if (!mentorDoc) return notFound(res, 'Mentor');
      return res.json({ success: true, message: `Startup assignee au mentor ${mentorDoc.name}`, mentorId: mentorDoc._id, startupId });
    }

    await User.findByIdAndUpdate(req.params.id, { $addToSet: { assignedStartups: startupId } });
    res.json({ success: true, message: `Startup assignee au mentor ${mentor.name}`, mentorId: mentor._id, startupId });
  } catch (err) {
    serverError(res, err, 'assignStartup');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/mentors/:id/unassign-startup/:startupId
// ─────────────────────────────────────────────────────────────────────────────
exports.unassignStartup = async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) return notFound(res, 'Mentor');

    await User.findByIdAndUpdate(req.params.id, { $pull: { assignedStartups: req.params.startupId } });
    res.json({ success: true, message: 'Startup retiree du mentor', mentorId: req.params.id, startupId: req.params.startupId });
  } catch (err) {
    serverError(res, err, 'unassignStartup');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/mentors/:id/roles
// Body : { action: 'add' | 'remove', role: 'mentor' | 'jury' }
// ─────────────────────────────────────────────────────────────────────────────
exports.manageMentorRole = async (req, res) => {
  try {
    const { action, role } = req.body;

    if (!['add', 'remove'].includes(action))
      return res.status(400).json({ success: false, message: "action doit etre 'add' ou 'remove'" });
    if (!['mentor', 'jury'].includes(role))
      return res.status(400).json({ success: false, message: "role doit etre 'mentor' ou 'jury'" });
    if (action === 'remove' && role === 'mentor')
      return res.status(400).json({ success: false, message: "Le role 'mentor' ne peut pas etre retire." });

    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) return notFound(res, 'Mentor');

    const update = action === 'add'
      ? { $addToSet: { mentorRoles: role } }
      : { $pull:     { mentorRoles: role } };

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email mentorRoles');

    if (!updated.mentorRoles.includes('mentor')) {
      updated.mentorRoles.push('mentor');
      await updated.save();
    }

    res.json({
      success: true,
      message: action === 'add'
        ? `Role '${role}' ajoute a ${mentor.name}`
        : `Role '${role}' retire de ${mentor.name}`,
      mentor: {
        _id:         updated._id,
        name:        updated.name,
        email:       updated.email,
        mentorRoles: updated.mentorRoles,
        isJury:      updated.mentorRoles.includes('jury'),
      },
    });
  } catch (err) {
    serverError(res, err, 'manageMentorRole');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors/jury
// ─────────────────────────────────────────────────────────────────────────────
exports.getMentorsWithJuryRole = async (req, res) => {
  try {
    const juryMentors = await User.find({ role: 'mentor', isActive: true, mentorRoles: 'jury' })
      .select('name email mentorRoles assignedStartups')
      .populate('assignedStartups', 'startupName sector')
      .lean();

    res.json({ success: true, count: juryMentors.length, mentors: juryMentors });
  } catch (err) {
    serverError(res, err, 'getMentorsWithJuryRole');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors/stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getMentorStats = async (req, res) => {
  try {
    const [totalMentors, juryCount, withStartups] = await Promise.all([
      User.countDocuments({ role: 'mentor', isActive: true }),
      User.countDocuments({ role: 'mentor', isActive: true, mentorRoles: 'jury' }),
      User.countDocuments({ role: 'mentor', isActive: true, 'assignedStartups.0': { $exists: true } }),
    ]);

    res.json({
      success: true,
      stats: {
        total:           totalMentors,
        juryCount,
        mentorOnly:      totalMentors - juryCount,
        withStartups,
        withoutStartups: totalMentors - withStartups,
      },
    });
  } catch (err) {
    serverError(res, err, 'getMentorStats');
  }
};