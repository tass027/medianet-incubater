// src/routes/candidaturesRoutes.js
// Routes pour la page /dashboard/startup/candidatures

const express = require('express');
const router  = express.Router();
const { body, param, query, validationResult } = require('express-validator');

const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getMyCandidatures,
  getCandidatureById,
  withdrawCandidature,
} = require('../controllers/candidaturesController');

const authorizeStartup = authorize('startup', 'founder', 'applicant');

// ─── Middleware de validation ────────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map(e => ({ field: e.param, message: e.msg })),
    });
  }
  next();
};

// GET  /api/startup/candidatures          → liste toutes mes candidatures
router.get(
  '/',
  protect,
  authorizeStartup,
  query('status')
    .optional()
    .isIn(['all', 'draft', 'pending', 'reviewing', 'interview', 'approved', 'accepted', 'rejected', 'waitlist'])
    .withMessage('Status invalide'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page doit être un nombre positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit doit être entre 1 et 200'),
  handleValidationErrors,
  getMyCandidatures
);

// GET  /api/startup/candidatures/:appId   → détail d'une candidature
router.get(
  '/:appId',
  protect,
  authorizeStartup,
  param('appId')
    .isMongoId()
    .withMessage('ID de candidature invalide'),
  handleValidationErrors,
  getCandidatureById
);

// DELETE /api/startup/candidatures/:appId → retrait (draft/pending seulement)
router.delete(
  '/:appId',
  protect,
  authorizeStartup,
  param('appId')
    .isMongoId()
    .withMessage('ID de candidature invalide'),
  handleValidationErrors,
  withdrawCandidature
);

module.exports = router;