const mongoose = require('mongoose');

const mentorReportSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    period: {
      month: { type: Number, required: true }, // 1-12
      year:  { type: Number, required: true },
    },
    milestones: [
      {
        label:    { type: String, required: true },
        achieved: { type: Boolean, default: false },
        note:     { type: String, default: '' },
      },
    ],
    axes: {
      product: { type: String, default: '' },
      team:    { type: String, default: '' },
      market:  { type: String, default: '' },
      finance: { type: String, default: '' },
    },
    overallProgress: {
      type: Number, // 0-100
      default: 0,
    },
    recommendations: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

mentorReportSchema.index({ mentorId: 1, startupId: 1, 'period.year': -1, 'period.month': -1 });

module.exports = mongoose.model('MentorReport', mentorReportSchema);