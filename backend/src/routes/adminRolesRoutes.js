// src/routes/adminRolesRoutes.js

const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  duplicateRole,
} = require('../controllers/adminRolesController');

router.use(protect, authorize('admin'));

router.get   ('/',                       listRoles);             // GET    /api/admin/roles
router.post  ('/',                       createRole);            // POST   /api/admin/roles
router.put   ('/:roleId',               updateRole);            // PUT    /api/admin/roles/:roleId
router.delete('/:roleId',               deleteRole);            // DELETE /api/admin/roles/:roleId
router.patch ('/:roleId/permissions',   updateRolePermissions); // PATCH  /api/admin/roles/:roleId/permissions
router.post  ('/:roleId/duplicate',     duplicateRole);         // POST   /api/admin/roles/:roleId/duplicate

module.exports = router;