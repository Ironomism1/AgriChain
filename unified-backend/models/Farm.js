const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    farmName: {
      type: String,
      required: true,
      trim: true
    },
    district: String,
    areaAcres: {
      type: Number,
      required: true
    },
    soilType: String,
    soilPh: Number,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    temperatureAvg: Number,
    humidityAvg: Number,
    rainfallAnnual: Number,
    irrigationType: String,
    cropsGrownHistory: [
      {
        crop: String,
        year: Number,
        areaAcres: Number,
        yieldKg: Number,
        pricePerKg: Number,
        revenue: Number,
        date: { type: Date, default: Date.now }
      }
    ],
    recommendationsHistory: [
      {
        crop: String,
        confidence: Number,
        yieldPrediction: Number,
        pricePrediction: Number,
        date: { type: Date, default: Date.now }
      }
    ],
    lastRecommendation: {
      crop: String,
      date: Date
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

module.exports = mongoose.model('Farm', farmSchema);
