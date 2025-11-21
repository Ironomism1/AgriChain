const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    crop: String,
    quantityKg: Number,
    pricePerKg: Number,
    totalValue: Number,
    
    // Payment terms
    downPaymentPercent: {
      type: Number,
      default: 20
    },
    downPaymentAmount: Number,
    downPaymentStatus: {
      type: String,
      enum: ['pending', 'escrowed', 'refunded'],
      default: 'pending'
    },
    
    // Quality standards
    qualityStandards: {
      moisturePercent: Number,
      defectLimit: Number,
      sizeGrade: String
    },
    
    // Delivery terms
    deliveryWindowStart: Date,
    deliveryWindowEnd: Date,
    
    // Stage tracking
    stage: {
      type: String,
      enum: [
        'negotiation', 'signed', 'escrowed', 'in_progress',
        'harvest_submitted', 'verification', 'delivery_scheduled',
        'delivered', 'payment_released', 'completed', 'disputed'
      ],
      default: 'negotiation'
    },
    
    stageHistory: [
      {
        stage: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: mongoose.Schema.Types.ObjectId
      }
    ],
    
    // Harvest proof
    harvestProof: {
      photos: [String],
      gpsCoordinates: {
        lat: Number,
        lng: Number
      },
      submittedDate: Date,
      submittedByFarmer: Boolean
    },
    
    // Link to EscrowTransaction
    escrowTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EscrowTransaction'
    },
    
    // Verification
    verification: {
      verifiedByAdmin: Boolean,
      verifiedDate: Date,
      inspectorNotes: String,
      passedQuality: Boolean,
      penaltiesApplied: Number
    },
    
    // Delivery logistics
    deliveryLogistics: {
      transporter: String,
      trackingId: String,
      estimatedDelivery: Date,
      actualDelivery: Date
    },
    
    // Payment schedule
    paymentSchedule: {
      downPayment: {
        amount: Number,
        status: String,
        date: Date
      },
      finalPayment: {
        amount: Number,
        status: String,
        date: Date
      }
    },
    
    // Penalties and disputes
    penalties: [
      {
        reason: String,
        amount: Number,
        date: { type: Date, default: Date.now }
      }
    ],
    
    disputes: [
      {
        raisedBy: mongoose.Schema.Types.ObjectId,
        reason: String,
        evidence: [String],
        status: String,
        resolution: String,
        date: { type: Date, default: Date.now }
      }
    ],
    
    // Blockchain
    blockchain: {
      contractAddress: String,
      txHash: String,
      statusOnChain: String
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
