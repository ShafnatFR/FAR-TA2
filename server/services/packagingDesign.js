
const { callGeminiWithRotation } = require("./aiUtils");

/**
 * Service for Packaging Design Recommendations
 */
async function generatePackagingDesign(data, userId) {
    const prompt = `
        Anda adalah Pakar Desain Kemasan Ramah Lingkungan (Sustainable Packaging Expert).
        DATA INPUT:
        - Nama Makanan: ${data.foodName}
        - Tipe Pengiriman: ${data.deliveryMethod || 'Pickup/Delivery'}
        
        TUGAS:
        Berikan rekomendasi desain kemasan yang:
        1. Mengurangi penggunaan plastik sekali pakai.
        2. Menjaga suhu dan kualitas ${data.foodName}.
        3. Memberikan kesan premium namun rendah biaya.
        4. Sertakan elemen visual yang disarankan (warna, bahan).

        OUTPUT JSON:
        {
          "packaging": "string (Penjelasan detail desain)",
          "materials": ["string"],
          "ecoScore": integer (0-100)
        }
    `;

    return await callGeminiWithRotation(userId, prompt, { isJson: true });
}

module.exports = { generatePackagingDesign };
