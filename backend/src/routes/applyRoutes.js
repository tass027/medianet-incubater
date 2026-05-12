// routes/applyRoutes.js
// Monter dans app.js : app.use('/api/apply', applyRoutes);
//
// Routes exposées :
//   GET  /api/apply/form?programmeId=:id   → schéma du formulaire pour la page apply
//   POST /api/apply/submit                 → soumet la candidature

const express    = require('express');
const router     = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const upload      = require('../middlewares/uploadMiddleware'); // multer existant
const { getApplyForm, submitApplication } = require('../controllers/applyController');

// ── GET /api/apply/form?programmeId=xxx ──────────────────────────────────────
// Retourne le schéma JSON du formulaire adapté au composant DynamicField
router.get('/form', protect, getApplyForm);

// ── POST /api/apply/submit ───────────────────────────────────────────────────
// Accepte multipart/form-data (fichiers) OU JSON
// upload.any() intercepte tous les fichiers sans contrainte de nom de champ
router.post(
  '/submit',
  protect,
  upload.any(),          // multer — passe les fichiers dans req.files
  submitApplication,
);

module.exports = router;