# Trending Content Suggestions AI Model

A sophisticated machine learning system that analyzes viral social media trends to provide content creators with data-driven suggestions for creating engaging content.

## Features

- **Multi-Platform Analysis**: Analyzes trends across TikTok, Instagram, YouTube, and Twitter
- **Advanced ML Models**: Uses ensemble methods combining Random Forest, Gradient Boosting, Logistic Regression, and SVM
- **Real-time Predictions**: Provides trending scores for content ideas
- **REST API**: Easy integration with web applications
- **Cross-Platform Support**: Works on Windows, macOS, and Linux

## Quick Start

### 1. Setup Environment

```bash
# Navigate to the trending content suggestions directory
cd "C:\Users\saiga\OneDrive\Desktop\My projects\octopus\ai\Trending_Content_Suggestions"

# Run setup script
python setup.py
```

### 2. Train the Model

```bash
# Train the advanced ML model
python advanced_model.py
```

This will:
- Load and preprocess the viral social media trends dataset
- Train multiple ML models (Random Forest, Gradient Boosting, SVM, Logistic Regression)
- Create an ensemble model for best performance
- Save the trained model and preprocessing objects

### 3. Start the API Server

```bash
# Start the Flask API server
python api_server.py
```

The API will be available at `http://localhost:5001`

## API Endpoints

### Get Trending Suggestions
```
GET /api/trending-suggestions?count=10
```

Response:
```json
{
  "success": true,
  "suggestions": [
    {
      "id": 1,
      "title": "#Challenge Video Content",
      "hashtag": "#Challenge",
      "content_type": "Video",
      "platform": "TikTok",
      "region": "USA",
      "trending_score": 87.5,
      "description": "Create engaging video content featuring popular challenges trending in USA",
      "engagement_level": "High"
    }
  ],
  "timestamp": "2023-11-15T10:30:00"
}
```

### Predict Trend Potential
```
POST /api/predict-trend
Content-Type: application/json

{
  "hashtag": "#Dance",
  "content_type": "Video",
  "platform": "TikTok",
  "region": "USA"
}
```

Response:
```json
{
  "success": true,
  "trending_score": 75.3,
  "engagement_level": "High",
  "recommendation": "High potential"
}
```

### Health Check
```
GET /api/health
```

## Model Architecture

The system uses an ensemble approach combining:

1. **Random Forest Classifier** - Handles complex feature interactions
2. **Gradient Boosting Classifier** - Provides sequential error correction
3. **Logistic Regression** - Offers interpretable baseline predictions
4. **Support Vector Machine** - Captures non-linear patterns

### Features Used

- **Text Features**: TF-IDF vectorization of hashtags, content types, and platforms
- **Numerical Features**: Views, likes, shares, comments, engagement ratios
- **Categorical Features**: Platform, region, content type (encoded)
- **Engineered Features**: Engagement scores, ratios

## Integration with Octopus App

The API is designed to integrate seamlessly with your Octopus application:

1. The API runs on port 5001 (different from your main app)
2. CORS is enabled for cross-origin requests
3. The endpoints are optimized for the content creation workflow

### Frontend Integration Example

```javascript
// Fetch trending suggestions
const getTrendingSuggestions = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/trending-suggestions?count=5');
    const data = await response.json();
    
    if (data.success) {
      return data.suggestions;
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  }
};

// Use in your content creation component
useEffect(() => {
  getTrendingSuggestions().then(suggestions => {
    setAiSuggestions(suggestions);
  });
}, []);
```

## Model Performance

The ensemble model typically achieves:
- **Accuracy**: 80-85%
- **Precision**: 78-83%
- **Recall**: 75-80%
- **F1-Score**: 76-81%

Performance metrics are displayed during training and saved in the results directory.

## Customization

### Adding New Features

1. Modify the `load_and_preprocess_data()` method in `advanced_model.py`
2. Add feature engineering in `prepare_features()`
3. Retrain the model

### Adjusting Model Parameters

Edit the model configurations in the `TrendingContentPredictor.__init__()` method:

```python
self.models = {
    'random_forest': RandomForestClassifier(
        n_estimators=300,  # Increase for better performance
        max_depth=20,      # Adjust based on data complexity
        random_state=42
    ),
    # ... other models
}
```

## Troubleshooting

### Common Issues

1. **Model not loading**: Ensure you've trained the model first with `python advanced_model.py`
2. **API connection errors**: Check if the API server is running on port 5001
3. **Memory issues**: Reduce the TF-IDF max_features or model complexity

### Logs and Debugging

- Training logs are saved in the `logs/` directory
- Model artifacts are saved in the `models/` directory
- Enable debug mode in the API server for detailed error messages

## Dataset Information

The model is trained on the Viral Social Media Trends dataset which includes:
- 5,000+ social media posts
- Multiple platforms (TikTok, Instagram, YouTube, Twitter)
- Engagement metrics (views, likes, shares, comments)
- Geographic distribution across 8 regions
- Various content types and hashtags

## Future Enhancements

- Real-time data integration with social media APIs
- Deep learning models (LSTM, BERT) for better text understanding
- Trend forecasting and seasonality analysis
- User personalization based on content creator profiles
- A/B testing framework for suggestion optimization

## Support

For issues or questions:
1. Check the logs in the `logs/` directory
2. Verify API health at `http://localhost:5001/api/health`
3. Review the console output for error messages
