
import { SOCIAL_SYSTEM as STATIC_SOCIAL_SYSTEM } from '../constants';

export const getSocialSystem = (rankLevels: any[]) => {
    if (!rankLevels || rankLevels.length === 0) return STATIC_SOCIAL_SYSTEM;

    const system: any = {
        provider: { tiers: [], rules: STATIC_SOCIAL_SYSTEM.provider.rules },
        volunteer: { tiers: [], rules: STATIC_SOCIAL_SYSTEM.volunteer.rules },
        recipient: { tiers: [], rules: STATIC_SOCIAL_SYSTEM.recipient.rules }
    };

    rankLevels.forEach(level => {
        const roleKey = level.role.toLowerCase() === 'provider' ? 'provider' : 
                        level.role.toLowerCase() === 'volunteer' ? 'volunteer' : 'recipient';
        
        system[roleKey].tiers.push({
            id: String(level.id),
            name: level.name,
            minPoints: level.min_points,
            benefits: level.benefits || [],
            color: level.color,
            icon: level.icon
        });
    });

    // Ensure tiers are sorted by minPoints
    Object.keys(system).forEach(key => {
        system[key].tiers.sort((a: any, b: any) => a.minPoints - b.minPoints);
    });

    return system;
};
