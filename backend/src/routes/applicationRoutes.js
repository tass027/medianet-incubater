// src/routes/applicationRoutes.js

const express = require('express');
const router  = express.Router();

const {
  getMyApplication,
  createApplication,
  saveDraft,
  uploadDocument,
  deleteDocument,
  adminListApplications,
  adminGetApplication,
  adminUpdateStatus,
  adminAddFeedback,
  adminUpdateDocStatus,
  adminStats,
} = require('../controllers/applicationController');

const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadDocument: multerUpload, handleUpload } = require('../middlewares/uploadMiddleware');

// ─────────────────────────────────────────────────────────────
// ROUTES CANDIDAT  (rôle : applicant)
// ─────────────────────────────────────────────────────────────

// GET  /api/applications/me           → ma candidature
// POST /api/applications              → soumettre une candidature
// PATCH /api/applications/:id/draft   → sauvegarder brouillon
// POST /api/applications/:id/documents         → upload doc
// DELETE /api/applications/:id/documents/:docId → supprimer doc

router.get(
  '/me',
  protect,
  authorize('applicant'),
  getMyApplication
);

router.post(
  '/',
  protect,
  authorize('applicant'),
  createApplication
);

router.patch(
  '/:id/draft',
  protect,
  authorize('applicant'),
  saveDraft
);

router.post(
  '/:id/documents',
  protect,
  authorize('applicant'),
  handleUpload(multerUpload),    // gère multer + erreurs proprement
  uploadDocument
);

router.delete(
  '/:id/documents/:docId',
  protect,
  authorize('applicant'),
  deleteDocument
);

// ─────────────────────────────────────────────────────────────
// ROUTES ADMIN  (rôle : admin)
// ─────────────────────────────────────────────────────────────

// GET    /api/applications/admin/stats            → statistiques globales
// GET    /api/applications/admin?page=&status=    → liste paginée
// GET    /api/applications/admin/:id              → détail d'une candidature
// PATCH  /api/applications/admin/:id/status       → changer le statut
// POST   /api/applications/admin/:id/feedback     → ajouter évaluation
// PATCH  /api/applications/admin/:id/documents/:docId/status → valider doc

router.get(
  '/admin/stats',
  protect,
  authorize('admin'),
  adminStats
);

router.get(
  '/admin',
  protect,
  authorize('admin'),
  adminListApplications
);

router.get(
  '/admin/:id',
  protect,
  authorize('admin'),
  adminGetApplication
);

router.patch(
  '/admin/:id/status',
  protect,
  authorize('admin'),
  adminUpdateStatus
);

router.post(
  '/admin/:id/feedback',
  protect,
  authorize('admin'),
  adminAddFeedback
);

router.patch(
  '/admin/:id/documents/:docId/status',
  protect,
  authorize('admin'),
  adminUpdateDocStatus
);

module.exports = router;