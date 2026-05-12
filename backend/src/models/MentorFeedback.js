// src/models/MentorFeedback.js
const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['achieved', 'in_progress', 'delayed', 'not_started'], default: 'not_started' },
  date: { type: Date },
  comment: { type: String }
}, { _id: false });

const MentorFeedbackSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorSession' },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String, required: true },
  axes: {
    product: { type: String, default: '' },
    team:    { type: String, default: '' },
    market:  { type: String, default: '' },
    finance: { type: String, default: '' },
  },
  milestones: [MilestoneSchema], // ✅ Tableau d'objets, pas de strings
  visibility: { type: String, enum: ['private', 'startup', 'admin'], default: 'startup' }
}, { timestamps: true });

module.exports = mongoose.model('MentorFeedback', MentorFeedbackSchema);