#!/usr/bin/env python3
"""
Setup script for Trending Content Suggestions AI Model
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    print("✓ Requirements installed successfully")

def create_directories():
    """Create necessary directories"""
    directories = ["models", "logs", "results"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✓ Created directory: {directory}")

def main():
    print("=== Trending Content Suggestions AI Setup ===")
    
    # Create directories
    create_directories()
    
    # Install requirements
    install_requirements()
    
    print("\n=== Setup Complete ===")
    print("To train the model, run:")
    print("python advanced_model.py")
    print("\nTo start the API server, run:")
    print("python api_server.py")

if __name__ == "__main__":
    main()
