const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const User     = require('../models/User');
const { sendAdminInvitation } = require('../services/emailService');

// ─── RoleModel (pour les labels) ─────────────────────────────────────────────
let RoleModel;
try {
  RoleModel = mongoose.model('Role');
} catch {
  const RoleSchema = new mongoose.Schema({ name: String, label: String });
  RoleModel = mongoose.model('Role', RoleSchema);
}

const ADMIN_CREATABLE_ROLES = ['admin', 'mentor', 'jury', 'investor'];

const ROLE_FALLBACK_LABELS = {
  admin:     'Administrateur',
  mentor:    'Mentor',
  jury:      'Jury',
  investor:  'Investisseur',
  applicant: 'Candidat',
  startup:   'Startup / Fondateur',
  founder:   'Intrapreneur',
};

const db = mongoose.connection;

// ✅ CORRECTION : toutes les collections liées sont déclarées
// — formresponses : réponses de formulaires soumises par l'utilisateur
// — applications  : candidatures déposées par l'utilisateur
// — evaluations   : évaluations réalisées par un jury/mentor (evaluatorId)
// — contacts      : messages/échanges impliquant l'utilisateur (senderId ou receiverId)
// — mentorships   : sessions de mentorat où l'utilisateur est mentor ou mentoré
const linkedCollections = [
  {
    col:   () => db.collection('formresponses'),
    field: 'respondentId',
    label: 'réponse(s) de formulaire',
  },
  {
    col:   () => db.collection('applications'),
    field: 'userId',
    label: 'candidature(s)',
  },
  {
    col:   () => db.collection('evaluations'),
    field: 'evaluatorId',
    label: 'évaluation(s)',
  },
  // ✅ AJOUT — contacts (l'utilisateur est expéditeur OU destinataire)
  {
    col:        () => db.collection('contacts'),
    multiField: ['senderId', 'receiverId'],   // deux champs possibles → voir checkLinkedData
    label:      'contact(s) / message(s)',
  },
  // ✅ AJOUT — sessions de mentorat (l'utilisateur est mentor OU mentoré)
  {
    col:        () => db.collection('mentorships'),
    multiField: ['mentorId', 'menteeId'],
    label:      'session(s) de mentorat',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// checkLinkedData
// Supporte maintenant :
//   - field      : champ unique  (ex: userId)
//   - multiField : tableau de champs (ex: [senderId, receiverId])
//     → compte les documents où AU MOINS UN des champs correspond à l'userId
// ─────────────────────────────────────────────────────────────────────────────
async function checkLinkedData(userId) {
  const id    = new mongoose.Types.ObjectId(userId);
  const found = [];

  await Promise.all(
    linkedCollections.map(async ({ col, field, multiField, label }) => {
      try {
        let count = 0;

        if (multiField) {
          // $or sur plusieurs champs (ex: senderId OU receiverId)
          count = await col().countDocuments({
            $or: multiField.map(f => ({ [f]: id })),
          });
        } else {
          count = await col().countDocuments({ [field]: id });
        }

        if (count > 0) found.push({ label, count });
      } catch {
        // collection inexistante ou erreur → on ignore silencieusement
      }
    })
  );

  return found;
}

// ─────────────────────────────────────────────────────────────────────────────
// cascadeDelete
// Supprime toutes les données liées à un userId dans toutes les collections.
// Utilisé lors d'une suppression forcée (force=true).
// ─────────────────────────────────────────────────────────────────────────────
async function cascadeDelete(userId) {
  const id = new mongoose.Types.ObjectId(userId);

  await Promise.all(
    linkedCollections.map(({ col, field, multiField }) => {
      try {
        if (multiField) {
          return col().deleteMany({
            $or: multiField.map(f => ({ [f]: id })),
          });
        }
        return col().deleteMany({ [field]: id });
      } catch {
        // collection inexistante → on ignore
      }
    })
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resolveStatus(user) {
  if (!user.isEmailVerified) return 'pending';
  if (!user.isApproved)      return 'pending';
  if (!user.isActive)        return 'inactive';
  return 'active';
}

function applyStatus(user, status) {
  switch (status) {
    case 'active':    user.isActive = true;  user.isApproved = true;  break;
    case 'inactive':  user.isActive = false; user.isApproved = true;  break;
    case 'suspended': user.isActive = false; user.isApproved = false; break;
    case 'pending':   user.isApproved = false; break;
  }
}

function formatUser(u, rolesMap = {}) {
  const roleLabel =
    (rolesMap[u.role] && rolesMap[u.role] !== u.role)
      ? rolesMap[u.role]
      : ROLE_FALLBACK_LABELS[u.role] || u.role;

  return {
    _id:             u._id,
    name:            u.name,
    email:           u.email,
    role:            u.role,
    roleLabel,
    mentorRoles:     u.mentorRoles || [],
    isActive:        u.isActive,
    isApproved:      u.isApproved,
    isEmailVerified: u.isEmailVerified,
    status:          resolveStatus(u),
    company:         u.startupProfile?.startupName || u.company || null,
    department:      u.department || null,
    location:        u.startupProfile?.location || u.location || null,
    phone:           u.phone || null,
    expertise:       u.expertise || [],
    permissions:     u.permissions || [],
    startupProfile:  u.startupProfile || null,
    lastLoginAt:     u.lastLoginAt,
    createdAt:       u.createdAt,
    updatedAt:       u.updatedAt,
    sessionsCount:   u.loginHistory?.length || 0,
  };
}

async function getRolesMap() {
  try {
    const roles = await RoleModel.find({}, { name: 1, label: 1 }).lean();
    const map = {};
    roles.forEach(r => { if (r.name) map[r.name] = r.label || r.name; });
    return map;
  } catch {
    return {};
  }
}

// ─── STATS ───────────────────────────────────────────────────────────────────
async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, admin, mentor, jury, applicant, investor] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'mentor' }),
    User.countDocuments({ role: 'jury' }),
    User.countDocuments({ role: { $in: ['applicant', 'startup', 'founder'] } }),
    User.countDocuments({ role: 'investor' }),
  ]);

  const activeToday = await User.countDocuments({ lastLoginAt: { $gte: today } });
  const pending     = await User.countDocuments({
    $or: [{ isApproved: false }, { isEmailVerified: false }],
    isActive: false,
  });

  return { total, admin, mentor, jury, applicant, investor, activeToday, pending };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const {
      search = '', role = 'all', status = 'all',
      page = 1, limit = 12, sort = '-createdAt',
    } = req.query;

    const filter = {};

    if (role !== 'all') {
      const STARTUP_ROLES = ['startup', 'founder', 'applicant'];
      filter.role = STARTUP_ROLES.includes(role)
        ? { $in: STARTUP_ROLES }
        : role;
    }

    if (search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: re }, { email: re }, { 'startupProfile.startupName': re }];
    }

    if (status !== 'all') {
      switch (status) {
        case 'active':
          filter.isActive   = true;
          filter.isApproved = true;
          break;
        case 'inactive':
          filter.isActive   = false;
          filter.isApproved = true;
          break;
        case 'suspended':
          filter.isActive   = false;
          filter.isApproved = false;
          break;
        case 'pending': {
          const pendingCondition = { $or: [{ isApproved: false }, { isEmailVerified: false }] };
          if (filter.$or) {
            filter.$and = [{ $or: filter.$or }, pendingCondition];
            delete filter.$or;
          } else {
            filter.$or = pendingCondition.$or;
          }
          break;
        }
      }
    }

    const sortMap = {
      '-createdAt':  { createdAt: -1 },
      'createdAt':   { createdAt:  1 },
      'name':        { name:       1 },
      '-name':       { name:      -1 },
      '-lastActive': { lastLoginAt: -1 },
    };
    const sortObj  = sortMap[sort] || { createdAt: -1 };
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [users, total, rolesMap, stats] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -refreshTokenHash -resetCode -resetToken -emailVerifyToken')
        .sort(sortObj).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
      getRolesMap(),
      getStats(),
    ]);

    return res.json({
      users: users.map(u => formatUser(u, rolesMap)),
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
      stats,
    });
  } catch (err) {
    console.error('[listUsers]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getUser = async (req, res) => {
  try {
    const [user, rawUser, rolesMap] = await Promise.all([
      User.findById(req.params.id)
        .select('-passwordHash -refreshTokenHash -resetCode -resetToken -emailVerifyToken')
        .lean(),
      User.findById(req.params.id).select('loginHistory').lean(),
      getRolesMap(),
    ]);

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const activity = (rawUser?.loginHistory || [])
      .slice(-10).reverse()
      .map((h, i) => ({
        id:     `${h.date}-${i}`,
        action: h.status === 'success' ? 'Connexion réussie' : 'Tentative de connexion échouée',
        type:   h.status === 'success' ? 'success' : 'warning',
        date:   h.date,
        ip:     h.ip,
      }));

    const linkedData = await checkLinkedData(req.params.id);

    return res.json({ user: formatUser(user, rolesMap), activity, linkedData });
  } catch (err) {
    console.error('[getUser]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, role, status,
      company, department, location, phone,
      permissions, invitationMessage,
    } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email et password sont requis.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "L'adresse e-mail saisie est invalide." });

    const roleToAssign = role || 'mentor';
    if (!ADMIN_CREATABLE_ROLES.includes(roleToAssign))
      return res.status(400).json({
        message: `Rôle non autorisé. Valeurs acceptées : ${ADMIN_CREATABLE_ROLES.join(', ')}.`,
      });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: 'Un compte existe déjà avec cette adresse e-mail.' });

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email:           email.toLowerCase(),
      passwordHash,
      role:            roleToAssign,
      isEmailVerified: true,
      company:         company     || null,
      department:      department  || null,
      location:        location    || null,
      phone:           phone       || null,
      permissions:     permissions || [],
    });

    applyStatus(newUser, status || 'active');
    await newUser.save();

    let emailError = null;
    try {
      await sendAdminInvitation({
        toEmail:           newUser.email,
        name:              newUser.name,
        role:              newUser.role,
        temporaryPassword: password,
        customMessage:     invitationMessage || null,
        loginUrl:          process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : null,
      });
    } catch (mailErr) {
      console.error('[createUser] Échec envoi e-mail:', mailErr.message);
      emailError = "Le compte a été créé, mais l'envoi de l'e-mail d'invitation a échoué.";
    }

    const rolesMap = await getRolesMap();

    return res.status(201).json({
      message:    emailError
        ? `Utilisateur créé. ${emailError}`
        : `Utilisateur créé. Un e-mail d'invitation a été envoyé à ${newUser.email}.`,
      user:       formatUser(newUser.toObject(), rolesMap),
      emailError: emailError ? true : false,
    });
  } catch (err) {
    console.error('[createUser]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status, company, department, location, phone, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    if (email && email.toLowerCase() !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res.status(400).json({ message: "L'adresse e-mail saisie est invalide." });
      const dup = await User.findOne({ email: email.toLowerCase() });
      if (dup) return res.status(409).json({ message: 'Email déjà utilisé.' });
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) {
      if (!ADMIN_CREATABLE_ROLES.includes(role))
        return res.status(400).json({
          message: `Rôle non autorisé. Valeurs acceptées : ${ADMIN_CREATABLE_ROLES.join(', ')}.`,
        });
      user.role = role;
    }
    if (company    !== undefined) user.company    = company;
    if (department !== undefined) user.department = department;
    if (location   !== undefined) user.location   = location;
    if (phone      !== undefined) user.phone      = phone;
    if (status) applyStatus(user, status);
    if (password) {
      user.passwordHash     = await bcrypt.hash(password, 12);
      user.refreshTokenHash = null;
    }

    await user.save();
    const rolesMap = await getRolesMap();
    return res.json({ message: 'Utilisateur mis à jour.', user: formatUser(user.toObject(), rolesMap) });
  } catch (err) {
    console.error('[updateUser]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/status
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'inactive', 'pending', 'suspended'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `Statut invalide. Valeurs : ${allowed.join(', ')}` });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    if (user._id.toString() === req.user._id.toString() && status !== 'active')
      return res.status(403).json({ message: 'Vous ne pouvez pas désactiver votre propre compte.' });

    applyStatus(user, status);
    await user.save();
    const rolesMap = await getRolesMap();
    return res.json({ message: `Statut mis à jour : ${status}`, user: formatUser(user.toObject(), rolesMap) });
  } catch (err) {
    console.error('[updateStatus]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/permissions
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions))
      return res.status(400).json({ message: 'permissions doit être un tableau.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    user.permissions = permissions;
    await user.save();
    const rolesMap = await getRolesMap();
    return res.json({ message: 'Permissions mises à jour.', user: formatUser(user.toObject(), rolesMap) });
  } catch (err) {
    console.error('[updatePermissions]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const force = req.query.force === 'true';

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    if (user._id.toString() === req.user._id.toString())
      return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });

    const linkedData = await checkLinkedData(req.params.id);

    // ✅ Blocage si données liées existent et force=false
    if (linkedData.length > 0 && !force) {
      const detail = linkedData.map(l => `${l.count} ${l.label}`).join(', ');
      return res.status(409).json({
        message: `Impossible de supprimer : cet utilisateur possède ${detail}.`,
        linkedData,
        hint: 'Ajoutez ?force=true pour supprimer avec toutes les données associées.',
      });
    }

    // ✅ Suppression en cascade sur toutes les collections (y compris contacts et mentorships)
    if (linkedData.length > 0 && force) {
      await cascadeDelete(req.params.id);
    }

    await User.findByIdAndDelete(req.params.id);

    const deletedSummary = linkedData.map(l => `${l.count} ${l.label}`).join(', ');
    return res.json({
      message: force && linkedData.length > 0
        ? `Utilisateur et données associées supprimés (${deletedSummary}).`
        : 'Utilisateur supprimé.',
      linkedData: force ? linkedData : [],
    });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/bulk
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkAction = async (req, res) => {
  try {
    const { action, ids, value, force = false } = req.body;

    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: 'ids requis.' });

    const safeIds = ids.filter(id => id !== req.user._id.toString());

    if (action === 'delete') {
      if (force) {
        // ✅ Suppression en cascade sur toutes les collections pour chaque user
        await Promise.all(safeIds.map(userId => cascadeDelete(userId)));
        await User.deleteMany({ _id: { $in: safeIds } });
        return res.json({ message: `${safeIds.length} utilisateur(s) et leurs données supprimés.` });
      }

      // Vérification des données liées avant suppression
      const blocked = [];
      await Promise.all(
        safeIds.map(async (userId) => {
          const linkedData = await checkLinkedData(userId);
          if (linkedData.length > 0) {
            const u = await User.findById(userId).select('name email').lean();
            blocked.push({ userId, name: u?.name, linkedData });
          }
        })
      );

      if (blocked.length > 0) {
        return res.status(409).json({
          message: `${blocked.length} utilisateur(s) ont des données liées et ne peuvent pas être supprimés.`,
          blocked,
          hint: 'Envoyez force: true pour supprimer avec toutes les données associées.',
        });
      }

      await User.deleteMany({ _id: { $in: safeIds } });
      return res.json({ message: `${safeIds.length} utilisateur(s) supprimé(s).` });
    }

    if (action === 'status') {
      const allowed = ['active', 'inactive', 'pending', 'suspended'];
      if (!allowed.includes(value))
        return res.status(400).json({ message: 'Valeur de statut invalide.' });

      const users = await User.find({ _id: { $in: safeIds } });
      await Promise.all(users.map(u => { applyStatus(u, value); return u.save(); }));
      return res.json({ message: `${users.length} utilisateur(s) mis à jour → ${value}.` });
    }

    return res.status(400).json({ message: `Action inconnue : ${action}` });
  } catch (err) {
    console.error('[bulkAction]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users/export
// ─────────────────────────────────────────────────────────────────────────────
exports.exportCSV = async (req, res) => {
  try {
    const [users, rolesMap] = await Promise.all([
      User.find({})
        .select('name email role isActive isApproved isEmailVerified createdAt lastLoginAt startupProfile location phone')
        .lean(),
      getRolesMap(),
    ]);

    const header = 'Name,Email,Role,Role Label,Status,Location,Phone,Company,Created At,Last Login\n';
    const rows = users.map(u => {
      const roleLabel = (rolesMap[u.role] && rolesMap[u.role] !== u.role)
        ? rolesMap[u.role]
        : ROLE_FALLBACK_LABELS[u.role] || u.role;

      return [
        `"${u.name}"`,
        `"${u.email}"`,
        u.role,
        `"${roleLabel}"`,
        resolveStatus(u),
        `"${u.startupProfile?.location || u.location || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.startupProfile?.startupName || u.company || ''}"`,
        u.createdAt   ? new Date(u.createdAt).toISOString().split('T')[0]   : '',
        u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().split('T')[0] : '',
      ].join(',');
    });

    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('[exportCSV]', err);
    return res.status(500).json({ message: 'Erreur export.' });
  }
};