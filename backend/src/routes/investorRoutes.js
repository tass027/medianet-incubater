// src/routes/investorRoutes.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/investorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ── Stats (avant /:id pour éviter collision) ──────────────────────────────
router.get('/stats', protect, authorize('admin'), ctrl.getStats);

// ── CRUD ──────────────────────────────────────────────────────────────────
router.get('/',    protect, authorize('admin'), ctrl.getAll);
router.post('/',   protect, authorize('admin'), ctrl.create);
router.get('/:id', protect, authorize('admin'), ctrl.getOne);
router.put('/:id', protect, authorize('admin'), ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

// ── Matches ───────────────────────────────────────────────────────────────
router.patch('/:investorId/matches/:matchId/valider', protect, authorize('admin'), ctrl.validerMatch);
router.patch('/:investorId/matches/:matchId/rejeter', protect, authorize('admin'), ctrl.rejeterMatch);

module.exports = router;