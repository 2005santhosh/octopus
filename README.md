# 🐙 OCTOPUS - AI-Powered Content Creation Platform

> **Advanced AI-driven content creation and management tool with machine learning-powered trending suggestions**

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-v3.8+-blue.svg)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)
[![AI Model](https://img.shields.io/badge/AI-SVM%20Ensemble-orange.svg)](#)

## 🌟 Features

### 🤖 **AI-Powered Content Suggestions**
- **Trending Content Analysis**: ML model trained on 5000+ viral social media posts
- **Multi-Platform Support**: TikTok, Instagram, YouTube, Twitter
- **Real-time Predictions**: Get trending scores and engagement predictions
- **Smart Recommendations**: Platform-specific content suggestions

### 📊 **Content Management**
- **Content Calendar**: Schedule and manage posts across platforms
- **Analytics Dashboard**: Track performance and engagement metrics
- **Multi-format Support**: Videos, Posts, Reels, Stories, Live Streams
- **Credit System**: Fair usage system for AI features

### 🎯 **Platform Integration**
- **Social Media Accounts**: Connect multiple platforms
- **Gallery Management**: Organize and store media assets
- **User Authentication**: Secure JWT-based authentication
- **Responsive Design**: Works seamlessly on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB Atlas account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/octopus.git
cd octopus

# Install Node.js dependencies
npm install

# Setup Python AI environment
cd ai/Trending_Content_Suggestions
python setup.py

# Train the AI model
python advanced_model.py

# Return to root and start the application
cd ../..
npm run dev:full
```

### Access the Application
- **Main App**: http://localhost:8080
- **AI API Health**: http://localhost:5001/api/health

## 🧠 AI Model Details

### **Machine Learning Architecture**
- **Model Type**: Support Vector Machine (SVM) Ensemble
- **Accuracy**: ~34.7% (3-class classification)
- **Features**: TF-IDF text vectorization + numerical engagement metrics
- **Training Data**: 5000+ viral social media trends

### **Supported Platforms & Regions**
- **Platforms**: TikTok, Instagram, YouTube, Twitter
- **Regions**: USA, UK, Canada, Australia, Germany, Brazil, India, Japan
- **Content Types**: Video, Post, Shorts, Reel, Live Stream, Tweet

## 📁 Project Structure

```
octopus/
├── 📁 backend/           # Express.js backend server
│   ├── 📁 middleware/     # Auth and validation middleware
│   ├── 📁 models/         # MongoDB schemas
│   ├── 📁 routes/         # API routes
│   └── 📁 services/       # Business logic & AI integration
├── 📁 frontend/           # EJS templates & static assets
│   ├── 📁 assets/         # Images, videos, icons
│   └── 📁 views/          # EJS template files
├── 📁 ai/                 # AI/ML components
│   └── 📁 Trending_Content_Suggestions/
│       ├── 📄 advanced_model.py    # ML model training
│       ├── 📄 api_server.py        # Flask API server
│       ├── 📄 train_model.py       # BERT model training
│       ├── 📁 dataset/             # Training data (gitignored)
│       └── 📁 models/              # Trained models (gitignored)
└── 📄 SETUP.md            # Detailed setup instructions
```

## 🔧 Configuration

### Environment Variables
Create `backend/.env` with:
```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
jwtsecret="your_jwt_secret"
```

### Scripts
```bash
# Development (full stack)
npm run dev:full

# Backend only
npm run dev

# Train AI model
npm run ai:train

# AI server only
npm run ai:server
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Scikit-learn** for machine learning capabilities
- **Flask** for the AI API server
- **Express.js** for the backend framework
- **MongoDB** for data storage
- **Hugging Face** for transformer models

## 📞 Support

For support and questions:
- Check the [SETUP.md](SETUP.md) for detailed instructions
- Review the troubleshooting section
- Open an issue for bugs or feature requests

---

**Built with ❤️ for content creators worldwide**
