// models/JuryEvaluation.js
const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  criteriaId:   { type: String, required: true },  // 'team', 'innovation', etc.
  criteriaName: { type: String },
  score:        { type: Number, min: 0, max: 100, required: true },
  remark:       { type: String, default: '' },
}, { _id: false });

const JuryEvaluationSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  juryId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  juryName:      { type: String, required: true },
  startupName:   { type: String, required: true },
  programme:     { type: String, default: '' },
  scores:        [ScoreSchema],
  totalScore:    { type: Number, default: 0 },
  globalRemark:  { type: String, default: '' },
  recommendation:{ type: String, enum: ['accept','reject','review','interview'], default: 'review' },
  status:        { type: String, enum: ['pending','submitted','reviewed'], default: 'pending' },
  submittedAt:   { type: Date },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('JuryEvaluation', JuryEvaluationSchema);