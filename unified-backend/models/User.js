const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'admin'],
      default: 'farmer'
    },
    district: {
      type: String,
      required: function() { return this.role === 'farmer'; }
    },
    address: String,
    bio: {
      type: String,
      default: ''
    },
    verified: {
      type: Boolean,
      default: false
    },
    avatar: String,
    
    // Razorpay Integration
    razorpayAccountId: {
      type: String,
      sparse: true // Allow null/undefined
    },
    
    // Bank Account Details (for sellers)
    bankAccount: {
      holderName: String,
      accountNumber: String, // Store last 4 digits only for security
      ifscCode: String,
      accountType: {
        type: String,
        enum: ['savings', 'current'],
        default: 'savings'
      },
      verified: {
        type: Boolean,
        default: false
      },
      linkedAt: Date
    },
    
    // KYC Status
    kycStatus: {
      type: String,
      enum: ['not_started', 'pending', 'pending_manual', 'verified', 'rejected'],
      default: 'not_started'
    },
    
    // Payment & Transaction Stats
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalAmountEarned: {
      type: Number,
      default: 0
    },
    totalAmountSpent: {
      type: Number,
      default: 0
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
