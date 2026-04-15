
import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, ArrowLeft, Sparkles, Utensils, Info, CheckCircle2, ChevronRight, Loader2, Image as ImageIcon, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { db } from '../../services/db';
import { kitchenScanner } from '../../services/kitchenScanner';
import { UserData } from '../../types';

interface KitchenScannerProps {
    currentUser: UserData | null;
    onBack: () => void;
}

export const KitchenScanner: React.FC<KitchenScannerProps> = ({ currentUser, onBack }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setPhoto(dataUrl);
                stopCamera();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const scanIngredients = async () => {
        if (!photo || !currentUser) return;
        
        setIsScanning(true);
        try {
            const data = await kitchenScanner.scan(photo, currentUser.role, currentUser.id);
            setResult(data);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Gagal menganalisis bahan. Pastikan Anda sudah memasukkan API Key di profil.");
        } finally {
            setIsScanning(false);
        }
    };

    const resetScanner = () => {
        setPhoto(null);
        setResult(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-stone-950 flex flex-col md:max-w-md md:mx-auto md:relative md:h-[90vh] md:rounded-[3rem] md:shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <header className="p-6 flex items-center justify-between bg-white/80 dark:bg-stone-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-100 dark:border-stone-900">
                <button 
                    onClick={() => { stopCamera(); onBack(); }}
                    className="p-3 bg-stone-100 dark:bg-stone-900 rounded-2xl text-stone-600 dark:text-stone-300 active:scale-90 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center flex-1">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white leading-none tracking-tight uppercase italic">Kitchen AI</h2>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1">Zero Waste Assistant</p>
                </div>
                <div className="w-11"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
                {!photo ? (
                    <div className="space-y-6">
                        {/* Hero Section */}
                        <div className="text-center space-y-3 py-4">
                            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-[2.5rem] flex items-center justify-center text-orange-600 mx-auto relative group">
                                <Utensils className="w-8 h-8" />
                                <div className="absolute inset-0 bg-orange-400/20 rounded-[2.5rem] animate-ping opacity-20"></div>
                            </div>
                            <h3 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">Punya sisa makanan?<br/>AI bantu carikan resep!</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium px-4">Foto bahan makanan acak di dapur Anda, dan biarkan AI meracik ide hidangan lezat.</p>
                        </div>

                        {/* Camera Preview / Initial View */}
                        {!isCameraActive ? (
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={startCamera}
                                    className="h-64 bg-stone-100 dark:bg-stone-900 rounded-[3rem] border-2 border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-4 group hover:border-orange-500 transition-all"
                                >
                                    <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-3xl shadow-sm flex items-center justify-center text-stone-400 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-stone-500 group-hover:text-stone-900 dark:group-hover:text-white">Buka Kamera</span>
                                </button>
                                
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-3 p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] text-stone-600 dark:text-stone-400 hover:bg-stone-50 transition-all font-black uppercase text-[10px] tracking-widest"
                                >
                                    <ImageIcon className="w-5 h-5" /> Ambil dari Galeri
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                            </div>
                        ) : (
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-[3/4]">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 border-2 border-white/20 rounded-[3rem] pointer-events-none"></div>
                                <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
                                    <button 
                                        onClick={stopCamera}
                                        className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                                    >
                                        <RefreshCw className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={takePhoto}
                                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-2xl active:scale-90 transition-all"
                                    >
                                        <div className="w-16 h-16 border-4 border-stone-900/5 rounded-full"></div>
                                    </button>
                                    <div className="w-14"></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : !result ? (
                    <div className="space-y-6">
                        <div className="rounded-[3rem] overflow-hidden shadow-xl bg-stone-100 dark:bg-stone-800 aspect-[3/4] relative">
                            <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                            {isScanning && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
                                    <div className="relative">
                                        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                                        <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-widest animate-pulse">Menghitung Resep...</p>
                                </div>
                            )}
                        </div>
                        
                        {!isScanning && (
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setPhoto(null)}
                                    className="flex-1 p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl text-stone-600 dark:text-stone-400 font-bold text-sm"
                                >
                                    Foto Ulang
                                </button>
                                <button 
                                    onClick={scanIngredients}
                                    className="flex-[2] p-5 bg-orange-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-4 h-4 fill-white" /> Analisis Bahan
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        {/* Result Section */}
                        <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-8">
                            {/* Ingredients */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <Utensils className="w-3 h-3" /> Bahan Terdeteksi
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.ingredients?.map((ing: string, i: number) => (
                                        <span key={i} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-700 dark:text-stone-200 text-xs font-bold border border-stone-200/50 dark:border-stone-700/50">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-stone-100 dark:border-stone-800" />

                            {/* Recipe Card */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Rekomendasi Menu
                                    </h4>
                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Cepat & Sehat</span>
                                </div>
                                <div className="p-6 bg-stone-50 dark:bg-stone-950/50 rounded-[2rem] border border-stone-100 dark:border-stone-800">
                                    <p className="text-stone-800 dark:text-stone-200 text-sm font-medium leading-relaxed italic">
                                        "{result.recipe}"
                                    </p>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 flex gap-4">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Tips Sisa Pangan</h5>
                                    <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                        {result.tips || "Siapkan bahan di malan hari agar waktu masak lebih efisien."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    onClick={resetScanner} 
                                    variant="outline"
                                    className="w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-white py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest"
                                >
                                    Cari Lain
                                </Button>
                                <Button 
                                    onClick={async () => {
                                        if(!currentUser) return;
                                        try {
                                            await db.saveCorporateAIResult({
                                                donorId: Number(currentUser.id),
                                                foodId: 0, // Not linked to a specific inventory item
                                                type: 'KITCHEN',
                                                title: `Resep Kitchen AI: ${result.ingredients?.slice(0, 2).join(', ')}...`,
                                                content: JSON.stringify(result)
                                            });
                                            alert("Resep berhasil disimpan ke riwayat!");
                                        } catch (e: any) {
                                            alert("Gagal menyimpan resep: " + e.message);
                                        }
                                    }}
                                    className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-orange-500/20"
                                >
                                    Simpan Resep
                                </Button>
                            </div>

                            {/* External Recipes (Cookpad) */}
                            {result.externalRecipes && result.externalRecipes.length > 0 && (
                                <div className="pt-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800"></div>
                                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] whitespace-nowrap">REKOMENDASI EKSTERNAL</span>
                                        <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {result.externalRecipes.map((ext: any, i: number) => (
                                            <a 
                                                key={i}
                                                href={ext.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl flex items-center justify-between group hover:border-orange-500 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                        <Utensils className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[11px] font-black text-stone-900 dark:text-white line-clamp-1">{ext.title}</h5>
                                                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{ext.source}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-orange-500 transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                    
                                    <p className="text-center text-[9px] text-stone-400 font-medium px-6">
                                        Hasil di atas disesuaikan dengan bahan terdeteksi melalui mesin pencari Cookpad Indonesia.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Helpful Guide */}
                {!result && !photo && (
                    <div className="bg-stone-50 dark:bg-stone-900/50 rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">Cara Kerja</h4>
                        <div className="space-y-3">
                            {[
                                "Foto bahan makanan yang ada di kulkas Anda.",
                                "AI akan mendeteksi isi dari foto tersebut.",
                                "Dapatkan resep kreatif untuk cegah mubazir!"
                            ].map((step, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-orange-600">{i+1}</span>
                                    </div>
                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
