
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { 
    getNextWorkingKey, 
    markKeyAsFailed, 
    isKeySpecificError, 
    getApiKeysLength,
    advanceKeyIndex 
} = require("./aiUtils");

async function callCorporateAI(action, data) {
    const maxAttempts = getApiKeysLength();
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const apiKey = getNextWorkingKey();
        if (!apiKey) throw new Error("No Gemini API Keys available.");

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            let prompt = "";
            switch (action) {
                case 'GENERATE_RECIPE':
                    prompt = `Anda adalah Chef Ahli Food Waste Reduction. 
                    Donatur memiliki surplus makanan: "${data.foodName}". 
                    Deskripsi: "${data.description}".
                    Tugas: Berikan 1 resep kreatif "Zero Waste" untuk mengolah kembali makanan ini menjadi hidangan baru yang lezat. 
                    Sertakan Nama Hidangan, Bahan Tambahan, dan Langkah Singkat.
                    Gunakan Bahasa Indonesia yang menarik.
                    Output harus valid JSON: { "recipe": "string" }`;
                    break;
                case 'DESIGN_PACKAGING':
                    prompt = `Anda adalah Pakar Desain Kemasan Berkelanjutan.
                    Makanan: "${data.foodName}".
                    Tugas: Berikan rekomendasi desain kemasan ramah lingkungan yang premium untuk brand korporat.
                    Penjelasan material dan visual. Bahasa Indonesia.
                    Output harus valid JSON: { "packaging": "string" }`;
                    break;
                case 'WRITE_CSR_COPY':
                    prompt = `Anda adalah PR & CSR Specialist.
                    Donatur: ${data.donorName}, Menu: ${data.foodName}, Poin: ${data.impactPoints}, CO2: ${data.co2Saved}kg.
                    Tugas: Tulis copy media sosial LinkedIn/Instagram profesional tentang kontribusi lingkungan ini.
                    Gunakan Bahasa Indonesia.
                    Output harus valid JSON: { "copy": "string" }`;
                    break;
                default:
                    throw new Error("Invalid Corporate AI action");
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());

        } catch (error) {
            lastError = error;
            console.error(`[AI ATTEMPT ${attempt + 1}] Failed with key ...${apiKey.slice(-6)}:`, error.message);
            
            if (isKeySpecificError(error)) {
                markKeyAsFailed(apiKey);
            } else {
                advanceKeyIndex();
            }
        }
    }
    
    throw lastError || new Error("Corporate AI failed after all key rotation attempts.");
}

module.exports = { callCorporateAI };
