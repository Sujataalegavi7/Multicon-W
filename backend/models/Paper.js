const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    authors: {
      type: [String],
      required: [true, 'At least one author is required'],
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
    },
    conferenceName: {
      type: String,
      required: [true, 'Conference name is required'],
      trim: true,
    },
    conferenceDate: {
      type: String,
      trim: true,
    },
    conferenceLocation: {
      type: String,
      trim: true,
    },
    doi: {
      type: String,
      trim: true,
    },
    electronicISBN: {
      type: String,
      trim: true,
    },
    printISBN: {
      type: String,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    pdfPath: {
      type: String,
      required: [true, 'PDF file is required'],
    },
    thumbnailPath: {
      type: String,
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending',
    },
    adminRemarks: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Full-text search indexes
paperSchema.index(
  { title: 'text', keywords: 'text', authors: 'text', abstract: 'text' },
  {
    weights: { title: 10, keywords: 5, authors: 3, abstract: 1 },
    name: 'paper_text_index',
  }
);

// For filtering performance
paperSchema.index({ status: 1, createdAt: -1 });
paperSchema.index({ isFeatured: 1, status: 1 });
paperSchema.index({ conferenceName: 1 });

module.exports = mongoose.model('Paper', paperSchema);
