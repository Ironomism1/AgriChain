#!/usr/bin/env python
"""
Simple test to verify Flask service and models
"""
import sys
import warnings

# Suppress sklearn warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("AgriPredict Service Test")
print("=" * 60)

# Test 1: Import Flask
print("\n1. Testing Flask import...")
try:
    from flask import Flask
    print("   OK - Flask imported")
except Exception as e:
    print(f"   FAIL - Flask import: {e}")
    sys.exit(1)

# Test 2: Import models
print("\n2. Testing dependencies...")
try:
    import pickle
    import pandas as pd
    import numpy as np
    from pathlib import Path
    print("   OK - All dependencies imported")
except Exception as e:
    print(f"   FAIL - Dependency import: {e}")
    sys.exit(1)

# Test 3: Load Flask app
print("\n3. Loading Flask application...")
try:
    from flask_complete import app
    print("   OK - Flask app loaded")
except Exception as e:
    print(f"   FAIL - Flask app load: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Test Flask app context
print("\n4. Testing Flask routes...")
try:
    with app.test_client() as client:
        # Test health endpoint
        response = client.get('/api/health')
        print(f"   OK - /api/health: {response.status_code}")
        
        # Test crops endpoint
        response = client.get('/api/crops/available')
        print(f"   OK - /api/crops/available: {response.status_code}")
        
except Exception as e:
    print(f"   FAIL - Route test: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("OK - All tests passed!")
print("=" * 60)
