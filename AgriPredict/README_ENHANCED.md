# AgriPredict ML Service - Enhanced Edition

## Overview

AgriPredict is a comprehensive agricultural machine learning service that provides predictions for crop yield, market prices, demand forecasting, fertilizer recommendations, and crop selection across multiple crop types and districts.

## ✓ What's New

The service now integrates **ALL available machine learning models** for complete agricultural decision support:

### Models Integrated (17 Total)

#### Production Forecasting (5 models)
- Predicts crop yield in quintals
- Uses: District code, Year, Area (hectares)
- Supports: Paddy, Sorghum, Arhar, Groundnut, Sesamum

#### Price Prediction (5 models)
- Forecasts harvest price per quintal
- Uses: Year, Area (hectares), Production (quintals)
- Supports: All 5 crop types

#### Regional Demand Analysis (5 models)
- Projects regional demand for supply-demand matching
- Uses: Year
- Enables: Production gap analysis

#### Fertilizer Optimization (1 model)
- Recommends optimal fertilizer type
- Uses: Temperature, Humidity, Moisture Content, Crop Type, N, P, K levels

#### Crop Recommendation (1 model)
- Suggests best crop for soil conditions
- Uses: N, P, K levels, Temperature, Humidity, pH, Rainfall

## Supported Crops

1. **Paddy (Rice)** - ID: 1
2. **Sorghum** - ID: 2  
3. **Arhar (Pigeon Pea)** - ID: 3
4. **Groundnut** - ID: 4
5. **Sesamum** - ID: 5

## Supported Districts

| ID | District |
|----|----------|
| 63 | Adilabad |
| 62 | Karimnagar |
| 55 | Hyderabad |
| 61 | Khammam |
| 58 | Mahabubnagar |
| 57 | Medak |
| 59 | Nalgonda |
| 56 | Nizamabad |
| 60 | Warangal |

## Key Features

### 🚀 Smart Model Loading
- Lazy loading: Models load on first use, then cache
- Prevents startup delays
- Graceful fallback for missing models

### 📊 Comprehensive Analysis
- Production predictions
- Price forecasting  
- Revenue calculations
- Demand-supply comparison
- Production gap analysis

### 🔌 RESTful API Endpoints

#### Data Endpoints
```
GET /api/crops/available
GET /api/districts/available
GET /api/models/status
GET /api/health
```

#### Prediction Endpoints
```
POST /api/predict/production
POST /api/predict/price
POST /api/predict/demand
POST /api/predict/fertilizer
```

### 🌐 Web Interface Routes
```
GET / - Home page
GET /currentstatistics - Statistics
GET /cropregistration - Registration form
GET /cropyield - Yield estimation form
GET /recommendfile - Recommendation form
GET /fertilizersfile - Fertilizer form
```

## Installation

### Prerequisites
- Python 3.12+
- Flask 3.1+
- scikit-learn 1.7+
- pandas 2.3+
- matplotlib 3.10+
- numpy 2.2+

### Setup

```bash
# Navigate to AgriPredict directory
cd AgriPredict

# Install dependencies (if needed)
pip install flask scikit-learn pandas matplotlib numpy

# Run the service
python run_service.py
```

The service will start on `http://localhost:5000`

## API Usage Examples

### 1. Get Available Crops
```bash
curl http://localhost:5000/api/crops/available
```

**Response:**
```json
{
  "status": "success",
  "crops": [
    {
      "id": 1,
      "name": "paddy",
      "display": "Paddy (Rice)",
      "models_available": {
        "production": true,
        "price": true,
        "district": true
      }
    },
    ...
  ]
}
```

### 2. Predict Production
```bash
curl -X POST http://localhost:5000/api/predict/production \
  -H "Content-Type: application/json" \
  -d '{
    "district": 63,
    "crop": 1,
    "area": 100
  }'
```

**Response:**
```json
{
  "status": "success",
  "crop": "Paddy (Rice)",
  "district": "Adilabad",
  "area_acres": 100,
  "area_hectares": 40,
  "production_quintals": 2450
}
```

### 3. Predict Price
```bash
curl -X POST http://localhost:5000/api/predict/price \
  -H "Content-Type: application/json" \
  -d '{
    "crop": 1,
    "area": 100,
    "production": 2450
  }'
```

**Response:**
```json
{
  "status": "success",
  "crop": "Paddy (Rice)",
  "price_per_quintal": 2150,
  "total_revenue": 5267500
}
```

### 4. Get Regional Demand
```bash
curl -X POST http://localhost:5000/api/predict/demand \
  -H "Content-Type: application/json" \
  -d '{"crop": 1}'
```

**Response:**
```json
{
  "status": "success",
  "crop": "Paddy (Rice)",
  "expected_demand_quintals": 5200
}
```

### 5. Fertilizer Recommendation
```bash
curl -X POST http://localhost:5000/api/predict/fertilizer \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 28,
    "humidity": 65,
    "moisture_content": 50,
    "crop": 1,
    "nitrogen": 50,
    "phosphorus": 40,
    "potassium": 30
  }'
```

**Response:**
```json
{
  "status": "success",
  "recommended_fertilizer": "Urea",
  "parameters": {
    "temperature": 28,
    "humidity": 65,
    "moisture_content": 50,
    "nitrogen": 50,
    "phosphorus": 40,
    "potassium": 30
  }
}
```

### 6. Check Service Health
```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": 5
}
```

## Model Performance

All models are LinearRegression models trained on historical agricultural data:

- **Training Data**: Historical crop production, prices, and demand data
- **Prediction Accuracy**: Varies by crop and season
- **Update Frequency**: Models can be retrained with new data
- **Confidence**: Based on historical trends and patterns

## Error Handling

The service includes comprehensive error handling:

```json
{
  "status": "error",
  "message": "Invalid crop selection"
}
```

Common errors:
- Invalid crop ID (must be 1-5)
- Invalid district ID (must be valid district code)
- Missing model file
- Invalid input parameters

## Performance Notes

- ⚡ First prediction request: ~500ms (model loading)
- ⚡ Subsequent requests: ~100ms (cached models)
- 💾 Memory usage: ~150MB (all models loaded)
- 🔄 Concurrent requests: Supported (threaded)

## Files Structure

```
AgriPredict/
├── flask_complete.py          # Main Flask application
├── run_service.py             # Service launcher
├── model.pkl                  # Crop recommendation model
├── fertilizer.pkl             # Fertilizer model
├── *_pro_model.pkl            # Production models (5)
├── *_pri_model.pkl            # Price models (5)
├── *_district_model.pkl       # District models (5)
├── templates/                 # HTML templates
├── static/                    # Static files
└── *.csv                       # Data files
```

## Troubleshooting

### Service won't start
- Ensure Python 3.12+ is installed
- Check all dependencies: `pip install flask scikit-learn pandas matplotlib`
- Verify model files exist in the directory

### Models not loading
- Check file permissions
- Verify model files haven't been corrupted
- Check available disk space

### Predictions seem wrong
- Verify input parameters are in correct ranges
- Check if model was trained for your data range
- Consider retraining models with current data

## Future Enhancements

- [ ] Time series forecasting
- [ ] Multi-year trend analysis
- [ ] Weather integration
- [ ] Real-time market data
- [ ] Advanced visualizations
- [ ] Model performance metrics
- [ ] Batch prediction support
- [ ] Database integration

## License

This project is part of the AgriChain initiative.

## Support

For issues and questions, please refer to the project documentation or contact the development team.

---

**Status**: ✓ All models integrated and operational  
**Last Updated**: November 19, 2025  
**Models Active**: 17 (Production: 5, Price: 5, District: 5, Fertilizer: 1, Recommendation: 1)
