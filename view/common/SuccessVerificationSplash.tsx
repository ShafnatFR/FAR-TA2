
import React from 'react';
import { CheckCircle2, Package, User, X } from 'lucide-react';
import { Button } from '../components/Button';

interface SuccessVerificationSplashProps {
    receiverName: string;
    foodName: string;
    points?: number;
    onClose: () => void;
}

export const SuccessVerificationSplash: React.FC<SuccessVerificationSplashProps> = ({ 
    receiverName, 
    foodName, 
    points = 50,
    onClose
}) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 dark:from-blue-900/20 to-transparent pointer-events-none"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 mb-6 animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-stone-900 dark:text-white uppercase italic tracking-tighter mb-2">
                        Pesanan Selesai!
                    </h2>
                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">
                        Donasi berhasil diserahkan
                    </p>

                    {/* Point Bonus Card */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-full mb-8 p-6 rounded-[2rem] shadow-lg shadow-orange-500/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-700">
                             <CheckCircle2 className="w-20 h-20 text-white" />
                        </div>
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Poin Sosial Didapat</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-4xl font-black text-white italic">+{points}</span>
                            <span className="bg-white/20 text-[10px] font-black py-1 px-3 rounded-full text-white uppercase tracking-widest">Points</span>
                        </div>
                    </div>

                    <div className="w-full bg-stone-50 dark:bg-stone-800/50 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 mb-8 space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-xl text-orange-600 shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-0.5">Diterima Oleh</p>
                                <p className="text-base font-bold text-stone-900 dark:text-white leading-tight">{receiverName}</p>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-stone-300 dark:border-stone-700"></div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-blue-600 shrink-0">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-0.5">Menu Donasi</p>
                                <p className="text-base font-bold text-stone-900 dark:text-white leading-tight">{foodName}</p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={onClose}
                        className="h-14 bg-stone-900 dark:bg-stone-800 hover:bg-black text-white shadow-xl rounded-2xl font-black uppercase tracking-widest w-full"
                    >
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};
