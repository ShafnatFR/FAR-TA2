
const { callGeminiWithRotation } = require("./aiUtils");

/**
 * Service for Food Quality and Safety Verification
 */
async function verifyFood(data, userId) {
    const prompt = `
        Anda adalah Senior Food Safety Auditor & Environmental Analyst.
        DATA INPUT:
        - Nama Makanan: ${data.foodName}
        - Bahan: ${data.ingredients}
        - Waktu Masak: ${data.madeTime}
        - Waktu Mulai Distribusi: ${data.distributionStart}
        - Berat Total: ${data.weightGram} gram
        
        KRITERIA AUDIT KETAT (GOLDEN RULES):
        1. VALIDASI DATA: Jika nama makanan atau bahan terlihat seperti data acak/ngawur (misal: "asdf", "abcd", "tes"), WAJIB berikan 'isSafe: false' dan 'qualityPercentage: 0'.
        2. ATURAN 4 JAM (TIME-GAP): Makanan matang hanya aman di suhu ruang maksimal 4 jam. 
           - Jika (Waktu Distribusi - Waktu Masak) > 4 jam: Berikan peringatan keras dan kurangi skor drastis.
           - Jika (Waktu Distribusi - Waktu Masak) > 8 jam: WAJIB berikan 'isSafe: false' dan 'qualityPercentage < 20'.
        3. VISUAL CONSISTENCY: Nama makanan dan bahan harus sinkron dengan data visual (identifikasi bahan dari deskripsi).
        4. ALERGEN: Deteksi semua potensi alergen (Telur, Susu, Seafood, Kacang, Gandum, Kedelai).
        
        TUGAS 1: Klasifikasikan bahan ke kategori LCA (Daging Merah, Unggas & Telur, Ikan & Seafood, Karbohidrat, Sayur & Buah, Lainnya).
        TUGAS 2: Audit Keamanan (Microbiology Risk) berdasarkan selisih waktu.
        TUGAS 3: Hitung skor Halal berdasarkan bahan yang disebutkan.

        OUTPUT JSON:
        {
          "isSafe": boolean,
          "isHalal": boolean,
          "halalScore": integer (0-100),
          "reasoning": string,
          "hygieneScore": integer (0-100),
          "qualityPercentage": integer (0-100),
          "detectedAllergens": [string],
          "shelfLifePrediction": string,
          "storageTips": [string],
          "detectedItems": [ { "name": "Bahan", "category": "Kategori" } ]
        }
    `;

    return await callGeminiWithRotation(userId, prompt, { isJson: true });
}

module.exports = { verifyFood };
