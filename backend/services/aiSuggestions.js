const axios = require('axios');

class AITrendingSuggestionsService {
    constructor() {
        this.baseURL = 'http://localhost:5001/api';
        this.isConnected = false;
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
            this.isConnected = response.data.status === 'healthy';
            console.log('AI Suggestions Service:', this.isConnected ? 'Connected' : 'Disconnected');
        } catch (error) {
            this.isConnected = false;
            console.log('AI Suggestions Service: Not available');
        }
    }

    async getTrendingSuggestions(count = 10) {
        if (!this.isConnected) {
            await this.checkConnection();
        }

        try {
            const response = await axios.get(`${this.baseURL}/trending-suggestions?count=${count}`, {
                timeout: 10000
            });

            if (response.data.success) {
                return {
                    success: true,
                    suggestions: response.data.suggestions
                };
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (error) {
            console.error('Error fetching AI suggestions:', error.message);
            
            // Fallback suggestions if AI service is unavailable
            return {
                success: false,
                suggestions: this.getFallbackSuggestions(count),
                fallback: true
            };
        }
    }

    async predictTrendPotential(hashtag, contentType, platform, region) {
        if (!this.isConnected) {
            await this.checkConnection();
        }

        try {
            const response = await axios.post(`${this.baseURL}/predict-trend`, {
                hashtag,
                content_type: contentType,
                platform,
                region
            }, {
                timeout: 5000
            });

            if (response.data.success) {
                return response.data;
            } else {
                throw new Error('Prediction API returned unsuccessful response');
            }
        } catch (error) {
            console.error('Error predicting trend potential:', error.message);
            
            // Fallback prediction
            return {
                success: false,
                trending_score: Math.floor(Math.random() * 100),
                engagement_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                recommendation: 'Prediction unavailable',
                fallback: true
            };
        }
    }

    getFallbackSuggestions(count) {
        const fallbackSuggestions = [
            {
                id: 1,
                title: "#Challenge Video Content",
                hashtag: "#Challenge",
                content_type: "Video",
                platform: "TikTok",
                region: "USA",
                trending_score: 85.2,
                description: "Create engaging video content featuring popular challenges",
                engagement_level: "High"
            },
            {
                id: 2,
                title: "#Dance Shorts Content",
                hashtag: "#Dance",
                content_type: "Shorts",
                platform: "YouTube",
                region: "USA",
                trending_score: 78.9,
                description: "Showcase trending dance moves in short format",
                engagement_level: "High"
            },
            {
                id: 3,
                title: "#Education Post Content",
                hashtag: "#Education",
                content_type: "Post",
                platform: "Instagram",
                region: "USA",
                trending_score: 72.1,
                description: "Share educational content that's currently popular",
                engagement_level: "Medium"
            },
            {
                id: 4,
                title: "#Gaming Live Stream Content",
                hashtag: "#Gaming",
                content_type: "Live Stream",
                platform: "Twitch",
                region: "USA",
                trending_score: 81.5,
                description: "Create gaming-related live stream content",
                engagement_level: "High"
            },
            {
                id: 5,
                title: "#Comedy Reel Content",
                hashtag: "#Comedy",
                content_type: "Reel",
                platform: "Instagram",
                region: "USA",
                trending_score: 74.3,
                description: "Develop humorous reel content for maximum engagement",
                engagement_level: "Medium"
            },
            {
                id: 6,
                title: "#Tech Video Content",
                hashtag: "#Tech",
                content_type: "Video",
                platform: "YouTube",
                region: "USA",
                trending_score: 69.7,
                description: "Share technology insights through video content",
                engagement_level: "Medium"
            },
            {
                id: 7,
                title: "#Fashion Post Content",
                hashtag: "#Fashion",
                content_type: "Post",
                platform: "Instagram",
                region: "USA",
                trending_score: 76.8,
                description: "Showcase fashion trends in post format",
                engagement_level: "High"
            },
            {
                id: 8,
                title: "#Fitness Shorts Content",
                hashtag: "#Fitness",
                content_type: "Shorts",
                platform: "YouTube",
                region: "USA",
                trending_score: 73.2,
                description: "Create fitness-focused short content",
                engagement_level: "Medium"
            },
            {
                id: 9,
                title: "#Music Video Content",
                hashtag: "#Music",
                content_type: "Video",
                platform: "TikTok",
                region: "USA",
                trending_score: 82.1,
                description: "Feature trending music in your video content",
                engagement_level: "High"
            },
            {
                id: 10,
                title: "#Travel Post Content",
                hashtag: "#Travel",
                content_type: "Post",
                platform: "Instagram",
                region: "USA",
                trending_score: 71.5,
                description: "Share travel experiences and destinations",
                engagement_level: "Medium"
            }
        ];

        return fallbackSuggestions.slice(0, count);
    }
}

module.exports = new AITrendingSuggestionsService();
