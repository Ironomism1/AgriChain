const mongoose = require('mongoose');

const userPerformanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Overall metrics
  overallStats: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    successfulTransactions: {
      type: Number,
      default: 0
    },
    disputedTransactions: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },
  
  // Review statistics
  reviews: {
    totalReviews: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    ratingDistribution: {
      fiveStar: { type: Number, default: 0 },
      fourStar: { type: Number, default: 0 },
      threeStar: { type: Number, default: 0 },
      twoStar: { type: Number, default: 0 },
      oneStar: { type: Number, default: 0 }
    }
  },
  
  // Category averages
  categoryAverages: {
    quality: { type: Number, default: 5 },
    communication: { type: Number, default: 5 },
    timeliness: { type: Number, default: 5 },
    fairness: { type: Number, default: 5 }
  },
  
  // Trust badges
  badges: {
    verified: Boolean,
    topSeller: Boolean,
    topBuyer: Boolean,
    reliable: Boolean,
    communicative: Boolean,
    fastShipper: Boolean,
    responsive: Boolean
  },
  
  // Seller specific
  sellerMetrics: {
    totalProductsSold: {
      type: Number,
      default: 0
    },
    averageDeliveryTime: {
      type: Number,
      default: 0 // in days
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 100
    },
    returnRate: {
      type: Number,
      default: 0
    },
    refundRate: {
      type: Number,
      default: 0
    }
  },
  
  // Buyer specific
  buyerMetrics: {
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0 // in INR
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    repeatPurchaseRate: {
      type: Number,
      default: 0
    },
    disputeRate: {
      type: Number,
      default: 0
    }
  },
  
  // Recent activity
  recentActivity: {
    lastTransactionDate: Date,
    lastReviewDate: Date,
    lastDisputeDate: Date,
    activeNow: Boolean
  },
  
  // Risk indicators
  riskProfile: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    flags: [String], // e.g., ['multiple_disputes', 'low_communication']
    warningCount: {
      type: Number,
      default: 0
    }
  },
  
  // Recommendations & insights
  insights: {
    strengths: [String],
    improvements: [String],
    recommendation: String // AI-generated summary
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
userPerformanceSchema.index({ userId: 1 });
userPerformanceSchema.index({ 'overallStats.successRate': -1 });
userPerformanceSchema.index({ 'reviews.averageRating': -1 });
userPerformanceSchema.index({ 'riskProfile.level': 1 });

module.exports = mongoose.model('UserPerformance', userPerformanceSchema);
