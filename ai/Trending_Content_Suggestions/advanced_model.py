import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class TrendingContentPredictor:
    def __init__(self):
        self.models = {
            'random_forest': RandomForestClassifier(n_estimators=200, random_state=42, max_depth=15),
            'gradient_boost': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'logistic_regression': LogisticRegression(random_state=42, max_iter=1000),
            'svm': SVC(kernel='rbf', random_state=42, probability=True)
        }
        self.best_model = None
        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        self.label_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        
    def load_and_preprocess_data(self):
        """Load and preprocess the viral social media trends data"""
        data_path = os.path.join('dataset', 'Viral_Social_Media_Trends.csv')
        df = pd.read_csv(data_path)
        
        # Feature engineering
        df['content_text'] = df['Hashtag'].str.replace('#', '') + ' ' + df['Content_Type'] + ' ' + df['Platform']
        df['engagement_ratio'] = (df['Likes'] + df['Shares'] + df['Comments']) / df['Views']
        df['engagement_score'] = df['Likes'] * 0.3 + df['Shares'] * 0.4 + df['Comments'] * 0.3
        
        # Encode categorical variables
        df['platform_encoded'] = self.label_encoder.fit_transform(df['Platform'])
        df['region_encoded'] = LabelEncoder().fit_transform(df['Region'])
        df['content_type_encoded'] = LabelEncoder().fit_transform(df['Content_Type'])
        
        # Target variable
        engagement_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
        df['target'] = df['Engagement_Level'].map(engagement_mapping)
        
        return df
    
    def prepare_features(self, df):
        """Prepare features for training"""
        # Text features
        text_features = self.vectorizer.fit_transform(df['content_text']).toarray()
        
        # Numerical features
        numerical_features = df[['Views', 'Likes', 'Shares', 'Comments', 'engagement_ratio', 
                               'engagement_score', 'platform_encoded', 'region_encoded', 
                               'content_type_encoded']].values
        
        # Normalize numerical features
        numerical_features = self.scaler.fit_transform(numerical_features)
        
        # Combine features
        X = np.hstack([text_features, numerical_features])
        y = df['target'].values
        
        return X, y
    
    def train_models(self, X_train, y_train, X_test, y_test):
        """Train multiple models and select the best one"""
        best_score = 0
        model_scores = {}
        
        print("Training models...")
        
        for name, model in self.models.items():
            print(f"Training {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Cross-validation score
            cv_scores = cross_val_score(model, X_train, y_train, cv=5)
            mean_cv_score = cv_scores.mean()
            
            # Test score
            test_score = model.score(X_test, y_test)
            
            model_scores[name] = {
                'cv_score': mean_cv_score,
                'test_score': test_score,
                'model': model
            }
            
            print(f"{name} - CV Score: {mean_cv_score:.4f}, Test Score: {test_score:.4f}")
            
            if test_score > best_score:
                best_score = test_score
                self.best_model = model
                self.best_model_name = name
        
        print(f"\nBest model: {self.best_model_name} with score: {best_score:.4f}")
        return model_scores
    
    def create_ensemble_model(self, models_dict, X_train, y_train):
        """Create an ensemble model from the trained models"""
        from sklearn.ensemble import VotingClassifier
        
        estimators = [(name, info['model']) for name, info in models_dict.items()]
        ensemble = VotingClassifier(estimators=estimators, voting='soft')
        ensemble.fit(X_train, y_train)
        
        return ensemble
    
    def save_model(self, model, model_name="trending_model"):
        """Save the trained model and preprocessing objects"""
        model_dir = "models"
        os.makedirs(model_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save model
        joblib.dump(model, f"{model_dir}/{model_name}_{timestamp}.pkl")
        
        # Save preprocessing objects
        joblib.dump(self.vectorizer, f"{model_dir}/vectorizer_{timestamp}.pkl")
        joblib.dump(self.label_encoder, f"{model_dir}/label_encoder_{timestamp}.pkl")
        joblib.dump(self.scaler, f"{model_dir}/scaler_{timestamp}.pkl")
        
        # Save latest model info
        with open(f"{model_dir}/latest_model.txt", "w") as f:
            f.write(f"{model_name}_{timestamp}.pkl\n")
            f.write(f"vectorizer_{timestamp}.pkl\n")
            f.write(f"label_encoder_{timestamp}.pkl\n")
            f.write(f"scaler_{timestamp}.pkl")
        
        print(f"Model saved as {model_name}_{timestamp}.pkl")
    
    def predict_trending_topics(self, hashtags, content_types, platforms, regions):
        """Predict trending potential for given topics"""
        if self.best_model is None:
            raise ValueError("No trained model available. Please train a model first.")
        
        # Create DataFrame for prediction
        pred_df = pd.DataFrame({
            'Hashtag': hashtags,
            'Content_Type': content_types,
            'Platform': platforms,
            'Region': regions,
            'Views': [1000000] * len(hashtags),  # Dummy values
            'Likes': [50000] * len(hashtags),
            'Shares': [10000] * len(hashtags),
            'Comments': [5000] * len(hashtags)
        })
        
        # Preprocess
        pred_df['content_text'] = pred_df['Hashtag'].str.replace('#', '') + ' ' + pred_df['Content_Type'] + ' ' + pred_df['Platform']
        pred_df['engagement_ratio'] = (pred_df['Likes'] + pred_df['Shares'] + pred_df['Comments']) / pred_df['Views']
        pred_df['engagement_score'] = pred_df['Likes'] * 0.3 + pred_df['Shares'] * 0.4 + pred_df['Comments'] * 0.3
        
        # Encode categorical variables (using fitted encoders)
        try:
            pred_df['platform_encoded'] = self.label_encoder.transform(pred_df['Platform'])
        except ValueError:
            pred_df['platform_encoded'] = [0] * len(pred_df)  # Unknown platform
        
        # Prepare features
        text_features = self.vectorizer.transform(pred_df['content_text']).toarray()
        numerical_features = pred_df[['Views', 'Likes', 'Shares', 'Comments', 'engagement_ratio', 
                                    'engagement_score', 'platform_encoded']].values
        numerical_features = self.scaler.transform(numerical_features[:, :-1])  # Exclude last column for now
        numerical_features = np.hstack([numerical_features, pred_df[['platform_encoded']].values])
        
        X_pred = np.hstack([text_features, numerical_features])
        
        # Predict
        predictions = self.best_model.predict_proba(X_pred)
        
        return predictions

def main():
    predictor = TrendingContentPredictor()
    
    # Load and preprocess data
    print("Loading and preprocessing data...")
    df = predictor.load_and_preprocess_data()
    print(f"Data shape: {df.shape}")
    
    # Prepare features
    print("Preparing features...")
    X, y = predictor.prepare_features(df)
    print(f"Feature shape: {X.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train models
    model_scores = predictor.train_models(X_train, y_train, X_test, y_test)
    
    # Create ensemble model
    print("\nCreating ensemble model...")
    ensemble_model = predictor.create_ensemble_model(model_scores, X_train, y_train)
    ensemble_score = ensemble_model.score(X_test, y_test)
    print(f"Ensemble model score: {ensemble_score:.4f}")
    
    # Use ensemble if it's better
    if ensemble_score > model_scores[predictor.best_model_name]['test_score']:
        predictor.best_model = ensemble_model
        predictor.best_model_name = "ensemble"
        print("Using ensemble model as the best model")
    
    # Evaluate best model
    y_pred = predictor.best_model.predict(X_test)
    print(f"\nClassification Report for {predictor.best_model_name}:")
    print(classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High']))
    
    # Save model
    predictor.save_model(predictor.best_model, f"trending_content_{predictor.best_model_name}")
    
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    main()
