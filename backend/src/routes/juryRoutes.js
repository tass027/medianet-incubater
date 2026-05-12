// routes/juryRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllJury,
  getJuryById,
  createJury,
  updateJury,
  deleteJury,
  assignProgrammes,
  sendInvitation,
  getJuryEvaluations,
  getJuryStats,
} = require('../controllers/juryController');

// Importer vos middlewares existants
const { protect, authorize } = require('../middlewares/authMiddleware');

// ── Stats (avant :id pour éviter conflit de route) ────────────
router.get('/stats', protect, authorize('admin'), getJuryStats);

// ── CRUD ──────────────────────────────────────────────────────
router.get('/',    protect, authorize('admin'), getAllJury);
router.post('/',   protect, authorize('admin'), createJury);
router.get('/:id', protect, authorize('admin'), getJuryById);
router.put('/:id', protect, authorize('admin'), updateJury);
router.delete('/:id', protect, authorize('admin'), deleteJury);

// ── Actions spécifiques ────────────────────────────────────────
router.patch('/:id/programmes', protect, authorize('admin'), assignProgrammes);
router.post('/:id/invite',      protect, authorize('admin'), sendInvitation);
router.get('/:id/evaluations',  protect, authorize('admin'), getJuryEvaluations);

module.exports = router;