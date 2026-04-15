
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load all keys
const keys = [];
if (process.env.VITE_GEMINI_API_KEY) keys.push({ label: 'KEY_1', key: process.env.VITE_GEMINI_API_KEY });
for (let i = 2; i <= 50; i++) {
    const k = process.env[`VITE_GEMINI_API_KEY_${i}`];
    if (k) keys.push({ label: `KEY_${i}`, key: k });
}

console.log(`\n🔍 DIAGNOSTIC: Testing ${keys.length} API Keys...\n`);
console.log(`Testing with MINIMAL prompt (no image) to minimize token usage.\n`);

async function testKey(entry) {
    try {
        const genAI = new GoogleGenerativeAI(entry.key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say only: OK");
        const text = (await result.response).text();
        return { ...entry, status: '✅ OK', response: text.trim().substring(0, 30) };
    } catch (error) {
        const msg = error.message || '';
        if (msg.includes('429') || msg.includes('quota')) {
            return { ...entry, status: '❌ QUOTA', detail: 'Rate limited / quota exceeded' };
        } else if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
            return { ...entry, status: '🔑 INVALID', detail: 'Key is invalid or revoked' };
        } else if (msg.includes('403') || msg.includes('forbidden')) {
            return { ...entry, status: '🚫 FORBIDDEN', detail: 'API not enabled for this project' };
        } else {
            return { ...entry, status: '⚠️ ERROR', detail: msg.substring(0, 80) };
        }
    }
}

async function run() {
    // Test first 5 keys quickly to see the pattern
    console.log('--- Testing first 5 keys (quick check) ---\n');
    for (let i = 0; i < Math.min(5, keys.length); i++) {
        const result = await testKey(keys[i]);
        console.log(`${result.label} (${result.key.slice(-8)}): ${result.status} ${result.detail || result.response || ''}`);
        
        // Small delay between tests
        await new Promise(r => setTimeout(r, 1000));
    }

    // Also try alternative model names
    console.log('\n--- Testing alternative models with KEY_1 ---\n');
    const altModels = ['gemini-2.0-flash-lite', 'gemini-1.5-flash-8b', 'gemini-2.5-flash-preview-04-17'];
    for (const modelName of altModels) {
        try {
            const genAI = new GoogleGenerativeAI(keys[0].key);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say only: OK");
            const text = (await result.response).text();
            console.log(`${modelName}: ✅ OK - "${text.trim().substring(0, 30)}"`);
        } catch (error) {
            const msg = error.message || '';
            const shortMsg = msg.includes('429') ? 'QUOTA' : msg.includes('404') ? 'NOT FOUND' : msg.substring(0, 60);
            console.log(`${modelName}: ❌ ${shortMsg}`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

run().then(() => {
    console.log('\n✅ Diagnostic complete.');
    process.exit(0);
}).catch(e => {
    console.error('Diagnostic failed:', e);
    process.exit(1);
});
