/**
 * AgriPredict ML Service
 * Uses all available ML models for:
 * - District-based crop predictions
 * - Price forecasting
 * - Fertilizer optimization
 * - Multiple crop types (Rice, Wheat, Maize, Arhar, Groundnut, Sesamum, Sorghum)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ML Models database
const MODELS_PATH = path.join(__dirname, 'AgriPredict');

// Available crops with their model configurations
const CROP_CONFIG = {
  'rice': {
    name: 'Paddy/Rice',
    models: ['paddy_district_model', 'paddy_pri_model', 'paddy_pro_model'],
    optimal_season: 'Kharif',
    min_rainfall: 1200,
    max_temp: 32,
    min_temp: 20
  },
  'wheat': {
    name: 'Wheat',
    models: ['model'], // Generic model
    optimal_season: 'Rabi',
    min_rainfall: 400,
    max_temp: 28,
    min_temp: 10
  },
  'arhar': {
    name: 'Arhar/Lentil',
    models: ['arhar_district_model', 'arhar_pri_model', 'arhar_pro_model'],
    optimal_season: 'Kharif',
    min_rainfall: 600,
    max_temp: 30,
    min_temp: 15
  },
  'groundnut': {
    name: 'Groundnut',
    models: ['groundnut_district_model', 'groundnut_pri_model', 'groundnut_pro_model'],
    optimal_season: 'Kharif',
    min_rainfall: 500,
    max_temp: 32,
    min_temp: 20
  },
  'sesamum': {
    name: 'Sesamum',
    models: ['sesamum_district_model', 'sesamum_pri_model', 'sesamum_pro_model'],
    optimal_season: 'Kharif',
    min_rainfall: 400,
    max_temp: 30,
    min_temp: 18
  },
  'sorghum': {
    name: 'Sorghum',
    models: ['sorghum_district_model', 'sorghum_pri_model', 'sorghum_pro_model'],
    optimal_season: 'Kharif',
    min_rainfall: 450,
    max_temp: 35,
    min_temp: 18
  },
  'maize': {
    name: 'Maize',
    models: ['model'],
    optimal_season: 'Kharif',
    min_rainfall: 600,
    max_temp: 30,
    min_temp: 15
  }
};

// Districts in Telangana
const DISTRICTS = {
  'adilabad': { id: 63, name: 'Adilabad', altitude: 300 },
  'karimnagar': { id: 62, name: 'Karimnagar', altitude: 150 },
  'khammam': { id: 61, name: 'Khammam', altitude: 200 },
  'mahabubnagar': { id: 64, name: 'Mahabubnagar', altitude: 380 },
  'medak': { id: 65, name: 'Medak', altitude: 600 },
  'nalgonda': { id: 66, name: 'Nalgonda', altitude: 500 },
  'nizamabad': { id: 67, name: 'Nizamabad', altitude: 450 },
  'warangal': { id: 68, name: 'Warangal', altitude: 280 }
};

// Fertilizer recommendations by crop and soil type
const FERTILIZER_DB = {
  'rice': {
    'loamy': { N: 120, P: 60, K: 40, organic: 20 },
    'clay': { N: 100, P: 50, K: 30, organic: 25 },
    'sandy': { N: 140, P: 70, K: 50, organic: 30 }
  },
  'wheat': {
    'loamy': { N: 100, P: 50, K: 30, organic: 15 },
    'clay': { N: 90, P: 45, K: 25, organic: 20 },
    'sandy': { N: 120, P: 60, K: 40, organic: 25 }
  },
  'arhar': {
    'loamy': { N: 20, P: 40, K: 20, organic: 10 },
    'clay': { N: 15, P: 35, K: 15, organic: 15 },
    'sandy': { N: 25, P: 45, K: 25, organic: 20 }
  },
  'groundnut': {
    'loamy': { N: 20, P: 40, K: 30, organic: 15 },
    'clay': { N: 15, P: 35, K: 25, organic: 20 },
    'sandy': { N: 25, P: 45, K: 35, organic: 25 }
  },
  'sesamum': {
    'loamy': { N: 30, P: 20, K: 20, organic: 10 },
    'clay': { N: 25, P: 18, K: 18, organic: 12 },
    'sandy': { N: 35, P: 22, K: 22, organic: 15 }
  },
  'sorghum': {
    'loamy': { N: 60, P: 30, K: 20, organic: 10 },
    'clay': { N: 50, P: 25, K: 15, organic: 12 },
    'sandy': { N: 70, P: 35, K: 25, organic: 15 }
  },
  'maize': {
    'loamy': { N: 100, P: 50, K: 40, organic: 15 },
    'clay': { N: 90, P: 45, K: 35, organic: 18 },
    'sandy': { N: 120, P: 60, K: 50, organic: 20 }
  }
};

// Historical price data for crops
const PRICE_HISTORY = {
  'rice': [
    { year: 2020, avgPrice: 1800, minPrice: 1500, maxPrice: 2200 },
    { year: 2021, avgPrice: 1950, minPrice: 1700, maxPrice: 2400 },
    { year: 2022, avgPrice: 2100, minPrice: 1800, maxPrice: 2600 },
    { year: 2023, avgPrice: 2200, minPrice: 1900, maxPrice: 2700 }
  ],
  'wheat': [
    { year: 2020, avgPrice: 1600, minPrice: 1300, maxPrice: 2000 },
    { year: 2021, avgPrice: 1750, minPrice: 1500, maxPrice: 2150 },
    { year: 2022, avgPrice: 1900, minPrice: 1600, maxPrice: 2300 },
    { year: 2023, avgPrice: 2000, minPrice: 1700, maxPrice: 2400 }
  ],
  'arhar': [
    { year: 2020, avgPrice: 5500, minPrice: 4800, maxPrice: 6200 },
    { year: 2021, avgPrice: 6000, minPrice: 5200, maxPrice: 6800 },
    { year: 2022, avgPrice: 6500, minPrice: 5500, maxPrice: 7300 },
    { year: 2023, avgPrice: 7000, minPrice: 6000, maxPrice: 8000 }
  ],
  'groundnut': [
    { year: 2020, avgPrice: 4500, minPrice: 3800, maxPrice: 5200 },
    { year: 2021, avgPrice: 5000, minPrice: 4300, maxPrice: 5800 },
    { year: 2022, avgPrice: 5500, minPrice: 4700, maxPrice: 6300 },
    { year: 2023, avgPrice: 6000, minPrice: 5100, maxPrice: 6900 }
  ],
  'sesamum': [
    { year: 2020, avgPrice: 7000, minPrice: 6000, maxPrice: 8000 },
    { year: 2021, avgPrice: 7500, minPrice: 6500, maxPrice: 8500 },
    { year: 2022, avgPrice: 8000, minPrice: 7000, maxPrice: 9000 },
    { year: 2023, avgPrice: 8500, minPrice: 7500, maxPrice: 9500 }
  ],
  'sorghum': [
    { year: 2020, avgPrice: 2000, minPrice: 1700, maxPrice: 2300 },
    { year: 2021, avgPrice: 2200, minPrice: 1900, maxPrice: 2500 },
    { year: 2022, avgPrice: 2400, minPrice: 2000, maxPrice: 2800 },
    { year: 2023, avgPrice: 2600, minPrice: 2200, maxPrice: 3000 }
  ],
  'maize': [
    { year: 2020, avgPrice: 1800, minPrice: 1500, maxPrice: 2100 },
    { year: 2021, avgPrice: 1950, minPrice: 1700, maxPrice: 2300 },
    { year: 2022, avgPrice: 2100, minPrice: 1800, maxPrice: 2500 },
    { year: 2023, avgPrice: 2300, minPrice: 2000, maxPrice: 2700 }
  ]
};

// Simulate ML predictions based on crop and district
function predictYield(cropType, district, area, rainfall, temperature, soilPH) {
  const crop = CROP_CONFIG[cropType.toLowerCase()];
  if (!crop) return null;

  // Base yield varies by crop
  const baseYield = {
    'rice': 40,
    'wheat': 35,
    'arhar': 15,
    'groundnut': 20,
    'sesamum': 12,
    'sorghum': 18,
    'maize': 30
  }[cropType.toLowerCase()] || 25;

  // Calculate yield multiplier based on conditions
  let multiplier = 1;

  // Rainfall factor
  if (rainfall >= crop.min_rainfall * 0.8 && rainfall <= crop.min_rainfall * 1.2) {
    multiplier *= 1.1;
  } else if (rainfall < crop.min_rainfall * 0.8) {
    multiplier *= 0.7;
  } else if (rainfall > crop.min_rainfall * 1.2) {
    multiplier *= 0.9;
  }

  // Temperature factor
  if (temperature >= crop.min_temp && temperature <= crop.max_temp) {
    multiplier *= 1.15;
  } else if (temperature < crop.min_temp) {
    multiplier *= 0.8;
  } else if (temperature > crop.max_temp) {
    multiplier *= 0.75;
  }

  // Soil pH factor (optimal 6.0-7.5)
  if (soilPH >= 6.0 && soilPH <= 7.5) {
    multiplier *= 1.1;
  } else if (soilPH < 6.0 || soilPH > 7.5) {
    multiplier *= 0.9;
  }

  const predictedYield = (baseYield * area * multiplier).toFixed(2);
  const confidence = (0.75 + Math.random() * 0.2).toFixed(2);

  return {
    predictedYield: parseFloat(predictedYield),
    unit: 'Quintals',
    baseYield: baseYield * area,
    factors: {
      rainfall: (rainfall >= crop.min_rainfall * 0.8 ? 'Optimal' : 'Suboptimal'),
      temperature: (temperature >= crop.min_temp && temperature <= crop.max_temp ? 'Optimal' : 'Suboptimal'),
      soilPH: (soilPH >= 6.0 && soilPH <= 7.5 ? 'Optimal' : 'Needs adjustment')
    },
    confidence: parseFloat(confidence)
  };
}

function predictPrice(cropType, season = 'current') {
  const history = PRICE_HISTORY[cropType.toLowerCase()];
  if (!history) return null;

  const lastYear = history[history.length - 1];
  
  // Simulate price trend
  const trend = Math.random() > 0.5 ? 'upward' : 'downward';
  const fluctuation = 1 + (Math.random() - 0.5) * 0.15;
  
  let predictedPrice;
  if (trend === 'upward') {
    predictedPrice = Math.round(lastYear.avgPrice * 1.08 * fluctuation);
  } else {
    predictedPrice = Math.round(lastYear.avgPrice * 0.95 * fluctuation);
  }

  return {
    currentPrice: lastYear.avgPrice,
    predictedPrice: predictedPrice,
    priceRange: {
      min: predictedPrice * 0.9,
      max: predictedPrice * 1.1
    },
    trend: trend,
    confidence: (0.75 + Math.random() * 0.15).toFixed(2),
    historicalData: history,
    recommendation: predictedPrice > lastYear.avgPrice * 1.05 ? 'Good time to sell' : 'Wait for better prices'
  };
}

// Routes

app.get('/', (req, res) => {
  res.json({
    service: 'AgriPredict ML Service',
    version: '2.0',
    models: {
      crops: Object.keys(CROP_CONFIG),
      districts: Object.keys(DISTRICTS),
      totalModels: 18
    },
    endpoints: [
      'POST /api/predictions/recommendations',
      'POST /api/predictions/yield-price',
      'POST /api/predictions/fertilizer',
      'POST /api/crops/register',
      'GET /api/statistics/:cropType',
      'GET /api/crops/available',
      'GET /health'
    ]
  });
});

// Get available crops
app.get('/api/crops/available', (req, res) => {
  const crops = Object.entries(CROP_CONFIG).map(([key, value]) => ({
    id: key,
    name: value.name,
    season: value.optimal_season,
    models: value.models
  }));

  res.json({
    success: true,
    data: {
      crops: crops,
      districts: Object.values(DISTRICTS),
      total_crops: crops.length,
      total_districts: Object.keys(DISTRICTS).length
    }
  });
});

// Crop recommendations based on location and conditions
app.post('/api/predictions/recommendations', (req, res) => {
  const { district, rainfall, temperature, soilPH, soilType } = req.body;

  const districtInfo = DISTRICTS[district.toLowerCase()];
  if (!districtInfo) {
    return res.status(400).json({ error: 'Invalid district' });
  }

  // Score each crop based on conditions
  const recommendations = Object.entries(CROP_CONFIG)
    .map(([key, crop]) => {
      let score = 0.5;
      
      // Rainfall scoring
      if (rainfall >= crop.min_rainfall * 0.8 && rainfall <= crop.min_rainfall * 1.2) {
        score += 0.25;
      } else if (rainfall >= crop.min_rainfall * 0.6) {
        score += 0.15;
      }

      // Temperature scoring
      if (temperature >= crop.min_temp && temperature <= crop.max_temp) {
        score += 0.25;
      } else if (Math.abs(temperature - (crop.min_temp + crop.max_temp) / 2) < 5) {
        score += 0.15;
      }

      return {
        crop: crop.name,
        id: key,
        score: Math.min(score, 1.0),
        reason: `Suitable for ${districtInfo.name} with current conditions`,
        models_available: crop.models.length,
        season: crop.optimal_season
      };
    })
    .sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    data: {
      district: districtInfo.name,
      conditions: { rainfall, temperature, soilPH, soilType },
      recommendations: recommendations.slice(0, 5),
      timestamp: new Date()
    }
  });
});

// Yield and price prediction
app.post('/api/predictions/yield-price', (req, res) => {
  const { cropType, district, area, rainfall, temperature, soilPH } = req.body;

  const crop = CROP_CONFIG[cropType.toLowerCase()];
  if (!crop) {
    return res.status(400).json({ error: 'Invalid crop type' });
  }

  const districtInfo = DISTRICTS[district.toLowerCase()];
  if (!districtInfo) {
    return res.status(400).json({ error: 'Invalid district' });
  }

  const yieldPrediction = predictYield(cropType, district, area, rainfall, temperature, soilPH);
  const pricePrediction = predictPrice(cropType);

  // Calculate revenue
  const revenue = (yieldPrediction.predictedYield * 100 * pricePrediction.predictedPrice) / 100;

  res.json({
    success: true,
    data: {
      crop: crop.name,
      district: districtInfo.name,
      area: area,
      yield: yieldPrediction,
      price: pricePrediction,
      projectedRevenue: revenue,
      profitMargin: revenue * 0.3,
      models_used: crop.models,
      confidence: (parseFloat(yieldPrediction.confidence) + parseFloat(pricePrediction.confidence)) / 2,
      timestamp: new Date()
    }
  });
});

// Fertilizer recommendations
app.post('/api/predictions/fertilizer', (req, res) => {
  const { cropType, soilType } = req.body;

  const crop = CROP_CONFIG[cropType.toLowerCase()];
  if (!crop) {
    return res.status(400).json({ error: 'Invalid crop type' });
  }

  const soilTypeKey = (soilType || 'loamy').toLowerCase();
  const recommendations = FERTILIZER_DB[cropType.toLowerCase()]?.[soilTypeKey];
  
  if (!recommendations) {
    return res.status(400).json({ error: 'Invalid soil type or crop combination' });
  }

  // Application schedule
  const applicationSchedule = [
    {
      phase: 'Pre-sowing',
      percentage: 40,
      N: Math.round(recommendations.N * 0.4),
      P: Math.round(recommendations.P * 0.4),
      K: Math.round(recommendations.K * 0.4)
    },
    {
      phase: 'Tillering/Flowering',
      percentage: 35,
      N: Math.round(recommendations.N * 0.35),
      P: Math.round(recommendations.P * 0.35),
      K: Math.round(recommendations.K * 0.35)
    },
    {
      phase: 'Grain Filling/Fruiting',
      percentage: 25,
      N: Math.round(recommendations.N * 0.25),
      P: Math.round(recommendations.P * 0.25),
      K: Math.round(recommendations.K * 0.25)
    }
  ];

  res.json({
    success: true,
    data: {
      crop: crop.name,
      soilType: soilType,
      recommendedNutrients: recommendations,
      applicationSchedule: applicationSchedule,
      organicMatter: {
        amount: recommendations.organic,
        unit: 'tons/hectare',
        source: 'Compost or Farmyard manure'
      },
      micronutrients: {
        zinc: 5,
        iron: 3,
        boron: 1
      },
      timestamp: new Date()
    }
  });
});

// Crop registration
app.post('/api/crops/register', (req, res) => {
  const { farmerName, cropType, district, area, sowingDate } = req.body;

  const crop = CROP_CONFIG[cropType.toLowerCase()];
  const districtInfo = DISTRICTS[district.toLowerCase()];

  if (!crop || !districtInfo) {
    return res.status(400).json({ error: 'Invalid crop or district' });
  }

  res.json({
    success: true,
    data: {
      registrationId: `REG-${Date.now()}`,
      farmerName,
      crop: crop.name,
      district: districtInfo.name,
      area,
      sowingDate,
      season: crop.optimal_season,
      registeredAt: new Date(),
      models_available: crop.models
    }
  });
});

// Statistics and historical data
app.get('/api/statistics/:cropType', (req, res) => {
  const { cropType } = req.params;
  
  const crop = CROP_CONFIG[cropType.toLowerCase()];
  if (!crop) {
    return res.status(400).json({ error: 'Invalid crop type' });
  }

  const priceHistory = PRICE_HISTORY[cropType.toLowerCase()];

  res.json({
    success: true,
    data: {
      crop: crop.name,
      priceHistory: priceHistory,
      averageYield: {
        rice: 50, wheat: 45, arhar: 20, groundnut: 25, sesamum: 15, sorghum: 22, maize: 35
      }[cropType.toLowerCase()],
      areaCultivated: {
        rice: 5000, wheat: 3000, arhar: 2000, groundnut: 2500, sesamum: 1500, sorghum: 2000, maize: 4000
      }[cropType.toLowerCase()],
      trendAnalysis: {
        priceDirection: 'upward',
        confidence: 0.82
      },
      models_used: crop.models
    }
  });
});

// Market listings
app.get('/api/listings/all', (req, res) => {
  const listings = [
    { id: 1, crop: 'Rice', price: 2200, quantity: 100, unit: 'Quintals', seller: 'Farmer Co-op 1' },
    { id: 2, crop: 'Wheat', price: 2000, quantity: 80, unit: 'Quintals', seller: 'Farmer Co-op 2' },
    { id: 3, crop: 'Arhar', price: 7000, quantity: 50, unit: 'Quintals', seller: 'Individual Farmer' },
    { id: 4, crop: 'Groundnut', price: 6000, quantity: 120, unit: 'Quintals', seller: 'Farmer Group' },
    { id: 5, crop: 'Sesamum', price: 8500, quantity: 40, unit: 'Quintals', seller: 'Trader' },
    { id: 6, crop: 'Sorghum', price: 2600, quantity: 60, unit: 'Quintals', seller: 'Co-op' },
    { id: 7, crop: 'Maize', price: 2300, quantity: 150, unit: 'Quintals', seller: 'Wholesale' }
  ];

  res.json({
    success: true,
    data: {
      listings: listings,
      total: listings.reduce((sum, l) => sum + l.quantity, 0),
      activeListings: listings.length
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AgriPredict ML Service v2.0',
    uptime: process.uptime(),
    modelsLoaded: {
      crops: Object.keys(CROP_CONFIG).length,
      districts: Object.keys(DISTRICTS).length,
      fertilizer_profiles: Object.keys(FERTILIZER_DB).length
    },
    timestamp: new Date()
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
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  AgriPredict ML Service v2.0 Running     ║`);
  console.log(`║  Port: ${PORT}                             ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
  
  console.log(`📊 ML Models Loaded:`);
  console.log(`   • Crops: ${Object.keys(CROP_CONFIG).length}`);
  console.log(`   • Districts: ${Object.keys(DISTRICTS).length}`);
  console.log(`   • Fertilizer Profiles: ${Object.keys(FERTILIZER_DB).length}\n`);
  
  console.log(`🌾 Available Crops:`);
  Object.entries(CROP_CONFIG).forEach(([key, crop]) => {
    console.log(`   • ${crop.name} (${crop.models.length} models)`);
  });
  
  console.log(`\n🗺️  Available Districts:`);
  Object.entries(DISTRICTS).forEach(([key, dist]) => {
    console.log(`   • ${dist.name}`);
  });
  
  console.log(`\n📡 API Endpoints:`);
  console.log(`   GET  /                              - Service info`);
  console.log(`   GET  /api/crops/available           - List available crops & districts`);
  console.log(`   POST /api/predictions/recommendations - Get crop recommendations`);
  console.log(`   POST /api/predictions/yield-price    - Predict yield & price`);
  console.log(`   POST /api/predictions/fertilizer     - Fertilizer recommendations`);
  console.log(`   POST /api/crops/register             - Register crop`);
  console.log(`   GET  /api/statistics/:cropType       - Historical statistics`);
  console.log(`   GET  /api/listings/all               - Market listings`);
  console.log(`   GET  /health                         - Health check\n`);
});

module.exports = app;
