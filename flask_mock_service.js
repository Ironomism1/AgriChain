// Mock Flask AgriPredict Service - Running on Port 5000
// This serves as a mock for the Python Flask service

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for predictions
const mockPredictions = {
  cropRecommendations: [
    { crop: 'Rice', score: 0.95, reason: 'Optimal soil pH and moisture' },
    { crop: 'Maize', score: 0.87, reason: 'Good climate match' },
    { crop: 'Wheat', score: 0.72, reason: 'Moderate conditions' }
  ],
  yieldPrediction: {
    estimatedYield: 2500,
    unit: 'kg/ha',
    confidence: 0.89,
    factors: ['Soil Quality', 'Rainfall', 'Temperature', 'Crop Health']
  },
  priceAnalysis: {
    currentPrice: 25000,
    predictedPrice: 27500,
    trend: 'upward',
    confidence: 0.82
  },
  fertilizerRecommendation: {
    nitrogen: 120,
    phosphorus: 60,
    potassium: 40,
    organic: 5
  },
  marketStatistics: {
    demandLevel: 'high',
    priceRange: '20000-30000',
    marketSentiment: 'positive',
    buyersAvailable: 45
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AgriPredict Mock Service Running', port: PORT });
});

// Crop Recommendations
app.post('/api/predictions/recommendations', (req, res) => {
  const { soilPH, moisture, temperature, location } = req.body;
  
  // Simulate ML prediction
  const recommendations = mockPredictions.cropRecommendations.map(pred => ({
    ...pred,
    score: pred.score + (Math.random() - 0.5) * 0.1
  })).sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    data: recommendations,
    timestamp: new Date()
  });
});

// Yield Prediction
app.post('/api/predictions/yield-price', (req, res) => {
  const { cropType, area, season } = req.body;
  
  const prediction = {
    ...mockPredictions.yieldPrediction,
    yield: mockPredictions.yieldPrediction.estimatedYield + Math.floor(Math.random() * 500),
    price: mockPredictions.priceAnalysis
  };

  res.json({
    success: true,
    data: prediction,
    timestamp: new Date()
  });
});

// Fertilizer Recommendation
app.post('/api/predictions/fertilizer', (req, res) => {
  const { soilTest, cropType, area } = req.body;
  
  const recommendation = {
    ...mockPredictions.fertilizerRecommendation,
    totalAmount: area * (120 + 60 + 40 + 5),
    applicationSchedule: [
      { phase: 'Pre-sowing', amount: '30%' },
      { phase: 'Flowering', amount: '30%' },
      { phase: 'Fruiting', amount: '40%' }
    ]
  };

  res.json({
    success: true,
    data: recommendation,
    timestamp: new Date()
  });
});

// Market Demand/Analysis
app.post('/api/predictions/demand', (req, res) => {
  const { cropType, region } = req.body;
  
  const demand = {
    ...mockPredictions.marketStatistics,
    region: region || 'National',
    crop: cropType,
    demandForecast: [
      { month: 'December', demand: 1000 },
      { month: 'January', demand: 1200 },
      { month: 'February', demand: 950 }
    ]
  };

  res.json({
    success: true,
    data: demand,
    timestamp: new Date()
  });
});

// Crop Registration
app.post('/api/crops/register', (req, res) => {
  const { farmerName, cropType, area, sowingDate } = req.body;
  
  res.json({
    success: true,
    message: 'Crop registered successfully',
    data: {
      registrationId: 'REG-' + Date.now(),
      farmerName,
      cropType,
      area,
      sowingDate,
      registeredAt: new Date()
    }
  });
});

// Statistics/Historical Data
app.get('/api/statistics/:cropType', (req, res) => {
  const { cropType } = req.params;
  
  res.json({
    success: true,
    data: {
      crop: cropType,
      historical: [
        { year: 2020, avgYield: 2000, avgPrice: 18000 },
        { year: 2021, avgYield: 2200, avgPrice: 21000 },
        { year: 2022, avgYield: 2400, avgPrice: 24000 },
        { year: 2023, avgYield: 2500, avgPrice: 25000 }
      ]
    }
  });
});

// Market Listings
app.get('/api/listings/all', (req, res) => {
  res.json({
    success: true,
    data: {
      listings: [
        { id: 1, crop: 'Rice', price: 25000, quantity: 100, seller: 'Farmer Co-op' },
        { id: 2, crop: 'Wheat', price: 20000, quantity: 50, seller: 'Local Trader' },
        { id: 3, crop: 'Maize', price: 18000, quantity: 200, seller: 'Wholesale Buyer' }
      ],
      total: 350
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AgriPredict Mock Service',
    uptime: process.uptime(),
    port: PORT
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ AgriPredict Mock Service Running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /api/predictions/recommendations`);
  console.log(`   POST /api/predictions/yield-price`);
  console.log(`   POST /api/predictions/fertilizer`);
  console.log(`   POST /api/predictions/demand`);
  console.log(`   POST /api/crops/register`);
  console.log(`   GET  /api/statistics/:cropType`);
  console.log(`   GET  /api/listings/all`);
  console.log(`   GET  /health\n`);
});

module.exports = app;
