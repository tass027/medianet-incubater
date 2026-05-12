const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────
const LoginHistorySchema = new mongoose.Schema({
  ip:        { type: String },
  userAgent: { type: String },
  status:    { type: String, enum: ['success', 'failed'] },
  date:      { type: Date, default: Date.now },
});

const TimelineStepSchema = new mongoose.Schema({
  step:   { type: String, required: true },
  status: { type: String, enum: ['pending', 'active', 'done', 'rejected'], default: 'pending' },
  label:  { type: String },
  note:   { type: String },
  date:   { type: Date },
}, { _id: false });

const ApplicationSchema = new mongoose.Schema({
  programmeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Programme', default: null },
  programmeName:  { type: String },
  type:           { type: String, enum: ['spontaneous', 'programme'], default: 'spontaneous' },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'waitlist'],
    default: 'pending',
  },
  formResponses:  { type: mongoose.Schema.Types.Mixed, default: {} },
  timelineSteps:  { type: [TimelineStepSchema], default: [] },
  assignedJury:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedMentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  juryScores:     [{ juryId: mongoose.Schema.Types.ObjectId, score: Number, comment: String, submittedAt: Date }],
  aiScore: {
    scores: {
      problem:  Number,
      market:   Number,
      team:     Number,
      solution: Number,
      traction: Number,
    },
    total:       Number,
    summary:     String,
    strengths:   [String],
    weaknesses:  [String],
    generatedAt: Date,
    model:       { type: String, default: 'claude-sonnet-4-20250514' },
  },
  interviews: [{
    scheduledAt: Date,
    note:        String,
    result:      { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
  }],
  decidedAt: { type: Date },
  appliedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

const KpiEntrySchema = new mongoose.Schema({
  month:    { type: String },
  revenue:  { type: Number, default: 0 },
  teamSize: { type: Number, default: 0 },
  users:    { type: Number, default: 0 },
  mrr:      { type: Number, default: 0 },
  note:     { type: String },
}, { _id: false });

// ─────────────────────────────────────────────
// Main User Schema
// ─────────────────────────────────────────────
const UserSchema = new mongoose.Schema({

  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  /**
   * RÔLES:
   *  - 'startup'  : espace unifié (ex-founder + ex-applicant). isFounder est un virtual.
   *  - 'admin'    : staff interne
   *  - 'mentor'   : staff interne
   *  - 'jury'     : externe temporaire
   *  - 'investor' : catalogue investisseurs
   *  - 'support'  : support chatbot humain
   *
   * MIGRATION: Les anciens rôles 'founder' et 'applicant' sont redirigés vers 'startup'
   * via resolveRole() dans ProtectedRoute. Migrer les documents en base vers role='startup'.
   */
  role: {
    type: String,
    // On garde 'founder' et 'applicant' dans l'enum pendant la période de migration
    enum: ['startup', 'founder', 'applicant', 'admin', 'mentor', 'jury', 'investor', 'support'],
    required: true,
  },

  isActive:         { type: Boolean, default: false },
  isApproved:       { type: Boolean, default: false },
  isEmailVerified:  { type: Boolean, default: false },
  isFounder:        { type: Boolean, default: false }, // ← Physical field (overrides the virtual calculation)
  refreshTokenHash: { type: String,  default: null },
  lastLoginAt:      { type: Date,    default: null },

  emailVerifyToken:        { type: String, default: null },
  emailVerifyTokenExpires: { type: Date,   default: null },

  resetCode:         { type: String,  default: null },
  resetCodeExpires:  { type: Date,    default: null },
  resetCodeVerified: { type: Boolean, default: false },
  resetToken:        { type: String,  default: null },

  loginHistory: [LoginHistorySchema],

  // ── Profil Startup ──────────────────────────────────────────────────
  startupProfile: {
    startupName:  { type: String },
    uniqueId:     { type: String },
    sector:       { type: String },
    stage:        { type: String, enum: ['idea', 'mvp', 'launched', 'scaling'] },
    website:      { type: String },
    linkedin:     { type: String },
    description:  { type: String },
    logoUrl:      { type: String },
    teamSize:     { type: Number },
    location:     { type: String },
    foundedYear:  { type: Number },
  },

  // ── Candidatures (un objet par candidature) ─────────────────────────
  // isFounder = applications.some(a => a.status === 'accepted')
  applications: { type: [ApplicationSchema], default: [] },

  // ── Matching suggestions (générées par AI) ──────────────────────────
  matchingSuggestions: {
    investors: [{
      investorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score:            Number,
      reason:           String,
      validatedByAdmin: { type: Boolean, default: false },
      generatedAt:      Date,
    }],
    mentors: [{
      mentorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score:           Number,
      reason:          String,
      assignedByAdmin: { type: Boolean, default: false },
      generatedAt:     Date,
    }],
  },

  // ── Mentor specific fields (NOUVEAUX CHAMPS CORRIGÉS) ─────────────────
  
  // Startups assignées par l'admin à ce mentor (CORRIGÉ : référence vers Application)
  assignedStartups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  }],

  // Double rôle mentor/jury (NOUVEAU)
  mentorRoles: {
    type: [String],
    enum: ['mentor', 'jury'],
    default: [],
  },

  // ── KPIs (UNIQUE définition conservée) ──────────────────────────────
  kpis: { type: [KpiEntrySchema], default: [] },

}, { timestamps: true });

// ─────────────────────────────────────────────
// Virtual: isFounder
// DEPRECATED: Use the physical field instead
// true si le rôle est 'startup' (ou alias legacy) ET au moins 1 candidature acceptée
// OU si isFounder est défini explicitement
// ─────────────────────────────────────────────
UserSchema.virtual('isFounder_computed').get(function () {
  const startupRoles = ['startup', 'founder', 'applicant'];
  if (!startupRoles.includes(this.role)) return false;
  return this.applications?.some(a => a.status === 'accepted') ?? false;
});

UserSchema.set('toJSON',   { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// ─────────────────────────────────────────────
// Methods
// ─────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.validatePasswordStrength = function (password) {
  const errors = [];
  if (password.length < 8)                             errors.push('minimum 8 caractères');
  if (!/[A-Z]/.test(password))                         errors.push('au moins une majuscule');
  if (!/[a-z]/.test(password))                         errors.push('au moins une minuscule');
  if (!/[0-9]/.test(password))                         errors.push('au moins un chiffre');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))        errors.push('au moins un caractère spécial');
  if (/\s/.test(password))                              errors.push("ne doit pas contenir d'espaces");
  return {
    isValid:   errors.length === 0,
    errors,
    strength:  errors.length === 0 ? 'fort' : errors.length <= 2 ? 'moyen' : 'faible',
  };
};

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
UserSchema.index({ role: 1 });
UserSchema.index({ 'applications.status': 1 });
UserSchema.index({ 'applications.programmeId': 1 });
UserSchema.index({ mentorRoles: 1 }); // NOUVEAU : index pour les requêtes sur mentorRoles

module.exports = mongoose.model('User', UserSchema);