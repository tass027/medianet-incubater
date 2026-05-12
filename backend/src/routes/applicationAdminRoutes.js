// routes/applicationAdminRoutes.js
// À monter dans app.js : app.use('/api/applications/admin', applicationAdminRoutes)

const express = require('express');
const router  = express.Router();
const {
  adminGetAllApplications,
  adminGetApplication,
  adminUpdateStatus,
  adminUpdateScores,
  adminAssignJury,
  adminMarkNotified,
  adminGetStats,
} = require('../controllers/applicationAdminController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Stats
router.get('/stats', protect, authorize('admin'), adminGetStats);

// Liste + détail
router.get('/',    protect, authorize('admin'), adminGetAllApplications);
router.get('/:id', protect, authorize('admin'), adminGetApplication);

// Actions
router.patch('/:id/status',   protect, authorize('admin'), adminUpdateStatus);
router.patch('/:id/scores',   protect, authorize('admin'), adminUpdateScores);
router.patch('/:id/jury',     protect, authorize('admin'), adminAssignJury);
router.patch('/:id/notify',   protect, authorize('admin'), adminMarkNotified);

module.exports = router;