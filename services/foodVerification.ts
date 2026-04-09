
import { db } from "./db";
import { SocialImpactData } from "../types";

export interface DetectedItem {
  name: string;
  category: 'Daging Merah' | 'Unggas & Telur' | 'Ikan & Seafood' | 'Karbohidrat' | 'Sayur & Buah' | 'Lainnya';
}

export interface ImpactBreakdownItem {
  name: string;
  weightKg: number;
  factor: number;
  result: number;
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

/**
 * Service for Food Quality and Safety Verification
 */
export const foodVerification = {
  analyze: async (
    imageBase64?: string,
    context?: any
  ): Promise<QualityAnalysisResult> => {
    console.log('[AI SERVICE] Delegating food analysis to backend...');
    
    try {
      const payload = {
        foodName: context?.foodName,
        ingredients: context?.ingredients,
        madeTime: context?.madeTime,
        distributionStart: context?.distributionStart,
        weightGram: context?.weightGram,
        image: imageBase64
      };

      const aiResult = await db.verifyFood(payload, context?.userId || 'system');

      // Local impact calculation logic
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

    } catch (error) {
      console.error('[AI SERVICE] Backend analysis failed, using fallback:', error);
      
      const fallbackItems: DetectedItem[] = [{ name: context?.foodName || "Makanan", category: "Lainnya" }];
      const fallbackImpact = calculateDetailedImpact(
        fallbackItems,
        context?.weightGram || 500,
        'plastic',
        context?.quantityCount || 1
      );

      return {
        isSafe: true, isHalal: true, halalScore: 80, halalReasoning: "Fallback analysis", reasoning: "Gagal menghubungi AI Server. Menggunakan estimasi standar.",
        shelfLifePrediction: "4 Jam", hygieneScore: 80, qualityPercentage: 80,
        detectedItems: fallbackItems, detectedCategory: 'Lainnya', storageTips: ["Simpan di tempat kering"],
        socialImpact: fallbackImpact
      };
    }
  }
};

// ==========================================
// EMISSION & SOCIAL IMPACT FACTORS (Shared)
// ==========================================

const EMISSION_FACTORS: Record<string, number> = {
  'Sayur & Buah': 0.4,
  'Karbohidrat': 0.8,
  'Unggas & Telur': 3.5,
  'Ikan & Seafood': 4.5,
  'Daging Merah': 18.0,
  'Lainnya': 1.2
};

const SOCIAL_IMPACT_FACTORS: Record<string, number> = {
  'Sayur & Buah': 1.2,
  'Karbohidrat': 1.5,
  'Unggas & Telur': 2.2,
  'Ikan & Seafood': 2.5,
  'Daging Merah': 3.0,
  'Lainnya': 1.0
};

const calculateDetailedImpact = (
  items: DetectedItem[], 
  weightGram: number, 
  packaging: string,
  quantityCount: number = 1
): DetailedSocialImpact => {
  const count = items.length || 1;
  const weightPerItem = (weightGram / count) / 1000; // to kg

  const co2Breakdown: ImpactBreakdownItem[] = items.map(item => ({
    name: item.name,
    weightKg: weightPerItem,
    factor: EMISSION_FACTORS[item.category] || 1.2,
    result: weightPerItem * (EMISSION_FACTORS[item.category] || 1.2),
    category: item.category
  }));

  const socialBreakdown: ImpactBreakdownItem[] = items.map(item => ({
    name: item.name,
    weightKg: weightPerItem,
    factor: SOCIAL_IMPACT_FACTORS[item.category] || 1.0,
    result: weightPerItem * (SOCIAL_IMPACT_FACTORS[item.category] || 1.0),
    category: item.category
  }));

  const totalCo2 = co2Breakdown.reduce((sum, item) => sum + item.result, 0) * quantityCount;
  const totalPoints = Math.round(socialBreakdown.reduce((sum, item) => sum + item.result, 0) * 100 * quantityCount);

  return {
    co2Saved: totalCo2,
    totalPoints: totalPoints,
    waterSaved: 0,
    landSaved: 0,
    wasteReduction: weightGram * quantityCount / 1000, // waste reduction in kg
    co2Breakdown,
    socialBreakdown,
    portionCount: quantityCount,
    co2PerPortion: totalCo2 / quantityCount,
    pointsPerPortion: totalPoints / quantityCount
  };
};
