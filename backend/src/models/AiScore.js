const mongoose = require('mongoose');

const aiScoreSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  scores: {
    problem:  { type: Number, default: 0 },
    market:   { type: Number, default: 0 },
    team:     { type: Number, default: 0 },
    solution: { type: Number, default: 0 },
    traction: { type: Number, default: 0 },
  },
  total:     { type: Number, default: 0 },
  summary:   { type: String, default: '' },
  strengths: [String],
  weaknesses:[String],
  status:    { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  criteriaJustification: {
    problem:  String,
    market:   String,
    team:     String,
    solution: String,
    traction: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('AiScore', aiScoreSchema);