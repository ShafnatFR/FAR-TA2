
import { GoogleGenAI } from "@google/genai";

/** Collect all VITE_GEMINI_API_KEY* from environment */
const getAllApiKeys = (): string[] => {
  const keys: string[] = [];
  const env = import.meta.env;
  
  // Primary key
  if (env.VITE_GEMINI_API_KEY) keys.push(env.VITE_GEMINI_API_KEY);
  
  // Numbered keys (VITE_GEMINI_API_KEY_2, _3, _4, ...)
  for (let i = 2; i <= 50; i++) {
    const key = env[`VITE_GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  // Deduplicate
  const unique = [...new Set(keys)];
  console.log(`%c[AI KEY POOL] ${unique.length} API key(s) tersedia`, 'color: #8B5CF6; font-weight: bold;');
  return unique;
};

const API_KEYS = getAllApiKeys();
const failedKeys = new Set<string>(); // Blacklisted keys for this session
let currentKeyIndex = 0;

/** Get the next working API key, skipping failed ones */
export const getNextWorkingKey = (): string | null => {
  const totalKeys = API_KEYS.length;
  
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const idx = (currentKeyIndex + attempt) % totalKeys;
    const key = API_KEYS[idx];
    
    if (!failedKeys.has(key)) {
      currentKeyIndex = idx;
      return key;
    }
  }
  
  // All keys exhausted — reset and try again from beginning
  console.warn('[AI KEY POOL] Semua key gagal, mereset blacklist...');
  failedKeys.clear();
  return API_KEYS[0] || null;
};

/** Mark a key as failed and advance to next */
export const markKeyAsFailed = (key: string): void => {
  failedKeys.add(key);
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  const remaining = API_KEYS.length - failedKeys.size;
  console.warn(`%c[AI KEY POOL] Key ...${key.slice(-6)} GAGAL. Sisa ${remaining} key tersedia.`, 'color: #EF4444; font-weight: bold;');
};

/** Check if an error is a KEY-SPECIFIC problem (should blacklist the key) */
export const isKeySpecificError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  const code = error?.status || error?.code || error?.error?.code;
  
  return (
    code === 403 || code === 429 ||
    msg.includes('permission_denied') ||
    msg.includes('leaked') ||
    msg.includes('api_key_invalid') ||
    msg.includes('quota') ||
    msg.includes('forbidden') ||
    msg.includes('resource_exhausted')
  );
};

/** Check if an error is transient/server-side (should retry with next key but NOT blacklist) */
export const isTransientError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  const code = error?.status || error?.code || error?.error?.code;
  
  return (
    code === 500 || code === 502 || code === 503 || code === 504 ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('internal') ||
    msg.includes('temporarily') ||
    msg.includes('try again') ||
    msg.includes('deadline exceeded') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed')
  );
};

export const getApiKeysLength = () => API_KEYS.length;
export const advanceKeyIndex = () => {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
};
