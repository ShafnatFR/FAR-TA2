
import React from 'react';
import { Sparkles, Utensils, Package, Share2 } from 'lucide-react';
import { UserData } from '../../../types';

interface CorporateAIWidgetsProps {
    currentUser: UserData | null;
    foodItems: any[];
    onOpenTool: (tool: 'recipe' | 'packaging' | 'csr') => void;
}

export const CorporateAIWidgets: React.FC<CorporateAIWidgetsProps> = ({ currentUser, foodItems, onOpenTool }) => {
    const handleAction = (actionType: 'recipe' | 'packaging' | 'csr') => {
        onOpenTool(actionType);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => handleAction('packaging')}
                    className="group bg-white dark:bg-stone-900 p-6 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 hover:border-indigo-500 transition-all text-left relative overflow-hidden active:scale-95"
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <Package className="w-8 h-8 text-indigo-600 mb-4" />
                    <h3 className="font-black text-stone-900 dark:text-white uppercase text-sm mb-1">Eco Packaging</h3>
                    <p className="text-xs text-stone-500">Desain kemasan ramah lingkungan premium.</p>
                </button>

                <button 
                    onClick={() => handleAction('csr')}
                    className="group bg-white dark:bg-stone-900 p-6 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 hover:border-pink-500 transition-all text-left relative overflow-hidden active:scale-95"
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <Share2 className="w-8 h-8 text-pink-600 mb-4" />
                    <h3 className="font-black text-stone-900 dark:text-white uppercase text-sm mb-1">CSR Copywriting</h3>
                    <p className="text-xs text-stone-500">Tulis dampak untuk LinkedIn & Sosial Media.</p>
                </button>
            </div>
        </div>
    );
};
