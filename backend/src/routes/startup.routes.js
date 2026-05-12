// src/routes/startup.routes.js
// Routes Startup unifiées — Candidat + Fondateur
// isFounder est calculé dynamiquement côté backend

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const router  = express.Router();

const {
  getMyProfile,
  updateProfile,
  getMyApplications,
  submitApplication,
  getApplicationStatus,
  getKPIs,
  upsertKPI,
  getMentoringData,
  bookMentoringSession,
  getInvestorMatches,
  adminListStartups,
  adminUpdateApplicationStatus,
} = require('../controllers/startupController');
const {
  getMyCandidatures,
  withdrawCandidature,
} = require('../controllers/candidaturesController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────
// MULTER — Upload documents candidature
// ─────────────────────────────────────────────────────
const safeName = (ext) => crypto.randomBytes(16).toString('hex') + ext;

const docStorage = multer.diskStorage({
  destination: 'uploads/docs/',
  filename:    (_, file, cb) => cb(null, safeName(path.extname(file.originalname))),
});

const logoStorage = multer.diskStorage({
  destination: 'uploads/logos/',
  filename:    (_, file, cb) => cb(null, safeName(path.extname(file.originalname))),
});

const docUpload = multer({
  storage:    docStorage,
  fileFilter: (_, file, cb) => cb(null, [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ].includes(file.mimetype)),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const logoUpload = multer({
  storage:    logoStorage,
  fileFilter: (_, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
  limits:     { fileSize: 2 * 1024 * 1024 },
});

// Authorize helper — accepte rôles startup + legacy
const authorizeStartup = authorize('startup', 'founder', 'applicant');
const authorizeAdmin   = authorize('admin');

// ─────────────────────────────────────────────────────
// ROUTES STARTUP (accessibles à tous les startups)
// ─────────────────────────────────────────────────────
router.get('/candidatures',     protect, authorizeStartup, getMyCandidatures);
router.delete('/candidatures/:id', protect, authorizeStartup, withdrawCandidature);
// Profil
router.get('/me',      protect, authorizeStartup, getMyProfile);
router.patch('/profile', protect, authorizeStartup, logoUpload.single('logo'), updateProfile);

// Candidatures
router.get('/applications', protect, authorizeStartup, getMyApplications);

router.post('/applications',
  protect,
  authorizeStartup,
  docUpload.fields([
    { name: 'businessPlan', maxCount: 1 },
    { name: 'pitchDeck',    maxCount: 1 },
    { name: 'financials',   maxCount: 1 },
  ]),
  submitApplication
);

router.get('/applications/:appId/status', protect, authorizeStartup, getApplicationStatus);

// ─────────────────────────────────────────────────────
// ROUTES FONDATEUR (vérifié dynamiquement côté contrôleur)
// Le middleware protect + authorizeStartup passe,
// ensuite le contrôleur vérifie checkIsFounder()
// ─────────────────────────────────────────────────────

// KPIs
router.get('/kpis',      protect, authorizeStartup, getKPIs);
router.post('/kpis',     protect, authorizeStartup, upsertKPI);

// Mentorat
router.get('/mentoring',          protect, authorizeStartup, getMentoringData);
router.post('/mentoring/sessions', protect, authorizeStartup, bookMentoringSession);

// Investisseurs
router.get('/investors', protect, authorizeStartup, getInvestorMatches);

// ─────────────────────────────────────────────────────
// ROUTES ADMIN — gestion des startups
// ─────────────────────────────────────────────────────

// Liste startups
router.get('/admin/list', protect, authorizeAdmin, adminListStartups);

// Modifier statut d'une candidature
router.patch(
  '/admin/:userId/application/:appId/status',
  protect,
  authorizeAdmin,
  adminUpdateApplicationStatus
);

module.exports = router;