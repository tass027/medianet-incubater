const mongoose = require('mongoose');

const mentorSessionSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // minutes
      default: 60,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'done', 'cancelled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

mentorSessionSchema.index({ mentorId: 1, date: -1 });
mentorSessionSchema.index({ startupId: 1 });

module.exports = mongoose.model('MentorSession', mentorSessionSchema);