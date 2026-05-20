// src/models/AiReport.js
const mongoose = require('mongoose');

const AiReportSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  startupName:   { type: String },
  generatedAt:   { type: Date, default: Date.now },
  model:         { type: String },
  juryCount:     { type: Number },
  avgScore:      { type: Number },
  report:        { type: mongoose.Schema.Types.Mixed }, // the parsed JSON from Ollama
}, { timestamps: true });

module.exports = mongoose.model('AiReport', AiReportSchema);