const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const { body } = require('express-validator');
const router  = express.Router();

const {
  loginController,
  refreshController,
  logoutController,
  registerStartupController,
  registerFounderController,
  registerApplicantController,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  loginValidation,
  founderValidation,
  applicantValidation,
  startupValidation,
  checkValidation,
  forgotPasswordController,
  verifyCodeController,
  resetPasswordController,
  approveAccountController,
  resetPasswordValidation,
  verifyEmailController,
  approveAccountDirectController,
  rejectAccountDirectController,
  getCurrentUserController,
  loginHistoryController,
} = require('../controllers/authController');

// Import du middleware d'authentification
const { protect, authorize } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────
// MULTER — Upload sécurisé
// ─────────────────────────────────────────────────────
const safeName = (ext) => crypto.randomBytes(16).toString('hex') + ext;

const logoStorage = multer.diskStorage({
  destination: 'uploads/logos/',
  filename:    (_, file, cb) => cb(null, safeName(path.extname(file.originalname))),
});

const cvStorage = multer.diskStorage({
  destination: 'uploads/cvs/',
  filename:    (_, file, cb) => cb(null, safeName(path.extname(file.originalname))),
});

const logoUpload = multer({
  storage:    logoStorage,
  fileFilter: (_, file, cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)),
  limits:     { fileSize: 2 * 1024 * 1024 },
});

const cvUpload = multer({
  storage:    cvStorage,
  fileFilter: (_, file, cb) => cb(null, [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(file.mimetype)),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─────────────────────────────────────────────────────
// ROUTES PUBLIQUES
// ─────────────────────────────────────────────────────

router.post('/login',
  loginLimiter,
  loginValidation,
  checkValidation,
  loginController
);

router.post('/register/startup',
  registerLimiter,
  startupValidation,
  checkValidation,
  registerStartupController
);

router.post('/register/founder',
  registerLimiter,
  founderValidation,           // ✅ sans multer
  checkValidation,
  registerFounderController
);

router.post('/register/applicant',
  registerLimiter,
  cvUpload.single('cv'),
  applicantValidation,
  checkValidation,
  registerApplicantController
);

router.post('/refresh', refreshLimiter, refreshController);
router.post('/logout', logoutController);

router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  checkValidation,
  forgotPasswordController
);

router.post('/verify-code', verifyCodeController);

router.post('/reset-password',
  resetPasswordValidation,
  checkValidation,
  resetPasswordController
);

router.get('/verify-email', verifyEmailController);

// ─────────────────────────────────────────────────────
// ROUTES PROTÉGÉES
// ─────────────────────────────────────────────────────

router.get('/me',
  protect,
  getCurrentUserController
);

router.get('/login-history/:userId',
  protect,
  authorize('admin'),
  loginHistoryController
);

module.exports = router;