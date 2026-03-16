
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

const getAI = () => {
  // Gunakan import.meta.env untuk Vite
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
  return new GoogleGenAI({ apiKey: apiKey || '', apiVersion: 'v1' });
};

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
    quantityCount?: number; // Tambahan parameter jumlah porsi
  }
): Promise<QualityAnalysisResult> => {
  try {
    const ai = getAI();

    // Log daftar model yang TERSEDIA untuk API Key Anda
    try {
      const result = await ai.models.list();
      // Mengambil nama model dari hasil list
      const modelNames = (result as any).pageInternal?.map((m: any) => m.name) || [];
      console.log("%c[AI SERVICE] Model yang bisa Anda gunakan:", "color: cyan; font-weight: bold;", modelNames);
    } catch (e) {
      console.log("[AI SERVICE] Gagal melist model, lanjut ke analisis...");
    }

    const parts: any[] = [];
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
    }

    const prompt = `
      Anda adalah Senior Food Safety Auditor & Environmental Analyst.
      
      DATA INPUT:
      - Nama: ${context?.foodName}
      - Bahan: ${context?.ingredients}
      - Waktu Masak: ${context?.madeTime}
      - Berat Total: ${context?.weightGram} gram
      
      TUGAS 1: Klasifikasikan bahan-bahan utama yang terlihat atau tertulis ke dalam kategori LCA (Life Cycle Assessment) berikut:
      - 'Daging Merah' (Sapi, Kambing)
      - 'Unggas & Telur' (Ayam, Bebek, Telur)
      - 'Ikan & Seafood'
      - 'Karbohidrat' (Nasi, Roti, Mie, Kentang)
      - 'Sayur & Buah'
      - 'Lainnya' (Bumbu, Kuah, Tahu/Tempe masuk sini)

      TUGAS 2: Audit Keamanan Pangan (Microbiology Risk).
      - Analisis selisih waktu masak vs distribusi.
      - Berikan skor 'qualityPercentage' (0-100). Di bawah 70 = REJECT.

      OUTPUT JSON (Strict Type):
      {
        "isSafe": boolean,
        "isHalal": boolean,
        "halalScore": integer (0-100),
        "reasoning": string,
        "hygieneScore": integer (0-100),
        "qualityPercentage": integer (0-100),
        "detectedItems": [
           { "name": "Nama Bahan (misal: Nasi Putih)", "category": "Karbohidrat" },
           { "name": "Nama Bahan (misal: Ayam Goreng)", "category": "Unggas & Telur" }
        ],
        "shelfLifePrediction": string (e.g. "3 Jam"),
        "storageTips": [string]
      }
    `;

// services/ai.ts

const schema = {
  type: Type.OBJECT, // Gunakan enum Type, bukan string "OBJECT"
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
    shelfLifePrediction: { type: Type.STRING },
    storageTips: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["isSafe", "qualityPercentage", "detectedItems"]
};

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Model paling stabil di v1
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

    // Kalkulasi Dampak Mendetail (Updated Logic)
    const socialImpact = calculateDetailedImpact(
      aiResult.detectedItems || [],
      context?.weightGram || 500,
      context?.packagingType || 'plastic',
      context?.quantityCount || 1 // Pass quantity count
    );

    return {
      ...aiResult,
      detectedCategory: aiResult.detectedItems?.[0]?.category || 'Lainnya',
      socialImpact
    };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    // Fallback Result
    const fallbackItems: DetectedItem[] = [{ name: context?.foodName || "Makanan", category: "Lainnya" }];
    const fallbackImpact = calculateDetailedImpact(
      fallbackItems,
      context?.weightGram || 500,
      'plastic',
      context?.quantityCount || 1
    );

    return {
      isSafe: true, isHalal: true, halalScore: 80, halalReasoning: "Fallback analysis", reasoning: "Analisis AI terkendala, menggunakan estimasi standar.",
      shelfLifePrediction: "4 Jam", hygieneScore: 80, qualityPercentage: 80,
      detectedItems: fallbackItems, detectedCategory: 'Lainnya', storageTips: ["Simpan di tempat kering"],
      socialImpact: fallbackImpact
    };
  }
};
