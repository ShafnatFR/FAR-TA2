
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Clock, CheckCircle, MapPin, Navigation, Minus, Plus, CalendarDays, Heart, MessageCircle, Truck, Package, AlertTriangle, Loader2, Lock, AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/Button';
import { FoodItem, ClaimHistoryItem, UserData } from '../../../types';
import { StoreIcon } from './StoreIcon';
import { AIVerificationCard } from './AIVerificationCard';
import { db } from '../../../services/db';
import { formatDateTime, isFoodExpired } from '../../../utils/transformers';
import { optimizeUnsplashUrl } from '../../../utils/imageOptimizer';

interface FoodDetailProps {
  item: FoodItem;
  onBack: () => void;
  onClaim: (quantity: string, method: 'pickup' | 'delivery') => Promise<void> | void; 
  isSaved: boolean;
  onToggleSave: () => void;
  claimHistory?: ClaimHistoryItem[];
  currentUser?: UserData | null;
}

export const FoodDetail: React.FC<FoodDetailProps> = ({ item, onBack, onClaim, isSaved, onToggleSave, claimHistory = [], currentUser }) => {
  // LOGIKA ADAPTIF PORSI
  const stockAvailable = item.currentQuantity;
  const standardMin = item.minQuantity || 1;
  const maxAllowedByDonor = item.maxQuantity || item.initialQuantity;
  
  // Jika stok sisa < minimal standar, maka minimal ambil adalah sisa stok itu sendiri
  const minAllowed = stockAvailable < standardMin ? stockAvailable : standardMin;
  
  // Batas maksimal sesungguhnya tidak boleh melebihi stok yang tersisa
  const actualMax = Math.min(stockAvailable, maxAllowedByDonor);

  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [claimQuantity, setClaimQuantity] = useState(minAllowed); 
  const [selectedMethod, setSelectedMethod] = useState<'pickup' | 'delivery'>('pickup');

  // State to track if receiver has setup an address
  const [hasAddress, setHasAddress] = useState<boolean | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  const expired = isFoodExpired(item.distributionEnd, item.expiryTime);

  // Check status
  const isThisItemActive = claimHistory.some(c => 
      c.status?.toUpperCase() === 'ACTIVE' && 
      c.foodName === item.name && 
      c.providerName === item.providerName
  );
  
  const isOutOfStock = stockAvailable <= 0;

  useEffect(() => {
      const checkAddress = async () => {
          setIsLoadingAddress(true);
          try {
              if (currentUser?.id) {
                  const addresses = await db.getAddresses(currentUser.id);
                  setHasAddress(addresses && addresses.length > 0);
              }
          } catch (e) {
              console.error("Failed to check address:", e);
          } finally {
              setIsLoadingAddress(false);
          }
      };
      checkAddress();
  }, [currentUser?.id]);

  useEffect(() => {
      setClaimQuantity(minAllowed);
      if (item.deliveryMethod === 'delivery') setSelectedMethod('delivery');
      else setSelectedMethod('pickup');
  }, [item, minAllowed]);

  const handleClaimClick = () => {
    if (isThisItemActive || !hasAddress || isOutOfStock) return;
    setShowConfirmModal(true);
  };

  const confirmClaim = async () => {
    setShowConfirmModal(false);
    setIsClaiming(true);
    try {
        await onClaim(`${claimQuantity} Porsi`, selectedMethod);
    } catch (e) {
        console.error(e);
    } finally {
        setIsClaiming(false);
    }
  };

  const increment = () => {
    if (claimQuantity < actualMax) setClaimQuantity(prev => prev + 1);
  };

  const decrement = () => {
    if (claimQuantity > minAllowed) setClaimQuantity(prev => prev - 1);
  };

  const handleRoute = () => {
    let destination = "";
    if (item.location?.address && item.location.address !== "Lokasi tidak tersedia") {
        destination = encodeURIComponent(item.location.address);
    } else if (item.location?.lat && item.location?.lng && item.location.lat !== -6.914744) {
        destination = `${item.location.lat},${item.location.lng}`;
    } else {
        return alert("Lokasi tidak valid.");
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
  };

  const handleChatToProvider = () => {
    const rawPhone = item.providerPhone;
    if (!rawPhone) return alert("Kontak tidak tersedia.");
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent("Halo, saya tertarik dengan donasi: " + item.name)}`, '_blank');
  };

  const locationAddress = item.location?.address || "Lokasi tidak tersedia";
  const mapQuery = (locationAddress && locationAddress !== "Lokasi tidak tersedia")
      ? encodeURIComponent(locationAddress)
      : `${item.location?.lat || -6.914744},${item.location?.lng || 107.609810}`;

  return (
    <div className="fixed inset-0 bg-[#FDFBF7] dark:bg-stone-950 z-[60] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="relative h-72 md:h-80 w-full">
            <img src={optimizeUnsplashUrl(item.imageUrl, 1080)} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <button onClick={onBack} className="absolute top-4 left-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white z-10"><ArrowLeft className="w-6 h-6" /></button>
            <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
                <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 backdrop-blur-sm border border-white/20">
                    <ShieldCheck className="w-3 h-3" /> AI SCORE {item.aiVerification?.halalScore}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 ${isOutOfStock ? 'bg-red-600 text-white' : 'bg-white/90 text-stone-900'}`}>
                    Stok: {item.currentQuantity}
                </span>
                {item.deliveryMethod !== 'both' && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 flex items-center gap-1 ${item.deliveryMethod === 'pickup' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {item.deliveryMethod === 'pickup' ? <Package className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                        {item.deliveryMethod === 'pickup' ? 'Hanya Ambil' : 'Hanya Antar'}
                    </span>
                )}
            </div>
        </div>

        <div className="p-6 space-y-8 max-w-3xl mx-auto -mt-6 bg-[#FDFBF7] dark:bg-stone-950 rounded-t-3xl relative pb-64 md:pb-56">
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                    <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white leading-tight mb-3">{item.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-stone-600 dark:text-stone-400">
                        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-900 px-3 py-1.5 rounded-xl">
                            <StoreIcon className="w-4 h-4 text-orange-500" />
                            <span className="font-bold text-sm">{item.providerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-bold text-xs">Exp: {formatDateTime(item.distributionEnd || item.expiryTime)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <button onClick={onToggleSave} className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 transition-all active:scale-90 ${isSaved ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400'}`}><Heart className={`w-7 h-7 ${isSaved ? 'fill-current' : ''}`} /></button>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-stone-400">simpan</span>
                </div>
            </div>

            {isOutOfStock ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border-2 border-red-100 dark:border-red-900/30 flex items-center gap-4 animate-pulse">
                    <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                    <div>
                        <p className="font-black text-red-700 dark:text-red-400 text-sm uppercase tracking-tighter">Maaf, Stok Habis</p>
                        <p className="text-xs text-red-600 dark:text-red-300 font-medium">Makanan ini sudah habis diklaim oleh pengguna lain.</p>
                    </div>
                </div>
            ) : isThisItemActive && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-700 dark:text-red-400 text-sm">Pesanan Sedang Aktif</p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">Selesaikan proses pengambilan terlebih dahulu.</p>
                    </div>
                </div>
            )}

            <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-3xl border border-orange-100 dark:border-orange-800/50">
                <h3 className="font-black text-stone-800 dark:text-orange-100 text-sm flex items-center gap-2 mb-3 uppercase tracking-wider"><CalendarDays className="w-4 h-4 text-orange-500" /> JADWAL DISTRIBUSI SURPLUS</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-orange-100 dark:border-stone-800">
                        <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Mulai Ambil</p>
                        <p className="text-base font-black text-stone-900 dark:text-white">{item.distributionStart ? formatDateTime(item.distributionStart).split(',')[1] : '18:30'}</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-orange-100 dark:border-stone-800">
                        <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Batas Akhir</p>
                        <p className="text-base font-black text-red-600 dark:text-red-400">{item.distributionEnd ? formatDateTime(item.distributionEnd).split(',')[1] : '21:00'}</p>
                    </div>
                </div>
            </div>
            
            {/* AI Verification Section */}
            {item.aiVerification ? (
                <AIVerificationCard verification={item.aiVerification} />
            ) : (
                <div className="bg-stone-50 dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 flex flex-col items-center text-center opacity-70">
                    <ShieldCheck className="w-8 h-8 text-stone-300 mb-2" />
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-relaxed">Verifikasi AI Standar Aktif<br/>Halal & Kualitas Terjamin</p>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="font-bold text-xl text-stone-900 dark:text-white">Lokasi Pengambilan</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2 bg-stone-100 dark:bg-stone-900 p-3 rounded-xl"><MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" /> {locationAddress}</p>
                <div className="rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 relative h-56 group cursor-pointer shadow-sm" onClick={handleRoute}>
                    <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`} className="filter grayscale group-hover:grayscale-0 transition-all duration-500"></iframe>
                    <button className="absolute bottom-4 right-4 bg-white text-stone-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"><Navigation className="w-4 h-4" /> Buka Google Maps</button>
                </div>
            </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] md:max-w-3xl md:mx-auto md:bottom-6 md:rounded-3xl">
            <div className="flex flex-col gap-4">
                {item.deliveryMethod === 'both' && (
                    <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex gap-1">
                        <button onClick={() => setSelectedMethod('pickup')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${selectedMethod === 'pickup' ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-sm' : 'text-stone-500'}`}><Package className="w-4 h-4" /> Ambil Sendiri</button>
                        <button onClick={() => setSelectedMethod('delivery')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${selectedMethod === 'delivery' ? 'bg-white dark:bg-stone-700 text-blue-600 shadow-sm' : 'text-stone-500'}`}><Truck className="w-4 h-4" /> Diantar Relawan</button>
                    </div>
                )}

                <div className="flex items-center justify-between border-b md:border-b-0 border-stone-100 dark:border-stone-800 pb-3 md:pb-0">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.15em] mb-1">
                            JUMLAH AMBIL {stockAvailable < standardMin ? `(STOK SISA)` : `(MIN: ${minAllowed})`}
                        </p>
                        <div className="flex items-center gap-4 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-fit">
                            <button onClick={decrement} disabled={claimQuantity <= minAllowed || isThisItemActive || isOutOfStock} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-stone-700 text-stone-600 dark:text-white shadow-sm disabled:opacity-30 transition-all"><Minus className="w-4 h-4" /></button>
                            <span className="text-xl font-black text-stone-900 dark:text-white min-w-[2ch] text-center">{claimQuantity}</span>
                            <button onClick={increment} disabled={claimQuantity >= actualMax || isThisItemActive || isOutOfStock} className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500 text-white shadow-sm hover:bg-orange-600 disabled:opacity-30 transition-all"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.15em] mb-1">METODE: {selectedMethod === 'pickup' ? 'Ambil' : 'Antar'}</p>
                        <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400 leading-none">{actualMax} <span className="text-xs font-bold text-stone-400">Porsi</span></p>
                        <p className="text-[9px] text-stone-400 mt-1 italic font-bold">Maks per user: {actualMax}</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full">
                    <button onClick={handleChatToProvider} className="h-14 px-4 rounded-2xl border-2 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                    </button>
                    <Button 
                        onClick={handleClaimClick} 
                        isLoading={isClaiming} 
                        disabled={isOutOfStock || isThisItemActive || hasAddress === false || isLoadingAddress}
                        className={`h-14 flex-1 text-base rounded-2xl shadow-xl font-black tracking-widest uppercase border-0 ${
                            (isOutOfStock || isThisItemActive || hasAddress === false || isLoadingAddress)
                            ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none grayscale' 
                            : 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-orange-500/30'
                        }`}
                    >
                        {isOutOfStock ? 'STOK HABIS' : isLoadingAddress ? 'MEMERIKSA DATA...' : hasAddress === false ? 'LENGKAPI ALAMAT' : isThisItemActive ? 'SUDAH DIKLAIM' : 'KLAIM SEKARANG'}
                    </Button>
                </div>
            </div>
        </div>

        {showConfirmModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-black text-center text-stone-900 dark:text-white mb-2">Konfirmasi Klaim</h3>
                    <p className="text-stone-500 dark:text-stone-400 text-center text-sm mb-6">
                        Apakah Anda yakin ingin mengambil <span className="font-bold text-stone-900 dark:text-white">{claimQuantity} porsi</span> {item.name}?
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setShowConfirmModal(false)}>Batal</Button>
                        <Button className="flex-1 rounded-2xl bg-orange-600 hover:bg-orange-700" onClick={confirmClaim}>Ya, Yakin</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
