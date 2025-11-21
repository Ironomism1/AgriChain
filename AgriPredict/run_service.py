#!/usr/bin/env python
"""Simple script to run the Flask service without issues"""

import sys
import warnings

# Suppress sklearn warnings
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

from flask_complete import app, load_all_models

if __name__ == '__main__':
    try:
        print("\n" + "="*60)
        print("🌾 Starting AgriPredict ML Service...")
        print("="*60)
        
        # Load all models
        load_all_models()
        
        print("\n✓ All systems ready!")
        print("🚀 Running on http://127.0.0.1:5000\n")
        
        # Run Flask without debug
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=False,
            use_reloader=False,
            threaded=True
        )
    except Exception as e:
        print(f"\n✗ Error starting service: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
