// models/FormResponse.js
const mongoose = require('mongoose');

const FormResponseSchema = new mongoose.Schema({
  formId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  respondentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondent:    { type: String, required: true },   // name
  email:         { type: String, required: true },
  company:       { type: String, default: '' },
  sector:        { type: String, default: '' },
  answers:       { type: Map, of: String },          // { questionId: answer }
  submittedAt:   { type: Date, default: Date.now },
  score:         { type: Number, default: 0 },
  status:        { type: String, enum: ['Active','Accepted','Pending','Rejected'], default: 'Active' },
  amount:        { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FormResponse', FormResponseSchema);