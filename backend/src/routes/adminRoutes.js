const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

const adminController       = require('../controllers/adminController');
const programmeController   = require('../controllers/programmeController');
const adminStartupsController = require('../controllers/adminStartupsController');
const adminMentorController   = require('../controllers/adminMentorController');
const { getByProgramme }    = require('../controllers/adminEvaluationController');
const { getByProgramme: getDecisionsByProgramme, saveDecision } = require('../controllers/adminDecisionController');

// ── Investor controller (inline si pas de fichier dédié) ─────────────────────
const Investor = require('../models/Investor');
const getInvestors = async (req, res) => {
  try {
    const investors = await Investor.find({}).lean();
    res.json({ success: true, data: investors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.use(protect, authorize('admin'));

// ── Dashboard stats ───────────────────────────────────────────────────────────
router.get('/stats', adminController.getDashboardStats);

// ── Applications ──────────────────────────────────────────────────────────────
router.get('/applications',                                   adminController.getAllApplications);
router.get('/applications/:userId/:applicationId',            adminController.getApplicationDetail);
router.put('/applications/:userId/:applicationId/status',     adminController.updateApplicationStatus);
router.put('/applications/:userId/:applicationId/evaluation', adminController.updateApplicationEvaluation);

// ── Startups (CRUD complet) ───────────────────────────────────────────────────
router.get('/startups',                                        adminStartupsController.getAll);
router.get('/startups/:id',                                    adminStartupsController.getOne);
router.patch('/startups/:id/assign',                           adminStartupsController.assign);
router.patch('/startups/:id/timeline',                         adminStartupsController.updateTimeline);
router.patch('/startups/:id/besoins',                          adminStartupsController.updateBesoins);
router.post('/startups/:id/session-history',                   adminStartupsController.addSessionHistory);
router.delete('/startups/:id/session-history/:sessionId',      adminStartupsController.removeSessionHistory);
router.post('/startups/:id/formations',                        adminStartupsController.addFormation);
router.delete('/startups/:id/formations/:formationId',         adminStartupsController.removeFormation);
router.post('/startups/:id/ai-matching/generate',              adminStartupsController.generateAiMatching);
router.patch('/startups/:id/ai-matching/:matchId',             adminStartupsController.updateAiMatch);
router.get('/startups/:id/ai-matching',                        adminStartupsController.getAiMatches);

// ── Investors ─────────────────────────────────────────────────────────────────
router.get('/investors', getInvestors);

// ── Mentors ───────────────────────────────────────────────────────────────────
router.get('/mentors', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Mentor = mongoose.models.Mentor
      || mongoose.model('Mentor', new mongoose.Schema({}, { strict: false, collection: 'mentors' }));
    
    const mentors = await Mentor.find({}).sort({ name: 1 }).lean();
    console.log('[/mentors] count:', mentors.length); // ← log
    res.json({ success: true, data: mentors });
  } catch (err) {
    console.error('[/mentors] ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/mentors/jury',      adminMentorController.getMentorsWithJuryRole);
router.get('/mentors/stats',     adminMentorController.getMentorStats);
router.get('/mentors/:id',       adminMentorController.getMentorById);
router.post('/mentors/:id/assign-startup',              adminMentorController.assignStartup);
router.delete('/mentors/:id/unassign-startup/:startupId', adminMentorController.unassignStartup);
router.patch('/mentors/:id/roles', adminMentorController.manageMentorRole);

// ── Programmes ────────────────────────────────────────────────────────────────
router.get('/programmes/:id/evaluations', getByProgramme);
router.get('/programmes',                 programmeController.getAllProgrammes);
router.post('/programmes',                programmeController.createProgramme);
router.get('/programmes/:id',             programmeController.getProgramme);
router.put('/programmes/:id',             programmeController.updateProgramme);
router.delete('/programmes/:id',          programmeController.deleteProgramme);
router.patch('/programmes/:id/status',    programmeController.updateStatus);
router.get('/programmes/:id/decisions',   getDecisionsByProgramme);
router.post('/programmes/:id/decisions',  saveDecision);

module.exports = router;