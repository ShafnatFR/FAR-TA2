
/** 
 * Backend AI Utility for Gemini Key Rotation
 * Supports VITE_GEMINI_API_KEY and VITE_GEMINI_API_KEY_2...VITE_GEMINI_API_KEY_50
 */

const getAllApiKeys = () => {
    const keys = [];
    
    // Primary key
    if (process.env.VITE_GEMINI_API_KEY) keys.push(process.env.VITE_GEMINI_API_KEY);
    
    // Numbered keys
    for (let i = 2; i <= 50; i++) {
        const key = process.env[`VITE_GEMINI_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    
    return [...new Set(keys)];
};

const API_KEYS = getAllApiKeys();
const failedKeys = new Set();
let currentKeyIndex = 0;

function getNextWorkingKey() {
    const totalKeys = API_KEYS.length;
    if (totalKeys === 0) return null;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
        const idx = (currentKeyIndex + attempt) % totalKeys;
        const key = API_KEYS[idx];
        
        if (!failedKeys.has(key)) {
            currentKeyIndex = idx;
            return key;
        }
    }
    
    failedKeys.clear();
    return API_KEYS[0];
}

function markKeyAsFailed(key) {
    if (key) failedKeys.add(key);
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

function isKeySpecificError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    const code = error?.status || error?.code || error?.error?.code;
    return (code === 403 || code === 429 || msg.includes('quota') || msg.includes('exhausted'));
}

module.exports = {
    getNextWorkingKey,
    markKeyAsFailed,
    isKeySpecificError,
    getApiKeysLength: () => API_KEYS.length,
    advanceKeyIndex: () => { currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length; }
};
