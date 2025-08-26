#!/usr/bin/env python3
"""
Simple model setup script to ensure AI service works without errors
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler

def create_basic_model():
    """Create a basic model if none exists"""
    model_dir = "models"
    os.makedirs(model_dir, exist_ok=True)
    
    # Check if model already exists
    latest_file = os.path.join(model_dir, "latest_model.txt")
    if os.path.exists(latest_file):
        return True
    
    try:
        # Create basic model components
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        vectorizer = TfidfVectorizer(max_features=100)
        label_encoder = LabelEncoder()
        scaler = StandardScaler()
        
        # Fit with dummy data
        dummy_texts = ["challenge video tiktok", "dance shorts youtube", "education post instagram"]
        vectorizer.fit(dummy_texts)
        
        dummy_platforms = ["TikTok", "YouTube", "Instagram"]
        label_encoder.fit(dummy_platforms)
        
        dummy_features = np.array([[1000000, 50000, 10000, 5000]])
        scaler.fit(dummy_features)
        
        # Save components
        timestamp = "20250101_000000"
        joblib.dump(model, f"{model_dir}/basic_model_{timestamp}.pkl")
        joblib.dump(vectorizer, f"{model_dir}/vectorizer_{timestamp}.pkl")
        joblib.dump(label_encoder, f"{model_dir}/label_encoder_{timestamp}.pkl")
        joblib.dump(scaler, f"{model_dir}/scaler_{timestamp}.pkl")
        
        # Save latest model info
        with open(latest_file, "w") as f:
            f.write(f"basic_model_{timestamp}.pkl\n")
            f.write(f"vectorizer_{timestamp}.pkl\n")
            f.write(f"label_encoder_{timestamp}.pkl\n")
            f.write(f"scaler_{timestamp}.pkl")
        
        return True
        
    except Exception as e:
        return False

if __name__ == "__main__":
    create_basic_model()
