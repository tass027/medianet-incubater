// models/Match.js
// Modèle Mongoose pour un match Startup ↔ Investisseur

const mongoose = require('mongoose');

// ── Statuts possibles (machine à états) ──────────────────────────────────────
// pending_founder_validation : admin a créé le match, fondateur doit décider
// founder_validated          : fondateur a accepté le match
// founder_rejected           : fondateur a refusé le match
// session_proposed           : admin/investisseur a proposé une session
// session_confirmed          : fondateur a confirmé la session
// session_refused            : fondateur a refusé la session
const VALID_STATUSES = [
  'pending_founder_validation',
  'founder_validated',
  'founder_rejected',
  'session_proposed',
  'session_confirmed',
  'session_refused',
];

const MatchSchema = new mongoose.Schema({
  // ── Relations ─────────────────────────────────────────────────────────────
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true,
    index: true,
  },
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: true,
  },

  // ── Score de matching (calculé par l'algorithme IA ou saisi par l'admin) ──
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },

  // ── Statut principal ───────────────────────────────────────────────────────
  status: {
    type: String,
    enum: VALID_STATUSES,
    default: 'pending_founder_validation',
    index: true,
  },

  // ── Données de la session ──────────────────────────────────────────────────
  sessionDate: {
    type: Date,
    default: null,
  },
  sessionLink: {
    type: String, // URL Zoom / Google Meet / Teams
    default: null,
  },
  sessionLocation: {
    type: String, // Ou présentiel
    default: null,
  },
  sessionNotes: {
    type: String, // Instructions / agenda
    default: null,
  },

  // ── Raison de refus (fondateur) ────────────────────────────────────────────
  founderRefuseReason: {
    type: String,
    maxlength: 500,
    default: null,
  },

  // ── Timestamps des actions ─────────────────────────────────────────────────
  founderValidatedAt:  { type: Date, default: null },
  founderRejectedAt:   { type: Date, default: null },
  sessionProposedAt:   { type: Date, default: null },
  sessionConfirmedAt:  { type: Date, default: null },
  sessionRefusedAt:    { type: Date, default: null },

  // ── Créé par l'admin ───────────────────────────────────────────────────────
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin qui a créé le match
    required: true,
  },

}, { timestamps: true }); // createdAt + updatedAt automatiques

// ── Index composé : un seul match par couple startup/investisseur ─────────
MatchSchema.index({ startup: 1, investor: 1 }, { unique: true });

// ── Méthode virtuelle : état lisible ─────────────────────────────────────
MatchSchema.virtual('statusLabel').get(function () {
  const labels = {
    pending_founder_validation: 'En attente de validation',
    founder_validated:          'Match validé',
    founder_rejected:           'Match refusé',
    session_proposed:           'Session proposée',
    session_confirmed:          'Session confirmée',
    session_refused:            'Session refusée',
  };
  return labels[this.status] || this.status;
});

// ── Vérification de transition de statut valide ─────────────────────────
MatchSchema.methods.canTransitionTo = function (newStatus) {
  const transitions = {
    pending_founder_validation: ['founder_validated', 'founder_rejected'],
    founder_validated:          ['session_proposed'],
    founder_rejected:           [],
    session_proposed:           ['session_confirmed', 'session_refused'],
    session_confirmed:          [],
    session_refused:            ['session_proposed'], // relance possible par admin
  };
  return (transitions[this.status] || []).includes(newStatus);
};

module.exports = mongoose.model('Match', MatchSchema);