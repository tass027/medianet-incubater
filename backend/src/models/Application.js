// src/models/Application.js
// ─────────────────────────────────────────────────────────────────
// FICHIER COMPLET — remplace l'existant
// Ajoute : BesoinSchema, SessionHistorySchema, FormationHistorySchema
// + champs besoins / sessionHistory / startupFormations dans ApplicationSchema
// ─────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Sous-schémas documents ───────────────────────────────────────
const DocumentSchema = new Schema({
  name:       { type: String, required: true },
  docType:    { type: String, default: 'other', enum: ['businessPlan','pitchDeck','financials','other'] },
  filename:   { type: String, default: '' },
  url:        { type: String, default: '' },
  uploadedAt: { type: Date,   default: Date.now },
  status:     { type: String, default: 'pending', enum: ['pending','approved','rejected'] },
}, { _id: true });

// ── Sous-schémas candidature ─────────────────────────────────────
const ProjectSchema = new Schema({
  startupName: String,
  sector:      String,
  stage:       String,
  location:    String,
  foundedYear: String,
  description: String,
  problem:     String,
  solution:    String,
  competitors: String,
  website:     String,
}, { _id: false });

const TeamSchema = new Schema({
  founderName:  String,
  founderRole:  { type: String, default: 'CEO & Co-founder' },
  founderEmail: String,
  founderBio:   String,
  teamSize:     String,
  members:      [Schema.Types.Mixed],
}, { _id: false });

const EconomySchema = new Schema({
  businessModel:  String,
  fundingGoal:    String,
  fundingRaised:  String,
  monthlyRevenue: String,
  annualRevenue:  String,
  customers:      Number,
  growthRate:     String,
  marketSize:     String,
  competitors:    String,
  traction:       String,
}, { _id: false });

// ── Besoin identifié ─────────────────────────────────────────────
const BesoinSchema = new Schema({
  category:    { type: String, default: 'autre',   enum: ['technique','commercial','financier','rh','legal','marketing','partenariat','autre'] },
  priority:    { type: String, default: 'moyenne', enum: ['critique','haute','moyenne','faible'] },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, default: 'ouvert',  enum: ['ouvert','en_cours','resolu'] },
  tags:        [String],
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
}, { _id: true });

// ── Session dans l'historique de la startup ──────────────────────
const SessionHistorySchema = new Schema({
  type:         { type: String, default: 'mentoring' },
  title:        { type: String, default: '' },
  domain:       { type: String, default: '' },
  description:  { type: String, default: '' },
  date:         { type: Date },
  time:         { type: String, default: '' },
  duration:     { type: Number, default: 60 },
  isOnline:     { type: Boolean, default: true },
  location:     { type: String, default: '' },
  meetLink:     { type: String, default: '' },
  status:       { type: String, default: 'done', enum: ['upcoming','done','cancelled','pending'] },
  notes:        { type: String, default: '' },
  outcome:      { type: String, default: '' },
  participants: { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
}, { _id: true });

// ── Formation spécifique à la startup ───────────────────────────
const FormationHistorySchema = new Schema({
  type:        { type: String, default: 'custom' },
  title:       { type: String, default: '' },
  deadline:    { type: String, default: '' },
  description: { type: String, default: '' },
  status:      { type: String, default: 'active', enum: ['active','completed','cancelled'] },
  responses:   { type: Number, default: 0 },
  total:       { type: Number, default: 1 },
  sentAt:      { type: String, default: '' },
}, { _id: true });

// ── Score IA ─────────────────────────────────────────────────────
const AiScoreSchema = new Schema({
  scores: {
    problem:  { type: Number, default: 0 },
    market:   { type: Number, default: 0 },
    team:     { type: Number, default: 0 },
    solution: { type: Number, default: 0 },
    traction: { type: Number, default: 0 },
  },
  total:       { type: Number, default: 0 },
  summary:     { type: String, default: '' },
  strengths:   [String],
  weaknesses:  [String],
  generatedAt: { type: Date },
  model:       { type: String, default: '' },
}, { _id: false });

// ── Matching ──────────────────────────────────────────────────────
const MatchItemSchema = new Schema({
  investorId:   { type: Schema.Types.Mixed },
  mentorId:     { type: Schema.Types.Mixed },
  juryId:       { type: Schema.Types.Mixed },
  investorName: String,
  mentorName:   String,
  juryName:     String,
  investorType: String,
  expertise:    [String],
  score:        { type: Number, default: 0 },
  criteria:     Schema.Types.Mixed,
  reasoning:    String,
  highlights:   [String],
  risks:        [String],
  status:       { type: String, default: 'pending', enum: ['pending','approved','rejected'] },
}, { _id: false });

const MatchingSchema = new Schema({
  investors:   [MatchItemSchema],
  mentors:     [MatchItemSchema],
  jury:        [MatchItemSchema],
  generatedAt: { type: Date },
  lastUpdated: { type: Date },
  status:      { type: String, default: 'pending', enum: ['pending','processing','completed','failed'] },
}, { _id: false });

// ════════════════════════════════════════════════════════════════
// APPLICATION SCHEMA PRINCIPAL
// ════════════════════════════════════════════════════════════════
const ApplicationSchema = new Schema(
  {
    // ── Lien utilisateur ────────────────────────────────────────
    applicant: { type: Schema.Types.ObjectId, ref: 'User' },

    // ── Programme ───────────────────────────────────────────────
    programmeId:   { type: Schema.Types.ObjectId, ref: 'Programme', default: null },
    programmeName: { type: String, default: null },
    formId:        { type: Schema.Types.ObjectId, ref: 'Form',      default: null },
    formTitle:     { type: String, default: '' },
    type:          { type: String, default: 'spontaneous', enum: ['programme','spontaneous'] },

    // ── Champs racine (compatibilité) ────────────────────────────
    startupName:  { type: String, default: '' },
    founder:      { type: String, default: '' },
    founderName:  { type: String, default: '' },
    founderEmail: { type: String, default: '' },
    email:        { type: String, default: '' },
    sector:       { type: String, default: '' },
    stage:        { type: String, default: '' },
    location:     { type: String, default: '' },
    amount:       { type: String, default: '' },
    description:  { type: String, default: '' },
    website:      { type: String, default: '' },

    // ── Champs imbriqués (pour scoring IA) ───────────────────────
    project:  { type: ProjectSchema,  default: () => ({}) },
    team:     { type: TeamSchema,     default: () => ({}) },
    economy:  { type: EconomySchema,  default: () => ({}) },

    // ── Documents ────────────────────────────────────────────────
    documents: { type: [DocumentSchema], default: [] },

    // ── Réponses formulaire ──────────────────────────────────────
    formResponses: { type: Schema.Types.Mixed, default: {} },

    // ── Scores ───────────────────────────────────────────────────
    totalScore:     { type: Number, default: null },
    detailedScores: { type: Schema.Types.Mixed, default: {} },
    adminRemarks:   { type: Schema.Types.Mixed, default: {} },
    adminDecisionRemark: { type: String, default: '' },
    aiScore:        { type: AiScoreSchema, default: () => ({}) },

    // ── Matching IA ──────────────────────────────────────────────
    matching: { type: MatchingSchema, default: () => ({}) },

    // ── Assignations manuelles ───────────────────────────────────
    assignedInvestorIds: [String],
    assignedMentorIds:   [String],
    investorIds:         [String],
    mentorIds:           [String],

    // ── Timeline incubation ──────────────────────────────────────
    timelinePhase:    { type: String, default: 'ideation' },
    timelineProgress: { type: Number, default: 20, min: 0, max: 100 },
    timelineNotes:    { type: String, default: '' },

    // ── BESOINS IDENTIFIÉS (base pour matching IA) ───────────────
    besoins: { type: [BesoinSchema], default: [] },

    // ── HISTORIQUE SESSIONS de la startup ────────────────────────
    sessionHistory: { type: [SessionHistorySchema], default: [] },

    // ── FORMATIONS SPÉCIFIQUES à la startup ──────────────────────
    startupFormations: { type: [FormationHistorySchema], default: [] },

    // ── Statut & dates ───────────────────────────────────────────
    status: {
      type: String,
      default: 'pending',
      enum: ['draft','submitted','pending','reviewing','interview','accepted','approved','rejected','paused','graduated'],
    },
    submittedAt: { type: Date },
    appliedAt:   { type: Date },
    decidedAt:   { type: Date, default: null },
    lastUpdated: { type: Date },

    // ── Jury ─────────────────────────────────────────────────────
    juryAssigned: [String],
    juryIds:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
    notified:     { type: Boolean, default: false },
    notes:        { type: String, default: '' },
    statusHistory: [Schema.Types.Mixed],
    timelineSteps: [Schema.Types.Mixed],
  },
  {
    timestamps: true,
    strict: false, // accepte des champs supplémentaires éventuels
  }
);

// ── Index ────────────────────────────────────────────────────────
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ 'project.sector': 1 });
ApplicationSchema.index({ programmeId: 1 });
ApplicationSchema.index({ applicant: 1 });
ApplicationSchema.index({ totalScore: -1 });
ApplicationSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Application ||
  mongoose.model('Application', ApplicationSchema);