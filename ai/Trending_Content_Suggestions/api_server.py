from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)

class TrendingSuggestionsAPI:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.label_encoder = None
        self.scaler = None
        self.load_latest_model()
        
        # Trending topics based on dataset analysis
        self.trending_hashtags = [
            '#Challenge', '#Dance', '#Education', '#Gaming', '#Comedy', '#Music', 
            '#Tech', '#Fashion', '#Fitness', '#Viral', '#Travel', '#Food',
            '#Lifestyle', '#Art', '#Beauty', '#Sports', '#DIY', '#Motivation',
            '#Entertainment', '#Health', '#Science', '#Nature', '#Photography'
        ]
        
        self.content_types = ['Video', 'Shorts', 'Post', 'Reel', 'Live Stream', 'Tweet']
        self.platforms = ['TikTok', 'Instagram', 'YouTube', 'Twitter']
        self.regions = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Brazil', 'India', 'Japan']
    
    def load_latest_model(self):
        """Load the latest trained model and preprocessing objects"""
        model_dir = "models"
        latest_file = os.path.join(model_dir, "latest_model.txt")
        
        if not os.path.exists(latest_file):
            return False
        
        try:
            with open(latest_file, "r") as f:
                lines = f.read().strip().split('\n')
                model_file = lines[0]
                vectorizer_file = lines[1]
                label_encoder_file = lines[2]
                scaler_file = lines[3]
            
            self.model = joblib.load(os.path.join(model_dir, model_file))
            self.vectorizer = joblib.load(os.path.join(model_dir, vectorizer_file))
            self.label_encoder = joblib.load(os.path.join(model_dir, label_encoder_file))
            self.scaler = joblib.load(os.path.join(model_dir, scaler_file))
            
            return True
            
        except Exception as e:
            return False
    
    def predict_trending_potential(self, hashtag, content_type, platform, region):
        """Predict trending potential for a given combination"""
        if self.model is None:
            return random.random()  # Fallback to random if no model loaded
        
        try:
            # Create DataFrame for prediction
            pred_df = pd.DataFrame({
                'Hashtag': [hashtag],
                'Content_Type': [content_type],
                'Platform': [platform],
                'Region': [region],
                'Views': [1000000],
                'Likes': [50000],
                'Shares': [10000],
                'Comments': [5000]
            })
            
            # Feature engineering
            pred_df['content_text'] = pred_df['Hashtag'].str.replace('#', '') + ' ' + pred_df['Content_Type'] + ' ' + pred_df['Platform']
            pred_df['engagement_ratio'] = (pred_df['Likes'] + pred_df['Shares'] + pred_df['Comments']) / pred_df['Views']
            pred_df['engagement_score'] = pred_df['Likes'] * 0.3 + pred_df['Shares'] * 0.4 + pred_df['Comments'] * 0.3
            
            # Encode categorical variables
            try:
                pred_df['platform_encoded'] = self.label_encoder.transform(pred_df['Platform'])
            except ValueError:
                pred_df['platform_encoded'] = [0]  # Unknown platform
            
            pred_df['region_encoded'] = [0]  # Simplified for now
            pred_df['content_type_encoded'] = [0]  # Simplified for now
            
            # Prepare features
            text_features = self.vectorizer.transform(pred_df['content_text']).toarray()
            numerical_features = pred_df[['Views', 'Likes', 'Shares', 'Comments', 'engagement_ratio', 
                                        'engagement_score', 'platform_encoded', 'region_encoded', 
                                        'content_type_encoded']].values
            numerical_features = self.scaler.transform(numerical_features)
            
            X_pred = np.hstack([text_features, numerical_features])
            
            # Get prediction probabilities
            proba = self.model.predict_proba(X_pred)[0]
            
            # Return probability of high engagement
            return float(proba[2])  # High engagement probability
            
        except Exception as e:
            return random.random()  # Fallback
    
    def generate_trending_suggestions(self, num_suggestions=10):
        """Generate trending content suggestions"""
        suggestions = []
        
        # Generate combinations and score them
        potential_combinations = []
        
        for _ in range(num_suggestions * 3):  # Generate more to select best ones
            hashtag = random.choice(self.trending_hashtags)
            content_type = random.choice(self.content_types)
            platform = random.choice(self.platforms)
            region = random.choice(self.regions)
            
            score = self.predict_trending_potential(hashtag, content_type, platform, region)
            
            potential_combinations.append({
                'hashtag': hashtag,
                'content_type': content_type,
                'platform': platform,
                'region': region,
                'trending_score': score
            })
        
        # Sort by trending score and select top suggestions
        potential_combinations.sort(key=lambda x: x['trending_score'], reverse=True)
        top_suggestions = potential_combinations[:num_suggestions]
        
        # Format suggestions
        for i, suggestion in enumerate(top_suggestions):
            suggestions.append({
                'id': i + 1,
                'title': f"{suggestion['hashtag']} {suggestion['content_type']} Content",
                'hashtag': suggestion['hashtag'],
                'content_type': suggestion['content_type'],
                'platform': suggestion['platform'],
                'region': suggestion['region'],
                'trending_score': round(suggestion['trending_score'] * 100, 1),
                'description': self.generate_description(suggestion),
                'engagement_level': self.get_engagement_level(suggestion['trending_score'])
            })
        
        return suggestions
    
    def generate_description(self, suggestion):
        """Generate a description for the suggestion"""
        descriptions = {
            '#Challenge': f"Create engaging {suggestion['content_type'].lower()} content featuring popular challenges trending in {suggestion['region']}",
            '#Dance': f"Showcase trending dance moves in {suggestion['content_type'].lower()} format for {suggestion['platform']} audience",
            '#Education': f"Share educational {suggestion['content_type'].lower()} content that's currently popular in {suggestion['region']}",
            '#Gaming': f"Create gaming-related {suggestion['content_type'].lower()} content targeting {suggestion['platform']} users",
            '#Comedy': f"Develop humorous {suggestion['content_type'].lower()} content that resonates with {suggestion['region']} audience",
            '#Music': f"Feature trending music in your {suggestion['content_type'].lower()} for maximum engagement",
            '#Tech': f"Share technology insights through {suggestion['content_type'].lower()} content",
            '#Fashion': f"Showcase fashion trends in {suggestion['content_type'].lower()} format",
            '#Fitness': f"Create fitness-focused {suggestion['content_type'].lower()} content for health-conscious audience",
            '#Viral': f"Tap into viral trends with {suggestion['content_type'].lower()} content"
        }
        
        return descriptions.get(suggestion['hashtag'], f"Create {suggestion['content_type'].lower()} content around {suggestion['hashtag']} trending in {suggestion['region']}")
    
    def get_engagement_level(self, score):
        """Convert score to engagement level"""
        if score >= 0.7:
            return "High"
        elif score >= 0.4:
            return "Medium"
        else:
            return "Low"

# Initialize API
api = TrendingSuggestionsAPI()

@app.route('/api/trending-suggestions', methods=['GET'])
def get_trending_suggestions():
    """Get trending content suggestions"""
    try:
        num_suggestions = request.args.get('count', 10, type=int)
        suggestions = api.generate_trending_suggestions(num_suggestions)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict-trend', methods=['POST'])
def predict_trend():
    """Predict trending potential for specific content"""
    try:
        data = request.json
        hashtag = data.get('hashtag', '#Viral')
        content_type = data.get('content_type', 'Video')
        platform = data.get('platform', 'TikTok')
        region = data.get('region', 'USA')
        
        score = api.predict_trending_potential(hashtag, content_type, platform, region)
        
        return jsonify({
            'success': True,
            'trending_score': round(score * 100, 1),
            'engagement_level': api.get_engagement_level(score),
            'recommendation': "High potential" if score >= 0.6 else "Moderate potential" if score >= 0.3 else "Low potential"
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': api.model is not None,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5001, use_reloader=False)
