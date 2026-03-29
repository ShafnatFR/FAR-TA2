
import React, { useState } from 'react';
import { AlertTriangle, X, Package, ShoppingBag, CheckCircle2, Image as ImageIcon, MessageSquare, Maximize2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Report } from '../../../../types';
import { MediaLightbox } from '../../../common/MediaLightbox';

interface ReportDetailModalProps {
    report: Report;
    onClose: () => void;
    onShowProductDetail: () => void;
    onHandleAction: (status: 'resolved' | 'dismissed') => void;
    onContactAdmin: (report: Report) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ 
    report, 
    onClose, 
    onShowProductDetail, 
    onHandleAction,
    onContactAdmin 
}) => {
    const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);

    const handleCheckDetail = () => {
        onClose(); // Close this modal first
        onShowProductDetail(); // Trigger the navigation callback
    };

    // Helper to safely handle evidence array vs string (backward compatibility)
    const evidenceList = Array.isArray(report.evidenceUrl) 
        ? report.evidenceUrl 
        : (typeof report.evidenceUrl === 'string' && report.evidenceUrl.startsWith('[') ? JSON.parse(report.evidenceUrl) : (report.evidenceUrl ? [report.evidenceUrl] : []));

    // Filter out valid strings only
    const validEvidence = evidenceList.filter((url: any) => typeof url === 'string' && url.length > 5);

    const isVideo = (url: string) => url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.startsWith('data:video');

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                    {/* Header Modal */}
                    <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${report.isUrgent ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-stone-900 dark:text-white leading-tight">{report.title}</h3>
                                <p className="text-xs text-stone-500 font-medium">Laporan ID: {report.id}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Modal */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                        {/* Evidence Image Gallery */}
                        <div className="space-y-4">
                            <h4 className="font-black text-stone-900 dark:text-white text-[10px] flex items-center gap-2 uppercase tracking-[0.2em]">
                                <ImageIcon className="w-4 h-4 text-blue-500" /> Bukti Foto dari Penerima
                            </h4>
                            {validEvidence.length > 0 ? (
                                <div className={`grid gap-3 ${validEvidence.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {validEvidence.map((url: string, idx: number) => (
                                        <div 
                                            key={idx}
                                            className="relative group cursor-zoom-in rounded-[1.5rem] overflow-hidden border-2 border-stone-100 dark:border-stone-800 shadow-lg bg-stone-100 dark:bg-stone-800 aspect-video"
                                            onClick={() => setPreviewMediaIndex(idx)}
                                        >
                                            {isVideo(url) ? (
                                                <div className="w-full h-full relative">
                                                    <video src={url} className="w-full h-full object-cover opacity-80" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-110 transition-transform">
                                                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={url} 
                                                    alt={`Bukti Laporan ${idx + 1}`} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" 
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white/95 backdrop-blur-md p-2 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                                    <Maximize2 className="w-4 h-4 text-stone-900" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-stone-50 dark:bg-stone-800/30 rounded-[2rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
                                    <ImageIcon className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Tidak ada foto bukti</p>
                                </div>
                            )}
                        </div>

                        {/* Product & Order Info Section */}
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-stone-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-stone-800 rounded-xl">
                                    <Package className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Produk Terkait</p>
                                    <p className="font-bold text-stone-900 dark:text-white text-sm">{report.foodName || 'Nasi Kotak'}</p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="h-8 text-[10px] px-3 bg-white border-orange-200 text-orange-600 hover:bg-orange-100 w-auto"
                                onClick={handleCheckDetail}
                            >
                                Detail Produk
                            </Button>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-3">
                            <h4 className="font-black text-stone-900 dark:text-white text-[10px] flex items-center gap-2 uppercase tracking-[0.2em]">
                                <MessageSquare className="w-4 h-4 text-orange-500" /> Keluhan Penerima
                            </h4>
                            <div className="bg-[#FDFBF7] dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800">
                                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                                    "{report.description ? report.description : "Tidak ada deskripsi rinci dari pelapor."}"
                                </p>
                            </div>
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">ID Pesanan</p>
                                <span className="text-xs font-black text-orange-600 dark:text-orange-400">{report.orderId || 'N/A'}</span>
                            </div>
                            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Tanggal</p>
                                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{report.date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Modal */}
                    <div className="p-6 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => onHandleAction('resolved')} 
                                className="bg-green-600 hover:bg-green-700 flex-1 h-12 text-xs font-black uppercase tracking-widest rounded-2xl"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai
                            </Button>
                            <Button 
                                onClick={() => onContactAdmin(report)}
                                className="flex-1 rounded-2xl font-black uppercase tracking-widest text-xs h-12 bg-blue-600 hover:bg-blue-700 border-none shadow-blue-500/20"
                            >
                                <MessageSquare className="w-4 h-4 mr-1" /> Beri Tanggapan
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Lightbox */}
            {previewMediaIndex !== null && (
                <MediaLightbox 
                    mediaUrls={validEvidence} 
                    initialIndex={previewMediaIndex} 
                    onClose={() => setPreviewMediaIndex(null)} 
                />
            )}
        </>
    );
};
