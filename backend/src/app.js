// src/app.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const path         = require('path');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes              = require('./routes/authRoutes');
const applicationRoutes       = require('./routes/applicationRoutes');
const applicationAdminRoutes  = require('./routes/applicationAdminRoutes');
const applyRoutes             = require('./routes/applyRoutes');
const notificationRoutes      = require('./routes/notificationRoutes');
const startupRoutes           = require('./routes/startup.routes');
const juryRoutes              = require('./routes/juryRoutes');
const jurySpaceRoutes         = require('./routes/jurySpaceRoutes');
const programmeRoutes         = require('./routes/programmeRoutes');
const formRoutes              = require('./routes/formRoutes');
const evaluationRoutes        = require('./routes/evaluationRoutes');
const aiScoringRoutes         = require('./routes/aiScoringRoutes');
const matchingRoutes          = require('./routes/matchingRoutes');
const investorRoutes          = require('./routes/investorRoutes');
const mentorRoutes            = require('./routes/mentorRoutes');
const adminStartupsRoutes     = require('./routes/adminStartupsRoutes');
const sessionRoutes           = require('./routes/sessionRoutes');
const adminMentorRoutes       = require('./routes/adminMentorRoutes');
const adminUsersRoutes        = require('./routes/adminUsersRoutes');
const adminRolesRoutes        = require('./routes/adminRolesRoutes');
const adminDashboardRoutes    = require('./routes/adminDashboardRoutes');
const adminEvaluationRoutes   = require('./routes/adminEvaluationRoutes'); // ✅ AJOUT
const candidaturesRoutes = require('./routes/candidaturesRoutes');
const startupsProgrammesRoutes = require('./routes/startupsProgrammesRoutes');
const matchRoutes             = require('./routes/matchroutes');
const mentorMatchRoutes       = require('./routes/mentorMatchRoutes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────

// Auth
app.use('/auth', authRoutes);

// Applications — admin BEFORE generic
app.use('/api/applications/admin', applicationAdminRoutes);
app.use('/api/applications',       applicationRoutes);
app.use('/api/apply',              applyRoutes);

// Jury
app.use('/api/jury',       juryRoutes);
app.use('/api/jury-space', jurySpaceRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Startup — specific routes BEFORE the generic /api/startup prefix
// ⚠️ L'ordre est critique : les routes spécifiques doivent précéder /api/startup
app.use('/api/startup/candidatures',   candidaturesRoutes);
app.use('/api/startup/matches',        matchRoutes);
app.use('/api/startup/mentor-matches', mentorMatchRoutes);
app.use('/api/startup',                startupRoutes); // ← doit rester en dernier

// Programmes
app.use('/api/admin/programmes',    programmeRoutes);
app.use('/api/programmes',          programmeRoutes);
app.use('/api/startups-programmes', startupsProgrammesRoutes);

// Forms & Evaluations
app.use('/api/forms',       formRoutes);
app.use('/api/evaluations', evaluationRoutes);

// AI
app.use('/ai-scoring',   aiScoringRoutes);
app.use('/api/matching', matchingRoutes);

// Investors
app.use('/api/investors', investorRoutes);

// Admin — Startups
app.use('/api/admin/startups', adminStartupsRoutes);

// Admin — Mentors
app.use('/api/admin/mentors', adminMentorRoutes);

// Admin — Users & Roles
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/roles', adminRolesRoutes);

// Admin — Dashboard
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Admin — Evaluations ✅ AJOUT — route manquante qui causait le 404
app.use('/api/admin/evaluations', adminEvaluationRoutes);

// Sessions — admin routes
app.use('/api/admin/sessions',           sessionRoutes.admin);
app.use('/api/admin/mentoring-sessions', sessionRoutes.mentoring);

// Mentor (self-service) — AFTER admin routes to avoid collision
app.use('/api/mentor', mentorRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur interne.' });
});

module.exports = app;