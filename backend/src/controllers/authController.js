const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const { body, validationResult } = require('express-validator');
const User       = require('../models/User');

const {
  sendResetCode,
  sendAdminApprovalRequest,
  sendAccountApproved,
  sendAccountRejected,
  sendEmailVerification,
} = require('../config/mailer');

// ─────────────────────────────────────────────────────
// RATE LIMITERS (DÉSACTIVÉS POUR LE DÉVELOPPEMENT)
// ─────────────────────────────────────────────────────
const bypassLimiter = (req, res, next) => { next(); };

exports.loginLimiter    = bypassLimiter;
exports.registerLimiter = bypassLimiter;
exports.refreshLimiter  = bypassLimiter;

// ─────────────────────────────────────────────────────
// VALIDATION DU MOT DE PASSE
// ─────────────────────────────────────────────────────
const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8)                 errors.push('Minimum 8 caractères');
  if (password && !/[A-Z]/.test(password))              errors.push('Au moins une lettre majuscule');
  if (password && !/[a-z]/.test(password))              errors.push('Au moins une lettre minuscule');
  if (password && !/[0-9]/.test(password))              errors.push('Au moins un chiffre');
  if (password && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Au moins un caractère spécial');
  if (password && /\s/.test(password))                  errors.push("Ne doit pas contenir d'espaces");
  return {
    isValid:  errors.length === 0,
    errors,
    strength: !password ? 'weak' : errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak',
  };
};

// ─────────────────────────────────────────────────────
// VALIDATION INSCRIPTION STARTUP (unifié)
// ─────────────────────────────────────────────────────
exports.startupValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email')
    .isEmail().withMessage("Format d'email invalide").normalizeEmail()
    .custom(async (email) => {
      const existing = await User.findOne({ email });
      if (existing) throw new Error('Cet email est déjà utilisé');
      return true;
    }),
  body('password')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .custom((value) => {
      const { isValid, errors } = validatePassword(value);
      if (!isValid) { const e = new Error(JSON.stringify(errors)); e.errorsList = errors; throw e; }
      return true;
    }),
];

// ─────────────────────────────────────────────────────
// VALIDATION INSCRIPTION CANDIDAT (legacy)
// ─────────────────────────────────────────────────────
exports.applicantValidation = exports.startupValidation;

// ─────────────────────────────────────────────────────
// VALIDATION INSCRIPTION FONDATEUR (legacy)
// ─────────────────────────────────────────────────────
exports.founderValidation = [
  ...exports.startupValidation,
  body('startupName').trim().notEmpty().withMessage('Le nom de la startup est requis'),
  body('uniqueId').trim().notEmpty().withMessage("L'ID unique est requis"),
  body('sector').notEmpty().withMessage('Le secteur est requis'),
  body('stage').isIn(['idea', 'mvp', 'launched', 'scaling']).withMessage('Stage invalide'),
];

exports.loginValidation = [
  body('email').isEmail().withMessage("Format d'email invalide").normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

exports.resetPasswordValidation = [
  body('email').isEmail().withMessage("Format d'email invalide").normalizeEmail(),
  body('newPassword').isLength({ min: 8 }).custom((value) => {
    const { isValid, errors } = validatePassword(value);
    if (!isValid) { const e = new Error(JSON.stringify(errors)); e.errorsList = errors; throw e; }
    return true;
  }),
  body('resetToken').notEmpty().withMessage('Token de réinitialisation requis'),
];

exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    const allErrors   = [];
    errors.array().forEach(err => {
      let msgs = [];
      if (err.msg?.startsWith('[')) { try { msgs = JSON.parse(err.msg); } catch { msgs = [err.msg]; } }
      else { msgs = [err.msg]; }
      if (!fieldErrors[err.path]) fieldErrors[err.path] = [];
      fieldErrors[err.path].push(...msgs);
      allErrors.push(...msgs);
    });
    return res.status(422).json({ message: 'Erreur de validation', errors: fieldErrors, details: allErrors });
  }
  next();
};

// ─────────────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────────────
const signAccessToken  = (payload) => jwt.sign(payload, process.env.JWT_ACCESS_SECRET,  { expiresIn: '15m' });
const signRefreshToken = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d'  });

const setRefreshCookie = (res, token) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/auth/refresh',
  });
};

const setSessionCookie = (res, user) => {
  const payload = Buffer.from(JSON.stringify({ role: user.role, id: user._id })).toString('base64');
  const sig = crypto.createHmac('sha256', process.env.COOKIE_SECRET).update(payload).digest('base64url');
  res.cookie('auth_session', `${payload}.${sig}`, {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

// ─────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────
exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip        = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const user = await User.findOne({ email });
    if (!user) {
      await bcrypt.hash('dummy', 10);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginHistory.push({ ip, userAgent, status: 'failed' });
      await user.save();
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.isEmailVerified) return res.status(403).json({ message: 'Veuillez vérifier votre email avant de vous connecter.' });
    if (!user.isActive)        return res.status(403).json({ message: "Compte en attente d'approbation." });

    const effectiveRole = ['founder', 'applicant'].includes(user.role) ? 'startup' : user.role;

    const accessToken  = signAccessToken({ id: user._id, role: effectiveRole, email: user.email });
    const refreshToken = signRefreshToken({ id: user._id });

    user.loginHistory.push({ ip, userAgent, status: 'success' });
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.lastLoginAt      = new Date();
    await user.save();

    setRefreshCookie(res, refreshToken);
    setSessionCookie(res, { ...user.toObject(), role: effectiveRole });

    // ✅ Inclure isFounder dans la réponse
    const userData = user.toJSON();

    // Dans loginController — remplacer le return final :
    return res.status(200).json({
      accessToken,
      user: {
        id:             user._id,
        name:           user.name,
        email:          user.email,
        role:           effectiveRole,
        mentorRoles:    user.mentorRoles || [],   // ← AJOUTER
        isFounder:      userData.isFounder,
        startupProfile: userData.startupProfile,
        applications:   userData.applications?.map(app => ({
          programmeName: app.programmeName,
          status:        app.status,
          appliedAt:     app.appliedAt
        }))
      },
    });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /auth/register/startup (NOUVEAU ENDPOINT UNIFIÉ)
// ─────────────────────────────────────────────────────
exports.registerStartupController = async (req, res) => {
  try {
    const { name, email, password, startupName, sector, stage, website, description } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const logoUrl      = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const user = await User.create({
      name, email, passwordHash,
      role:       'startup',
      isActive:   true,
      isApproved: true,
      startupProfile: {
        startupName:  startupName  || null,
        sector:       sector       || null,
        stage:        stage        || null,
        website:      website      || null,
        description:  description  || null,
        logoUrl,
      },
    });

    const emailToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken        = emailToken;
    user.emailVerifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailToken}&email=${user.email}`;
    await sendEmailVerification(user.email, user.name, verifyUrl);
    await sendAdminApprovalRequest(user);

    return res.status(201).json({
      message: "Compte créé. Vérifiez votre email pour activer votre compte.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[registerStartup]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /auth/register/founder (LEGACY)
// ─────────────────────────────────────────────────────
exports.registerFounderController = async (req, res) => {
  req.body._legacyRole = 'founder';
  return exports.registerStartupController(req, res);
};

// ─────────────────────────────────────────────────────
// POST /auth/register/applicant (LEGACY)
// ─────────────────────────────────────────────────────
exports.registerApplicantController = async (req, res) => {
  req.body._legacyRole = 'applicant';
  return exports.registerStartupController(req, res);
};

// ─────────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────────
exports.refreshController = async (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ message: 'Session expirée.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user || !user.refreshTokenHash) return res.status(401).json({ message: 'Session invalide.' });

    const isValid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isValid) {
      user.refreshTokenHash = null;
      await user.save();
      res.clearCookie('refresh_token');
      res.clearCookie('auth_session');
      return res.status(401).json({ message: 'Session compromise. Reconnectez-vous.' });
    }

    const effectiveRole = ['founder', 'applicant'].includes(user.role) ? 'startup' : user.role;

    const newAccessToken  = signAccessToken({ id: user._id, role: effectiveRole, email: user.email });
    const newRefreshToken = signRefreshToken({ id: user._id });
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    setRefreshCookie(res, newRefreshToken);
    setSessionCookie(res, { ...user.toObject(), role: effectiveRole });

    // ✅ Inclure isFounder dans la réponse
    const userData = user.toJSON();

        // Dans refreshController — même chose :
    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id:             user._id,
        name:           user.name,
        email:          user.email,
        role:           effectiveRole,
        mentorRoles:    user.mentorRoles || [],   // ← AJOUTER
        isFounder:      userData.isFounder,
        startupProfile: userData.startupProfile,
        applications:   userData.applications?.map(app => ({
          programmeName: app.programmeName,
          status:        app.status,
          appliedAt:     app.appliedAt
        }))
      },
    });
  } catch (err) {
    res.clearCookie('refresh_token');
    res.clearCookie('auth_session');
    return res.status(401).json({ message: 'Session expirée.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────────
exports.logoutController = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
      } catch { /* token expiré */ }
    }
  } finally {
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    res.clearCookie('auth_session');
    return res.status(200).json({ message: 'Déconnecté.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────────────
exports.forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'Si cet email existe, un code a été envoyé.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode         = await bcrypt.hash(code, 10);
    user.resetCodeExpires  = new Date(Date.now() + 10 * 60 * 1000);
    user.resetCodeVerified = false;
    user.resetToken        = null;
    await user.save();

    await sendResetCode(user.email, code, user.name);
    return res.status(200).json({ message: 'Code envoyé par email.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /auth/verify-code
// ─────────────────────────────────────────────────────
exports.verifyCodeController = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetCode)              return res.status(400).json({ message: 'Demande invalide.' });
    if (user.resetCodeExpires < new Date())    return res.status(400).json({ message: 'Code expiré. Refaites une demande.' });
    const isMatch = await bcrypt.compare(code, user.resetCode);
    if (!isMatch) return res.status(400).json({ message: 'Code incorrect.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetCodeVerified = true;
    user.resetToken        = resetToken;
    await user.save();
    return res.status(200).json({ message: 'Code vérifié.', resetToken });
  } catch (err) {
    console.error('[verifyCode]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /auth/reset-password
// ─────────────────────────────────────────────────────
exports.resetPasswordController = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const { isValid, errors, strength } = validatePassword(newPassword);
    if (!isValid) return res.status(422).json({ message: 'Mot de passe invalide', errors, strength });

    const user = await User.findOne({ email });
    if (!user || !user.resetCodeVerified || user.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Session de réinitialisation invalide' });
    }

    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) return res.status(422).json({ message: "Le nouveau mot de passe doit être différent de l'ancien" });

    user.passwordHash       = await bcrypt.hash(newPassword, 12);
    user.resetCode          = null;
    user.resetCodeExpires   = null;
    user.resetCodeVerified  = false;
    user.resetToken         = null;
    user.refreshTokenHash   = null;
    await user.save();

    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.', strength });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};


// ─────────────────────────────────────────────────────
// GET /auth/verify-email
// ─────────────────────────────────────────────────────
exports.verifyEmailController = async (req, res) => {
  try {
    const { token, email } = req.query;
    const user = await User.findOne({ email });
    if (!user || !user.emailVerifyToken)           return res.status(400).json({ message: 'Lien invalide.' });
    if (user.emailVerifyTokenExpires < new Date())  return res.status(400).json({ message: 'Lien expiré. Réinscrivez-vous.' });
    if (user.emailVerifyToken !== token)            return res.status(400).json({ message: 'Token invalide.' });

    user.isEmailVerified         = true;
    user.emailVerifyToken        = null;
    user.emailVerifyTokenExpires = null;
    await user.save();
    return res.status(200).json({ message: 'Email vérifié avec succès.' });
  } catch (err) {
    console.error('[verifyEmail]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
// ─────────────────────────────────────────────────────
// GET /auth/me (NOUVEAU)
// ─────────────────────────────────────────────────────
exports.getCurrentUserController = async (req, res) => {
  try {
    // req.user est attaché par le middleware protect
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const userData = user.toJSON();
    const effectiveRole = ['founder', 'applicant'].includes(user.role) ? 'startup' : user.role;

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: effectiveRole,
        isFounder: userData.isFounder,
        startupProfile: userData.startupProfile,
        applications: userData.applications
      }
    });
  } catch (err) {
    console.error('[getCurrentUser]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /auth/login-history/:userId (NOUVEAU)
// ─────────────────────────────────────────────────────
exports.loginHistoryController = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('loginHistory name email');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    const history = user.loginHistory.sort((a, b) => b.date - a.date).slice(0, 20);
    return res.status(200).json({ user: { id: user._id, name: user.name, email: user.email }, history });
  } catch (err) {
    console.error('[loginHistory]', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};