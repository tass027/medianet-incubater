// src/routes/programmeRoutes.js
// ✅ FIX : suppression de la route /:id/evaluations dupliquée
// ✅ FIX : routes decisions correctement enregistrées avant router.use()
// ✅ FIX : ordre correct — routes spécifiques AVANT les routes génériques /:id

const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const programmeController  = require('../controllers/programmeController');
const { getByProgramme: getEvalsByProgramme } = require('../controllers/adminEvaluationController');
const {
  getByProgramme: getDecisionsByProgramme,
  saveDecision,
} = require('../controllers/adminDecisionController');

/* ── Routes publiques ───────────────────────────────────────────────────── */
router.get('/public',     programmeController.getPublicProgrammes);
router.get('/public/:id', programmeController.getPublicProgrammeById);

/* ── Formulaire (startup + admin) ───────────────────────────────────────── */
router.get(
  '/:id/form',
  protect,
  authorize('startup', 'founder', 'applicant', 'admin'),
  programmeController.getProgrammeForm
);

/* ── Routes protégées admin — sous-ressources AVANT les routes CRUD ─────── */
// ⚠️  Ces routes doivent être déclarées AVANT router.use() ET AVANT router.get('/:id')
// pour que Express ne confonde pas "evaluations" / "decisions" avec un :id MongoDB.

router.get(
  '/:id/evaluations',
  protect,
  authorize('admin'),
  getEvalsByProgramme
);

router.get(
  '/:id/decisions',
  protect,
  authorize('admin'),
  getDecisionsByProgramme
);

router.post(
  '/:id/decisions',
  protect,
  authorize('admin'),
  saveDecision
);

/* ── Routes admin — CRUD programme ─────────────────────────────────────── */
router.use(protect, authorize('admin'));

router.get('/',             programmeController.getAllProgrammes);
router.post('/',            programmeController.createProgramme);
router.get('/:id',          programmeController.getProgramme);
router.put('/:id',          programmeController.updateProgramme);
router.delete('/:id',       programmeController.deleteProgramme);
router.patch('/:id/status', programmeController.updateStatus);

module.exports = router;