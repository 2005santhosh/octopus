const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    type: {
      type: String,
      required: [true, 'Content type is required'],
      enum: ['Post', 'Video'],
      default: 'Post'
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Published', 'Draft', 'Scheduled'],
      default: 'Draft'
    },
    contentData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);