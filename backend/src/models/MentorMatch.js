// models/MentorMatch.js
const mongoose = require('mongoose');

const MentorMatchSchema = new mongoose.Schema({
  startup:   { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  mentor:    { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor',      required: true },
  programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },

  // Recommendation status workflow
  // pending_founder_validation → founder_validated | founder_rejected
  recommendationStatus: {
    type: String,
    enum: [
      'pending_founder_validation',
      'founder_validated',
      'founder_rejected',
    ],
    default: 'pending_founder_validation',
  },

  founderValidatedAt:       Date,
  founderRejectedAt:        Date,
  founderRefuseReason:      { type: String, maxlength: 500 },
  adminRecommendationNote:  { type: String, maxlength: 1000 },

  // Session (can be mentoring / conference / workshop / one-to-one pitch / etc.)
  sessionStatus: {
    type: String,
    enum: [
      'none',
      'session_proposed',
      'session_confirmed',
      'session_refused',
    ],
    default: 'none',
  },

  sessionType:         { type: String, default: 'mentoring' }, // mentoring | conference | workshop | pitch | other
  sessionDate:         Date,
  sessionLink:         String,
  sessionLocation:     String,
  sessionDuration:     String, // e.g. "60 min"
  sessionProposedAt:   Date,
  sessionConfirmedAt:  Date,
  sessionRefusedAt:    Date,
  sessionRefuseReason: { type: String, maxlength: 500 },
  adminSessionNote:    { type: String, maxlength: 1000 },

  matchScore: { type: Number, default: 0, min: 0, max: 100 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MentorMatch', MentorMatchSchema);