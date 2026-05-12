// src/routes/adminMentorRoutes.js
// Routes admin pour la gestion des mentors et du double rôle mentor/jury

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminMentorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Toutes les routes nécessitent d'être admin
router.use(protect, authorize('admin'));

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// GET /api/admin/mentors/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', ctrl.getMentorStats);

// ─────────────────────────────────────────────────────────────────────────────
// JURY FILTER
// GET /api/admin/mentors/jury
// Liste uniquement les mentors avec le rôle jury
// IMPORTANT : cette route doit être avant /:id pour ne pas être capturée
// ─────────────────────────────────────────────────────────────────────────────
router.get('/jury', ctrl.getMentorsWithJuryRole);

// ─────────────────────────────────────────────────────────────────────────────
// CRUD MENTORS
// GET    /api/admin/mentors          → liste tous les mentors
// GET    /api/admin/mentors/:id      → détail d'un mentor
// ─────────────────────────────────────────────────────────────────────────────
router.get('/',    ctrl.getAllMentors);
router.get('/:id', ctrl.getMentorById);

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNATION DES STARTUPS
// POST   /api/admin/mentors/:id/assign-startup             → assigner une startup
// DELETE /api/admin/mentors/:id/unassign-startup/:startupId → retirer une startup
// ─────────────────────────────────────────────────────────────────────────────
router.post  ('/:id/assign-startup',                  ctrl.assignStartup);
router.delete('/:id/unassign-startup/:startupId',     ctrl.unassignStartup);

// ─────────────────────────────────────────────────────────────────────────────
// GESTION DU DOUBLE RÔLE MENTOR / JURY
// PATCH  /api/admin/mentors/:id/roles
// Body : { action: 'add' | 'remove', role: 'jury' }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/roles', ctrl.manageMentorRole);

module.exports = router;