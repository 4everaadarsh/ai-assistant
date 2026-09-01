require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.gemini_api_key;

console.log("==========================================");
console.log("[Gemini Config] API Key Configured:", !!apiKey);
console.log("==========================================");

let genAI = null;

if (apiKey) {
    try {
        genAI = new GoogleGenerativeAI(apiKey);

        console.log(
            "[Gemini Config] Google Generative AI Client initialized successfully."
        );
    } catch (error) {
        console.error(
            "[Gemini Config] Initialization Error:",
            error.message
        );
    }
} else {
    console.warn(
        "[Gemini Config] GEMINI_API_KEY not found. AI will use fallback."
    );
}

module.exports = {
    genAI,
    apiKey,
    apiKeyConfigured: Boolean(apiKey && genAI)
};