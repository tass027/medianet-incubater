// src/routes/jurySpaceRoutes.js

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/jurySpaceController');
const { protect } = require('../middlewares/authMiddleware');

const jurySpaceAccess = (req, res, next) => {
  const { user } = req;
  if (!user) return res.status(401).json({ message: 'Non authentifié.' });
  if (user.role === 'jury')   return next();
  if (user.role === 'mentor' && (user.mentorRoles || []).includes('jury')) return next();
  if (user.role === 'admin')  return next();
  return res.status(403).json({
    message: "Accès refusé. Votre compte n'a pas le rôle jury.",
    yourRole: user.role,
    tip: "Demandez à l'administrateur d'activer le rôle jury sur votre compte.",
  });
};

router.use(protect, jurySpaceAccess);

router.get('/dashboard',      ctrl.getDashboardStats);
router.get('/my-evaluations', ctrl.getMyEvaluations);
router.post('/sync-evaluations', ctrl.syncEvaluations);
router.get('/debug',          ctrl.debugInfo);

router.get('/candidatures',                              ctrl.getCandidatures);
router.get('/candidatures/:applicationId',               ctrl.getCandidatureById);
router.get('/candidatures/:applicationId/criteria',      ctrl.getCriteria);
router.get('/candidatures/:applicationId/my-evaluation', ctrl.getMyEvaluation);
router.post('/candidatures/:applicationId/evaluate',     ctrl.submitEvaluation);

// ── Evaluation management (edit, feedback, send to admin) ──────────────────
router.patch('/evaluations/:evaluationId',               ctrl.patchEvaluation);
router.post('/evaluations/:evaluationId/send-to-admin',  ctrl.sendEvaluationToAdmin);

module.exports = router;