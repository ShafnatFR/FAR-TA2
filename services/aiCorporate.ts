
import { db } from "./db";

export const aiCorporate = {
    generateRecipe: async (foodName: string, description: string, role: string): Promise<string> => {
        const result = await db.callCorporateAI('GENERATE_RECIPE', role, { foodName, description });
        return result.recipe;
    },

    designPackaging: async (foodName: string, role: string): Promise<string> => {
        const result = await db.callCorporateAI('DESIGN_PACKAGING', role, { foodName });
        return result.packaging;
    },

    writeCSRCopy: async (data: { foodName: string, donorName: string, impactPoints: number, co2Saved: number }, role: string): Promise<string> => {
        const result = await db.callCorporateAI('WRITE_CSR_COPY', role, data);
        return result.copy;
    }
};
