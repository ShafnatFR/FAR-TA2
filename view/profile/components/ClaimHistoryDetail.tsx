
import React from 'react';
import { ArrowLeft, MapPin, Package, Truck, Navigation, ShoppingBag, CalendarDays, QrCode, CheckCircle2, ShieldCheck, ShieldAlert, MessageCircle, Clock, Info, AlertTriangle, Star, X, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { ClaimHistoryItem } from '../../../types';
import { optimizeUnsplashUrl } from '../../../utils/imageOptimizer';
import { MediaLightbox } from '../../common/MediaLightbox';

interface ClaimHistoryDetailProps {
    item: ClaimHistoryItem;
    onBack: () => void;
    onComplete?: () => void;
    onReport?: () => void;
    onReview?: () => void; // New prop for review action
}

export const ClaimHistoryDetail: React.FC<ClaimHistoryDetailProps> = ({ item, onBack, onComplete, onReport, onReview }) => {
    
    // UPDATED MAP LOGIC
    const locationAddress = item.location?.address || "Lokasi tidak tersedia";
    const mapQuery = (locationAddress && locationAddress !== "Lokasi tidak tersedia")
        ? encodeURIComponent(locationAddress)
        : `${item.location?.lat || -6.914744},${item.location?.lng || 107.609810}`;

    const openInMaps = () => {
        let destination = "";
        if (locationAddress && locationAddress !== "Lokasi tidak tersedia") {
            destination = encodeURIComponent(locationAddress);
        } else if (item.location?.lat && item.location?.lng) {
            destination = `${item.location.lat},${item.location.lng}`;
        } else {
            return alert("Lokasi tidak valid.");
        }
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
    };

    const handleChatDonor = () => {
        const phone = "6285215376975"; // Mock
        const text = `Halo Donatur *${item.providerName}*,\n\nSaya sedang di lokasi pengambilan untuk makanan *${item.foodName}*. \n\nSaya ingin menanyakan: `;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const isActionable = ['active', 'pending', 'in_progress'].includes(item.status?.toLowerCase() || '');
    const isScanned = item.isScanned || false;
    const isCompleted = item.status === 'completed';
    const [previewMediaIndex, setPreviewMediaIndex] = React.useState<number | null>(null);
    const [previewMediaArray, setPreviewMediaArray] = React.useState<string[]>([]);
    
    const isVideo = (url: string) => {
        if (!url) return false;
        return url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.startsWith('data:video');
    };

    const openPreview = (idx: number, arr: any[]) => {
        const stringArr = arr.map(a => String(a));
        setPreviewMediaArray(stringArr);
        setPreviewMediaIndex(idx);
    };

    return (
        <div className="fixed inset-0 bg-[#FDFBF7] dark:bg-stone-950 z-[100] overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Media Preview Modal */}
            {previewMediaIndex !== null && (
                <MediaLightbox 
                    mediaUrls={previewMediaArray} 
                    initialIndex={previewMediaIndex} 
                    onClose={() => setPreviewMediaIndex(null)} 
                />
            )}
            {/* Hero Image Section */}
            <div className="relative h-72 md:h-80 w-full">
                <img src={optimizeUnsplashUrl(item.imageUrl, 1080)} alt={item.foodName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                <button 
                    onClick={onBack}
                    className="absolute top-4 left-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors z-10"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="absolute bottom-6 left-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg ${
                        item.status === 'completed' ? 'bg-green-500 text-white' : 
                        item.status === 'active' ? 'bg-orange-500 text-white' : 
                        'bg-red-500 text-white'
                    }`}>
                        Status: {item.status}
                    </span>
                    <h1 className="text-3xl font-black text-white leading-tight drop-shadow-md">{item.foodName}</h1>
                    <p className="text-orange-400 font-bold flex items-center gap-1.5 mt-1 drop-shadow-sm">
                        <Package className="w-4 h-4" /> {item.providerName}
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8 space-y-8 max-w-3xl mx-auto -mt-6 bg-[#FDFBF7] dark:bg-stone-950 rounded-t-[2.5rem] relative pb-44">
                
                {/* Status Validasi Scan */}
                {isActionable && (
                    <div className={`p-5 rounded-[2rem] border-2 transition-all shadow-sm flex items-center gap-4 ${
                        isScanned 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
                        : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                    }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            isScanned ? 'bg-green-500 text-white' : 'bg-orange-500 text-white animate-pulse'
                        }`}>
                            {isScanned ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-black text-sm uppercase tracking-tight ${isScanned ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                {isScanned ? 'Sudah Discan' : 'Belum Discan'}
                            </h4>
                            <p className="text-[11px] text-stone-500 leading-snug">
                                {isScanned 
                                    ? 'Petugas (Validator 1) telah memverifikasi pengambilan makanan ini.' 
                                    : 'Tunjukkan QR Code di bawah kepada Petugas/Donatur untuk divalidasi.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Review Section if Rated */}
                {item.rating && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/5 p-6 rounded-[2rem] border border-yellow-200 dark:border-yellow-900/50 space-y-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-yellow-400 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-yellow-500/20">
                                {item.rating}
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-yellow-800 dark:text-yellow-500 uppercase tracking-[.2em] mb-1">Ulasan Anda</h4>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < (item.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-sm text-stone-700 dark:text-stone-300 italic leading-relaxed bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                            "{item.review || 'Tanpa ulasan tertulis'}"
                        </p>

                        {/* Review Media */}
                        {item.reviewMedia && item.reviewMedia.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {item.reviewMedia.map((mediaUrl, idx) => (
                                    <div key={idx} className="relative group shrink-0" onClick={() => openPreview(idx, item.reviewMedia || [])}>
                                        {isVideo(mediaUrl) ? (
                                            <div className="w-28 h-28 rounded-2xl border-2 border-white dark:border-stone-800 bg-black overflow-hidden relative cursor-pointer shadow-md">
                                                <video src={mediaUrl} className="w-full h-full object-cover opacity-60" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img 
                                                src={mediaUrl} 
                                                alt={`Review ${idx}`} 
                                                className="w-28 h-28 object-cover rounded-2xl border-2 border-white dark:border-stone-800 shadow-md cursor-pointer hover:scale-105 transition-transform" 
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Status Reported */}
                {item.isReported && (
                    <div className="bg-red-50 dark:bg-red-900/5 p-6 rounded-[2rem] border border-red-200 dark:border-red-900/50 space-y-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                <AlertTriangle className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-red-800 dark:text-red-500 uppercase tracking-[.2em] mb-1">Laporan Terkirim</h4>
                                <p className="text-xs font-bold text-red-600/70">{item.reportReason || 'Masalah Terdeteksi'}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 space-y-2">
                            <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">Deskripsi Masalah:</p>
                            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                                {item.reportDescription || 'Tidak ada deskripsi tambahan.'}
                            </p>
                        </div>

                        {/* Report Evidence */}
                        {item.reportEvidence && (Array.isArray(item.reportEvidence) ? item.reportEvidence.length > 0 : true) && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {(Array.isArray(item.reportEvidence) ? item.reportEvidence : [item.reportEvidence]).map((mediaUrl, idx, fullArr) => (
                                    <div key={idx} className="relative group shrink-0" onClick={() => openPreview(idx, fullArr)}>
                                        {isVideo(String(mediaUrl)) ? (
                                            <div className="w-28 h-28 rounded-2xl border-2 border-white dark:border-stone-800 bg-black overflow-hidden relative cursor-pointer shadow-md">
                                                <video src={String(mediaUrl)} className="w-full h-full object-cover opacity-60" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img 
                                                src={String(mediaUrl)} 
                                                alt={`Evidence ${idx}`} 
                                                className="w-28 h-28 object-cover rounded-2xl border-2 border-white dark:border-stone-800 shadow-md cursor-pointer hover:scale-105 transition-transform" 
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-100/50 dark:bg-red-900/20 py-2 px-4 rounded-full w-fit">
                            <Clock className="w-3 h-3 animate-spin-slow" /> Sedang Ditinjau Admin
                        </div>
                    </div>
                )}

                {/* Info Sanggahan & Auto-Complete */}
                {isActionable && isScanned && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-800 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                                Silakan cek kualitas makanan. Jika kurang layak atau tidak sesuai, segera chat Donatur untuk penyesuaian.
                            </p>
                            <button onClick={handleChatDonor} className="flex items-center gap-1.5 text-xs font-black text-blue-700 dark:text-blue-200 uppercase tracking-widest hover:underline">
                                <MessageCircle className="w-4 h-4" /> Chat Donatur
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Jumlah Klaim</p>
                        <p className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-orange-500" /> {item.claimedQuantity || '1 Porsi'}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Metode Distribusi</p>
                        <p className="text-xl font-black text-stone-900 dark:text-white capitalize flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-500" /> {item.deliveryMethod === 'pickup' ? 'Mandiri' : 'Relawan'}
                        </p>
                    </div>
                </div>

                {/* QR Code Section - ACTIVE Only */}
                {isActionable && item.uniqueCode && (
                    <div className="bg-stone-900 dark:bg-black p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
                        
                        <div className="space-y-1 relative z-10">
                            <h4 className="text-orange-500 font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                <QrCode className="w-4 h-4" /> QR Penukaran
                            </h4>
                            <p className="text-stone-400 text-xs">Arahkan kamera Petugas ke kode ini</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-3xl inline-block shadow-inner ring-8 ring-stone-800/50 relative z-10">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${item.uniqueCode}`} alt="QR Code" className="w-48 h-48" />
                        </div>
                        
                        <div className="relative z-10">
                            <p className="text-4xl font-black text-white tracking-[0.2em] font-mono select-all">
                                {item.uniqueCode}
                            </p>
                        </div>
                    </div>
                )}

                {/* Location & Map */}
                <div className="space-y-4">
                    <h3 className="font-black text-xl text-stone-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-orange-500" /> Lokasi Pengambilan
                    </h3>
                    
                    <p className="text-sm text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 leading-relaxed font-medium">
                        {locationAddress}
                    </p>
                    
                    <div className="rounded-[2.5rem] overflow-hidden border border-stone-200 dark:border-stone-800 relative h-64 group cursor-pointer shadow-md transition-all hover:shadow-xl" onClick={openInMaps}>
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            scrolling="no" 
                            marginHeight={0} 
                            marginWidth={0} 
                            src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                            className="filter grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out scale-105"
                        ></iframe>
                        <button className="absolute bottom-5 right-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white px-6 py-3 rounded-full text-sm font-black shadow-2xl flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <Navigation className="w-4 h-4 text-orange-500" /> Buka Google Maps
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-stone-800 z-[110]">
                <div className="max-w-3xl mx-auto flex flex-col gap-3">
                    {isActionable && !isScanned && (
                        <div className="flex items-center justify-center gap-2 text-stone-400 font-bold text-[10px] uppercase tracking-widest mb-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> Menunggu Validasi Scan Petugas...
                        </div>
                    )}
                    <div className="flex gap-3">
                        {/* Report Button */}
                        {!item.isReported && (
                            <button 
                                onClick={onReport}
                                className="h-14 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2 shrink-0"
                            >
                                <AlertTriangle className="w-4 h-4" /> Lapor
                            </button>
                        )}

                        {/* Review Button (Only if Completed & Not Rated) */}
                        {isCompleted && !item.rating && onReview && (
                            <button 
                                onClick={onReview}
                                className="h-14 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 transition-all flex items-center justify-center gap-2 flex-1"
                            >
                                <Star className="w-4 h-4" /> Beri Ulasan
                            </button>
                        )}

                        {/* Confirm Button */}
                        {isActionable && onComplete && (
                            <Button 
                                onClick={onComplete}
                                disabled={!isScanned}
                                className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all ${
                                    isScanned 
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' 
                                    : 'bg-stone-200 text-stone-400 shadow-none grayscale'
                                }`}
                            >
                                <CheckCircle2 className="w-5 h-5 mr-1" /> Konfirmasi Diterima
                            </Button>
                        )}

                        {/* Close Button if no main action */}
                        {!isActionable && !(!item.rating && isCompleted) && (
                             <Button 
                                onClick={onBack}
                                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest bg-stone-900 text-white"
                            >
                                Tutup Detail
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
