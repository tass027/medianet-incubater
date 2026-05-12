const mongoose = require('mongoose');
const User = require('../models/User');

// ─── RoleModel ───────────────────────────────────────────────────────────────
let RoleModel;
try {
  RoleModel = mongoose.model('Role');
} catch {
  const RoleSchema = new mongoose.Schema({
    id:            { type: String },
    name:          { type: String, required: true },
    label:         { type: String, default: '' },
    description:   { type: String, default: '' },
    color:         { type: String, default: '#64748b' },
    icon:          { type: String, default: '' },
    isSystem:      { type: Boolean, default: true },
    isActive:      { type: Boolean, default: true },
    permissions:   { type: [String], default: [] },
    dashboardPath: { type: String, default: '' },
  }, { timestamps: true });
  RoleModel = mongoose.model('Role', RoleSchema);
}

// IDs des rôles système (non supprimables)
const SYSTEM_ROLE_IDS = ['admin', 'jury', 'mentor', 'applicant', 'investor'];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function getUserCountPerRole() {
  const counts = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach(c => { map[c._id] = c.count; });
  return map;
}

async function mergeWithCounts(roles) {
  const counts = await getUserCountPerRole();
  return roles.map(r => ({
    ...r,
    userCount: counts[r.name] || counts[r.id] || 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/roles
// ─────────────────────────────────────────────────────────────────────────────
exports.listRoles = async (req, res) => {
  try {
    const dbRoles = await RoleModel.find({ isActive: { $ne: false } }).lean();

    const normalized = dbRoles.map(r => ({
      ...r,
      id: r.id || r.name,
      isSystem: r.isSystem !== undefined
        ? r.isSystem
        : SYSTEM_ROLE_IDS.includes(r.name),
    }));

    const withCounts = await mergeWithCounts(normalized);

    const stats = {
      total:      withCounts.length,
      system:     withCounts.filter(r => r.isSystem).length,
      custom:     withCounts.filter(r => !r.isSystem).length,
      totalUsers: withCounts.reduce((s, r) => s + (r.userCount || 0), 0),
    };

    return res.json({ roles: withCounts, stats });
  } catch (err) {
    console.error('[listRoles]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/roles
// ─────────────────────────────────────────────────────────────────────────────
exports.createRole = async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;

    // Exc 1 : nom vide
    if (!name?.trim())
      return res.status(400).json({ message: 'Le nom du rôle est requis.' });

    // Exc 2 : nom déjà utilisé
    const existing = await RoleModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing)
      return res.status(409).json({
        message: `Un rôle portant le nom "${name.trim()}" existe déjà.`
      });

    const id = name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

    const role = await RoleModel.create({
      id,
      name:        name.trim(),
      label:       name.trim(),
      description: description || '',
      color:       color || '#64748b',
      isSystem:    false,
      isActive:    true,
      permissions: permissions || [],
    });

    return res.status(201).json({
      message: 'Rôle créé.',
      role: { ...role.toObject(), id: role.id || role.name, userCount: 0 }
    });
  } catch (err) {
    console.error('[createRole]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/roles/:roleId
// ─────────────────────────────────────────────────────────────────────────────
exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, color, label } = req.body;

    const isSystem = SYSTEM_ROLE_IDS.includes(roleId);

    if (isSystem) {
      // Rôles système : on peut modifier label, description, color uniquement
      const updated = await RoleModel.findOneAndUpdate(
        { $or: [{ id: roleId }, { name: roleId }] },
        { $set: { label, description, color } },
        { new: true }
      );
      return res.json({ message: 'Rôle système mis à jour.', role: updated });
    }

    const role = await RoleModel.findOneAndUpdate(
      { $or: [{ id: roleId }, { name: roleId }], isSystem: false },
      { $set: { name, label: name, description, color } },
      { new: true }
    );

    if (!role) return res.status(404).json({ message: 'Rôle introuvable.' });
    return res.json({ message: 'Rôle mis à jour.', role });
  } catch (err) {
    console.error('[updateRole]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/roles/:roleId
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (SYSTEM_ROLE_IDS.includes(roleId))
      return res.status(403).json({
        message: 'Les rôles système ne peuvent pas être supprimés.'
      });

    const usersWithRole = await User.countDocuments({ role: roleId });
    if (usersWithRole > 0)
      return res.status(409).json({
        message: `Impossible de supprimer : ${usersWithRole} utilisateur(s) ont ce rôle.`
      });

    const role = await RoleModel.findOneAndDelete({
      $or: [{ id: roleId }, { name: roleId }],
      isSystem: false
    });

    if (!role) return res.status(404).json({ message: 'Rôle introuvable.' });
    return res.json({ message: 'Rôle supprimé.' });
  } catch (err) {
    console.error('[deleteRole]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/roles/:roleId/permissions
// ─────────────────────────────────────────────────────────────────────────────
exports.updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions))
      return res.status(400).json({ message: 'permissions doit être un tableau.' });

    const updated = await RoleModel.findOneAndUpdate(
      { $or: [{ id: roleId }, { name: roleId }] },
      { $set: { permissions } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Rôle introuvable.' });
    return res.json({ message: 'Permissions mises à jour.', role: updated });
  } catch (err) {
    console.error('[updateRolePermissions]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/roles/:roleId/duplicate
// ─────────────────────────────────────────────────────────────────────────────
exports.duplicateRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const source = await RoleModel.findOne({
      $or: [{ id: roleId }, { name: roleId }]
    }).lean();

    if (!source) return res.status(404).json({ message: 'Rôle source introuvable.' });

    const newId   = `${source.name}_copy_${Date.now()}`;
    const newName = `${source.label || source.name} (Copie)`;

    const copy = await RoleModel.create({
      id:          newId,
      name:        newId,
      label:       newName,
      description: source.description || '',
      color:       source.color || '#64748b',
      isSystem:    false,
      isActive:    true,
      permissions: source.permissions || [],
    });

    return res.status(201).json({
      message: 'Rôle dupliqué.',
      role: { ...copy.toObject(), userCount: 0 }
    });
  } catch (err) {
    console.error('[duplicateRole]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};