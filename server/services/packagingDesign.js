
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

async function generatePackagingImage(data, userId) {
    // We use AI to generate a precise prompt for an image generator (Polinations / DALL-E style)
    const prompt = `
        Tuliskan prompt bahasa Inggris yang sangat detail untuk pembuat gambar AI (seperti DALL-E atau Midjourney).
        OBJEK: Desain kemasan eco-friendly premium untuk makanan: ${data.foodName}.
        KONSEP: ${data.packagingDesc}
        GAYA: Foto produk studio, pencahayaan sinematik, minimalis, latar belakang bersih.
        HASIL: Hanya berikan prompt bahasa Inggris saja, tanpa penjelasan lain.
    `;

    let visualPrompt = await callGeminiWithRotation(userId, prompt, { isJson: false });
    
    // Clean up: Remove introductory text if present (e.g., "The prompt is:", quotes, etc.)
    visualPrompt = visualPrompt.replace(/^(Here is a prompt:|The prompt is:|Prompt:)/i, "").trim();
    visualPrompt = visualPrompt.replace(/^["']|["']$/g, "").trim(); // Remove leading/trailing quotes
    
    // Using Pollinations.ai for live image generation via URL
    const encodedPrompt = encodeURIComponent(visualPrompt);
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random()*1000)}&nologo=true`;
    
    return { imageUrl };
}

module.exports = { generatePackagingDesign, generatePackagingImage };
