
import { GoogleGenAI, Type } from "@google/genai";
import { SocialImpactData } from "../types";

export interface DetectedItem {
  name: string;
  category: 'Daging Merah' | 'Unggas & Telur' | 'Ikan & Seafood' | 'Karbohidrat' | 'Sayur & Buah' | 'Lainnya';
}

export interface ImpactBreakdownItem {
  name: string;
  weightKg: number; // Weight per portion
  factor: number;
  result: number; // Result per portion
  category: string;
}

export interface DetailedSocialImpact extends SocialImpactData {
  co2Breakdown: ImpactBreakdownItem[];
  socialBreakdown: ImpactBreakdownItem[];
  portionCount: number;
  co2PerPortion: number;
  pointsPerPortion: number;
}

export interface QualityAnalysisResult {
  isSafe: boolean;
  isHalal: boolean;
  halalScore: number;
  halalReasoning: string;
  reasoning: string;
  shelfLifePrediction: string;
  hygieneScore: number;
  qualityPercentage: number;
  detectedItems: DetectedItem[];
  detectedCategory: string;
  storageTips: string[];
  socialImpact: DetailedSocialImpact;
}

// ==========================================
// API KEY ROTATION SYSTEM
// ==========================================

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
const getNextWorkingKey = (): string | null => {
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
const markKeyAsFailed = (key: string): void => {
  failedKeys.add(key);
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  const remaining = API_KEYS.length - failedKeys.size;
  console.warn(`%c[AI KEY POOL] Key ...${key.slice(-6)} GAGAL. Sisa ${remaining} key tersedia.`, 'color: #EF4444; font-weight: bold;');
};

/** Check if an error is a KEY-SPECIFIC problem (should blacklist the key) */
const isKeySpecificError = (error: any): boolean => {
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
const isTransientError = (error: any): boolean => {
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

// ==========================================
// EMISSION & SOCIAL IMPACT FACTORS
// ==========================================

// Faktor Emisi CO2e per Kg (LCA Standard Approximation)
const EMISSION_FACTORS: Record<string, number> = {
  'Daging Merah': 20.0,    // Sapi, Kambing
  'Unggas & Telur': 6.0,   // Ayam, Bebek, Telur
  'Ikan & Seafood': 4.0,   // Ikan
  'Karbohidrat': 3.5,      // Nasi, Roti, Mie
  'Sayur & Buah': 1.5,     // Sayuran, Buah
  'Lainnya': 0.5           // Bumbu, Air, dll
};

// Faktor Social Points (EIS Score Basis)
const SOCIAL_FACTORS: Record<string, number> = {
  'Daging Merah': 150,
  'Unggas & Telur': 100,
  'Ikan & Seafood': 120,
  'Karbohidrat': 50,
  'Sayur & Buah': 60,
  'Lainnya': 10
};

const calculateDetailedImpact = (
  detectedItems: DetectedItem[],
  totalWeightGram: number,
  packagingType: string,
  portionCount: number = 1
): DetailedSocialImpact => {
  // Hitung berat rata-rata per porsi (dalam KG)
  const totalWeightKg = totalWeightGram / 1000;
  const weightPerPortionKg = totalWeightKg / (portionCount || 1);

  // 1. Estimasi Distribusi Berat per item dalam 1 porsi
  const weightRatios: Record<string, number> = {
    'Karbohidrat': 4,
    'Daging Merah': 3,
    'Unggas & Telur': 3,
    'Ikan & Seafood': 3,
    'Sayur & Buah': 2,
    'Lainnya': 1
  };

  let totalRatioPoints = 0;
  const itemsWithRatio = detectedItems.map(item => {
    const ratio = weightRatios[item.category] || 1;
    totalRatioPoints += ratio;
    return { ...item, ratio };
  });

  // 2. Hitung Breakdown CO2 & Social (UNTUK 1 PORSI)
  const co2Breakdown: ImpactBreakdownItem[] = [];
  const socialBreakdown: ImpactBreakdownItem[] = [];

  let totalCo2PerPortion = 0;
  let totalPointsPerPortion = 0;

  itemsWithRatio.forEach(item => {
    // Berat item ini dalam 1 porsi
    const itemWeightPerPortion = parseFloat(((item.ratio / totalRatioPoints) * weightPerPortionKg).toFixed(3));

    // CO2 Calculation per Porsi
    const co2Factor = EMISSION_FACTORS[item.category] || 0.5;
    const co2Val = parseFloat((itemWeightPerPortion * co2Factor).toFixed(2));
    totalCo2PerPortion += co2Val;

    co2Breakdown.push({
      name: `${item.name} (${item.category})`,
      category: item.category,
      weightKg: itemWeightPerPortion, // Berat per porsi
      factor: co2Factor,
      result: co2Val // Hasil per porsi
    });

    // Social Points Calculation per Porsi
    const socialFactor = SOCIAL_FACTORS[item.category] || 10;
    const pointsVal = Math.round(itemWeightPerPortion * socialFactor * 10);
    totalPointsPerPortion += pointsVal;

    socialBreakdown.push({
      name: item.name,
      category: item.category,
      weightKg: itemWeightPerPortion,
      factor: socialFactor,
      result: pointsVal
    });
  });

  // Packaging Bonus (Applied to points)
  let packagingMultiplier = 1.0;
  if (packagingType === 'no-plastic') packagingMultiplier = 1.2;
  else if (packagingType === 'recycled') packagingMultiplier = 1.1;
  else if (packagingType === 'plastic') packagingMultiplier = 0.9;

  totalPointsPerPortion = Math.round(totalPointsPerPortion * packagingMultiplier);

  // 3. KALKULASI TOTAL AKHIR (DIKALIKAN JUMLAH PORSI)
  const grandTotalCo2 = parseFloat((totalCo2PerPortion * portionCount).toFixed(2));
  const grandTotalPoints = Math.round(totalPointsPerPortion * portionCount);

  // Water & Land based on total CO2 proxy (simplified)
  const waterSaved = Math.round(grandTotalCo2 * 200);
  const landSaved = parseFloat((grandTotalCo2 * 0.5).toFixed(1));

  return {
    totalPoints: grandTotalPoints,
    co2Saved: grandTotalCo2,
    waterSaved,
    landSaved,
    wasteReduction: parseFloat(totalWeightKg.toFixed(2)),
    level: grandTotalPoints > 500 ? "Expert" : "Aktif",
    co2Breakdown,
    socialBreakdown,
    portionCount,
    co2PerPortion: parseFloat(totalCo2PerPortion.toFixed(2)),
    pointsPerPortion: totalPointsPerPortion
  };
};

// ==========================================
// MAIN AI ANALYSIS FUNCTION (WITH KEY ROTATION)
// ==========================================

export const analyzeFoodQuality = async (
  inputLabels: string[],
  imageBase64?: string,
  context?: {
    foodName: string;
    ingredients: string;
    madeTime: string;
    storageLocation: string;
    weightGram: number;
    packagingType: string;
    distributionStart: string;
    quantityCount?: number;
  }
): Promise<QualityAnalysisResult> => {

  const parts: any[] = [];
  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
  }

  const prompt = `
    Anda adalah Senior Food Safety Auditor & Environmental Analyst.
       DATA INPUT:
    - Nama Makanan: ${context?.foodName}
    - Bahan: ${context?.ingredients}
    - Waktu Masak: ${context?.madeTime}
    - Waktu Mulai Distribusi: ${context?.distributionStart}
    - Berat Total: ${context?.weightGram} gram
    
    KRITERIA AUDIT KETAT (GOLDEN RULES):
    1. VALIDASI DATA: Jika nama makanan atau bahan terlihat seperti data acak/ngawur (misal: "asdf", "abcd", "tes"), WAJIB berikan 'isSafe: false' dan 'qualityPercentage: 0'.
    2. ATURAN 4 JAM (TIME-GAP): Makanan matang hanya aman di suhu ruang maksimal 4 jam. 
       - Jika (Waktu Distribusi - Waktu Masak) > 4 jam: Berikan peringatan keras dan kurangi skor drastis.
       - Jika (Waktu Distribusi - Waktu Masak) > 8 jam: WAJIB berikan 'isSafe: false' dan 'qualityPercentage < 20'.
    3. VISUAL CONSISTENCY: Nama makanan dan bahan harus sinkron dengan apa yang terlihat di foto. Jika tertulis "Ayam" tapi foto "Sayur", berikan penalti skor.
    4. ALERGEN: Deteksi semua potensi alergen. Jika ditemukan elemen seperti Telur (Egg), Susu (Milk/Dairy), Seafood (Udang/Ikan/Cumi/Kerang), Kacang (Peanuts/Nuts), Gandum (Wheat/Gluten), atau Kedelai (Soy/Tofu/Tempe), Anda WAJIB memasukkannya ke daftar 'detectedAllergens'.
    
    TUGAS 1: Klasifikasikan bahan ke kategori LCA (Daging Merah, Unggas & Telur, Ikan & Seafood, Karbohidrat, Sayur & Buah, Lainnya).
    TUGAS 2: Audit Keamanan (Microbiology Risk) berdasarkan selisih waktu.
    TUGAS 3: PEMISAHAN ALERGEN. Pastikan semua item yang mengandung alergen masuk ke 'detectedAllergens'.

    OUTPUT JSON (Strict Type):
    {
      "isSafe": boolean,
      "isHalal": boolean,
      "halalScore": integer (0-100),
      "reasoning": string (Berikan alasan teknis termasuk analisis waktu),
      "hygieneScore": integer (0-100),
      "qualityPercentage": integer (0-100),
      "detectedItems": [
         { "name": "Bahan", "category": "Kategori" }
      ],
      "detectedAllergens": [string],
      "shelfLifePrediction": string (misal: "2 Jam lagi"),
      "storageTips": [string]
    }
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      isSafe: { type: Type.BOOLEAN },
      isHalal: { type: Type.BOOLEAN },
      halalScore: { type: Type.INTEGER },
      reasoning: { type: Type.STRING },
      hygieneScore: { type: Type.INTEGER },
      qualityPercentage: { type: Type.INTEGER },
      detectedItems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["name", "category"]
        }
      },
      detectedAllergens: { type: Type.ARRAY, items: { type: Type.STRING } },
      shelfLifePrediction: { type: Type.STRING },
      storageTips: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["isSafe", "qualityPercentage", "detectedItems", "detectedAllergens"]
  };

  // ===== RETRY LOOP WITH KEY ROTATION =====
  const maxAttempts = API_KEYS.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = getNextWorkingKey();
    
    if (!apiKey) {
      console.error('[AI SERVICE] Tidak ada API key yang tersedia!');
      break;
    }
    
    const keyLabel = `...${apiKey.slice(-6)}`;
    console.log(
      `%c[AI SERVICE] Attempt ${attempt + 1}/${maxAttempts} — Key ${keyLabel}`,
      'color: #3B82F6; font-weight: bold;'
    );

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }, ...parts]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema as any
        }
      });

      const aiResult = JSON.parse(response.text || '{}');

      console.log(
        `%c[AI SERVICE] ✅ Berhasil dengan key ${keyLabel}`,
        'color: #10B981; font-weight: bold;'
      );

      // Kalkulasi Dampak Mendetail
      const socialImpact = calculateDetailedImpact(
        aiResult.detectedItems || [],
        context?.weightGram || 500,
        context?.packagingType || 'plastic',
        context?.quantityCount || 1
      );

      return {
        ...aiResult,
        detectedCategory: aiResult.detectedItems?.[0]?.category || 'Lainnya',
        socialImpact
      };

    } catch (error: any) {
      lastError = error;
      
      if (isKeySpecificError(error)) {
        // Key problem (leaked, quota, forbidden) — blacklist and try next
        console.warn(
          `%c[AI SERVICE] ❌ Key ${keyLabel} gagal (KEY ERROR): ${error.message?.substring(0, 80)}`,
          'color: #F59E0B; font-weight: bold;'
        );
        markKeyAsFailed(apiKey);
        continue; // Try next key
      } else if (isTransientError(error)) {
        // Server overloaded / temporarily unavailable — try next key WITHOUT blacklisting
        console.warn(
          `%c[AI SERVICE] ⚠️ Key ${keyLabel} — server error (503/transient): ${error.message?.substring(0, 80)}`,
          'color: #F97316; font-weight: bold;'
        );
        // Advance to next key without blacklisting (key itself is fine)
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        // Small delay before retrying to give server breathing room
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue; // Try next key
      } else {
        // Truly non-retryable error (parsing, network down, etc.)
        console.error(`[AI SERVICE] Error fatal non-retryable:`, error);
        break;
      }
    }
  }

  // ===== ALL KEYS EXHAUSTED — FALLBACK =====
  console.error('[AI SERVICE] Semua API key gagal. Menggunakan fallback.', lastError);
  
  const fallbackItems: DetectedItem[] = [{ name: context?.foodName || "Makanan", category: "Lainnya" }];
  const fallbackImpact = calculateDetailedImpact(
    fallbackItems,
    context?.weightGram || 500,
    'plastic',
    context?.quantityCount || 1
  );

  return {
    isSafe: true, isHalal: true, halalScore: 80, halalReasoning: "Fallback analysis", reasoning: "Semua API key Gemini gagal. Menggunakan estimasi standar.",
    shelfLifePrediction: "4 Jam", hygieneScore: 80, qualityPercentage: 80,
    detectedItems: fallbackItems, detectedCategory: 'Lainnya', storageTips: ["Simpan di tempat kering"],
    socialImpact: fallbackImpact
  };
};
