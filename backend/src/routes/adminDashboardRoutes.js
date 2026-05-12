// src/routes/adminDashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/AdminDashboardController');

// Toutes les routes protégées admin
router.use(protect, authorize('admin'));

// ── KPI Principal ──────────────────────────────────────────────
router.get('/stats',                      ctrl.getStats);

// ── Graphes / Charts ──────────────────────────────────────────
router.get('/charts/applications-timeline',  ctrl.getApplicationsTimeline);
router.get('/charts/applications-by-status', ctrl.getApplicationsByStatus);
router.get('/charts/users-by-role',          ctrl.getUsersByRole);
router.get('/charts/user-growth',            ctrl.getUserGrowth);
router.get('/charts/programmes-overview',    ctrl.getProgrammesOverview);
router.get('/charts/evaluations-scores',     ctrl.getEvaluationsScores);
router.get('/charts/sessions-activity',      ctrl.getSessionsActivity);

// ── Listes ────────────────────────────────────────────────────
router.get('/recent-applications',           ctrl.getRecentApplications);
router.get('/top-mentors',                   ctrl.getTopMentors);
router.get('/activity-feed',                 ctrl.getActivityFeed);

// ── Métriques & Notifications ─────────────────────────────────
router.get('/performance-metrics',           ctrl.getPerformanceMetrics);
router.get('/notifications-summary',         ctrl.getNotificationsSummary);

module.exports = router;