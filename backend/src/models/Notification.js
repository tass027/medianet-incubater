// src/models/Notification.js
const mongoose = require('mongoose');

// ── Types de notification supportés ──────────────────────────────────────────
const NOTIFICATION_TYPES = [
  'session_assigned',      // session mentorat assignée à un mentor / startup
  'session_confirmed',     // session confirmée
  'session_pending',       // session en attente d'acceptation (mentor)
  'session_reminder',      // rappel J-1 ou J-2
  'session_new',           // nouvelle session collective disponible
  'session_cancelled',     // session annulée
  'session_completed',     // session terminée
  'mentor_accepted',       // mentor a accepté la session
  'mentor_declined',       // mentor a refusé la session
  'mentor_session_created',// mentor a créé une session depuis son espace
  'startup_assigned',      // startup assignée à un mentor
  'kpi_update_requested',  // mentor demande mise à jour KPIs
  'feedback_requested',    // rapport / feedback post-session demandé
  'form_assigned',         // formulaire envoyé à une startup
  'general',               // notification générique admin
];

const NotificationSchema = new mongoose.Schema(
  {
    // ── Destinataire ──────────────────────────────────────────────────────
    recipientId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    recipientRole: {
      type:     String,
      enum:     ['admin', 'mentor', 'startup', 'investor'],
      required: true,
      index:    true,
    },

    // ── Contenu ───────────────────────────────────────────────────────────
    type: {
      type:     String,
      enum:     NOTIFICATION_TYPES,
      required: true,
      index:    true,
    },
    title: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 120,
    },
    body: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 500,
    },

    // ── Navigation ────────────────────────────────────────────────────────
    link: {
      type:    String,
      default: '',
      trim:    true,
    },

    // ── État ─────────────────────────────────────────────────────────────
    read: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    readAt: {
      type:    Date,
      default: null,
    },

    // ── Payload spécifique (sessionId, mentorId, startupId…) ─────────────
    data: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,           // ajoute createdAt + updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Index composé pour requête classique : toutes les notifs d'un user ──────
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, read: 1 });

// ── Méthode : marquer comme lue ──────────────────────────────────────────────
NotificationSchema.methods.markRead = async function () {
  if (!this.read) {
    this.read   = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// ── Statics utiles ────────────────────────────────────────────────────────────
NotificationSchema.statics.countUnread = function (recipientId) {
  return this.countDocuments({ recipientId, read: false });
};

NotificationSchema.statics.markAllRead = function (recipientId) {
  return this.updateMany(
    { recipientId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// ── Nettoyage automatique après 90 jours ─────────────────────────────────────
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }   // TTL 90 jours
);

module.exports = mongoose.model('Notification', NotificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;