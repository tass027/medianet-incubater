// src/routes/adminStartupsRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminStartupsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const auth = [protect, authorize('admin')];

// ── Liste & lecture ──────────────────────────────────────────────
router.get('/',  ...auth, ctrl.getAll);

// ── Assignation investisseurs / mentors ──────────────────────────
router.patch('/:id/assign',   ...auth, ctrl.assign);

// ── Timeline ─────────────────────────────────────────────────────
router.patch('/:id/timeline', ...auth, ctrl.updateTimeline);

// ── Besoins ──────────────────────────────────────────────────────
router.patch('/:id/besoins',  ...auth, ctrl.updateBesoins);

// ── Historique sessions ──────────────────────────────────────────
router.post  ('/:id/session-history',              ...auth, ctrl.addSessionHistory);
router.delete('/:id/session-history/:sessionId',   ...auth, ctrl.removeSessionHistory);

// ── Formations spécifiques startup ───────────────────────────────
router.post  ('/:id/formations',                   ...auth, ctrl.addFormation);
router.delete('/:id/formations/:formationId',      ...auth, ctrl.removeFormation);

module.exports = router;