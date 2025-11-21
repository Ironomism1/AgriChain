#!/usr/bin/env python3
"""Simplified AgriPredict Mock Service for development"""

from flask import Flask, request, jsonify
import random

app = Flask(__name__)

@app.route('/')
def health():
    return {'status': 'ok'}, 200

@app.route('/api/recommendations/crop', methods=['POST'])
def recommendations():
    return {
        'recommendations': [
            {'crop': 'Paddy', 'confidence': 0.92},
            {'crop': 'Arhar', 'confidence': 0.85}
        ]
    }, 200

@app.route('/api/predictions/yield-price', methods=['POST'])
def predictions():
    data = request.json or {}
    crop = data.get('crop', 'Paddy')
    area = data.get('area', 5)
    return {
        'crop': crop,
        'area_acres': area,
        'yield_kg': int(2500 * area + random.randint(-200, 200)),
        'price_per_kg': 35 + random.randint(-2, 2),
        'total_revenue': int(87500 * area * (35 + random.randint(-2, 2)) / 35)
    }, 200

@app.route('/api/analytics/demand', methods=['GET'])
def demand():
    return {
        'demand_level': random.choice(['LOW', 'MEDIUM', 'HIGH']),
        'competitors': random.randint(5, 20)
    }, 200

@app.route('/api/recommendations/fertilizer', methods=['POST'])
def fertilizer():
    return {
        'npk': {'nitrogen': 20, 'phosphorus': 15, 'potassium': 10}
    }, 200

@app.route('/api/market/prices', methods=['GET'])
def prices():
    return {
        'current_price': 35,
        'trend': random.choice(['UP', 'DOWN', 'STABLE'])
    }, 200

if __name__ == '__main__':
    try:
        print("Starting Flask service on port 5000...")
        app.run(host='127.0.0.1', port=5000, debug=False)
    except Exception as e:
        print(f"Error: {e}")
