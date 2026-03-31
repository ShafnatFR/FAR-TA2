
import React, { useState } from 'react';
import { ArrowRight, Upload, Sparkles, Timer, Weight, ShoppingBag, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { DeliveryMethod, Address } from '../../../types';
import { analyzeFoodQuality } from '../../../services/ai';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    React.useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { animate: true, duration: 0.5 });
        }
    }, [center, map]);
    return null;
};

interface QualityCheckInventoryInputProps {
  onAnalysisComplete: (result: any, image: string, formData: any) => void;
  onBack: () => void;
  addresses: Address[];
}

export const QualityCheckInventoryInput: React.FC<QualityCheckInventoryInputProps> = ({ onAnalysisComplete, onBack, addresses }) => {
  const [step, setStep] = useState<'form' | 'upload' | 'loading'>('form');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const getLocalDateStr = () => {
    return new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().slice(0, 16);
  };

  const defaultTimes = {
    start: `${getLocalDateStr()}T18:30`,
    end: `${getLocalDateStr()}T21:00`
  };

  const [form, setForm] = useState({ 
    name: '', 
    ingredients: '', 
    madeDateTime: getCurrentDateTime(),
    distributionStart: defaultTimes.start, 
    distributionEnd: defaultTimes.end,
    quantity: '', 
    quantityUnit: 'Porsi' as 'Porsi' | 'Box' | 'Gram', 
    weightPerUnit: '', 
    minClaim: '1', 
    maxClaim: '5',
    storageLocation: 'Suhu Ruang',
    packaging: 'plastic' as 'plastic' | 'recycled' | 'no-plastic', 
    deliveryMethod: 'pickup' as DeliveryMethod,
    allergens: '',
    addressId: addresses.length > 0 ? (addresses.find(a => a.isPrimary)?.id || addresses[0].id) : ''
  });

  const selectedAddress = addresses.find(a => a.id === form.addressId) || addresses[0];
  const mapCenter: [number, number] = selectedAddress?.lat && selectedAddress?.lng 
      ? [selectedAddress.lat, selectedAddress.lng] 
      : [-6.200000, 106.816666];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setStep('loading');
        runAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (img: string) => {
    try {
        const qtyNum = parseFloat(form.quantity) || 1;
        const weightNum = parseFloat(form.weightPerUnit) || 500;
        
        // Hitung total berat batch
        const totalWeightGram = form.quantityUnit === 'Gram' 
            ? qtyNum 
            : qtyNum * weightNum;

        // Tentukan jumlah porsi untuk perhitungan rata-rata
        const portionCount = form.quantityUnit === 'Gram' ? 1 : qtyNum;

        // MENGIRIM SELURUH KONTEKS WAKTU UNTUK ANALISIS MIKROBIOLOGI AI
        const result = await analyzeFoodQuality(["Makanan"], img, {
            foodName: form.name,
            ingredients: form.ingredients,
            madeTime: form.madeDateTime,
            storageLocation: form.storageLocation,
            weightGram: totalWeightGram,
            packagingType: form.packaging,
            distributionStart: form.distributionStart,
            quantityCount: portionCount // Pass quantity count
        });
        
        onAnalysisComplete(result, img, form);
    } catch (err) {
        console.error(err);
        alert("Gagal menganalisis. Silakan coba lagi.");
        setStep('upload');
    }
  };

  if (step === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in">
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-orange-400" />
                </div>
            </div>
            <h3 className="text-3xl font-black text-stone-900 dark:text-white italic">AI Sedang Mengaudit Kualitas Pangan...</h3>
            <p className="text-stone-500 mt-3 max-w-sm mx-auto">Kami menganalisis risiko pertumbuhan bakteri dan menghitung dampak lingkungan per porsi.</p>
        </div>
      );
  }

  if (step === 'upload') {
      return (
        <div className="w-full max-w-lg mx-auto py-12 animate-in zoom-in-95">
             <div className="relative group cursor-pointer w-full max-w-xs aspect-square mx-auto border-4 border-dashed border-orange-200 dark:border-stone-700 rounded-[2.5rem] flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50/30 transition-all duration-500">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleImageUpload} />
                <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-orange-600" />
                </div>
                <span className="font-bold text-xl text-stone-800 dark:text-stone-200">Lanjutkan ke Foto</span>
                <span className="text-sm text-stone-400 mt-2 px-6 text-center font-medium">AI akan mencocokkan kondisi visual foto dengan durasi penyimpanan Anda.</span>
            </div>
            <Button variant="ghost" onClick={() => setStep('form')} className="mt-8">← Kembali Isi Detail</Button>
        </div>
      );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 py-8">
        <Input label="Nama Makanan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Nasi Box Ayam Bakar" required />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-2">
                <Input 
                    label="Jumlah Stok" 
                    type="number" 
                    min="0"
                    value={form.quantity} 
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        setForm({...form, quantity: isNaN(val) ? '' : Math.max(0, val).toString()});
                    }} 
                    placeholder="0" 
                    required
                />
                <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Satuan</label>
                    <select className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white" value={form.quantityUnit} onChange={e => setForm({...form, quantityUnit: e.target.value as any})}>
                        <option value="Porsi">Porsi</option><option value="Box">Box</option><option value="Gram">Gram</option>
                    </select>
                </div>
            </div>
            
            {(form.quantityUnit === 'Porsi' || form.quantityUnit === 'Box') && (
                <div className="animate-in slide-in-from-left-2">
                    <Input 
                        label={`Berat per ${form.quantityUnit} (Gram)`} 
                        type="number" 
                        min="1"
                        value={form.weightPerUnit} 
                        onChange={e => setForm({...form, weightPerUnit: e.target.value})}
                        placeholder="Contoh: 450"
                        icon={<Weight className="w-4 h-4" />}
                    />
                </div>
            )}
        </div>

        <div className="p-6 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
            <label className="text-sm font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" /> Batas Pengambilan per Penerima
            </label>
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Minimal Ambil" 
                    type="number" 
                    min="1"
                    value={form.minClaim} 
                    onChange={e => setForm({...form, minClaim: e.target.value})}
                />
                <Input 
                    label="Maksimal Ambil" 
                    type="number" 
                    min="1"
                    value={form.maxClaim} 
                    onChange={e => setForm({...form, maxClaim: e.target.value})}
                />
            </div>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Lokasi Penjemputan / Pengiriman</label>
                <select 
                    className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white font-bold" 
                    value={form.addressId} 
                    onChange={e => setForm({...form, addressId: e.target.value})}
                >
                    {addresses.length === 0 ? (
                        <option value="">Belum ada alamat tersimpan</option>
                    ) : (
                        addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>{addr.label} - {addr.fullAddress}</option>
                        ))
                    )}
                </select>
            </div>

            {selectedAddress && selectedAddress.lat && selectedAddress.lng && (
                <div className="w-full h-40 bg-stone-100 dark:bg-[#0C0A09] rounded-2xl overflow-hidden border border-stone-200 dark:border-[#292524] relative z-0">
                    <div className="w-full h-full dark:invert dark:hue-rotate-180">
                        <MapContainer center={mapCenter} zoom={16} zoomControl={false} className="w-full h-full z-0">
                            <TileLayer 
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <MapUpdater center={mapCenter} />
                        </MapContainer>
                    </div>
                    {/* Fixed center marker */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none drop-shadow-lg">
                        <div className="relative">
                            <MapPin className="w-8 h-8 text-orange-600 fill-orange-100 -mt-4" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/20 rounded-full blur-[1px]"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 mt-2">
                <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Metode Pengambilan</label>
                <select className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white font-bold" value={form.deliveryMethod} onChange={e => setForm({...form, deliveryMethod: e.target.value as any})}>
                    <option value="pickup">Pick Up (Penerima Ambil Sendiri)</option>
                    <option value="delivery">Diantar (Oleh Relawan)</option>
                    <option value="both">Keduanya (Pick Up & Diantar)</option>
                </select>
            </div>
        </div>

        <Input label="Bahan Utama (Ketik manual)" value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} placeholder="Ayam, Nasi, Sayur, Telur..." />
        
        <div className="animate-in slide-in-from-left-2 transition-all">
            <Input 
                label="Punya Alergen? (Kacang/Susu/dll)" 
                value={form.allergens} 
                onChange={e => setForm({...form, allergens: e.target.value})} 
                placeholder="Kosongkan jika tidak ada" 
                icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            />
            <p className="text-[10px] text-stone-400 mt-1 italic leading-tight">*Input ini membantu AI melakukan verifikasi silang lebih akurat.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                label="Waktu Masak/Beli" 
                type="datetime-local" 
                value={form.madeDateTime} 
                onChange={e => setForm({...form, madeDateTime: e.target.value})} 
                className="!bg-stone-100 dark:!bg-stone-800 text-stone-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" 
            />
            
            <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Penyimpanan</label>
                <select className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white" value={form.storageLocation} onChange={e => setForm({...form, storageLocation: e.target.value})}>
                    <option>Suhu Ruang</option><option>Kulkas</option><option>Pemanas</option>
                </select>
            </div>
        </div>

        <div className="space-y-2 p-6 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-stone-800">
            <label className="text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4" /> Atur Jendela Waktu Distribusi
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Buka Klaim" type="datetime-local" value={form.distributionStart} onChange={e => setForm({...form, distributionStart: e.target.value})} className="!bg-white" />
                <Input label="Tutup / Exp" type="datetime-local" value={form.distributionEnd} onChange={e => setForm({...form, distributionEnd: e.target.value})} className="!bg-white" />
            </div>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 italic mt-1">*Penting: AI akan menilai kualitas berdasarkan selisih waktu buka klaim dan waktu masak.</p>
        </div>

        <div className="pt-6">
            <Button onClick={() => setStep('upload')} disabled={!form.name || !form.quantity || (form.quantityUnit !== 'Gram' && !form.weightPerUnit)}>
                LANJUT KE FOTO & AUDIT AI <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
    </div>
  );
};
