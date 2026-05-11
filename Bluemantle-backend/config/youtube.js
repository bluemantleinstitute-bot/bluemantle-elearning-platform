// Exporting YouTube API configuration from environment variables
const youtubeConfig = {
    apiKey: process.env.YOUTUBE_API_KEY,
    channelId: process.env.YOUTUBE_CHANNEL_ID
};

module.exports = youtubeConfig;
