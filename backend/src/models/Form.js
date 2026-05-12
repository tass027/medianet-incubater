// models/Form.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id:            { type: String, required: true },
  type:          { type: String, enum: ['short','long','radio','checkbox','dropdown','scale','grid','date','time','file'], required: true },
  title:         { type: String, default: '' },
  description:   { type: String, default: '' },
  required:      { type: Boolean, default: false },
  options:       [String],
  rows:          [String],
  scaleMin:      { type: Number, default: 1 },
  scaleMax:      { type: Number, default: 5 },
  scaleMinLabel: { type: String, default: '' },
  scaleMaxLabel: { type: String, default: '' },
}, { _id: false });

const FormSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  subtitle:      { type: String, default: '' },
  description:   { type: String, default: '' },
  type:          { type: String, enum: ['basic', 'custom'], default: 'custom' },
  status:        { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  accent:        { type: String, default: '#006d94' },
  programme:     { type: String, default: null },      // programme ID or null for base form
  programmeName: { type: String, default: null },
  isInherited:   { type: Boolean, default: false },
  questions:     [QuestionSchema],
  sentTo:        { type: Number, default: 0 },
  sentToNames:   { type: mongoose.Schema.Types.Mixed, default: [] }, // 'all' or array of names
  recipientIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  responses:     { type: Number, default: 0 },
  completionRate:{ type: Number, default: 0 },
  fields:        { type: Number, default: 0 },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Form', FormSchema);