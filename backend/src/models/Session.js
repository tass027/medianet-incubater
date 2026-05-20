// src/models/Session.js
/**
 * Session Model
 * Covers: workshop, conference, one2one, pitching, mentoring, masterclass
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SpeakerSchema = new Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, lowercase: true, trim: true },
  linkedin: { type: String, trim: true, default: '' },
}, { _id: false });

const SessionSchema = new Schema({
  // ── Core ────────────────────────────────────────────────────────────────
type: {
  type: String,
  required: true,
  enum: [
    'workshop',      // Atelier pratique en groupe
    'formation',     // Module de formation structuré
    'conference',    // Présentation ou keynote
    'pitching',      // Pitch & Investisseurs (garder 'pitching' comme valeur interne)
    'mentoring',   // Masterclass (non affiché mais gardé pour compatibilité)
  ],
},
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  domain:      { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },

  // ── Scheduling ──────────────────────────────────────────────────────────
  date:     { type: Date, required: true },
  time:     { type: String, default: '' },          // "HH:MM"
  duration: { type: Number, default: 90 },           // minutes
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'live', 'done', 'cancelled', 'pending'],
    default: 'upcoming',
  },

  // ── Location ────────────────────────────────────────────────────────────
  isOnline:  { type: Boolean, default: true },
  location:  { type: String, trim: true, default: '' }, // physical address
  meetLink:  { type: String, trim: true, default: '' }, // Google Meet URL
  calendarLink: { type: String, trim: true, default: '' }, // Google Calendar event URL

  // ── Speakers (non-mentoring sessions) ───────────────────────────────────
  speakers: { type: [SpeakerSchema], default: [] },

  // ── Capacity & enrollment ───────────────────────────────────────────────
  capacity: { type: Number, default: 20 },
  enrolled: { type: Number, default: 0 },

  // ── Targeting ───────────────────────────────────────────────────────────
  targetMode: {
    type: String,
    enum: ['all', 'programme', 'specific'],
    default: 'all',
  },
  selectedProgrammes: [{ type: String }],
  selectedStartups:   [{ type: Schema.Types.ObjectId, ref: 'Application' }],

  // ── Mentoring-specific ───────────────────────────────────────────────────
  mentorId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  startupId:   { type: Schema.Types.ObjectId, ref: 'Application', default: null },
  notifyMentor:{ type: Boolean, default: true },
  mentorNote:  { type: String, trim: true, default: '' },

  // ── Mentor decision ─────────────────────────────────────────────────────
  mentorStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'rescheduled'],
    default: 'pending',
  },
  mentorDecisionAt: { type: Date },
  mentorDecisionNote: { type: String, default: '' },

  // ── Meta ────────────────────────────────────────────────────────────────
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
SessionSchema.index({ date: 1 });
SessionSchema.index({ type: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ mentorId: 1 });
SessionSchema.index({ startupId: 1 });

SessionSchema.virtual('isMentoring').get(function () {
  return this.type === 'mentoring' || this.type === 'one2one';
});

SessionSchema.virtual('spotsLeft').get(function () {
  return Math.max(0, this.capacity - this.enrolled);
});

module.exports = mongoose.model('Session', SessionSchema);