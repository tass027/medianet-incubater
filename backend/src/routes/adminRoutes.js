// src/routes/adminRoutes.js
const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

const adminController       = require('../controllers/adminController');
const programmeController   = require('../controllers/programmeController');
const { getByProgramme }    = require('../controllers/adminEvaluationController');
const { getByProgramme: getDecisionsByProgramme, saveDecision } = require('../controllers/adminDecisionController');

router.use(protect, authorize('admin'));

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', adminController.getDashboardStats);

// ── Applications ─────────────────────────────────────────────────────────────
router.get('/applications',                              adminController.getAllApplications);
router.get('/applications/:userId/:applicationId',       adminController.getApplicationDetail);
router.put('/applications/:userId/:applicationId/status',     adminController.updateApplicationStatus);
router.put('/applications/:userId/:applicationId/evaluation', adminController.updateApplicationEvaluation);

// ── Startups ─────────────────────────────────────────────────────────────────
router.get('/startups', adminController.getAllStartups);

// ── Programmes ───────────────────────────────────────────────────────────────
// ✅ Route /:id/evaluations AVANT /:id pour éviter les conflits
router.get('/programmes/:id/evaluations', getByProgramme);
router.get('/programmes',             programmeController.getAllProgrammes);
router.post('/programmes',            programmeController.createProgramme);
router.get('/programmes/:id',         programmeController.getProgramme);
router.put('/programmes/:id',         programmeController.updateProgramme);
router.delete('/programmes/:id',      programmeController.deleteProgramme);
router.patch('/programmes/:id/status',programmeController.updateStatus);
router.get('/programmes/:id/decisions',  getDecisionsByProgramme);
router.post('/programmes/:id/decisions', saveDecision);
module.exports = router;