
const { callGeminiWithRotation } = require("./aiUtils");

/**
 * Service for Kitchen Scanner & Recipe Integration
 */
async function scanKitchen(data, userId) {
    // 1. Analyze Image using Gemini Flash
    const prompt = `
        Anda adalah Smart Kitchen AI. 
        Analisis gambar bahan makanan ini (Base64 provided).
        TUGAS:
        1. Identifikasi daftar bahan makanan yang terlihat jelas.
        2. Tafsirkan bahan-bahan tersebut ke dalam teks deskripsi singkat.
        3. Analisis dan racik 1 rekomendasi resep masakan kreatif dari bahan tersebut.
        4. Berikan tips penyimpanan agar bahan tetap awet.

        OUTPUT JSON:
        {
          "ingredients": ["string"],
          "description": "string (Tafsiran visual bahan)",
          "recipe": "string (Langkah masak singkat)",
          "tips": "string",
          "cookpadQuery": "string (Kata kunci pencarian optimal untuk Cookpad)"
        }
    `;

    // Note: In a real Vision AI call, the image base64 would be passed in parts.
    // I'll assume callGeminiWithRotation handles image data if provided in options.
    const aiResult = await callGeminiWithRotation(userId, prompt, { 
        isJson: true,
        image: data.image 
    });

    // 2. Map Cookpad Recommendations
    // For now, we generate dynamic search-based results
    const cookpadRecipes = await getCookpadRecipes(aiResult.ingredients);

    return {
        ...aiResult,
        externalRecipes: cookpadRecipes
    };
}

/**
 * Service for Text-based Recipe Generation
 */
async function generateRecipe(data, userId) {
    const prompt = `
        Anda adalah Pakar Kuliner Zero-Waste.
        Bahan tersedia: ${data.foodName}
        Deskripsi: ${data.description || 'Tidak ada deskripsi tambahan'}
        
        TUGAS:
        Berikan 1 resep kreatif yang bisa dibuat dari bahan tersebut.
        Gunakan langkah-langkah yang ringkas dan menarik.

        OUTPUT JSON:
        {
          "recipe": "string (Nama menu dan langkah masak)"
        }
    `;

    return await callGeminiWithRotation(userId, prompt, { isJson: true });
}

/**
 * Helper to simulate/generate Cookpad external integration
 */
async function getCookpadRecipes(ingredients) {
    if (!ingredients || ingredients.length === 0) return [];
    
    // Generate valid Cookpad Indonesia search links
    const baseUrl = "https://cookpad.com/id/cari/";
    const query = ingredients.slice(0, 3).join(" ");
    const searchUrl = `${baseUrl}${encodeURIComponent(query)}`;

    // Providing a set of structured links that the frontend can "embed" as cards
    return [
        {
            title: `Aneka Resep ${ingredients[0]} di Cookpad`,
            link: searchUrl,
            source: "Cookpad Indonesia",
            icon: "https://cookpad.com/favicon.ico"
        },
        {
            title: `Inspirasi Masakan ${ingredients.slice(0, 2).join(' & ')}`,
            link: `${baseUrl}${encodeURIComponent(ingredients.slice(0, 2).join(' '))}`,
            source: "Cookpad Indonesia",
            icon: "https://cookpad.com/favicon.ico"
        }
    ];
}

module.exports = { scanKitchen, generateRecipe };
