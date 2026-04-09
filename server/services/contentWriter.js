
const { callGeminiWithRotation } = require("./aiUtils");

/**
 * Service for Social Media and CSR Copywriting
 */
async function writeCSRCopy(data, userId) {
    const prompt = `
        Anda adalah PR & Social Media Specialist khusus di bidang Filantropi dan Food Rescue.
        DATA INPUT:
        - Donatur: ${data.donorName}
        - Menu: ${data.foodName}
        - Estimasi Dampak: ${data.impactText || 'Membantu keluarga membutuhkan'}
        - Target Platform: ${data.platform || 'Instagram/LinkedIn'}
        
        TUGAS:
        Buat 3 variasi copy teks untuk media sosial:
        1. Emosional/Inspiratif
        2. Profesional/Corporate (Fokus pada ESG/CSR)
        3. Singkat/Viral (Fokus pada ajakan bertindak/CTA)
        
        Gunakan Bahasa Indonesia yang menarik dan sertakan hashtag yang relevan.

        OUTPUT JSON:
        {
          "variations": [
            { "type": "Emotional", "content": "string" },
            { "type": "Professional", "content": "string" },
            { "type": "Viral", "content": "string" }
          ],
          "hashtags": ["string"]
        }
    `;

    return await callGeminiWithRotation(userId, prompt, { isJson: true });
}

module.exports = { writeCSRCopy };
