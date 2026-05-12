// routes/formRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  sendForm,
  getFormResponses,
  submitFormResponse,
  deleteFormResponse,
  getFormStats,
} = require('../controllers/formController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Stats (before :id to avoid route conflict)
router.get('/stats', protect, authorize('admin'), getFormStats);

// CRUD
router.get('/',    protect, authorize('admin'), getAllForms);
router.post('/',   protect, authorize('admin'), createForm);
router.get('/:id', protect, getAllForms.length > 0 ? authorize('admin') : (req,res,next)=>next(), getFormById);
router.put('/:id', protect, authorize('admin'), updateForm);
router.delete('/:id', protect, authorize('admin'), deleteForm);

// Send form to recipients
router.patch('/:id/send', protect, authorize('admin'), sendForm);

// Responses
router.get('/:id/responses',          protect,                       getFormResponses);
router.post('/:id/responses',         protect,                       submitFormResponse);
router.delete('/:id/responses/:responseId', protect, authorize('admin'), deleteFormResponse);

module.exports = router;