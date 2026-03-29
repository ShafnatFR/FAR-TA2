
import React from 'react';
import { Cloud, Droplets, Mountain, Trophy, Leaf } from 'lucide-react';

interface ImpactStatCardProps {
    title: string;
    value: string | number;
    unit: string;
    icon: React.ElementType;
    color: string;
    description: string;
}

const ImpactStatCard: React.FC<ImpactStatCardProps> = ({ title, value, unit, icon: Icon, color, description }) => {
    // UI Helpers for Tailwind color safelisting
    const getBgColor = (c: string) => {
        if (c === 'sky') return 'bg-sky-500/5';
        if (c === 'blue') return 'bg-blue-500/5';
        if (c === 'emerald') return 'bg-emerald-500/5';
        return 'bg-stone-500/5';
    };

    const getIconBg = (c: string) => {
        if (c === 'sky') return 'bg-sky-50; dark:bg-sky-900/20';
        if (c === 'blue') return 'bg-blue-50; dark:bg-blue-900/20';
        if (c === 'emerald') return 'bg-emerald-50; dark:bg-emerald-900/20';
        return 'bg-stone-50; dark:bg-stone-900/20';
    };

    const getTextColor = (c: string) => {
        if (c === 'sky') return 'text-sky-600; dark:text-sky-400';
        if (c === 'blue') return 'text-blue-600; dark:text-blue-400';
        if (c === 'emerald') return 'text-emerald-600; dark:text-emerald-400';
        return 'text-stone-600; dark:text-stone-400';
    };

    return (
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${getBgColor(color)} group-hover:scale-150 transition-transform duration-700`}></div>
            
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${getIconBg(color)} ${getTextColor(color)}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-stone-900 dark:text-white tabular-nums">{value}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">{unit}</span>
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-1">{title}</h3>
                <p className="text-[10px] text-stone-400 leading-tight">{description}</p>
            </div>
        </div>
    );
};

interface ImpactWidgetProps {
    data: {
        totalCo2: number;
        totalWater: number;
        totalLand: number;
        totalPoints: number;
        impactLevel: string;
    };
    isLoading?: boolean;
}

export const ImpactWidget: React.FC<ImpactWidgetProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 bg-stone-200 dark:bg-stone-800 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-stone-100 dark:bg-stone-900 rounded-3xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImpactStatCard 
                    title="Penyelamatan Emisi"
                    value={data.totalCo2}
                    unit="kg CO2"
                    icon={Cloud}
                    color="sky"
                    description="Setara dengan emisi yang diserap oleh puluhan pohon dewasa."
                />
                <ImpactStatCard 
                    title="Konservasi Air"
                    value={data.totalWater}
                    unit="Liter"
                    icon={Droplets}
                    color="blue"
                    description="Jumlah air bersih yang berhasil dicegah dari pemborosan produksi."
                />
                <ImpactStatCard 
                    title="Efisiensi Lahan"
                    value={data.totalLand}
                    unit="m²"
                    icon={Mountain}
                    color="emerald"
                    description="Luas lahan pertanian yang produktivitasnya berhasil dimaksimalkan."
                />
            </div>
        </section>
    );
};
