// src/routes/sessionRoutes.js
/**
 * Session Routes
 *
 * Mount in server.js / app.js :
 *   const sessionRoutes = require('./routes/sessionRoutes');
 *   app.use('/api/admin/sessions',           sessionRoutes.admin);
 *   app.use('/api/admin/mentoring-sessions', sessionRoutes.mentoring);
 *   app.use('/api/mentor',                   sessionRoutes.mentor);
 */

const express = require('express');
const ctrl    = require('../controllers/sessionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ── Admin routes ──────────────────────────────────────────────────────────────
const adminRouter = express.Router();

adminRouter.use(protect, authorize('admin'));

adminRouter
  .route('/')
  .get(ctrl.getAll)
  .post(ctrl.create);

adminRouter
  .route('/:id')
  .patch(ctrl.update)
  .delete(ctrl.remove);

// ── Mentoring-specific admin routes ───────────────────────────────────────────
const mentoringRouter = express.Router();

mentoringRouter.use(protect, authorize('admin'));

mentoringRouter.post('/',                   ctrl.createMentoring);
mentoringRouter.patch('/:id/decision',      ctrl.mentorDecision);

// ── Mentor self-service routes ────────────────────────────────────────────────
const mentorRouter = express.Router();

mentorRouter.use(protect, authorize('mentor'));

mentorRouter.get('/sessions',               ctrl.getMentorSessions);
mentorRouter.patch('/sessions/:id/decision',ctrl.mentorDecision);
mentorRouter.post('/sessions', ctrl.mentorCreate);

module.exports = {
  admin:     adminRouter,
  mentoring: mentoringRouter,
  mentor:    mentorRouter,
};