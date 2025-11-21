const mongoose = require('mongoose');

const escrowTransactionSchema = new mongoose.Schema({
  // Transaction details
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties involved
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Product/Listing details
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  paymentRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentRequest'
  },
  crop: String,
  quantity: Number,
  unit: String,
  
  // Financial details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0 // 2-3% platform fee
    },
    totalFee: {
      type: Number,
      default: 0
    },
    sellerAmount: {
      type: Number,
      default: 0 // amount - totalFee
    }
  },
  
  // Escrow status
  status: {
    type: String,
    enum: ['pending', 'funded', 'confirmed', 'released', 'refunded', 'dispute', 'completed'],
    default: 'pending'
  },
  
  // Payment tracking
  payment: {
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'wallet', 'online', 'razorpay'],
      default: 'bank_transfer'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    },
    transactionRef: String,
    confirmedAt: Date
  },
  
  // Delivery tracking
  delivery: {
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingId: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    pickupLocation: String,
    deliveryLocation: String
  },
  
  // Buyer confirmation
  buyerConfirmation: {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    },
    confirmedAt: Date,
    rejectionReason: String,
    photosUploaded: [String] // URLs of photos showing received product
  },
  
  // Dispute handling
  dispute: {
    raised: Boolean,
    raisedBy: String, // 'buyer' or 'seller'
    reason: String,
    description: String,
    evidence: [String], // URLs of evidence
    raisedAt: Date,
    resolution: String,
    resolvedAt: Date
  },
  
  // Razorpay Payment Integration
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpayTransferId: String,
  
  // Release authorization
  releaseAuthorization: {
    buyerAuthorized: {
      type: Boolean,
      default: false
    },
    releaseTime: Date,
    sellerVerified: {
      type: Boolean,
      default: false
    },
    sellerVerifiedAt: Date,
    adminApproved: {
      type: Boolean,
      default: false
    },
    adminApprovedAt: Date,
    autoReleaseTime: Date
  },
  
  // Blockchain Integration (For future smart contract)
  blockchain: {
    txHash: String,                    // Transaction hash on blockchain
    smartContractAddress: String,      // Contract address
    smartContractId: Number,           // ID in smart contract
    network: {
      type: String,
      enum: ['polygon', 'bsc', 'ethereum'],
      default: 'polygon'
    },
    blockchainStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    },
    blockchainConfirmedAt: Date,
    gasUsed: Number
  },
  
  // Auto-release scheduling
  autoReleaseScheduledFor: Date,
  reviewsPending: {
    type: Boolean,
    default: true
  },
  
  // Fund management
  funds: {
    inEscrow: {
      type: Number,
      default: 0 // Amount currently held
    },
    released: {
      type: Number,
      default: 0 // Amount released to seller
    },
    refunded: {
      type: Number,
      default: 0 // Amount refunded to buyer
    }
  },
  
  // Terms & conditions
  terms: {
    deliveryDays: {
      type: Number,
      default: 3
    },
    autoReleaseAfter: {
      type: Number,
      default: 5 // days after delivery for auto-release
    },
    returnWindow: {
      type: Number,
      default: 7 // days after delivery
    }
  },
  
  // Timeline
  createdAt: {
    type: Date,
    default: Date.now
  },
  fundedAt: Date,
  deliveredAt: Date,
  autoReleaseScheduledFor: Date,
  completedAt: Date,
  
  // Metadata
  notes: String,
  adminNotes: String,
  
  // Verification
  verificationRequired: {
    type: Boolean,
    default: true
  },
  verifiedBy: mongoose.Schema.Types.ObjectId, // Admin who verified
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for faster queries
escrowTransactionSchema.index({ buyerId: 1, status: 1 });
escrowTransactionSchema.index({ sellerId: 1, status: 1 });
escrowTransactionSchema.index({ status: 1, createdAt: -1 });
escrowTransactionSchema.index({ transactionId: 1 });
escrowTransactionSchema.index({ autoReleaseScheduledFor: 1 });

module.exports = mongoose.model('EscrowTransaction', escrowTransactionSchema);
