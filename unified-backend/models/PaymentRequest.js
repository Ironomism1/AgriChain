const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderPhone: {
    type: String
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientPhone: {
    type: String
  },
  crop: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['kg', 'quintals', 'tonnes'],
    default: 'kg'
  },
  amount: {
    type: Number,
    required: true
  },
  // Advance percentage options: 10%, 20%, 30%
  advancePercentage: {
    type: Number,
    enum: [10, 20, 30],
    default: 20
  },
  advanceAmount: {
    type: Number  // Calculated as amount * (advancePercentage / 100)
  },
  description: {
    type: String
  },
  // Bidirectional payment flag: can both sides send/receive contracts
  allowBidirectional: {
    type: Boolean,
    default: true
  },
  // Track if this is a contract request (renamed from payment request)
  isContract: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'paid', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  paymentRequestId: {
    type: String // Link to PaymentRequest ID if using external system
  },
  // Status timeline
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Link to actual EscrowTransaction if accepted
  escrowTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EscrowTransaction'
  },
  
  // Link to Contract created from this payment request
  linkedContractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  
  // Payment status tracking
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Contract details embedded
  contractTerms: {
    deliveryWindowStart: Date,
    deliveryWindowEnd: Date,
    downPaymentPercent: {
      type: Number,
      default: 20
    },
    qualityStandards: {
      moisturePercent: Number,
      defectLimit: Number,
      sizeGrade: String
    }
  },
  
  // Track when contract was linked
  linkedAt: Date,
  
  // Additional context
  rejectionReason: {
    type: String
  },
  notes: {
    type: String
  }
});

PaymentRequestSchema.index({ senderId: 1 });
PaymentRequestSchema.index({ recipientId: 1 });
PaymentRequestSchema.index({ status: 1 });
PaymentRequestSchema.index({ linkedContractId: 1 });

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);
