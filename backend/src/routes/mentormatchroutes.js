// routes/mentorMatchRoutes.js
// ► PLACEZ CE FICHIER DANS : src/routes/mentorMatchRoutes.js

const express = require('express');
const router  = express.Router();

const {
  getMyMentorMatches,
  getMentorMatchDetail,
  validateMentorRecommendation,
  refuseMentorRecommendation,
  confirmMentorSession,
  refuseMentorSession,
} = require('../controllers/mentorMatchController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('founder', 'startup', 'Startup', 'Founder'));

router.get('/',                           getMyMentorMatches);
router.get('/:matchId',                   getMentorMatchDetail);
router.patch('/:matchId/validate',        validateMentorRecommendation);
router.patch('/:matchId/refuse',          refuseMentorRecommendation);
router.patch('/:matchId/session/confirm', confirmMentorSession);
router.patch('/:matchId/session/refuse',  refuseMentorSession);

module.exports = router;