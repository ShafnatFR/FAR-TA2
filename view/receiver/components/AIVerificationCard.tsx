
import React from 'react';
import { ShieldCheck, Info, Check, X, AlertCircle, Sparkles, Biohazard } from 'lucide-react';

interface AIVerificationCardProps {
    verification: {
        isEdible: boolean;
        halalScore: number;
        reason?: string;
        ingredients?: string[];
    };
}

export const AIVerificationCard: React.FC<AIVerificationCardProps> = ({ verification }) => {
    const isHalal = verification.halalScore >= 80;
    const isHaram = verification.halalScore < 40;
    const isSyubhat = verification.halalScore >= 40 && verification.halalScore < 80;

    return (
        <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Verifikasi Food AI</h3>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <span className="text-lg font-black text-stone-900 dark:text-white uppercase italic tracking-tight">Kualitas & Kandungan</span>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${verification.isEdible ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                        {verification.isEdible ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {verification.isEdible ? "Layak Konsumsi" : "Tidak Layak"}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Halal Status Section */}
                    <div className={`p-5 rounded-3xl border ${isHalal ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30' : isSyubhat ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isHalal ? 'text-green-600' : isSyubhat ? 'text-amber-600' : 'text-red-600'}`}>Status Halal</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg ${isHalal ? 'bg-green-500 shadow-green-500/20' : isSyubhat ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                                {isHalal ? <ShieldCheck className="w-5 h-5" /> : isSyubhat ? <Info className="w-5 h-5" /> : <Biohazard className="w-5 h-5" />}
                            </div>
                        </div>
                        <h4 className={`text-2xl font-black italic tracking-tighter ${isHalal ? 'text-green-700 dark:text-green-400' : isSyubhat ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isHalal ? "TERVERIFIKASI HALAL" : isSyubhat ? "BUTUH KONFIRMASI" : "TIDAK HALAL"}
                        </h4>
                        <p className="text-[10px] text-stone-500 mt-1 font-bold uppercase tracking-widest">Akurasi AI: {verification.halalScore}%</p>
                    </div>

                    {/* Ingredients Section */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 px-1">Komposisi Terdeteksi</h4>
                        <div className="flex flex-wrap gap-2">
                            {verification.ingredients && verification.ingredients.length > 0 ? (
                                verification.ingredients.map((ing, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-[10px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-tight">
                                        {ing}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] text-stone-400 italic font-medium px-1">Gagal mendeteksi komposisi spesifik.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Reasoning */}
                {verification.reason && (
                    <div className="mt-6 p-4 bg-stone-50 dark:bg-stone-950/50 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Catatan Analisis</p>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed font-medium">{verification.reason}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-stone-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em]">AI Analysis Protection Active</span>
                </div>
                <button className="text-[9px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors flex items-center gap-1">
                    Detail Teknis <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

const ChevronRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
);
