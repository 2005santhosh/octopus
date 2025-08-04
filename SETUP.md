# Octopus Project Setup Guide

## Prerequisites
- **Node.js** (v16+ recommended)
- **Python** (v3.8+ recommended)
- **MongoDB** connection (MongoDB Atlas or local)

## 🚀 Quick Start

### 1. Clone & Navigate
```bash
cd "C:\Users\saiga\OneDrive\Desktop\My projects\octopus"
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Setup Python AI Environment
```bash
cd "ai\Trending_Content_Suggestions"
python setup.py
```

### 4. Train the AI Model
```bash
python advanced_model.py
# OR from root: npm run ai:train
```

### 5. Start the Full Application
```bash
cd ..\..\  # Back to root
npm run dev:full
```

## 📦 Dependencies Overview

### Node.js Dependencies (package.json)
- **axios**: HTTP client for AI API communication
- **express**: Web framework
- **mongoose**: MongoDB integration
- **ejs**: Template engine
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **concurrently**: Run multiple scripts
- **nodemon**: Development auto-restart

### Python Dependencies (ai/Trending_Content_Suggestions/requirements.txt)
- **torch**: PyTorch for deep learning
- **transformers**: Hugging Face transformers
- **scikit-learn**: Machine learning library
- **pandas**: Data manipulation
- **numpy**: Numerical computing
- **flask**: Python web framework for AI API
- **flask-cors**: CORS support
- **joblib**: Model persistence

## 🔧 Configuration

### Environment Variables (.env)
Located in `backend/.env`:
```
PORT=8080
MONGO_URI=mongodb+srv://OCTOPUS:Octopus%402025@octopus.bltweco.mongodb.net/octopus?retryWrites=true&w=majority
jwtsecret="dimbidimbiro"
```

## 🎯 Running Options

### Full Application (Recommended)
```bash
npm run dev:full
```
Starts both backend (port 8080) and AI server (port 5001)

### Backend Only
```bash
npm run dev
```
Starts only the main backend server

### AI Server Only
```bash
npm run ai:server
```
Starts only the AI suggestions API

## 🌐 Access Points

- **Main Application**: http://localhost:8080
- **AI API Health**: http://localhost:5001/api/health
- **AI Suggestions**: http://localhost:5001/api/trending-suggestions

## 🤖 AI Features

### Trending Content Suggestions
- **Endpoint**: `/api/trending-suggestions`
- **Method**: GET
- **Parameters**: `?count=5` (optional)
- **Returns**: AI-powered content suggestions based on trained model

### Trend Prediction
- **Endpoint**: `/api/predict-trend`
- **Method**: POST
- **Body**: `{"hashtag": "#Dance", "content_type": "Video", "platform": "TikTok", "region": "USA"}`
- **Returns**: Trending score and engagement prediction

## 📊 Model Information

### Trained Model
- **Type**: Support Vector Machine (SVM) ensemble
- **Accuracy**: ~34.7%
- **Features**: TF-IDF text features + numerical engagement metrics
- **Dataset**: 5000+ viral social media posts

### Training Data
- **Platforms**: TikTok, Instagram, YouTube, Twitter
- **Regions**: USA, UK, Canada, Australia, Germany, Brazil, India, Japan
- **Content Types**: Video, Post, Shorts, Reel, Live Stream, Tweet

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot find module 'axios'"**
   ```bash
   npm install axios
   ```

2. **AI Server Not Starting**
   ```bash
   cd ai/Trending_Content_Suggestions
   python setup.py
   ```

3. **Model Not Found**
   ```bash
   cd ai/Trending_Content_Suggestions
   python advanced_model.py
   ```

4. **MongoDB Connection Issues**
   - Check your `.env` file
   - Verify MongoDB Atlas connection string
   - Ensure network access is allowed

### Logs & Debugging
- **AI Training Logs**: `ai/Trending_Content_Suggestions/logs/`
- **Model Files**: `ai/Trending_Content_Suggestions/models/`
- **Backend Logs**: Console output when running `npm run dev:full`

## 🎉 Success Indicators

When everything is working correctly, you should see:
```
✅ MONGODB CONNECTED SUCCESSFULLY
🚀 Server started at port 8080
AI Suggestions Service: Connected
AI API server is ready!
Model loaded: True
```

## 📝 Usage

1. **Navigate to**: http://localhost:8080
2. **Sign up/Login** with your credentials
3. **Go to Content Lab**
4. **Click "Create Content"**
5. **See AI Suggestions** appear in the modal with real trending data

The AI suggestions will now show actual predictions from your trained machine learning model instead of static text!
