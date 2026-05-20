// routes/matchingRoutes.js
// CORRECTION : ordre des routes fixé (routes spécifiques AVANT routes paramétrées)
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/matchingController');
const Investor = require('../models/Investor');
const { protect, authorize } = require('../middlewares/authMiddleware');

const adminAuth = [protect, authorize('admin')];

// ── Routes fixes (DOIVENT être avant les routes paramétrées /:applicationId) ──

// POST /api/matching/rematch-all
router.post('/rematch-all', ...adminAuth, ctrl.rematchAll);

// GET /api/matching/candidate/:investorId
router.get('/candidate/:investorId', ...adminAuth, async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.investorId);
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investisseur introuvable' });
    }
    const data = (investor.matches || []).map((m) => ({
      applicationId: m._id,
      startupName:   m.nom,
      score:         m.score,
      status:
        m.statut === 'validé'  ? 'approved' :
        m.statut === 'rejeté'  ? 'rejected' : 'pending',
      sector:    null,
      reasoning: null,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Routes paramétrées /:applicationId ────────────────────────────────────────

// POST /api/matching/trigger/:applicationId        → asynchrone (réponse immédiate)
router.post('/trigger/:applicationId',      ...adminAuth, ctrl.trigger);

// POST /api/matching/trigger/:applicationId/sync  → synchrone (attend le résultat)
router.post('/trigger/:applicationId/sync', ...adminAuth, ctrl.triggerSync);

// PATCH /api/matching/:applicationId/validate         → valider/rejeter un investisseur
router.patch('/:applicationId/validate',        ...adminAuth, ctrl.validateMatch);

// PATCH /api/matching/:applicationId/validate-mentor  → valider/rejeter un mentor
router.patch('/:applicationId/validate-mentor', ...adminAuth, ctrl.validateMentor);

// POST /api/matching/:applicationId/send-email        → envoyer email de mise en relation
router.post('/:applicationId/send-email',       ...adminAuth, ctrl.sendMatchEmail);

// GET /api/matching/:applicationId  → lecture des matches (EN DERNIER — route générique)
router.get('/:applicationId', ...adminAuth, ctrl.getByApplication);

module.exports = router;