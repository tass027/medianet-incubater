// src/models/Programme.js
const mongoose = require('mongoose');

const ProgrammeSchema = new mongoose.Schema({
  titre:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  sector:      { type: String, default: 'Tous secteurs' },
  status: {
    type:    String,
    enum:    ['draft', 'published', 'closed', 'scheduled'],
    default: 'draft',
  },
  dateDebut:        { type: Date },
  dateFin:          { type: Date },
  quota:            { type: Number, default: null },
  formulaire:       { type: String, default: '' },

  // ── Lien vers le formulaire spécifique au programme ───────────────────────
  // Était: { type: mongoose.Schema.Types.ObjectId, default: null } sans ref
  // Corrigé: ref: 'Form' pour permettre .populate('formulaireId')
  formulaireId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Form',
    default: null,
  },

  jury:             [{ type: String }],
  juryIds:          [{ type: mongoose.Schema.Types.ObjectId }],
  objectives:       [{ type: String }],
  criteria:         [{ type: String }],
  scheduledPublish: { type: Date, default: null },

  // ── Médias ──────────────────────────────────────────────────────────────
  image: { type: String, default: null },
  logo:  { type: String, default: null },

  // ── Phases ──────────────────────────────────────────────────────────────
  phases: [{
    label:       { type: String },
    nom:         { type: String },
    date:        { type: String },
    dateDebut:   { type: Date },
    dateFin:     { type: Date },
    done:        { type: Boolean, default: false },
    statut:      { type: String, enum: ['pending', 'in-progress', 'done'], default: 'pending' },
    description: { type: String },
  }],

  // ── Avantages / Bénéfices ────────────────────────────────────────────────
  benefits: [{
    icon:  { type: String, default: null },
    label: { type: String },
    desc:  { type: String },
  }],

  // ── Statistiques cohorte précédente ─────────────────────────────────────
  stats: {
    startups:        { type: Number, default: null },
    labelStartup:    { type: Number, default: null },
    commercialisent: { type: Number, default: null },
    leveesFonds:     { type: Number, default: null },
    sessions:        { type: Number, default: null },
  },

  subSectors:   [{ type: String }],

  testimonials: [{
    name:    { type: String },
    company: { type: String },
    logo:    { type: String },
    photo:   { type: String },
    text:    { type: String },
  }],

  gallery:  [{ type: String }],

  partners: [{
    name: { type: String },
    logo: { type: String },
    url:  { type: String },
  }],

}, { timestamps: true });

ProgrammeSchema.index({ status: 1 });
ProgrammeSchema.index({ sector: 1 });

module.exports = mongoose.model('Programme', ProgrammeSchema);