// routes/startupsProgrammesRoutes.js

const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getProgrammes,
  getProgrammeDetail,
  getMyApplicationIds,
  getRelatedProgrammes,
} = require('../controllers/startupsProgrammesController');

// ── IMPORTANT : les routes statiques AVANT les routes paramétriques ───────────

// GET /api/startups-programmes
router.get('/', protect, getProgrammes);

// GET /api/startups-programmes/my-applications   ← doit être avant /:idOrSlug
router.get('/my-applications', protect, getMyApplicationIds);

// GET /api/startups-programmes/:idOrSlug          ← accepte ObjectId ou slug
router.get('/:idOrSlug', protect, getProgrammeDetail);

// GET /api/startups-programmes/:idOrSlug/related
router.get('/:idOrSlug/related', protect, getRelatedProgrammes);

module.exports = router;