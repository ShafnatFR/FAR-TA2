
const { GoogleGenerativeAI } = require("@google/generative-ai");
const aiDB = require("./aiDB");

/** 
 * Backend AI Utility for Gemini Key Rotation
 * Supports Hierarchical Priority:
 * 1. Subscriber Master Key
 * 2. User Personal Keys
 * 3. Global Pool Rotation (Fallback)
 */

const getGlobalPoolKeys = () => {
    const keys = [];
    if (process.env.VITE_GEMINI_API_KEY) keys.push(process.env.VITE_GEMINI_API_KEY);
    for (let i = 2; i <= 50; i++) {
        const key = process.env[`VITE_GEMINI_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    return [...new Set(keys)];
};

const GLOBAL_KEYS = getGlobalPoolKeys();
const MASTER_KEY = process.env.VITE_GEMINI_API_KEY_CORPORATE_MASTER;
const failedKeys = new Set();
let globalIndex = 0;

/**
 * Core function to execute AI calls with robust rotation
 */
async function callGeminiWithRotation(userId, prompt, options = {}) {
    // 1. Determine Key Priority
    const keysToTry = [];
    
    // Tier 1: Subscriber Master Key
    const userSub = await aiDB.getUserAISubscription(userId);
    if (userSub && userSub.ai_subscription_status === 'SUBSCRIBER' && MASTER_KEY) {
        keysToTry.push(MASTER_KEY);
    }

    // Tier 2: User Personal Keys
    const userKeys = await aiDB.getUserAIKeys(userId);
    userKeys.forEach(k => keysToTry.push(k.api_key));

    // Tier 3: Global Pool (Only if Tier 1&2 fail or are empty)
    // We add them at the end
    const globalPool = [...GLOBAL_KEYS];
    // Rotate the global pool so we don't always try the first one
    const rotatedPool = [
        ...globalPool.slice(globalIndex),
        ...globalPool.slice(0, globalIndex)
    ];
    
    const finalKeySet = [...new Set([...keysToTry, ...rotatedPool])];

    if (finalKeySet.length === 0) {
        throw new Error("Tidak ada API Key yang tersedia. Silakan masukkan API Key di profil Anda.");
    }

    let lastError = null;
    for (let i = 0; i < finalKeySet.length; i++) {
        const apiKey = finalKeySet[i];
        if (failedKeys.has(apiKey) && i < keysToTry.length) continue; // Skip failed personal keys

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: options.model || "gemini-1.5-flash",
                generationConfig: { 
                    responseMimeType: options.isJson ? "application/json" : "text/plain" 
                }
            });

            // Vision Support
            const contents = [{ role: 'user', parts: [{ text: prompt }] }];
            if (options.image) {
                const base64Data = options.image.split(',')[1] || options.image;
                contents[0].parts.push({
                    inlineData: { mimeType: 'image/jpeg', data: base64Data }
                });
            }

            const result = await model.generateContent({ contents });
            const response = await result.response;
            const text = response.text();

            // Success! 
            if (globalPool.includes(apiKey)) {
                // Update global index for next time to distribute load
                globalIndex = (GLOBAL_KEYS.indexOf(apiKey) + 1) % GLOBAL_KEYS.length;
            }

            return options.isJson ? JSON.parse(text) : text;

        } catch (error) {
            lastError = error;
            const msg = error.message?.toLowerCase() || "";
            const isQuota = msg.includes("quota") || msg.includes("exhausted") || error.status === 429;
            
            console.warn(`[AI Utils] Key check failed (Attempt ${i+1}/${finalKeySet.length}):`, error.message);

            if (isQuota) {
                // If it's a global key, maybe mark it as failed for a while
                if (globalPool.includes(apiKey)) {
                    failedKeys.add(apiKey);
                    setTimeout(() => failedKeys.delete(apiKey), 1000 * 60 * 5); // 5 min cooldown
                }
                continue; // Try next key
            } else {
                // For non-quota errors (invalid key, forbidden), don't retry with THIS key again
                if (i < keysToTry.length) {
                    // It's a user/master key that's invalid - stop trying it
                    console.error("[AI Utils] Critical key error:", error.message);
                }
                continue;
            }
        }
    }

    throw lastError || new Error("Semua API Key gagal memproses permintaan.");
}

module.exports = {
    callGeminiWithRotation
};
