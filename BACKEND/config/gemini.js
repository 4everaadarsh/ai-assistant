require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;

let genAI = null;
if (apiKey) {
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        console.log('[Gemini Config] Gemini Client initialized successfully.');
    } catch (e) {
        console.error('[Gemini Config] Error initializing GoogleGenerativeAI:', e.message);
    }
} else {
    console.warn('[Gemini Config] GEMINI_API_KEY not set. AI endpoints will use local NLP fallback.');
}

module.exports = {
    genAI,
    apiKey
};
