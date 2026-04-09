
import { db } from "./db";

export interface KitchenScannerResult {
    ingredients: string[];
    description: string;
    recipe: string;
    tips: string;
    externalRecipes?: any[];
}

export const kitchenScanner = {
    scan: async (image: string, role: string, actorId: string): Promise<KitchenScannerResult> => {
        return await db.callCorporateAI('KITCHEN_SCANNER', role, { image }, actorId);
    },

    generateRecipe: async (foodName: string, description: string, role: string): Promise<string> => {
        const result = await db.callCorporateAI('GENERATE_RECIPE', role, { foodName, description });
        return result.recipe;
    }
};
