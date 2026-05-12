// src/middlewares/authMiddleware.js
// ─────────────────────────────────────────────────────────────────
// Supporte :
//  - JWT_ACCESS_SECRET (ton projet)
//  - JWT_SECRET (fallback)
//  - Token depuis Authorization: Bearer header ET cookie (httpOnly)
// ─────────────────────────────────────────────────────────────────
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Détermine la clé JWT à utiliser (supporte les deux noms)
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

/**
 * Extrait le token brut depuis la requête.
 * Ordre : Authorization header → cookie → query param (dev)
 */
function extractToken(req) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const tok = authHeader.slice(7).trim();
    if (tok) return tok;
  }

  // 2. Cookie httpOnly ou JS
  if (req.cookies) {
    const tok =
      req.cookies.token        ||
      req.cookies.authToken    ||
      req.cookies.jwt          ||
      req.cookies.accessToken  ||
      req.cookies.access_token ||
      null;
    if (tok) return tok;
  }

  // 3. Query param — dev uniquement
  if (process.env.NODE_ENV !== 'production' && req.query?.token) {
    return req.query.token;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// protect
// ─────────────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant. Connectez-vous.',
        code:    'NO_TOKEN',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expirée. Reconnectez-vous.',
          code:    'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token invalide.',
        code:    'TOKEN_INVALID',
      });
    }

    // Cherche l'utilisateur — supporte id / _id / userId selon la façon dont le token a été signé
    const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token mal formé (id manquant).',
        code:    'TOKEN_MALFORMED',
      });
    }

    const user = await User.findById(userId)
      .select('-passwordHash -password -refreshTokenHash -resetCode -resetToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable.',
        code:    'USER_NOT_FOUND',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé. Contactez l'administrateur.",
        code:    'ACCOUNT_DISABLED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[protect]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// authorize(...roles)
// Vérifie req.user.role ET req.user.roles[] (tableau)
// ─────────────────────────────────────────────────────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }

    // Supporte role (string) et roles (tableau)
    const userRoles = [
      ...(Array.isArray(req.user.roles) ? req.user.roles : []),
      ...(req.user.role ? [req.user.role] : []),
    ];

    const allowed = roles.some((r) => userRoles.includes(r));

    if (!allowed) {
      return res.status(403).json({
        success:  false,
        message:  `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`,
        yourRole: req.user.role,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────
// authorizeWithMentorRole(...subRoles)
// ─────────────────────────────────────────────────────────────────
exports.authorizeWithMentorRole = (...subRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }
    const mentorRoles = req.user.mentorRoles || [];
    const hasSubRole  = subRoles.some((r) => mentorRoles.includes(r));
    if (!hasSubRole) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Sous-rôle requis : ${subRoles.join(' ou ')}.`,
        yourMentorRoles: mentorRoles,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────
// requireMentor
// ─────────────────────────────────────────────────────────────────
exports.requireMentor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux mentors.' });
  }
  next();
};