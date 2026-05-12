// routes/matchRoutes.js
const express = require('express');
const router  = express.Router();

const {
  getMyMatches,
  getMatchDetail,
  validateMatch,
  refuseMatch,
  confirmSession,
  refuseSession,
  debugMatch,
} = require('../controllers/matchController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// ── DEBUG (remove in production) ─────────────────────────────────────────────
// GET /api/startup/matches/debug
// Call this from browser to see what startupId the server resolves for your user
router.get('/debug', debugMatch);

// ── Founder-only routes ──────────────────────────────────────────────────────
// authorize checks req.user.role — add every role name your founders can have
router.use(authorize('founder', 'startup', 'Startup', 'Founder'));

router.get('/',                           getMyMatches);
router.get('/:matchId',                   getMatchDetail);
router.patch('/:matchId/validate',        validateMatch);
router.patch('/:matchId/refuse',          refuseMatch);
router.patch('/:matchId/session/confirm', confirmSession);
router.patch('/:matchId/session/refuse',  refuseSession);

module.exports = router;