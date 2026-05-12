// routes/matchingRoutes.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/matchingController');
const Investor = require('../models/Investor'); // ← manquait
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/trigger/:applicationId',          protect, authorize('admin'), ctrl.trigger);
router.post('/trigger/:applicationId/sync',     protect, authorize('admin'), ctrl.triggerSync);
router.patch('/:applicationId/validate',        protect, authorize('admin'), ctrl.validateMatch);
router.patch('/:applicationId/validate-mentor', protect, authorize('admin'), ctrl.validateMentor);
router.post('/:applicationId/send-email',       protect, authorize('admin'), ctrl.sendMatchEmail);

router.get('/candidate/:investorId', protect, authorize('admin'), async (req, res) => {
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

router.get('/:applicationId', protect, authorize('admin'), ctrl.getByApplication);

module.exports = router;