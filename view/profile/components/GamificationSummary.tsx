
import React, { useState, useEffect } from 'react';
import { Award, ChevronRight, Zap, Target, History, Loader2, Lock } from 'lucide-react';
import { db } from '../../../services/db';
import { UserData } from '../../../types';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    min_points: number;
    image: string;
}

interface GamificationSummaryProps {
    currentUser: UserData | null;
    currentPoints: number;
    onViewHistory: () => void;
}

export const GamificationSummary: React.FC<GamificationSummaryProps> = ({ currentUser, currentPoints, onViewHistory }) => {
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const data = await db.getBadges();
                setAllBadges(data);
            } catch (e) {
                console.error("Failed to fetch badges:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBadges();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 animate-pulse">
                <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded mb-4"></div>
                <div className="h-8 bg-stone-100 dark:bg-stone-900 rounded-xl"></div>
            </div>
        );
    }

    // Filter badges by points to find current and next
    const unlockedBadges = allBadges.filter(b => currentPoints >= b.min_points).sort((a, b) => b.min_points - a.min_points);
    const lockedBadges = allBadges.filter(b => currentPoints < b.min_points).sort((a, b) => a.min_points - b.min_points);
    
    const currentBadge = unlockedBadges[0];
    const nextBadge = lockedBadges[0];

    const progress = nextBadge 
        ? Math.min(((currentPoints - (currentBadge?.min_points || 0)) / (nextBadge.min_points - (currentBadge?.min_points || 0))) * 100, 100)
        : 100;

    return (
        <section className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Status Pencapaian</h3>
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-orange-500" />
                            <span className="text-lg font-black text-stone-900 dark:text-white uppercase italic tracking-tight">
                                {currentBadge?.name || "Pemula"}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onViewHistory}
                        className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-500 hover:text-orange-600 transition-all active:scale-90"
                        title="Riwayat Poin"
                    >
                        <History className="w-5 h-5" />
                    </button>
                </div>

                {nextBadge ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                            <div className="text-stone-500 flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-amber-500" />
                                {currentPoints} / {nextBadge.min_points} POIN
                            </div>
                            <div className="text-orange-600">
                                {Math.ceil(nextBadge.min_points - currentPoints)} LAGI KE {nextBadge.name}
                            </div>
                        </div>
                        
                        {/* Premium Progress Bar */}
                        <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]"></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20 group cursor-pointer hover:border-orange-300 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                                <Lock className="w-4 h-4 text-stone-300" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Target Berikutnya</p>
                                <h4 className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-tight">{nextBadge.name}</h4>
                            </div>
                            <ChevronRight className="w-4 h-4 text-orange-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 flex flex-col items-center text-center">
                        <Target className="w-8 h-8 text-emerald-500 mb-2 animate-bounce" />
                        <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">Level Maksimum Tercapai!</h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mt-1">Anda adalah Legenda Penyelamat Pangan.</p>
                    </div>
                )}
            </div>
            
            <div className="bg-stone-50 dark:bg-stone-800/50 px-6 py-4 flex items-center justify-between">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Kontributor {currentUser?.role === 'provider' ? 'Donatur' : 'Penerima'}</span>
                <div className="flex -space-x-2">
                    {unlockedBadges.slice(0, 5).map(badge => (
                        <div key={badge.id} className="w-7 h-7 rounded-full bg-white dark:bg-stone-900 border-2 border-stone-50 dark:border-stone-800 flex items-center justify-center text-xs shadow-sm" title={badge.name}>
                            {/* Assuming badge.icon is an emoji or char */}
                            <span>{badge.icon}</span>
                        </div>
                    ))}
                    {unlockedBadges.length > 5 && (
                        <div className="w-7 h-7 rounded-full bg-orange-500 text-white border-2 border-white dark:border-stone-800 flex items-center justify-center text-[8px] font-black">
                            +{unlockedBadges.length - 5}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
