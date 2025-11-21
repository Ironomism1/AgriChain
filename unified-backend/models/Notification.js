const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'buyer_interested',      // Buyer marked interest in listing
      'listing_accepted',      // Farmer accepted offer
      'listing_rejected',      // Farmer rejected offer
      'payment_received',      // Payment received
      'payment_released',      // Escrow funds released
      'harvest_verification',  // Harvest needs verification
      'contract_created',      // New contract created
      'review_received',       // New review received
      'dispute_raised',        // Dispute created
      'order_completed'        // Order completed
    ],
    required: true,
    index: true
  },
  
  // Notification content
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Related entity
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: function() {
      if (this.type === 'buyer_interested' || this.type === 'listing_accepted' || this.type === 'listing_rejected') {
        return 'Listing';
      } else if (this.type === 'payment_received' || this.type === 'payment_released') {
        return 'EscrowTransaction';
      } else if (this.type === 'contract_created' || this.type === 'harvest_verification') {
        return 'Contract';
      } else if (this.type === 'review_received') {
        return 'Review';
      }
      return 'Listing';
    }
  },
  
  relatedType: {
    type: String,
    enum: ['Listing', 'Contract', 'EscrowTransaction', 'Review', 'User', 'PaymentRequest'],
    required: true
  },
  
  // Additional data for notification
  data: {
    crop: String,
    quantity: Number,
    buyerName: String,
    farmerName: String,
    amount: Number,
    status: String
  },
  
  // Notification status
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  // Delivery status
  emailSent: {
    type: Boolean,
    default: false
  },
  
  emailSentAt: {
    type: Date
  },
  
  emailError: {
    type: String
  },
  
  inAppNotified: {
    type: Boolean,
    default: false
  },
  
  inAppNotifiedAt: {
    type: Date
  },
  
  // Preferences
  emailPreference: {
    type: Boolean,
    default: true
  },
  
  pushPreference: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  expiresAt: {
    type: Date,
    index: true,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Auto-delete old notifications after 30 days
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
