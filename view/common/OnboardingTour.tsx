
import React, { useState } from 'react';
import { ArrowRight, Check, X, Sparkles, ScanLine, QrCode, Trophy, HeartHandshake, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '../components/Button';

interface OnboardingTourProps {
    role: 'individual_donor' | 'corporate_donor' | 'volunteer' | 'recipient';
    onFinish: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ role, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const isProvider = role === 'individual_donor' || role === 'corporate_donor';

    // Konten Tour Khusus Provider
    const providerSteps = [
        {
            title: "Selamat Datang, Pahlawan!",
            desc: "Terima kasih telah bergabung. Anda kini adalah bagian dari gerakan penyelamatan pangan. Mari ubah surplus makanan menjadi berkah bagi sesama.",
            icon: <HeartHandshake className="w-20 h-20 text-orange-500" />,
            color: "bg-orange-50 dark:bg-orange-900/20"
        },
        {
            title: "Audit Kualitas via AI",
            desc: "Tidak perlu bingung memilah. Cukup foto makanan, AI kami akan menganalisis kelayakan, kandungan, hingga prediksi masa simpan secara otomatis.",
            icon: <Sparkles className="w-20 h-20 text-blue-500" />,
            color: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            title: "Keamanan Transaksi",
            desc: "Setiap penyerahan makanan dilindungi kode unik. Pastikan Anda atau petugas melakukan Scan QR Code penerima sebelum menyerahkan donasi.",
            icon: <QrCode className="w-20 h-20 text-stone-700 dark:text-stone-300" />,
            color: "bg-stone-100 dark:bg-stone-800"
        },
        {
            title: "Reputasi & Dampak Nyata",
            desc: "Setiap gram makanan yang Anda selamatkan akan dikonversi menjadi Poin Reputasi dan metrik penghematan CO2. Jadilah Top Donatur!",
            icon: <Trophy className="w-20 h-20 text-yellow-500" />,
            color: "bg-yellow-50 dark:bg-yellow-900/20"
        },
        // LANGKAH TERAKHIR BARU: INTEGRASI ALAMAT
        {
            title: "Penting: Atur Lokasi",
            desc: "Agar relawan dapat menjemput donasi, mohon lengkapi detail alamat Anda segera. Akses fitur ini melalui menu Profil > Alamat Tersimpan.",
            icon: <MapPin className="w-20 h-20 text-red-500" />,
            color: "bg-red-50 dark:bg-red-900/20"
        }
    ];

    // Fallback jika role lain belum didefinisikan, gunakan provider steps sementara
    const steps = isProvider ? providerSteps : providerSteps;
    const totalSteps = steps.length;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const currentContent = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col min-h-[500px] transition-all duration-500">
                
                {/* Skip Button */}
                <button 
                    onClick={onFinish}
                    className="absolute top-6 right-6 z-30 text-stone-400 hover:text-stone-600 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                    Lewati
                </button>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                    {/* Background Blob Animation - Lower Z-Index */}
                    <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-full opacity-20 blur-3xl transition-colors duration-700 z-0 ${currentContent.color}`}></div>
                    
                    <div className="relative z-10 animate-in zoom-in-50 duration-500 key={currentStep}">
                        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 shadow-xl ${currentContent.color} ring-8 ring-white dark:ring-stone-800 transition-colors duration-500`}>
                            {currentContent.icon}
                        </div>
                        
                        <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-4 uppercase italic tracking-tight leading-tight">
                            {currentContent.title}
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed font-medium">
                            {currentContent.desc}
                        </p>
                    </div>
                </div>

                {/* Footer Navigation - Higher Z-Index to Ensure Clickability */}
                <div className="p-6 bg-stone-50 dark:bg-stone-950/50 border-t border-stone-100 dark:border-stone-800 relative z-30">
                    <div className="flex items-center justify-between mb-6">
                        {/* Progress Dots */}
                        <div className="flex gap-2">
                            {steps.map((_, idx) => (
                                <div 
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === currentStep 
                                            ? 'w-6 bg-orange-600' 
                                            : 'w-1.5 bg-stone-300 dark:bg-stone-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            Langkah {currentStep + 1}/{totalSteps}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        {currentStep > 0 ? (
                            <button 
                                onClick={handlePrev}
                                className="w-12 h-14 rounded-2xl border-2 border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="w-12"></div> 
                        )}
                        
                        <Button 
                            onClick={handleNext}
                            className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 cursor-pointer active:scale-95"
                        >
                            {currentStep === totalSteps - 1 ? (
                                <span className="flex items-center gap-2">Siap, Mengerti <Check className="w-4 h-4" /></span>
                            ) : (
                                <span className="flex items-center gap-2">Lanjut <ArrowRight className="w-4 h-4" /></span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
