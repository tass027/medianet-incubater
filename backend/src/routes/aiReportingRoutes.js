// src/routes/aiReportingRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/aiReportingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/generate',         protect, authorize('admin'), ctrl.generate);
router.get('/:applicationId',    protect, authorize('admin'), ctrl.getReport);
router.delete('/:applicationId', protect, authorize('admin'), ctrl.deleteReport);

module.exports = router;