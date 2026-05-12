// src/middlewares/uploadMiddleware.js
// Compatible avec ta structure existante : uploads/logos/, uploads/cvs/
// Ajoute : uploads/documents/ pour les pièces jointes des candidatures

const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');
const fs     = require('fs');

// ─── Helper : créer le dossier si inexistant ──────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ─── Nom de fichier sécurisé ──────────────────────────────────
const safeName = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  return crypto.randomBytes(16).toString('hex') + ext;
};

// ─── Types autorisés pour les documents de candidature ────────
const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': true,
  'application/vnd.ms-powerpoint': true,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
  'application/vnd.ms-excel': true,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
};

// ─── Storage : documents de candidature ───────────────────────
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/documents');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, safeName(file.originalname));
  },
});

const documentFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Type non autorisé : ${file.mimetype}`), false);
  }
};

// ─── Upload instance pour .any() (tous les fichiers) ────────────
const uploadInstance = multer({
  storage:    documentStorage,
  fileFilter: documentFilter,
  limits:     { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

// ─── Middleware wrapper avec gestion erreur Multer ────────────
// Utilisé dans les routes pour avoir un try/catch propre
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Fichier trop volumineux. Maximum : 20 MB.' });
      }
      return res.status(400).json({ message: `Erreur upload : ${err.message}` });
    }
    // Erreur custom (fileFilter)
    return res.status(400).json({ message: err.message || "Erreur lors de l'upload." });
  });
};

// ─── Helper : taille lisible ─────────────────────────────────
const readableSize = (bytes) => {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Export : instance multer par défaut + propriétés nommées ───
uploadInstance.uploadDocument = uploadInstance.single('file');
uploadInstance.handleUpload = handleUpload;
uploadInstance.readableSize = readableSize;

module.exports = uploadInstance;