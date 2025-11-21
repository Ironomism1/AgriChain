from flask import Flask, request, render_template, jsonify
import pickle
import numpy as np
import csv
import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
try:
    plt.style.use('seaborn-v0_8-darkgrid')
except OSError:
    try:
        plt.style.use('seaborn-darkgrid')
    except OSError:
        plt.style.use('default')
import pandas as pd
import os
from pathlib import Path

#flask app
app = Flask(__name__)

# ==================== MODEL LOADING & CONFIGURATION ====================

# Define all available crops
CROP_CONFIGS = {
    1: {'name': 'paddy', 'display': 'Paddy (Rice)'},
    2: {'name': 'sorghum', 'display': 'Sorghum'},
    3: {'name': 'arhar', 'display': 'Arhar (Pigeon Pea)'},
    4: {'name': 'groundnut', 'display': 'Groundnut'},
    5: {'name': 'sesamum', 'display': 'Sesamum'}
}

# Districts mapping
DISTRICTS = {
    63: 'Adilabad',
    62: 'Karimnagar',
    55: 'Hyderabad',
    61: 'Khammam',
    58: 'Mahabubnagar',
    57: 'Medak',
    59: 'Nalgonda',
    56: 'Nizamabad',
    60: 'Warangal'
}

# Global model cache
models_cache = {
    'production': {},  # pro_model files
    'price': {},       # pri_model files
    'district': {},    # district_model files
    'fertilizer': None,
    'recommendation': None
}

def load_model_lazy(filename):
    """Lazy load a model file only when needed"""
    try:
        if os.path.exists(filename):
            return pickle.load(open(filename, "rb"))
    except Exception as e:
        print(f"✗ Error loading {filename}: {e}")
    return None

def load_all_models():
    """Pre-load all models at startup for performance"""
    try:
        print("Loading models (this may take a moment)...")
        # Load production models for each crop
        for crop_id, crop_config in CROP_CONFIGS.items():
            crop_name = crop_config['name']
            pro_model_path = f"{crop_name}_pro_model.pkl"
            pri_model_path = f"{crop_name}_pri_model.pkl"
            dist_model_path = f"{crop_name}_district_model.pkl"
            
            # Production models
            if os.path.exists(pro_model_path):
                try:
                    models_cache['production'][crop_name] = pickle.load(open(pro_model_path, "rb"))
                    print(f"  [OK] {crop_name} production model")
                except Exception as e:
                    print(f"  [WARNING] Failed to load {crop_name} production model: {e}")
            
            # Price models
            if os.path.exists(pri_model_path):
                try:
                    models_cache['price'][crop_name] = pickle.load(open(pri_model_path, "rb"))
                    print(f"  [OK] {crop_name} price model")
                except Exception as e:
                    print(f"  [WARNING] Failed to load {crop_name} price model: {e}")
            
            # District models
            if os.path.exists(dist_model_path):
                try:
                    models_cache['district'][crop_name] = pickle.load(open(dist_model_path, "rb"))
                    print(f"  [OK] {crop_name} district model")
                except Exception as e:
                    print(f"  [WARNING] Failed to load {crop_name} district model: {e}")
        
        # Load fertilizer model
        if os.path.exists("fertilizer.pkl"):
            try:
                models_cache['fertilizer'] = pickle.load(open("fertilizer.pkl", "rb"))
                print(f"  [OK] Fertilizer model")
            except Exception as e:
                print(f"  [WARNING] Failed to load fertilizer model: {e}")
        
        # Load crop recommendation model
        if os.path.exists("model.pkl"):
            try:
                models_cache['recommendation'] = pickle.load(open("model.pkl", "rb"))
                print(f"  [OK] Crop recommendation model")
            except Exception as e:
                print(f"  [WARNING] Failed to load recommendation model: {e}")
        
        print("OK - All models loaded!")
        return True
    except Exception as e:
        print(f"ERROR - Error loading models: {e}")
        return False

# Load models when app starts
try:
    print("\n" + "="*60)
    print("AgriPredict Initialization")
    print("="*60)
    load_all_models()
    print("OK - All models loaded successfully!")
except Exception as e:
    print(f"WARNING - Error during model loading: {e}")
    import traceback
    traceback.print_exc()

def get_production_model(crop_name):
    """Get production model for a crop - load if not cached"""
    if crop_name not in models_cache['production']:
        model_file = f"{crop_name}_pro_model.pkl"
        if os.path.exists(model_file):
            try:
                models_cache['production'][crop_name] = pickle.load(open(model_file, "rb"))
            except Exception as e:
                print(f"Error loading {model_file}: {e}")
                return None
    return models_cache['production'].get(crop_name)

def get_price_model(crop_name):
    """Get price model for a crop - load if not cached"""
    if crop_name not in models_cache['price']:
        model_file = f"{crop_name}_pri_model.pkl"
        if os.path.exists(model_file):
            try:
                models_cache['price'][crop_name] = pickle.load(open(model_file, "rb"))
            except Exception as e:
                print(f"Error loading {model_file}: {e}")
                return None
    return models_cache['price'].get(crop_name)

def get_district_model(crop_name):
    """Get district demand model for a crop - load if not cached"""
    if crop_name not in models_cache['district']:
        model_file = f"{crop_name}_district_model.pkl"
        if os.path.exists(model_file):
            try:
                models_cache['district'][crop_name] = pickle.load(open(model_file, "rb"))
            except Exception as e:
                print(f"Error loading {model_file}: {e}")
                return None
    return models_cache['district'].get(crop_name)

def get_fertilizer_model():
    """Get fertilizer model - load if not cached"""
    if models_cache['fertilizer'] is None and os.path.exists("fertilizer.pkl"):
        try:
            models_cache['fertilizer'] = pickle.load(open("fertilizer.pkl", "rb"))
        except Exception as e:
            print(f"Error loading fertilizer.pkl: {e}")
    return models_cache['fertilizer']

def get_recommendation_model():
    """Get crop recommendation model - load if not cached"""
    if models_cache['recommendation'] is None and os.path.exists("model.pkl"):
        try:
            models_cache['recommendation'] = pickle.load(open("model.pkl", "rb"))
        except Exception as e:
            print(f"Error loading model.pkl: {e}")
    return models_cache['recommendation']

@app.route('/')
def default():
    return render_template('main.html')

@app.route('/currentstatistics')
def currentstatistics():
    return render_template('current_statistics.html')

@app.route('/cropregistration')
def cropregistration():
    return render_template('crop_registration.html')

@app.route('/cropyield')
def cropyield():
    return render_template('crop_estimation.html')

def reg_dist(name, crop_name, dist, area, pro_predictions):
    if dist == 63:
        with open('adilabad_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 62:
        with open('karimnagar_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 55:
        with open('hyderabad_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 61:
        with open('khammam_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 58:
        with open('mahabubnagar_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 57:
        with open('medak_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 59:
        with open('nalgonda_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 56:
        with open('nizamabad_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    elif dist == 60:
        with open('warangal_user_crop_entry.csv', 'a', newline='') as crop_entry:
            write_data = csv.writer(crop_entry, delimiter=',')
            write_data.writerow([name, 2022, crop_name, int(area), int(pro_predictions)])

    crop_entry.close()

@app.route('/estimation', methods=["POST","GET"])
def estimation():
    try:
        dist = int(request.form.get("dist"))
        n = int(request.form.get("crop"))
        area = int(request.form.get("area"))
        
        # Get crop name from config
        if n not in CROP_CONFIGS:
            return render_template("result_page.html", prediction_text="Invalid crop selection!")
        
        crop_name = CROP_CONFIGS[n]['name']
        crop_display = CROP_CONFIGS[n]['display']
        area_hectares = int(area / 2.47)
        
        # Get production prediction
        pro_model = get_production_model(crop_name)
        if not pro_model:
            return render_template("result_page.html", prediction_text=f"Production model not available for {crop_display}")
        
        production = pro_model.predict([[dist, 2022, area_hectares]])[0]
        
        # Get price prediction
        price_model = get_price_model(crop_name)
        price = 0
        if price_model:
            price = price_model.predict([[2022, area_hectares, int(production)]])[0]
        
        # Get district demand
        district_model = get_district_model(crop_name)
        district_demand = 0
        if district_model:
            district_demand = district_model.predict([[2022]])[0]
        
        # Calculate profits and insights
        total_production_quintals = int(production)
        estimated_price = int(price)
        estimated_revenue = total_production_quintals * estimated_price
        
        # Determine if production meets district demand
        demand_status = "✓ Exceeds demand" if production > district_demand else "✗ Below demand"
        production_gap = abs(int(district_demand - production))
        
        prediction_text = f"""
        {crop_display} Prediction Report
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        District: {DISTRICTS.get(dist, 'Unknown')}
        
        🌾 Production Analysis:
           • Expected Yield: {total_production_quintals:,} Quintals
           • District Demand: {int(district_demand):,} Quintals
           • Status: {demand_status}
           • Gap: {production_gap:,} Quintals
        
        💰 Price Analysis:
           • Estimated Price: ₹{estimated_price:,} per Quintal
           • Estimated Revenue: ₹{estimated_revenue:,}
        
        📊 Area Information:
           • Input Area: {area} acres
           • Converted Area: {area_hectares} hectares
        """
        
        return render_template("result_page.html", prediction_text=prediction_text)
    
    except Exception as e:
        return render_template("result_page.html", prediction_text=f"Error in estimation: {str(e)}")


@app.route("/registration", methods=["POST", "GET"])
def registration():
    try:
        name = request.form.get("user")
        dist = int(request.form.get("dist"))
        n = int(request.form.get("crop"))
        area = int(request.form.get("area"))
        
        if n not in CROP_CONFIGS:
            return render_template("result_page.html", prediction_text="Invalid crop selection!")
        
        crop_name = CROP_CONFIGS[n]['name']
        area_hectares = int(area / 2.47)
        
        # Get production prediction
        pro_model = get_production_model(crop_name)
        if not pro_model:
            return render_template("result_page.html", prediction_text=f"Production model not available")
        
        production = pro_model.predict([[dist, 2022, area_hectares]])[0]
        
        # Register the crop entry with production prediction
        reg_dist(name, crop_name, dist, area, production)
        
        return render_template("result_page.html", prediction_text="✓ Registration Successful!!!")
    
    except Exception as e:
        return render_template("result_page.html", prediction_text=f"Error in registration: {str(e)}")

def current_total(crop):
    x = 0
    csv_files = [
        'adilabad_user_crop_entry.csv',
        'karimnagar_user_crop_entry.csv',
        'hyderabad_user_crop_entry.csv',
        'warangal_user_crop_entry.csv',
        'nalgonda_user_crop_entry.csv',
        'medak_user_crop_entry.csv',
        'nizamabad_user_crop_entry.csv',
        'khammam_user_crop_entry.csv',
        'mahabubnagar_user_crop_entry.csv'
    ]
    
    for csv_file in csv_files:
        try:
            crop_entry = pd.read_csv(csv_file)
            if not crop_entry.empty and 'Crop' in crop_entry.columns and 'Production' in crop_entry.columns:
                filtered = crop_entry[crop_entry['Crop'].str.lower() == crop.lower()]
                if not filtered.empty:
                    x += filtered['Production'].sum()
        except (FileNotFoundError, pd.errors.EmptyDataError, KeyError):
            continue  # Skip if file doesn't exist or is empty
    
    return x

@app.route("/statistics", methods=["POST", "GET"])
def statistics():
    try:
        n = int(request.form.get("crop"))
        
        if n not in CROP_CONFIGS:
            return render_template("result_page.html", prediction_text="Invalid crop selection!")
        
        crop_name = CROP_CONFIGS[n]['name']
        crop_display = CROP_CONFIGS[n]['display']
        
        # Get total production from all districts
        total = current_total(crop_name)
        
        # Get district demand prediction
        district_model = get_district_model(crop_name)
        if not district_model:
            return render_template("result_page.html", prediction_text=f"District model not available for {crop_display}")
        
        threshold_pred = district_model.predict([[2022]])
        threshold = float(threshold_pred[0])
        
        # Enhanced visualization
        fig = Figure(figsize=(12, 6))
        ax = fig.subplots()
        
        # Create bar chart with better styling
        bars = ax.bar(['Current Production', 'Expected Demand'], 
                      [total, threshold], 
                      color=['#2d8659', '#e74c3c'],
                      edgecolor='black', 
                      linewidth=1.5,
                      alpha=0.8)
        
        # Add value labels on bars
        for i, (bar, value) in enumerate(zip(bars, [total, threshold])):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(value):,} Quintals',
                   ha='center', va='bottom', fontsize=12, fontweight='bold')
        
        # Add horizontal line showing threshold if production exceeds demand
        if total < threshold:
            ax.axhline(y=threshold, color='r', linestyle='--', linewidth=2, 
                      label=f'Demand Threshold: {int(threshold):,} Quintals')
        
        # Styling
        ax.set_ylabel('Production (Quintals)', fontsize=12, fontweight='bold')
        ax.set_title(f'{crop_display} Statistics - 2022\nProduction vs Demand Analysis', 
                    fontsize=14, fontweight='bold', pad=20)
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.set_facecolor('#f8f9fa')
        
        # Format y-axis
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x):,}'))
        
        # Add legend
        ax.legend(loc='upper right', fontsize=10)
        
        # Tight layout for better spacing
        fig.tight_layout()
        
        buf = BytesIO()
        fig.savefig(buf, format="png", dpi=100, bbox_inches='tight')
        buf.seek(0)
        data = base64.b64encode(buf.getbuffer()).decode("ascii")
        buf.close()
        
        # Calculate production gap and status
        production_gap = max(0, threshold - total)
        status = "✓ Production Exceeds Demand" if total >= threshold else "✗ Production Below Demand"
        
        return render_template('statistics_result.html',
                             crop_name=crop_display,
                             current_production=total,
                             expected_demand=threshold,
                             production_gap=production_gap,
                             status=status,
                             chart_image=data)
    
    except Exception as e:
        return render_template('result_page.html', 
                             prediction_text=f"Error: {str(e)}\nPlease try again or contact support.")

@app.route('/recommendfile', methods=["POST", "GET"])
def recommendfile():
    return render_template('recommend.html')

@app.route('/fertilizersfile', methods=["POST", "GET"])
def fertilizersfile():
    return render_template('fertilizers.html')

# ==================== NEW API ENDPOINTS FOR INTEGRATION ====================

@app.route('/api/crops/available', methods=['GET'])
def api_available_crops():
    """Get list of all available crops"""
    try:
        crops = [
            {
                'id': crop_id,
                'name': config['name'],
                'display': config['display'],
                'models_available': {
                    'production': crop_name in models_cache['production'],
                    'price': crop_name in models_cache['price'],
                    'district': crop_name in models_cache['district']
                }
            }
            for crop_id, config in CROP_CONFIGS.items()
            for crop_name in [config['name']]
        ]
        return jsonify({'status': 'success', 'crops': crops})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/districts/available', methods=['GET'])
def api_available_districts():
    """Get list of all districts"""
    try:
        districts = [
            {'id': dist_id, 'name': dist_name}
            for dist_id, dist_name in DISTRICTS.items()
        ]
        return jsonify({'status': 'success', 'districts': districts})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/predict/production', methods=['POST'])
def api_predict_production():
    """API endpoint for production prediction"""
    try:
        data = request.get_json()
        dist = int(data.get('district'))
        crop_id = int(data.get('crop'))
        area = int(data.get('area'))
        
        if crop_id not in CROP_CONFIGS:
            return jsonify({'status': 'error', 'message': 'Invalid crop'})
        
        crop_name = CROP_CONFIGS[crop_id]['name']
        area_hectares = int(area / 2.47)
        
        pro_model = get_production_model(crop_name)
        if not pro_model:
            return jsonify({'status': 'error', 'message': 'Production model not available'})
        
        production = float(pro_model.predict([[dist, 2022, area_hectares]])[0])
        
        return jsonify({
            'status': 'success',
            'crop': CROP_CONFIGS[crop_id]['display'],
            'district': DISTRICTS.get(dist, 'Unknown'),
            'area_acres': area,
            'area_hectares': area_hectares,
            'production_quintals': int(production)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/predict/price', methods=['POST'])
def api_predict_price():
    """API endpoint for price prediction"""
    try:
        data = request.get_json()
        crop_id = int(data.get('crop'))
        area = int(data.get('area'))
        production = int(data.get('production'))
        
        if crop_id not in CROP_CONFIGS:
            return jsonify({'status': 'error', 'message': 'Invalid crop'})
        
        crop_name = CROP_CONFIGS[crop_id]['name']
        area_hectares = int(area / 2.47)
        
        price_model = get_price_model(crop_name)
        if not price_model:
            return jsonify({'status': 'error', 'message': 'Price model not available'})
        
        price = float(price_model.predict([[2022, area_hectares, production]])[0])
        
        return jsonify({
            'status': 'success',
            'crop': CROP_CONFIGS[crop_id]['display'],
            'price_per_quintal': int(price),
            'total_revenue': int(price * production)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/predict/demand', methods=['POST'])
def api_predict_demand():
    """API endpoint for district demand prediction"""
    try:
        data = request.get_json()
        crop_id = int(data.get('crop'))
        
        if crop_id not in CROP_CONFIGS:
            return jsonify({'status': 'error', 'message': 'Invalid crop'})
        
        crop_name = CROP_CONFIGS[crop_id]['name']
        
        district_model = get_district_model(crop_name)
        if not district_model:
            return jsonify({'status': 'error', 'message': 'District model not available'})
        
        demand = float(district_model.predict([[2022]])[0])
        
        return jsonify({
            'status': 'success',
            'crop': CROP_CONFIGS[crop_id]['display'],
            'expected_demand_quintals': int(demand)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/predict/fertilizer', methods=['POST'])
def api_predict_fertilizer():
    """API endpoint for fertilizer recommendation"""
    try:
        fertilizer_model = get_fertilizer_model()
        if not fertilizer_model:
            return jsonify({'status': 'error', 'message': 'Fertilizer model not available'})
        
        data = request.get_json()
        temp = int(data.get('temperature'))
        humidity = int(data.get('humidity'))
        mc = int(data.get('moisture_content'))
        crop = int(data.get('crop'))
        n = int(data.get('nitrogen'))
        p = int(data.get('phosphorus'))
        k = int(data.get('potassium'))
        
        recommendation = fertilizer_model.predict([[temp, humidity, mc, crop, n, k, p]])[0]
        
        return jsonify({
            'status': 'success',
            'recommended_fertilizer': recommendation,
            'parameters': {
                'temperature': temp,
                'humidity': humidity,
                'moisture_content': mc,
                'nitrogen': n,
                'phosphorus': p,
                'potassium': k
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/models/status', methods=['GET'])
def api_models_status():
    """Get status of all models"""
    try:
        status = {
            'production_models': len(models_cache['production']),
            'price_models': len(models_cache['price']),
            'district_models': len(models_cache['district']),
            'fertilizer_model': get_fertilizer_model() is not None,
            'recommendation_model': get_recommendation_model() is not None,
            'total_crops_supported': len(CROP_CONFIGS),
            'total_districts': len(DISTRICTS)
        }
        return jsonify({'status': 'success', 'models': status})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint"""
    try:
        has_production = len(models_cache['production']) > 0 or any(
            os.path.exists(f"{config['name']}_pro_model.pkl") 
            for config in CROP_CONFIGS.values()
        )
        return jsonify({
            'status': 'healthy' if has_production else 'initializing',
            'models_loaded': len(models_cache['production'])
        })
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)})

@app.route("/recommend", methods=["POST", "GET"])
def recommend():
    try:
        recommendation_model = get_recommendation_model()
        if not recommendation_model:
            return render_template("result_page.html", prediction_text="Recommendation model not available")
        
        n = int(request.form.get('n'))
        p = int(request.form.get('p'))
        k = int(request.form.get('k'))
        temp = int(request.form.get('temp'))
        ph = float(request.form.get('ph'))
        rain = int(request.form.get('rain'))
        humidity = int(request.form.get('h'))
        
        prediction = recommendation_model.predict([[n, p, k, temp, humidity, ph, rain]])
        
        recommendation_info = f"""
        🌾 Crop Recommendation Report
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        🧪 Soil Nutrients:
           • Nitrogen (N): {n} mg/kg
           • Phosphorus (P): {p} mg/kg
           • Potassium (K): {k} mg/kg
        
        🌡️ Environmental Factors:
           • Temperature: {temp}°C
           • Humidity: {humidity}%
           • Rainfall: {rain} mm
           • pH Level: {ph}
        
        ✓ Recommended Crop: {prediction[0]}
        """
        
        return render_template("result_page.html", prediction_text=recommendation_info)
    except Exception as e:
        return render_template("result_page.html", prediction_text=f"Error in crop recommendation: {str(e)}")

@app.route("/fertilizers", methods=["POST", "GET"])
def fertilizers():
    try:
        fertilizer_model = get_fertilizer_model()
        if not fertilizer_model:
            return render_template("result_page.html", prediction_text="Fertilizer model not available")
        
        temp = int(request.form.get('temp'))
        humidity = int(request.form.get('h'))
        mc = int(request.form.get('mc'))
        crop = int(request.form.get('crop'))
        n = int(request.form.get('n'))
        p = int(request.form.get('p'))
        k = int(request.form.get('k'))
        
        prediction = fertilizer_model.predict([[temp, humidity, mc, crop, n, k, p]])
        
        fertilizer_info = f"""
        🌾 Fertilizer Recommendation Report
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        📋 Soil & Environmental Parameters:
           • Temperature: {temp}°C
           • Humidity: {humidity}%
           • Moisture Content: {mc}
           • Crop Type: {crop}
        
        🧪 Nutrient Analysis:
           • Nitrogen (N): {n} mg/kg
           • Phosphorus (P): {p} mg/kg
           • Potassium (K): {k} mg/kg
        
        ✓ Recommended Fertilizer: {prediction[0]}
        """
        
        return render_template("result_page.html", prediction_text=fertilizer_info)
    except Exception as e:
        return render_template("result_page.html", prediction_text=f"Error in fertilizer recommendation: {str(e)}")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🌾 AgriPredict ML Service Starting...")
    print("="*60)
    print("\n📦 Available Models:")
    print(f"  • Production Models: {len(models_cache['production'])} crops")
    print(f"  • Price Models: {len(models_cache['price'])} crops")
    print(f"  • District Models: {len(models_cache['district'])} crops")
    print(f"  • Fertilizer Model: {'✓ Loaded' if models_cache['fertilizer'] else '✗ Not found'}")
    print(f"  • Recommendation Model: {'✓ Loaded' if models_cache['recommendation'] else '✗ Not found'}")
    print(f"\n🌾 Supported Crops:")
    for crop_id, config in CROP_CONFIGS.items():
        print(f"  • {config['display']}")
    print(f"\n📍 Districts: {len(DISTRICTS)} regions")
    print("\n🚀 Service running on http://localhost:5000")
    print("="*60 + "\n")
    app.run(debug=False, port=5000, host='0.0.0.0', use_reloader=False)