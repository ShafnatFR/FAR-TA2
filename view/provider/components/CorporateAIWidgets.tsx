
import React, { useState } from 'react';
import { Sparkles, Utensils, Package, Share2, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import { db } from '../../../services/db';
import { kitchenScanner } from '../../../services/kitchenScanner';
import { packagingDesign } from '../../../services/packagingDesign';
import { contentWriter } from '../../../services/contentWriter';
import { UserData } from '../../../types';

interface CorporateAIWidgetsProps {
    currentUser: UserData | null;
    foodItems: any[];
}

export const CorporateAIWidgets: React.FC<CorporateAIWidgetsProps> = ({ currentUser, foodItems }) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [result, setResult] = useState<{ title: string; content: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const latestFood = foodItems[0]; // Gunakan item terbaru sebagai konteks

    const handleAction = async (actionType: 'recipe' | 'packaging' | 'csr') => {
        if (!latestFood) return alert("Tambahkan menu donasi terlebih dahulu untuk menggunakan fitur AI.");
        
        setLoadingAction(actionType);
        try {
            let content = "";
            let title = "";

            if (actionType === 'recipe') {
                title = "Ide Resep Kreatif Zero-Waste";
                content = await kitchenScanner.generateRecipe(latestFood.name, latestFood.description || "", currentUser?.role || 'corporate_donor');
            } else if (actionType === 'packaging') {
                title = "Rekomendasi Kemasan Berkelanjutan";
                content = await packagingDesign.generate(latestFood.name, currentUser?.role || 'corporate_donor');
            } else if (actionType === 'csr') {
                title = "CSR Marketing Copy (LinkedIn/IG)";
                content = await contentWriter.writeCSR({
                    foodName: latestFood.name,
                    donorName: currentUser?.name || "Perusahaan Kami",
                    impactPoints: 250, 
                    co2Saved: 12.5
                }, currentUser?.role || 'corporate_donor');
            }

            setResult({ title, content });
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-xl shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Gemini Corporate AI</h2>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Fitur Eksklusif Donatur Korporat</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                    onClick={() => handleAction('recipe')}
                    disabled={!!loadingAction}
                    className="group bg-white dark:bg-stone-900 p-6 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 hover:border-purple-500 transition-all text-left relative overflow-hidden active:scale-95 disabled:opacity-50"
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <Utensils className="w-8 h-8 text-purple-600 mb-4" />
                    <h3 className="font-black text-stone-900 dark:text-white uppercase text-sm mb-1">Generate Recipe</h3>
                    <p className="text-xs text-stone-500">Ubah surplus menjadi hidangan kreatif baru.</p>
                    {loadingAction === 'recipe' && <Loader2 className="absolute top-6 right-6 w-5 h-5 animate-spin text-purple-600" />}
                </button>

                <button 
                    onClick={() => handleAction('packaging')}
                    disabled={!!loadingAction}
                    className="group bg-white dark:bg-stone-900 p-6 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 hover:border-indigo-500 transition-all text-left relative overflow-hidden active:scale-95 disabled:opacity-50"
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <Package className="w-8 h-8 text-indigo-600 mb-4" />
                    <h3 className="font-black text-stone-900 dark:text-white uppercase text-sm mb-1">Eco Packaging</h3>
                    <p className="text-xs text-stone-500">Desain kemasan ramah lingkungan premium.</p>
                    {loadingAction === 'packaging' && <Loader2 className="absolute top-6 right-6 w-5 h-5 animate-spin text-indigo-600" />}
                </button>

                <button 
                    onClick={() => handleAction('csr')}
                    disabled={!!loadingAction}
                    className="group bg-white dark:bg-stone-900 p-6 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 hover:border-pink-500 transition-all text-left relative overflow-hidden active:scale-95 disabled:opacity-50"
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <Share2 className="w-8 h-8 text-pink-600 mb-4" />
                    <h3 className="font-black text-stone-900 dark:text-white uppercase text-sm mb-1">CSR Copywriting</h3>
                    <p className="text-xs text-stone-500">Tulis dampak untuk LinkedIn & Sosial Media.</p>
                    {loadingAction === 'csr' && <Loader2 className="absolute top-6 right-6 w-5 h-5 animate-spin text-pink-600" />}
                </button>
            </div>

            {result && (
                <div className="mt-6 bg-gradient-to-br from-stone-900 to-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-8">
                        <Sparkles className="w-12 h-12 text-white/10" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-2">{result.title}</h4>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-stone-300 leading-relaxed font-medium whitespace-pre-wrap">{result.content}</p>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={async () => {
                                    if (!currentUser?.id || !latestFood?.id) return;
                                    setLoadingAction('saving');
                                    try {
                                        await db.saveCorporateAIResult({
                                            donorId: currentUser.id,
                                            foodId: latestFood.id,
                                            type: result.title.includes('Resep') ? 'RECIPE' : result.title.includes('Kemasan') ? 'PACKAGING' : 'CSR_COPY',
                                            title: result.title,
                                            content: result.content
                                        });
                                        alert("Berhasil disimpan ke riwayat!");
                                    } catch (e: any) {
                                        alert(e.message);
                                    } finally {
                                        setLoadingAction(null);
                                    }
                                }}
                                disabled={loadingAction === 'saving'}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 hover:bg-stone-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loadingAction === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-orange-500" />}
                                Simpan ke Riwayat
                            </button>
                            <button 
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Tersalin' : 'Salin Teks'}
                            </button>
                            <button 
                                onClick={() => setResult(null)}
                                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
