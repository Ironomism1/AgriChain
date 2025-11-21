#!/usr/bin/env python3
"""
Mock AgriPredict Flask Service
Runs on port 5000 and provides ML predictions for the unified backend
"""

from flask import Flask, request, jsonify
import random
from datetime import datetime, timedelta

app = Flask(__name__)

# Mock data for testing
CROPS = {
    'Paddy': {'yield_kg_per_acre': 2500, 'price_per_kg': 35},
    'Arhar': {'yield_kg_per_acre': 1200, 'price_per_kg': 55},
    'Sorghum': {'yield_kg_per_acre': 1800, 'price_per_kg': 28},
    'Groundnut': {'yield_kg_per_acre': 1500, 'price_per_kg': 65},
    'Sesamum': {'yield_kg_per_acre': 900, 'price_per_kg': 85},
}

DISTRICTS = ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahabubnagar', 'Medak', 'Nalgonda', 'Nizamabad', 'Warangal']

# ============================================================================
# Health Check
# ============================================================================

@app.route('/', methods=['GET'])
def health():
    return jsonify({
        'status': 'AgriPredict ML Service Running',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================================================
# Crop Recommendations (from soil data)
# ============================================================================

@app.route('/api/recommendations/crop', methods=['POST'])
def crop_recommendations():
    """
    Input: soil parameters (nitrogen, phosphorus, potassium, temperature, ph, rainfall, humidity)
    Output: recommended crops with confidence scores
    """
    try:
        data = request.json
        
        # Mock recommendation logic based on soil data
        nitrogen = data.get('nitrogen', 0)
        ph = data.get('ph', 6.5)
        rainfall = data.get('rainfall', 600)
        
        recommendations = []
        
        if 30 <= nitrogen <= 50 and 6.0 <= ph <= 7.5 and rainfall > 700:
            recommendations.append({
                'crop': 'Paddy',
                'confidence': 0.92,
                'reason': 'Optimal nitrogen and rainfall for paddy'
            })
        
        if 20 <= nitrogen <= 40 and 6.5 <= ph <= 8.0 and rainfall > 500:
            recommendations.append({
                'crop': 'Groundnut',
                'confidence': 0.85,
                'reason': 'Suitable pH and rainfall'
            })
        
        if 25 <= nitrogen <= 45 and 6.0 <= ph <= 7.8 and rainfall > 400:
            recommendations.append({
                'crop': 'Arhar',
                'confidence': 0.80,
                'reason': 'Good nitrogen levels'
            })
        
        if 15 <= nitrogen <= 35 and 6.0 <= ph <= 8.0:
            recommendations.append({
                'crop': 'Sorghum',
                'confidence': 0.78,
                'reason': 'Tolerant to current conditions'
            })
        
        if nitrogen >= 25 and 5.5 <= ph <= 8.0:
            recommendations.append({
                'crop': 'Sesamum',
                'confidence': 0.75,
                'reason': 'Can grow in current soil'
            })
        
        # Sort by confidence
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations[:5],  # Top 5
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============================================================================
# Yield & Price Predictions
# ============================================================================

@app.route('/api/predictions/yield-price', methods=['POST'])
def yield_price_prediction():
    """
    Input: crop, district, area_acres
    Output: predicted yield and market price
    """
    try:
        data = request.json
        crop = data.get('crop', 'Paddy')
        area = data.get('area', 5)
        district = data.get('district', 'Adilabad')
        
        if crop not in CROPS:
            crop = 'Paddy'  # Default
        
        crop_data = CROPS[crop]
        
        # Mock prediction with some randomness
        yield_per_acre = crop_data['yield_kg_per_acre'] + random.randint(-100, 200)
        total_yield = yield_per_acre * area
        price_per_kg = crop_data['price_per_kg'] + random.randint(-3, 5)
        total_revenue = total_yield * price_per_kg
        
        return jsonify({
            'status': 'success',
            'crop': crop,
            'district': district,
            'area_acres': area,
            'yield_per_acre_kg': yield_per_acre,
            'total_yield_kg': total_yield,
            'price_per_kg': price_per_kg,
            'expected_revenue': total_revenue,
            'confidence': 0.87,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============================================================================
# Market Demand Forecast
# ============================================================================

@app.route('/api/analytics/demand', methods=['GET'])
def demand_forecast():
    """
    Input: crop, district
    Output: demand level and market competition
    """
    try:
        crop = request.args.get('crop', 'Paddy')
        district = request.args.get('district', 'Adilabad')
        days = request.args.get('days', 30, type=int)
        
        demand_levels = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']
        demand = random.choice(demand_levels)
        
        forecast = []
        for i in range(0, days, 7):
            forecast.append({
                'date': (datetime.now() + timedelta(days=i)).isoformat(),
                'demand_level': random.choice(demand_levels),
                'price_trend': random.choice(['UP', 'DOWN', 'STABLE'])
            })
        
        return jsonify({
            'status': 'success',
            'crop': crop,
            'district': district,
            'current_demand': demand,
            'competitors': random.randint(5, 25),
            'forecast': forecast,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============================================================================
# Fertilizer Recommendations
# ============================================================================

@app.route('/api/recommendations/fertilizer', methods=['POST'])
def fertilizer_recommendation():
    """
    Input: crop, soil parameters
    Output: NPK ratios and fertilizer recommendations
    """
    try:
        data = request.json
        crop = data.get('crop', 'Paddy')
        nitrogen = data.get('nitrogen', 40)
        phosphorus = data.get('phosphorus', 25)
        potassium = data.get('potassium', 10)
        
        # Mock recommendations based on crop and current soil
        if crop == 'Paddy':
            n_needed = max(0, 60 - nitrogen)
            p_needed = max(0, 40 - phosphorus)
            k_needed = max(0, 30 - potassium)
        elif crop == 'Groundnut':
            n_needed = max(0, 50 - nitrogen)
            p_needed = max(0, 30 - phosphorus)
            k_needed = max(0, 40 - potassium)
        else:
            n_needed = max(0, 50 - nitrogen)
            p_needed = max(0, 30 - phosphorus)
            k_needed = max(0, 25 - potassium)
        
        return jsonify({
            'status': 'success',
            'crop': crop,
            'current_npk': {
                'nitrogen': nitrogen,
                'phosphorus': phosphorus,
                'potassium': potassium
            },
            'recommended_npk': {
                'nitrogen': n_needed,
                'phosphorus': p_needed,
                'potassium': k_needed
            },
            'fertilizer_types': [
                {'type': 'Urea', 'quantity_kg': n_needed / 0.46},
                {'type': 'Diammonium Phosphate (DAP)', 'quantity_kg': (p_needed + n_needed * 0.25) / 0.46},
                {'type': 'Potassium Chloride', 'quantity_kg': k_needed / 0.6}
            ],
            'application_schedule': [
                {'timing': 'Basal', 'percentage': 50},
                {'timing': 'Top dressing 1', 'percentage': 25, 'days': 30},
                {'timing': 'Top dressing 2', 'percentage': 25, 'days': 60}
            ],
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============================================================================
# Price Trends
# ============================================================================

@app.route('/api/market/prices', methods=['GET'])
def price_trends():
    """
    Input: crop, district, days
    Output: historical and forecasted prices
    """
    try:
        crop = request.args.get('crop', 'Paddy')
        district = request.args.get('district', 'Adilabad')
        days = request.args.get('days', 30, type=int)
        
        if crop not in CROPS:
            crop = 'Paddy'
        
        base_price = CROPS[crop]['price_per_kg']
        
        prices = []
        for i in range(-days, 0):
            date = datetime.now() + timedelta(days=i)
            variation = random.randint(-5, 10)
            prices.append({
                'date': date.isoformat(),
                'price': base_price + variation,
                'type': 'historical'
            })
        
        # Future forecast
        for i in range(1, 15):
            date = datetime.now() + timedelta(days=i)
            variation = random.randint(-3, 8)
            prices.append({
                'date': date.isoformat(),
                'price': base_price + variation,
                'type': 'forecast'
            })
        
        return jsonify({
            'status': 'success',
            'crop': crop,
            'district': district,
            'current_price': base_price,
            'avg_price_30days': base_price + random.randint(-2, 2),
            'min_price': base_price - 5,
            'max_price': base_price + 5,
            'price_trend': random.choice(['UPWARD', 'DOWNWARD', 'STABLE']),
            'prices': prices,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    print("=" * 70)
    print("AgriPredict ML Service - Mock Server")
    print("=" * 70)
    print("✓ Flask server starting on port 5000")
    print("✓ Running in development mode")
    print("Available endpoints:")
    print("  - POST /api/recommendations/crop")
    print("  - POST /api/predictions/yield-price")
    print("  - GET  /api/analytics/demand")
    print("  - POST /api/recommendations/fertilizer")
    print("  - GET  /api/market/prices")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
