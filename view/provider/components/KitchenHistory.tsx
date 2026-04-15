
import React, { useState, useEffect } from 'react';
import { ChefHat, Calendar, ChevronRight, ArrowLeft, Trash2, Utensils, Sparkles, Info } from 'lucide-react';
import { db } from '../../../services/db';
import { UserData } from '../../../types';

interface KitchenHistoryProps {
    currentUser: UserData | null;
    onBack: () => void;
}

export const KitchenHistory: React.FC<KitchenHistoryProps> = ({ currentUser, onBack }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchHistory();
        }
    }, [currentUser?.id]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await db.getCorporateAIHistory(Number(currentUser?.id));
            // Filter only kitchen type
            setHistory(data.filter(h => h.type === 'KITCHEN'));
        } catch (e) {
            console.error("Failed to fetch history:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderRecipeDetail = (item: any) => {
        const recipeData = JSON.parse(item.content);
        return (
            <div className="fixed inset-0 z-[110] bg-white dark:bg-stone-950 flex flex-col animate-in slide-in-from-right duration-300">
                <header className="p-6 flex items-center gap-4 border-b border-stone-100 dark:border-stone-900 sticky top-0 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md">
                    <button onClick={() => setSelectedRecipe(null)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-stone-900 dark:text-white uppercase italic leading-none">Detail Resep</h2>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Disimpan pada {new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">{item.title}</h3>
                        <div className="flex flex-wrap gap-2">
                             {recipeData.ingredients?.map((ing: string, i: number) => (
                                <span key={i} className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100 dark:border-orange-900/30">
                                    {ing}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 bg-stone-50 dark:bg-stone-900/50 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Langkah Memasak</span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {recipeData.recipe}
                        </p>
                    </div>

                    {recipeData.tips && (
                         <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 flex gap-4">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Tips Sisa Pangan</h5>
                                <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                    {recipeData.tips}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#FDFBF7] dark:bg-stone-950 flex flex-col md:max-w-md md:mx-auto md:relative md:h-[90vh] md:rounded-[3rem] md:shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <header className="p-6 flex items-center justify-between border-b border-stone-200/50 dark:border-stone-800/50 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md sticky top-0 z-10">
                <button 
                    onClick={onBack}
                    className="p-3 bg-stone-100 dark:bg-stone-900 rounded-2xl text-stone-600 dark:text-stone-300 hover:text-orange-600 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center flex-1 ml-4">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white leading-none tracking-tight uppercase italic">Riwayat Kitchen</h2>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1">Simpanan Resep AI Anda</p>
                </div>
                <div className="w-11"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Mengambil Data...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-900 rounded-[2rem] flex items-center justify-center text-stone-300">
                            <ChefHat className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase italic">Belum Ada Resep</h3>
                            <p className="text-sm text-stone-500 font-medium px-8">Anda belum menyimpan resep apapun dari Kitchen AI. Mulai scan bahan makanan Anda!</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-700">
                        {history.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => setSelectedRecipe(item)}
                                className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] text-left hover:border-orange-500 transition-all group shadow-sm flex items-center gap-4"
                            >
                                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shrink-0">
                                    <Utensils className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-3 h-3 text-stone-400" />
                                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-stone-900 dark:text-white line-clamp-1 uppercase italic tracking-tight">{item.title}</h4>
                                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-tight line-clamp-1 mt-0.5">Lihat Cara Memasak</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-orange-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedRecipe && renderRecipeDetail(selectedRecipe)}
        </div>
    );
};
