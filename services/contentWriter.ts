
import { db } from "./db";

export interface CSRCopyData {
    foodName: string;
    donorName: string;
    impactPoints: number;
    co2Saved: number;
}

export const contentWriter = {
    writeCSR: async (data: CSRCopyData, role: string): Promise<string> => {
        const result = await db.callCorporateAI('WRITE_CSR_COPY', role, data);
        // Backend returns variations, we join them for display or pick the best one
        if (result.variations && Array.isArray(result.variations)) {
            return result.variations.map((v: any) => `[${v.type}]\n${v.content}`).join('\n\n');
        }
        return result.copy || result;
    }
};
