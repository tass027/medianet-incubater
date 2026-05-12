const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/mentorController');
const {
  protect,
  requireMentor,
  authorizeWithMentorRole,
} = require('../middlewares/authMiddleware');

router.use(protect, requireMentor);

// ─── Startups ────────────────────────────────────────────────────────────────
router.get('/startups',          ctrl.getMyStartups);
router.get('/startups/:id',      ctrl.getStartupById);
router.get('/startups/:id/kpis', ctrl.getStartupKPIs);

// ─── Sessions ────────────────────────────────────────────────────────────────
router.get   ('/sessions',     ctrl.getMySessions);
router.post  ('/sessions',     ctrl.createSession);
router.put   ('/sessions/:id', ctrl.updateSession);
router.delete('/sessions/:id', ctrl.deleteSession);

// ─── Feedback ────────────────────────────────────────────────────────────────
router.get ('/feedback',            ctrl.getAllFeedback);
router.post('/feedback',            ctrl.createFeedback);
router.get ('/feedback/:startupId', ctrl.getFeedbackByStartup);

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get ('/reports', ctrl.getMyReports);
router.post('/reports', ctrl.createReport);

// ─── Resources ───────────────────────────────────────────────────────────────
router.get   ('/resources',     ctrl.getResources);
router.post  ('/resources',     ctrl.createResource);
router.delete('/resources/:id', ctrl.deleteResource);

module.exports = router;