const mongoose = require('mongoose');

const mentorResourceSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['document', 'link', 'video', 'template'],
      required: true,
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    filePath: {
      type: String,
      default: '',
    },
    targetStartups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ], // empty = shared with all assigned startups
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

mentorResourceSchema.index({ mentorId: 1 });

module.exports = mongoose.model('MentorResource', mentorResourceSchema);