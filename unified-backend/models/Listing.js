const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    crop: {
      type: String,
      required: true
    },
    quantityKg: {
      type: Number,
      required: true
    },
    pricePerKg: {
      type: Number,
      required: true
    },
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C'],
      default: 'B'
    },
    district: String,
    harvestDate: Date,
    description: String,
    photos: [String],
    interestedBuyers: [
      {
        buyerId: mongoose.Schema.Types.ObjectId,
        interestedAt: { type: Date, default: Date.now }
      }
    ],
    contracts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract'
      }
    ],
    status: {
      type: String,
      enum: ['active', 'sold', 'expired', 'inactive'],
      default: 'active'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
