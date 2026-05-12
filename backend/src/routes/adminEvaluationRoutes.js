// routes/adminEvaluationRoutes.js
// ✅ FIX : ajout de la route POST /remind manquante
// Le frontend appelle POST /api/admin/evaluations/remind
// mais cette route n'existait pas → 404

const express = require('express');
const router  = express.Router();

const {
  getAll,
  getStats,
  getOne,
  updateEval,
  getByApplication,
  sendReminder,   // ✅ nouveau
  blockWrite,
} = require('../controllers/adminEvaluationController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect, authorize('admin'));

// ── Stats ─────────────────────────────────────────────────────────────────
router.get('/stats', getStats);

// ── Rappel jury ───────────────────────────────────────────────────────────
// ✅ FIX : route manquante — le frontend fait POST /api/admin/evaluations/remind
router.post('/remind', sendReminder);

// ── Par candidature ───────────────────────────────────────────────────────
router.get('/by-application/:applicationId', getByApplication);

// ── CRUD ──────────────────────────────────────────────────────────────────
router.get('/',       getAll);
router.get('/:id',    getOne);
router.patch('/:id',  updateEval);
router.post('/',      blockWrite);
router.put('/:id',    blockWrite);
router.delete('/:id', blockWrite);

module.exports = router;