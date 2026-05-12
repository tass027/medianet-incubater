// src/controllers/adminMentorController.js
// Gestion des mentors par l'admin : liste, assignation de startups, gestion du double rôle mentor/jury

const User        = require('../models/User');
const Application = require('../models/Application');

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
// Liste tous les mentors actifs avec leurs startups assignées + rôles actifs
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', isActive: true })
      .select('name email mentorRoles assignedStartups isActive createdAt')
      .populate('assignedStartups', 'startupName sector stage status')
      .lean();

    const result = mentors.map((m) => ({
      _id:             m._id,
      name:            m.name,
      email:           m.email,
      // mentorRoles : tableau ["mentor"] ou ["mentor","jury"]
      mentorRoles:     m.mentorRoles?.length ? m.mentorRoles : ['mentor'],
      isJury:          m.mentorRoles?.includes('jury') ?? false,
      assignedStartups: m.assignedStartups || [],
      startupCount:    (m.assignedStartups || []).length,
      isActive:        m.isActive,
      createdAt:       m.createdAt,
    }));

    res.json({ success: true, count: result.length, mentors: result });
  } catch (err) {
    serverError(res, err, 'getAllMentors');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors/:id
// Détail d'un mentor avec ses startups et ses rôles
// ─────────────────────────────────────────────────────────────────────────────
exports.getMentorById = async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
      .select('-passwordHash -refreshTokenHash -resetCode -resetToken')
      .populate('assignedStartups')
      .lean();

    if (!mentor) return notFound(res, 'Mentor');

    res.json({
      success: true,
      mentor: {
        ...mentor,
        mentorRoles: mentor.mentorRoles?.length ? mentor.mentorRoles : ['mentor'],
        isJury:      mentor.mentorRoles?.includes('jury') ?? false,
      },
    });
  } catch (err) {
    serverError(res, err, 'getMentorById');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/mentors/:id/assign-startup
// Assigner une startup (Application._id) à un mentor
// Body : { startupId: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.assignStartup = async (req, res) => {
  try {
    const { startupId } = req.body;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'startupId requis' });
    }

    // Vérifier que la startup (Application) existe
    const startup = await Application.findById(startupId);
    if (!startup) return notFound(res, 'Startup / Application');

    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) return notFound(res, 'Mentor');

    // $addToSet évite les doublons
    await User.findByIdAndUpdate(req.params.id, {
      $addToSet: { assignedStartups: startupId },
    });

    res.json({
      success: true,
      message: `Startup assignée au mentor ${mentor.name}`,
      mentorId:  mentor._id,
      startupId: startupId,
    });
  } catch (err) {
    serverError(res, err, 'assignStartup');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/mentors/:id/unassign-startup/:startupId
// Retirer une startup d'un mentor
// ─────────────────────────────────────────────────────────────────────────────
exports.unassignStartup = async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) return notFound(res, 'Mentor');

    await User.findByIdAndUpdate(req.params.id, {
      $pull: { assignedStartups: req.params.startupId },
    });

    res.json({
      success: true,
      message: 'Startup retirée du mentor',
      mentorId:  req.params.id,
      startupId: req.params.startupId,
    });
  } catch (err) {
    serverError(res, err, 'unassignStartup');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/mentors/:id/roles
// Gérer le double rôle mentor / jury
//
// Body : { action: 'add' | 'remove', role: 'mentor' | 'jury' }
//
// Règles métier :
//  - 'mentor' est toujours présent dans mentorRoles (on ne peut pas le retirer)
//  - 'jury' peut être ajouté ou retiré par l'admin
//  - Le champ user.role reste 'mentor' (rôle principal MongoDB)
// ─────────────────────────────────────────────────────────────────────────────
exports.manageMentorRole = async (req, res) => {
  try {
    const { action, role } = req.body;

    // Validation
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ success: false, message: "action doit être 'add' ou 'remove'" });
    }
    if (!['mentor', 'jury'].includes(role)) {
      return res.status(400).json({ success: false, message: "role doit être 'mentor' ou 'jury'" });
    }
    // Règle : le rôle 'mentor' ne peut pas être retiré de mentorRoles
    if (action === 'remove' && role === 'mentor') {
      return res.status(400).json({
        success: false,
        message: "Le rôle 'mentor' ne peut pas être retiré. Désactivez le compte à la place.",
      });
    }

    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) return notFound(res, 'Mentor');

    const update = action === 'add'
      ? { $addToSet: { mentorRoles: role } }  // ajouter sans doublon
      : { $pull:     { mentorRoles: role } }; // retirer

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email mentorRoles');

    // S'assurer que 'mentor' est toujours dans le tableau
    if (!updated.mentorRoles.includes('mentor')) {
      updated.mentorRoles.push('mentor');
      await updated.save();
    }

    const isJury = updated.mentorRoles.includes('jury');

    res.json({
      success: true,
      message: action === 'add'
        ? `Rôle '${role}' ajouté à ${mentor.name}`
        : `Rôle '${role}' retiré de ${mentor.name}`,
      mentor: {
        _id:         updated._id,
        name:        updated.name,
        email:       updated.email,
        mentorRoles: updated.mentorRoles,
        isJury,
      },
    });
  } catch (err) {
    serverError(res, err, 'manageMentorRole');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors/jury
// Liste uniquement les mentors qui ont aussi le rôle jury
// Utile pour l'admin panel jury / attribution des évaluations
// ─────────────────────────────────────────────────────────────────────────────
exports.getMentorsWithJuryRole = async (req, res) => {
  try {
    const juryMentors = await User.find({
      role:        'mentor',
      isActive:    true,
      mentorRoles: 'jury',  // MongoDB: cherche 'jury' dans le tableau
    })
      .select('name email mentorRoles assignedStartups')
      .populate('assignedStartups', 'startupName sector')
      .lean();

    res.json({
      success: true,
      count:   juryMentors.length,
      mentors: juryMentors,
    });
  } catch (err) {
    serverError(res, err, 'getMentorsWithJuryRole');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/mentors/stats
// Stats globales pour le dashboard admin
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
        total:       totalMentors,
        juryCount,
        mentorOnly:  totalMentors - juryCount,
        withStartups,
        withoutStartups: totalMentors - withStartups,
      },
    });
  } catch (err) {
    serverError(res, err, 'getMentorStats');
  }
};