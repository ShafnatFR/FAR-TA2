
import React, { useState, useEffect } from 'react';
import { History, ArrowLeft, Zap, Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { db } from '../../../services/db';
import { UserData } from '../../../types';
import { EmptyState } from '../../common/EmptyState';

interface PointLog {
    id: string;
    points: number;
    activity_type: string;
    description: string;
    date: string;
}

interface PointHistoryProps {
    currentUser: UserData | null;
    onBack: () => void;
}

export const PointHistory: React.FC<PointHistoryProps> = ({ currentUser, onBack }) => {
    const [history, setHistory] = useState<PointLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!currentUser?.id) return;
            setIsLoading(true);
            try {
                const data = await db.getPointHistory(currentUser.id);
                setHistory(data);
            } catch (e) {
                console.error("Failed to fetch point history:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [currentUser?.id]);

    return (
        <div className="pb-32 animate-in slide-in-from-right-4 duration-500">
            <header className="p-6 md:p-8 bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-900 sticky top-0 z-20 flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-900 dark:text-white" />
                </button>
                <div>
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight italic">Riwayat Poin</h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">Jejak kontribusi kebaikan Anda</p>
                </div>
            </header>

            <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                        <p className="text-xs font-black text-stone-400 uppercase tracking-widest mt-4">Memuat data koin...</p>
                    </div>
                ) : history.length === 0 ? (
                    <EmptyState 
                        icon={History}
                        title="Belum Ada Riwayat"
                        description="Mulai berdonasi atau menyelamatkan makanan untuk mengumpulkan poin pertama Anda!"
                        actionLabel="Kembali ke Dashboard"
                        onAction={onBack}
                    />
                ) : (
                    <div className="space-y-3">
                        {history.map((log, idx) => (
                            <div 
                                key={log.id} 
                                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm flex items-center gap-4 group hover:border-orange-200 transition-all animate-in fade-in"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${log.points >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                                    {log.points >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-stone-900 dark:text-white text-sm uppercase tracking-tight truncate mb-1">
                                            {log.activity_type.replace(/_/g, ' ')}
                                        </h4>
                                        <div className={`text-sm font-black italic ${log.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {log.points >= 0 ? '+' : ''}{log.points}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mb-2 leading-relaxed">
                                        {log.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(log.date).toLocaleDateString()} • {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gamification Tip */}
            <div className="px-6 md:px-8 max-w-2xl mx-auto mt-8">
                <div className="p-6 bg-gradient-to-br from-stone-900 to-stone-800 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <Zap className="w-8 h-8 text-amber-400 mb-3" />
                        <h4 className="text-lg font-black uppercase italic tracking-tight mb-2">Ingin Poin Lebih?</h4>
                        <p className="text-xs text-stone-400 leading-relaxed font-bold">Teruslah berperan aktif dalam menyelamatkan makanan. Setiap tindakan kecil Anda berdampak besar bagi bumi!</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                </div>
            </div>
        </div>
    );
};
