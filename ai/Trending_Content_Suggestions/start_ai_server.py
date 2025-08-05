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
    print("Installing AI model dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "flask", "flask-cors", "scikit-learn", "pandas", "numpy", "joblib"
        ])
        return True
    except subprocess.CalledProcessError:
        print("Failed to install dependencies")
        return False

def start_ai_server():
    """Start the AI API server in a separate process"""
    current_dir = Path(__file__).parent
    api_script = current_dir / "api_server.py"
    
    if not api_script.exists():
        print("AI API server script not found")
        return None
    
    try:
        # Start the Flask server as a subprocess
        process = subprocess.Popen([
            sys.executable, str(api_script)
        ], cwd=str(current_dir))
        
        print(f"AI API server started with PID: {process.pid}")
        return process
    except Exception as e:
        print(f"Failed to start AI server: {e}")
        return None

def wait_for_server(max_attempts=30):
    """Wait for the AI server to be ready"""
    import urllib.request
    import urllib.error
    
    for attempt in range(max_attempts):
        try:
            urllib.request.urlopen('http://localhost:5001/api/health', timeout=1)
            print("AI API server is ready!")
            return True
        except urllib.error.URLError:
            time.sleep(1)
    
    print("AI API server failed to start properly")
    return False

def main():
    """Main startup function"""
    print("Starting Trending Content Suggestions AI...")
    
    # Check and install dependencies if needed
    if not check_dependencies():
        if not install_dependencies():
            print("Failed to install required dependencies")
            return False
    
    # Start the AI server
    process = start_ai_server()
    if process is None:
        return False
    
    # Wait for server to be ready
    if wait_for_server():
        print("Trending Content Suggestions AI is ready!")
        return True
    else:
        process.terminate()
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
