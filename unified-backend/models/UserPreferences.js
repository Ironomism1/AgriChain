const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    
    // Theme Settings
    theme: {
      mode: {
        type: String,
        enum: ['light', 'dark', 'auto', 'blue', 'green', 'purple', 'orange'],
        default: 'light'
      },
      customColors: {
        primary: String,
        secondary: String,
        accent: String,
        background: String,
        text: String
      },
      fontSize: {
        type: String,
        enum: ['small', 'normal', 'large', 'xlarge'],
        default: 'normal'
      },
      sidebarCollapsed: {
        type: Boolean,
        default: false
      }
    },
    
    // Payment Settings
    payments: {
      mockPaymentEnabled: {
        type: Boolean,
        default: true // For testing
      },
      mockBalance: {
        type: Number,
        default: 50000
      },
      preferredPaymentMethod: {
        type: String,
        enum: ['razorpay', 'upi', 'crypto', 'bank_transfer'],
        default: 'razorpay'
      }
    },
    
    // Notification Settings
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      },
      inAppNotifications: {
        type: Boolean,
        default: true
      },
      notificationFrequency: {
        type: String,
        enum: ['instant', 'daily', 'weekly'],
        default: 'instant'
      }
    },
    
    // Privacy Settings
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends_only'],
        default: 'public'
      },
      showPhoneNumber: {
        type: Boolean,
        default: false
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      allowMessages: {
        type: Boolean,
        default: true
      }
    },
    
    // Language & Localization
    language: {
      type: String,
      enum: ['en', 'hi', 'te', 'ta', 'kn'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
