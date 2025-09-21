const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
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
      enum: ['post', 'video', 'social', 'email'],
      default: 'post'
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [150, 'Excerpt cannot exceed 150 characters']
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['published', 'draft', 'scheduled'],
      default: 'draft'
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['google', 'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'email', 'website']
    },
    platformName: {
      type: String,
      required: [true, 'Platform name is required'],
      trim: true
    },
    contentData: {
      description: { type: String },
      aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1', null] },
      videoDuration: { type: String }
    },
    popular: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);