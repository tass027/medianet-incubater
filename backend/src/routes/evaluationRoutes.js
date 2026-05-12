// routes/evaluationRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllEvaluations,
  getEvaluationsByApplication,
  getEvaluationsByJury,
  submitEvaluation,
  updateEvaluation,
  getEvaluationStats,
} = require('../controllers/juryEvaluationController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Stats
router.get('/stats', protect, authorize('admin'), getEvaluationStats);

// Admin routes
router.get('/',    protect, authorize('admin'), getAllEvaluations);

// Per application / per jury
router.get('/application/:applicationId', protect, getEvaluationsByApplication);
router.get('/jury/:juryId',               protect, getEvaluationsByJury);

// Submit / update
router.post('/',    protect, submitEvaluation);
router.put('/:id',  protect, updateEvaluation);

module.exports = router;