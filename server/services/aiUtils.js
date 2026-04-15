
const { GoogleGenerativeAI } = require("@google/generative-ai");
const aiDB = require("./aiDB");

/** 
 * Backend AI Utility for Gemini Key Rotation
 * Supports Hierarchical Priority:
 * 1. Subscriber Master Key
 * 2. User Personal Keys
 * 3. Global Pool Rotation (Fallback)
 * 
 * IMPORTANT: Keys are loaded lazily on first call to ensure
 * dotenv has been configured before we read process.env.
 */

let GLOBAL_KEYS = null; // Lazy loaded
const MASTER_KEY_ENV = 'VITE_GEMINI_API_KEY_CORPORATE_MASTER';
const failedKeys = new Map(); // key -> expiry timestamp
let globalIndex = 0;

function loadGlobalKeys() {
    if (GLOBAL_KEYS !== null) return GLOBAL_KEYS;
    
    const keys = [];
    if (process.env.VITE_GEMINI_API_KEY) keys.push(process.env.VITE_GEMINI_API_KEY);
    for (let i = 2; i <= 100; i++) {
        const key = process.env[`VITE_GEMINI_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    GLOBAL_KEYS = [...new Set(keys)];
    console.log(`[AI Utils] ✅ Global Key Pool loaded: ${GLOBAL_KEYS.length} keys available`);
    return GLOBAL_KEYS;
}

function isKeyFailed(key) {
    if (!failedKeys.has(key)) return false;
    const expiry = failedKeys.get(key);
    if (Date.now() > expiry) {
        failedKeys.delete(key); // Cooldown expired, key is available again
        return false;
    }
    return true;
}

function markKeyFailed(key, cooldownMs = 5 * 60 * 1000) {
    failedKeys.set(key, Date.now() + cooldownMs);
}

/**
 * Core function to execute AI calls with robust rotation
 */
async function callGeminiWithRotation(userId, prompt, options = {}) {
    const globalPool = loadGlobalKeys();
    
    // 1. Build key priority list
    const keysToTry = [];
    
    // Tier 1: Subscriber Master Key
    try {
        const userSub = await aiDB.getUserAISubscription(userId);
        const masterKey = process.env[MASTER_KEY_ENV];
        if (userSub && userSub.ai_subscription_status === 'SUBSCRIBER' && masterKey) {
            keysToTry.push({ key: masterKey, source: 'master' });
        }
    } catch (e) {
        console.warn('[AI Utils] Could not check subscription:', e.message);
    }

    // Tier 2: User Personal Keys
    try {
        const userKeys = await aiDB.getUserAIKeys(userId);
        userKeys.forEach(k => keysToTry.push({ key: k.api_key, source: 'personal' }));
    } catch (e) {
        console.warn('[AI Utils] Could not fetch user keys:', e.message);
    }

    // Tier 3: Global Pool - rotated starting from globalIndex
    for (let i = 0; i < globalPool.length; i++) {
        const idx = (globalIndex + i) % globalPool.length;
        keysToTry.push({ key: globalPool[idx], source: 'global' });
    }

    // Deduplicate by key value, keeping first occurrence (highest priority)
    const seen = new Set();
    const finalKeyList = keysToTry.filter(entry => {
        if (seen.has(entry.key)) return false;
        seen.add(entry.key);
        return true;
    });

    if (finalKeyList.length === 0) {
        throw new Error("Tidak ada API Key yang tersedia. Silakan masukkan API Key di profil Anda.");
    }

    console.log(`[AI Utils] Starting rotation with ${finalKeyList.length} keys (globalIndex: ${globalIndex})`);

    let lastError = null;
    let attemptCount = 0;

    for (const entry of finalKeyList) {
        // Skip keys currently in cooldown
        if (isKeyFailed(entry.key)) {
            console.log(`[AI Utils] ⏭ Skipping ${entry.source} key ...${entry.key.slice(-6)} (in cooldown)`);
            continue;
        }

        attemptCount++;
        const keyLabel = `${entry.source}:...${entry.key.slice(-6)}`;

        try {
            console.log(`[AI Utils] 🔑 Trying key ${keyLabel} (attempt ${attemptCount})`);
            
            const genAI = new GoogleGenerativeAI(entry.key);
            const model = genAI.getGenerativeModel({ 
                model: options.model || "gemini-flash-latest",
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

            // Success! Advance global index for next call
            if (entry.source === 'global') {
                const keyIdx = globalPool.indexOf(entry.key);
                if (keyIdx !== -1) {
                    globalIndex = (keyIdx + 1) % globalPool.length;
                }
            }

            console.log(`[AI Utils] ✅ Success with key ${keyLabel}`);
            return options.isJson ? JSON.parse(text) : text;

        } catch (error) {
            lastError = error;
            const msg = error.message?.toLowerCase() || "";
            const isQuota = msg.includes("quota") || msg.includes("exhausted") || msg.includes("429") || msg.includes("too many");
            const isInvalidKey = msg.includes("api_key_invalid") || msg.includes("forbidden") || msg.includes("401");
            
            console.warn(`[AI Utils] ❌ Key ${keyLabel} failed: ${isQuota ? 'QUOTA' : isInvalidKey ? 'INVALID' : 'OTHER'} - ${error.message?.substring(0, 100)}`);

            if (isQuota && (options.model || "gemini-1.5-flash") === "gemini-1.5-flash") {
                console.warn(`[AI Utils] 🔄 Fallback failed or quota hit. Skipping key ${keyLabel}...`);
            } else if (isQuota) {
                console.warn(`[AI Utils] 🔄 Fallback to gemini-1.5-flash for key ${keyLabel}...`);
                try {
                    const fallbackAI = new GoogleGenerativeAI(entry.key);
                    const fallbackModel = fallbackAI.getGenerativeModel({ 
                        model: "gemini-flash-latest",
                        generationConfig: { 
                            responseMimeType: options.isJson ? "application/json" : "text/plain" 
                        }
                    });
                    const fallbackResult = await fallbackModel.generateContent({ contents });
                    const fbResponse = await fallbackResult.response;
                    const fbText = fbResponse.text();
                    console.log(`[AI Utils] ✅ Success with fallback model on ${keyLabel}`);
                    return options.isJson ? JSON.parse(fbText) : fbText;
                } catch (fbError) {
                    console.warn(`[AI Utils] ❌ Fallback also failed for ${keyLabel}:`, fbError.message);
                }
            }

            if (isQuota) {
                markKeyFailed(entry.key, 5 * 60 * 1000); // 5 min cooldown
                // Advance global index past this failed key immediately
                if (entry.source === 'global') {
                    const keyIdx = globalPool.indexOf(entry.key);
                    if (keyIdx !== -1) {
                        globalIndex = (keyIdx + 1) % globalPool.length;
                    }
                }
                continue; // Try next key
            } else if (isInvalidKey) {
                markKeyFailed(entry.key, 60 * 60 * 1000); // 1 hour cooldown for invalid keys
                continue;
            } else {
                // Unknown error - still try next key
                continue;
            }
        }
    }

    console.error(`[AI Utils] 🚨 ALL ${attemptCount} keys exhausted. Total pool: ${finalKeyList.length}, Failed/cooldown: ${failedKeys.size}`);
    throw lastError || new Error("Semua API Key gagal memproses permintaan.");
}

module.exports = {
    callGeminiWithRotation
};
