const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  triggerScoring,
  getScore,
  rescoreApplication,
} = require('../controllers/aiScoringController');

// ✅ POST routes en premier (ordre important !)
router.post('/trigger/:applicationId', protect, triggerScoring);
router.post('/rescore/:applicationId', protect, rescoreApplication);

// ✅ GET en dernier
router.get('/:applicationId', protect, getScore);

module.exports = router;