const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const AgriPredictService = require('../services/agriPredictService');
const Farm = require('../models/Farm');
const Listing = require('../models/Listing');

/**
 * POST /api/predictions/recommendations-public
 * Get crop recommendations (PUBLIC - no auth required)
 */
router.post('/recommendations-public', async (req, res) => {
  try {
    const { nitrogen, phosphorus, potassium, temperature, ph, rainfall, humidity } = req.body;

    const recommendations = await AgriPredictService.getCropRecommendations({
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      ph,
      rainfall,
      humidity
    });

    res.status(200).json({
      message: 'Crop recommendations retrieved',
      recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/predictions/recommendations
 * Get crop recommendations based on soil parameters
 * This connects to AgriPredict service
 */
router.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { nitrogen, phosphorus, potassium, temperature, ph, rainfall, humidity } = req.body;

    // Call AgriPredict service
    const recommendations = await AgriPredictService.getCropRecommendations({
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      ph,
      rainfall,
      humidity
    });

    // Save to farm profile if farmer
    if (req.user.role === 'farmer') {
      const farm = await Farm.findOne({ farmerId: req.user.id });
      if (farm) {
        farm.recommendationsHistory.push({
          crop: recommendations.crop || recommendations.recommended_crop,
          confidence: recommendations.confidence || 0.85,
          date: new Date()
        });
        await farm.save();
      }
    }

    res.status(200).json({
      message: 'Crop recommendations retrieved',
      recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/predictions/yield-price-public
 * Predict yield and price for a crop (PUBLIC - no auth required)
 */
router.post('/yield-price-public', async (req, res) => {
  try {
    const { crop, district, areaAcres } = req.body;

    const prediction = await AgriPredictService.getPrediction(crop, district, areaAcres);

    res.status(200).json({
      message: 'Yield and price prediction retrieved',
      prediction
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/predictions/yield-price
 * Predict yield and price for a crop
 */
router.post('/yield-price', authMiddleware, async (req, res) => {
  try {
    const { crop, district, areaAcres } = req.body;

    // Call AgriPredict service
    const prediction = await AgriPredictService.getPrediction(crop, district, areaAcres);

    res.status(200).json({
      message: 'Yield and price prediction retrieved',
      prediction
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/predictions/demand-public
 * Get demand forecast for a crop (PUBLIC - no auth required)
 */
router.get('/demand-public', async (req, res) => {
  try {
    const { crop, district } = req.query;

    if (!crop || !district) {
      return res.status(400).json({ error: 'Crop and district are required' });
    }

    const demand = await AgriPredictService.getDemandForecast(crop, district);

    res.status(200).json({
      message: 'Demand forecast retrieved',
      demand
    });
  } catch (error) {
    console.error('Demand error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/predictions/demand
 * Get demand forecast for a crop in a region
 */
router.get('/demand', authMiddleware, async (req, res) => {
  try {
    const { crop, district } = req.query;

    if (!crop || !district) {
      return res.status(400).json({ error: 'Crop and district are required' });
    }

    // Call AgriPredict service
    const demand = await AgriPredictService.getDemandForecast(crop, district);

    res.status(200).json({
      message: 'Demand forecast retrieved',
      demand
    });
  } catch (error) {
    console.error('Demand error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/predictions/fertilizer-public
 * Get fertilizer recommendations (PUBLIC - no auth required)
 */
router.post('/fertilizer-public', async (req, res) => {
  try {
    const { crop, nitrogen, phosphorus, potassium, temperature, humidity, moisture } = req.body;

    const fertilizer = await AgriPredictService.getFertilizerRecommendation(crop, {
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      humidity,
      moisture
    });

    res.status(200).json({
      message: 'Fertilizer recommendation retrieved',
      fertilizer
    });
  } catch (error) {
    console.error('Fertilizer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/predictions/fertilizer
 * Get fertilizer recommendations for a crop and soil
 */
router.post('/fertilizer', authMiddleware, async (req, res) => {
  try {
    const { crop, nitrogen, phosphorus, potassium, temperature, humidity, moisture } = req.body;

    // Call AgriPredict service
    const fertilizer = await AgriPredictService.getFertilizerRecommendation(crop, {
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      humidity,
      moisture
    });

    res.status(200).json({
      message: 'Fertilizer recommendation retrieved',
      fertilizer
    });
  } catch (error) {
    console.error('Fertilizer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/predictions/market-opportunities
 * Get high-margin crop opportunities in farmer's region
 */
router.get('/market-opportunities', [authMiddleware, roleMiddleware(['farmer'])], async (req, res) => {
  try {
    const farm = await Farm.findOne({ farmerId: req.user.id });
    if (!farm) {
      return res.status(404).json({ error: 'Farm profile not found' });
    }

    const crops = ['Paddy', 'Arhar', 'Sorghum', 'Groundnut', 'Sesamum'];
    const opportunities = [];

    for (const crop of crops) {
      try {
        const prediction = await AgriPredictService.getPrediction(crop, farm.district, farm.areaAcres);
        const demand = await AgriPredictService.getDemandForecast(crop, farm.district);

        opportunities.push({
          crop,
          predictedYield: prediction.predicted_yield_kg || 0,
          predictedPrice: prediction.predicted_price_per_kg || 0,
          expectedRevenue: (prediction.predicted_yield_kg || 0) * (prediction.predicted_price_per_kg || 0),
          demandLevel: demand.demand_level || 'Unknown',
          competitorCount: demand.active_listings || 0
        });
      } catch (e) {
        // Skip if prediction fails
      }
    }

    // Sort by expected revenue descending
    opportunities.sort((a, b) => b.expectedRevenue - a.expectedRevenue);

    res.status(200).json({
      message: 'Market opportunities identified',
      opportunities: opportunities.slice(0, 5)
    });
  } catch (error) {
    console.error('Market opportunities error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
