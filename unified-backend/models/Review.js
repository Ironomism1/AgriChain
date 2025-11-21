const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Transaction reference
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  
  // Reviewer info
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerRole: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  
  // Reviewed user info
  reviewedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  
  // Review details
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  
  // Category ratings (all 1-5)
  categoryRatings: {
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    fairness: { type: Number, min: 1, max: 5 }
  },
  
  // Review aspects
  aspects: {
    deliveryOnTime: Boolean,
    qualityAsDescribed: Boolean,
    communicative: Boolean,
    wouldRecommend: Boolean
  },
  
  // Verification
  verifiedPurchase: {
    type: Boolean,
    default: true
  },
  
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  
  // Admin moderation
  approved: {
    type: Boolean,
    default: true
  },
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
reviewSchema.index({ reviewedUserId: 1, createdAt: -1 });
reviewSchema.index({ transactionId: 1 });
reviewSchema.index({ reviewerId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
