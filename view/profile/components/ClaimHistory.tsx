
import React, { useState } from 'react';
import { QrCode, MessageSquare, AlertTriangle, X, Star, Send, CheckCircle, Loader2, ChevronLeft, ChevronRight, MapPin, Package, Truck, Navigation, CalendarDays, ShoppingBag, Camera, Image as ImageIcon, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { ClaimHistoryItem } from '../../../types';
import { db } from '../../../services/db';
import { getDateTimeParts } from '../../../utils/transformers';
import { optimizeUnsplashUrl } from '../../../utils/imageOptimizer';

export interface ReviewModalProps {
    item: ClaimHistoryItem;
    onClose: () => void;
    onSubmit: (rating: number, review: string, media: string[]) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ item, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [media, setMedia] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !e.target.files) return;

        if (media.length >= 5) {
            alert('Maksimal 5 media per ulasan.');
            return;
        }

        const isVid = file.type.startsWith('video/');
        const limit = isVid ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        
        if (file.size > limit) {
            alert(`Ukuran file terlalu besar. Maksimal ${isVid ? '50MB untuk video' : '5MB untuk foto'}.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setMedia(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Mohon berikan rating');
            return;
        }
        setIsSubmitting(true);
        
        try {
            const uploadedUrls: string[] = [];
            for (const base64 of media) {
                if (base64.startsWith('data:')) {
                    const isVid = base64.startsWith('data:video');
                    const ext = isVid ? 'mp4' : 'jpg';
                    const url = await db.uploadImage(base64, `review_${item.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`, 'reviews');
                    uploadedUrls.push(url);
                } else {
                    uploadedUrls.push(base64);
                }
            }

            onSubmit(rating, review, uploadedUrls);
        } catch (error) {
            console.error("Failed to upload review media:", error);
            alert("Gagal mengunggah media ulasan. Tetap mengirim ulasan tanpa media baru.");
            onSubmit(rating, review, []);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl max-w-md w-full relative shadow-2xl overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-white">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
                    <img src={item.imageUrl} alt={item.foodName} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white">{item.foodName}</h3>
                        <p className="text-sm text-stone-500">{item.providerName}</p>
                    </div>
                </div>
                <div className="text-center mb-6">
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">Bagaimana pengalaman Anda?</p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-stone-300 dark:text-stone-600'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>
                <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Tulis ulasan Anda..."
                    rows={4}
                    className="w-full p-3 border rounded-xl dark:bg-stone-800 dark:text-white mb-4 focus:outline-none focus:border-orange-500"
                />
                
                <div className="mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {media.map((url, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 group bg-stone-100">
                                {url.startsWith('data:video') ? (
                                    <video src={url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={url} alt="review" className="w-full h-full object-cover" />
                                )}
                                <button 
                                    onClick={() => setMedia(media.filter((_, idx) => idx !== i))}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}
                        {media.length < 5 && (
                            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shrink-0">
                                <Camera className="w-5 h-5 text-stone-400" />
                                <span className="text-[8px] text-stone-400 font-bold uppercase mt-1">Tambah</span>
                                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting} className="w-full">
                    {isSubmitting ? 'Mengirim Ulasan...' : 'Kirim Ulasan'}
                </Button>
            </div>
        </div>
    );
};

export interface ReportModalProps {
    item: ClaimHistoryItem;
    onClose: () => void;
    onSubmit: (reason: string, description: string, evidence: string[]) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ item, onClose, onSubmit }) => {
    const [reason, setReason] = useState('Kualitas Makanan Buruk');
    const [description, setDescription] = useState('');
    const [evidence, setEvidence] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !e.target.files) return;

        if (evidence.length >= 5) {
            alert('Maksimal 5 media bukti per laporan.');
            return;
        }

        const isVid = file.type.startsWith('video/');
        const limit = isVid ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        
        if (file.size > limit) {
            alert(`Ukuran file terlalu besar. Maksimal ${isVid ? '50MB untuk video' : '5MB untuk foto'}.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setEvidence(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!description.trim()) return;
        setIsSubmitting(true);
        
        try {
            const uploadedUrls: string[] = [];
            for (const base64 of evidence) {
                if (base64.startsWith('data:')) {
                    const isVid = base64.startsWith('data:video');
                    const ext = isVid ? 'mp4' : 'jpg';
                    const url = await db.uploadImage(base64, `report_${item.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`, 'reports');
                    uploadedUrls.push(url);
                } else {
                    uploadedUrls.push(base64);
                }
            }
            
            onSubmit(reason, description, uploadedUrls);
        } catch (error) {
            console.error("Failed to upload evidence:", error);
            alert("Gagal mengunggah media bukti. Laporan akan dikirim tanpa media.");
            onSubmit(reason, description, []);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl max-w-md w-full relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Laporkan Masalah
                </h3>
                <div className="space-y-4 mb-6">
                    <select 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 border rounded-xl dark:bg-stone-800 dark:text-white focus:outline-none focus:border-red-500"
                    >
                        <option>Kualitas Makanan Buruk</option>
                        <option>Jumlah Tidak Sesuai</option>
                        <option>Donatur Tidak Ditemukan</option>
                        <option>Lainnya</option>
                    </select>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deskripsi masalah..."
                        rows={4}
                        className="w-full p-3 border rounded-xl dark:bg-stone-800 dark:text-white focus:outline-none focus:border-red-500"
                    />
                    
                    <div>
                        <label className="text-xs font-bold text-stone-500 mb-2 block uppercase">Bukti Foto (Opsional)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {evidence.map((url, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 group border border-stone-200 bg-stone-100">
                                    {url.startsWith('data:video') ? (
                                        <video src={url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={url} alt="evidence" className="w-full h-full object-cover" />
                                    )}
                                    <button 
                                        onClick={() => setEvidence(evidence.filter((_, idx) => idx !== i))}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ))}
                            {evidence.length < 5 && (
                                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shrink-0">
                                    <ImageIcon className="w-5 h-5 text-stone-400" />
                                    <span className="text-[8px] text-stone-400 font-bold uppercase mt-1">Tambah</span>
                                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={!description.trim() || isSubmitting} className="w-full bg-red-600 hover:bg-red-700">
                    {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan'}
                </Button>
            </div>
        </div>
    );
};

interface ClaimHistoryProps {
    history: ClaimHistoryItem[];
    onSelectItem: (item: ClaimHistoryItem) => void;
    onSubmitReview?: (claimId: string, rating: number, comment: string, media: string[]) => void;
    onSubmitReport?: (claimId: string, reason: string, description: string, evidence: string[]) => void;
    onOpenReport?: (item: ClaimHistoryItem) => void;
    isLoading?: boolean;
    onRefresh?: () => void | Promise<void>;
}

export const ClaimHistory: React.FC<ClaimHistoryProps> = ({ 
    history, 
    onSelectItem,
    onSubmitReview,
    onSubmitReport,
    onOpenReport,
    isLoading,
    onRefresh
}) => {
    const [showQr, setShowQr] = useState<string | null>(null);
    const [reviewItem, setReviewItem] = useState<ClaimHistoryItem | null>(null);
    const [reportItem, setReportItem] = useState<ClaimHistoryItem | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleRefreshClick = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
            await new Promise(resolve => setTimeout(resolve, 800));
        } finally {
            setIsRefreshing(false);
        }
    };

    const showLoading = isLoading || isRefreshing;

    const filteredHistory = history.filter(item => filter === 'all' || item.status?.toLowerCase() === filter.toLowerCase());
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    const handleReviewSubmit = (rating: number, review: string, media: string[]) => {
        if (reviewItem && onSubmitReview) {
            onSubmitReview(reviewItem.id, rating, review, media);
            alert("Terima kasih! Ulasan Anda berhasil dikirim.");
            setReviewItem(null);
        }
    };

    const handleReportSubmit = (reason: string, description: string, evidence: string[]) => {
        if (reportItem && onSubmitReport) {
            onSubmitReport(reportItem.id, reason, description, evidence);
            alert("Laporan Anda telah dikirim dan akan segera ditinjau.");
            setReportItem(null);
        }
    };

    const handleOpenReport = (e: React.MouseEvent, item: ClaimHistoryItem) => {
        e.stopPropagation(); 
        if (onOpenReport) {
            onOpenReport(item);
        } else {
            setReportItem(item);
        }
    };

    return (
        <div className="px-6 pb-6 pt-2 bg-[#FDFBF7] dark:bg-stone-950 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
                    {['all', 'active', 'completed', 'cancelled'].map(tab => (
                        <button key={tab} onClick={() => { setFilter(tab as any); setCurrentPage(1); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize whitespace-nowrap ${filter === tab ? 'bg-orange-500 text-white' : 'bg-white dark:bg-stone-800 text-stone-600 border'}`}>
                            {tab === 'all' ? 'Semua' : tab === 'active' ? 'Aktif' : tab === 'completed' ? 'Selesai' : 'Batal'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {showLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-stone-200 dark:border-stone-800 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-stone-500 rounded-full animate-spin border-t-transparent"></div>
                        </div>
                        <p className="text-stone-500 dark:text-stone-400 font-black text-xs uppercase tracking-[0.2em] mt-6 animate-pulse">
                            Memuat Riwayat...
                        </p>
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">Tidak ada riwayat klaim.</div>
                ) : (
                    currentItems.map(item => {
                        const dateParts = getDateTimeParts(item.date);
                        return (
                        <div 
                            key={item.id} 
                            onClick={() => onSelectItem(item)}
                            className="bg-white dark:bg-stone-900 p-4 rounded-xl border flex flex-col md:flex-row gap-4 cursor-pointer group hover:border-orange-500/50 hover:shadow-md transition-all active:scale-[0.99]"
                        >
                            <div className="flex gap-4 flex-1">
                                <img src={optimizeUnsplashUrl(item.imageUrl, 200)} alt={item.foodName} className="w-20 h-20 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors">{item.foodName}</h4>
                                        {item.status?.toLowerCase() === 'completed' ? (
                                            <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase bg-green-100 text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Selesai
                                            </span>
                                        ) : ['active', 'pending', 'in_progress'].includes(item.status?.toLowerCase() || '') ? (
                                            <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase bg-blue-100 text-blue-600 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase bg-red-100 text-red-600 flex items-center gap-1">
                                                <X className="w-3 h-3" /> Batal
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">{item.providerName}</p>
                                    
                                    <div className="flex flex-col items-start mt-2">
                                        {dateParts ? (
                                            <>
                                                <span className="text-[10px] text-stone-500 font-medium">{dateParts.date}</span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{dateParts.time}</span>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${dateParts.ampm === 'PM' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                                                        {dateParts.ampm}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-[10px] text-stone-400">{item.date}</span>
                                        )}
                                    </div>

                                    {item.rating && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[10px] text-stone-500">{item.review}</span>
                                        </div>
                                    )}
                                    {item.isReported && <div className="mt-2 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">Laporan dikirim</div>}
                                </div>
                            </div>
                            <div className="flex md:flex-col justify-end items-end gap-2 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                                <Button variant="outline" className="h-9 text-xs px-4" onClick={(e) => { e.stopPropagation(); onSelectItem(item); }}>Detail</Button>
                                {['active', 'pending', 'in_progress'].includes(item.status?.toLowerCase() || '') && (
                                    <Button className="h-9 text-xs px-4" onClick={(e) => { e.stopPropagation(); setShowQr(item.uniqueCode || 'ERR'); }}>
                                        <QrCode className="w-3 h-3 mr-1" /> Kode
                                    </Button>
                                )}
                                
                                {['active', 'pending', 'in_progress', 'completed'].includes(item.status?.toLowerCase() || '') && (
                                    <div className="flex gap-2">
                                        {item.status === 'completed' && !item.rating && (
                                            <Button variant="outline" className="h-9 text-xs" onClick={(e) => { e.stopPropagation(); setReviewItem(item); }}><MessageSquare className="w-3 h-3" /> Ulas</Button>
                                        )}
                                        {!item.isReported && item.status === 'completed' && (
                                            <Button variant="ghost" className="h-9 text-xs text-red-500" onClick={(e) => handleOpenReport(e, item)}><AlertTriangle className="w-3 h-3" /> Lapor</Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )})
                )}
            </div>

            {showQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl max-w-sm w-full text-center relative">
                        <button onClick={() => setShowQr(null)} className="absolute top-4 right-4"><X className="w-6 h-6 text-stone-400" /></button>
                        <h3 className="font-bold dark:text-white mb-4">Kode Penukaran</h3>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${showQr}`} alt="QR" className="w-48 h-48 mx-auto mb-4 p-2 border rounded-xl" />
                        <p className="text-2xl font-mono font-bold text-stone-900 dark:text-white">{showQr}</p>
                    </div>
                </div>
            )}
            {reviewItem && <ReviewModal item={reviewItem} onClose={() => setReviewItem(null)} onSubmit={handleReviewSubmit} />}
            {!onOpenReport && reportItem && <ReportModal item={reportItem} onClose={() => setReportItem(null)} onSubmit={handleReportSubmit} />}
        </div>
    );
};
