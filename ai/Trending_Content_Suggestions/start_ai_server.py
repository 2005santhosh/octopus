#!/usr/bin/env python3
"""
Startup script for Trending Content Suggestions AI API
This script runs in the background when the main Octopus app starts
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import flask
        import sklearn
        import pandas
        import numpy
        import joblib
        return True
    except ImportError:
        return False

def install_dependencies():
    """Install required dependencies"""
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "flask", "flask-cors", "scikit-learn", "pandas", "numpy", "joblib"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False

def start_ai_server():
    """Start the AI API server in a separate process"""
    current_dir = Path(__file__).parent
    api_script = current_dir / "api_server.py"
    
    if not api_script.exists():
        return None
    
    try:
        # Start the Flask server as a subprocess
        process = subprocess.Popen([
            sys.executable, str(api_script)
        ], cwd=str(current_dir), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        return process
    except Exception as e:
        return None

def wait_for_server(max_attempts=30):
    """Wait for the AI server to be ready"""
    import urllib.request
    import urllib.error
    
    for attempt in range(max_attempts):
        try:
            urllib.request.urlopen('http://localhost:5001/api/health', timeout=1)
            return True
        except urllib.error.URLError:
            time.sleep(1)
    
    return False

def main():
    """Main startup function"""
    # Check and install dependencies if needed
    if not check_dependencies():
        if not install_dependencies():
            return False
    
    # Setup basic model if needed
    try:
        import setup_model
        setup_model.create_basic_model()
    except:
        pass
    
    # Start the AI server
    process = start_ai_server()
    if process is None:
        return False
    
    # Wait for server to be ready
    if wait_for_server():
        return True
    else:
        process.terminate()
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
