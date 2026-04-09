
import { db } from "./db";

export const packagingDesign = {
    generate: async (foodName: string, role: string): Promise<string> => {
        const result = await db.callCorporateAI('DESIGN_PACKAGING', role, { foodName });
        return result.packaging;
    }
};
