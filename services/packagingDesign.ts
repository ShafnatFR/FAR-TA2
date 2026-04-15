
import { db } from "./db";

export const packagingDesign = {
    generate: async (foodName: string, role: string): Promise<string> => {
        const result = await db.callCorporateAI('DESIGN_PACKAGING', role, { foodName });
        return result.packaging;
    },
    generateVisual: async (foodName: string, packagingDesc: string, role: string): Promise<string> => {
        const result = await db.callCorporateAI('GENERATE_PACKAGING_IMAGE', role, { foodName, packagingDesc });
        return result.imageUrl;
    }
};
