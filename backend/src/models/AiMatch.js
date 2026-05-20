// models/AiMatch.js
// Collection : aimatches
// Stocke les résultats du matching IA pour chaque startup (application)
// Remplace le sous-document application.aiMatches[] par une collection dédiée
// → meilleure performance pour les requêtes, pagination, et historique

const mongoose = require('mongoose');

const AiMatchSchema = new mongoose.Schema(
  {
    // ── Référence startup ───────────────────────────────────────────────────
    application: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Application',
      required: true,
      index:    true,
    },

    // ── Type de match ───────────────────────────────────────────────────────
    type: {
      type:     String,
      enum:     ['investor', 'mentor', 'jury'],
      required: true,
      index:    true,
    },

    // ── Cible du match ──────────────────────────────────────────────────────
    targetId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      // refPath permet de pointer vers Investor, User (mentor/jury) selon le type
      refPath:  'targetModel',
    },
    targetModel: {
      type:    String,
      enum:    ['Investor', 'User'],
      required: true,
    },
    targetName:    { type: String, default: '' },
    targetCompany: { type: String, default: '' }, // société investisseur ou expertise mentor

    // ── Score et critères ───────────────────────────────────────────────────
    score: {
      type:    Number,
      min:     0,
      max:     100,
      required: true,
    },
    // Détail des critères de scoring (clés variables selon le type)
    // ex: { sectorMatch: 20, stageMatch: 15, ticketMatch: 18, needsMatch: 17, startupQuality: 10 }
    criteria: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Justification IA ────────────────────────────────────────────────────
    reasoning:    { type: String, default: '' },
    highlights:   [{ type: String }], // points forts
    risks:        [{ type: String }], // risques identifiés
    coveredNeeds: [{ type: String }], // besoins couverts par ce match

    // ── Statut de validation admin ──────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['suggested', 'accepted', 'rejected', 'pending_contact', 'contacted'],
      default: 'suggested',
      index:   true,
    },

    // ── Traçabilité ─────────────────────────────────────────────────────────
    generatedAt:  { type: Date, default: Date.now },
    validatedAt:  { type: Date },
    validatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Email envoyé ────────────────────────────────────────────────────────
    emailSent:   { type: Boolean, default: false },
    emailSentAt: { type: Date },

    // ── Version du matching (pour historique) ───────────────────────────────
    matchingRun: { type: Number, default: 1 }, // incrémenté à chaque re-matching
  },
  {
    timestamps:  true, // createdAt, updatedAt automatiques
    collection:  'aimatches',
  }
);

// ── Index composé : un seul match par (application, type, cible) par run ──────
AiMatchSchema.index(
  { application: 1, type: 1, targetId: 1, matchingRun: 1 },
  { unique: true }
);

// ── Index pour récupérer tous les matches d'une startup triés par score ────────
AiMatchSchema.index({ application: 1, score: -1 });

// ── Index pour les tableaux de bord investisseur/mentor ───────────────────────
AiMatchSchema.index({ targetId: 1, type: 1, status: 1 });

module.exports = mongoose.model('AiMatch', AiMatchSchema);