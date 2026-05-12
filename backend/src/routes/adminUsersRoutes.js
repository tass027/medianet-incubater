// src/routes/adminUsersRoutes.js
// Routes REST pour la gestion des utilisateurs (espace admin)

const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateStatus,
  updatePermissions,
  deleteUser,
  bulkAction,
  exportCSV,
} = require('../controllers/adminUsersController');

// Toutes les routes nécessitent d'être admin
router.use(protect, authorize('admin'));

// ── Collection ────────────────────────────────────────────────────────────────
router.get   ('/',        listUsers);    // GET  /api/admin/users
router.post  ('/',        createUser);   // POST /api/admin/users
router.post  ('/bulk',    bulkAction);   // POST /api/admin/users/bulk
router.get   ('/export',  exportCSV);    // GET  /api/admin/users/export

// ── Document ──────────────────────────────────────────────────────────────────
router.get   ('/:id',                getUser);           // GET    /api/admin/users/:id
router.put   ('/:id',                updateUser);        // PUT    /api/admin/users/:id
router.patch ('/:id/status',         updateStatus);      // PATCH  /api/admin/users/:id/status
router.patch ('/:id/permissions',    updatePermissions); // PATCH  /api/admin/users/:id/permissions
router.delete('/:id',                deleteUser);        // DELETE /api/admin/users/:id

module.exports = router;