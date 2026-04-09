
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Trash2, Loader2, Edit3, Check, Star, X, Navigation, RefreshCw, User } from 'lucide-react';
import { Button } from '../../components/Button';
import { Address, UserData } from '../../../types';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper component to handle map events
const MapEvents = ({ onMoveEnd }: { onMoveEnd: (lat: number, lng: number) => void }) => {
    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            onMoveEnd(center.lat, center.lng);
        }
    });
    return null;
};

// Helper component to update map center programmatically
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { animate: true, duration: 0.5 });
        }
    }, [center, map]);
    return null;
};

interface AddressListProps {
    addresses: Address[];
    onAddAddress: (addr: Address) => Promise<void>; 
    onUpdateAddress?: (addr: Address) => Promise<void>;
    onDeleteAddress?: (id: string) => void;
    role?: string;
    currentUser?: UserData | null;
}

export const AddressList: React.FC<AddressListProps> = ({ addresses, onAddAddress, onUpdateAddress, onDeleteAddress, role, currentUser }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [mapRefreshKey, setMapRefreshKey] = useState(0);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.200000, 106.816666]); // Default Jakarta
    const isProgrammaticMove = useRef(false);
    
    const [formData, setFormData] = useState<Address>({ 
        id: '', 
        label: 'Alamat Saya', 
        fullAddress: '', 
        contactName: '-', 
        contactPhone: '-', 
        isPrimary: false,
        lat: undefined,
        lng: undefined
    });

    const resetForm = () => {
        setFormData({ id: '', label: '', fullAddress: '', contactName: '-', contactPhone: '-', isPrimary: false, lat: undefined, lng: undefined });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setFormData(prev => ({ ...prev, fullAddress: data.display_name, lat, lng }));
            } else {
                setFormData(prev => ({ ...prev, fullAddress: `Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng }));
            }
        } catch (error) {
            setFormData(prev => ({ ...prev, fullAddress: `Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng }));
        }
    };

    const handleMapMoveEnd = (lat: number, lng: number) => {
        if (isProgrammaticMove.current) {
            isProgrammaticMove.current = false;
            return;
        }
        
        // Prevent reverse geocoding if the map is at the default Jakarta center on initialization
        // unless it's an explicit move. We check if coordinates are the default ones.
        if (lat === -6.200000 && lng === 106.816666 && formData.fullAddress === '') {
            return;
        }
        
        reverseGeocode(lat, lng);
    };

    const handleRefreshMap = async () => {
        if (!formData.fullAddress) return;
        
        // Forward geocoding to find lat/lng from address text
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.fullAddress)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                isProgrammaticMove.current = true;
                setMapCenter([lat, lng]);
                setFormData(prev => ({ ...prev, lat, lng }));
            } else {
                alert("Alamat tidak ditemukan di peta.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        }
    };

    const handleUseMyLocation = (autoFill = false) => {
        if (!navigator.geolocation) {
            if (!autoFill) alert("Browser Anda tidak mendukung fitur lokasi.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                isProgrammaticMove.current = true;
                setMapCenter([latitude, longitude]);
                await reverseGeocode(latitude, longitude);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                
                let errorMsg = "Gagal mendapatkan lokasi.";
                if (error.code === 1) { // PERMISSION_DENIED
                    errorMsg += " Izin lokasi ditolak. Silakan aktifkan izin lokasi di pengaturan browser Anda (klik ikon kunci/gembok dekat URL).";
                } else if (error.code === 2) { // POSITION_UNAVAILABLE
                    errorMsg += " Posisi tidak tersedia.";
                } else if (error.code === 3) { // TIMEOUT
                    errorMsg += " Waktu permintaan habis.";
                } else {
                    errorMsg += " Pastikan izin lokasi diberikan.";
                }
                
                if (!autoFill) alert(errorMsg);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleEditClick = (addr: Address) => {
        setFormData(addr);
        if (addr.lat && addr.lng) {
            isProgrammaticMove.current = true;
            setMapCenter([addr.lat, addr.lng]);
        }
        setEditingId(addr.id);
        setIsFormOpen(true);
    };

    const handleAddClick = () => {
        setFormData({ id: '', label: '', fullAddress: '', contactName: '-', contactPhone: '-', isPrimary: addresses.length === 0 });
        setEditingId(null);
        setIsFormOpen(true);
        isProgrammaticMove.current = true; // Prevent initial Jakarta center from reverse geocoding
        handleUseMyLocation(true); // Auto-locate on open
    };

    const handleFillFromProfile = () => {
        if (!currentUser) return;
        setFormData(prev => ({
            ...prev,
            contactName: currentUser.name || prev.contactName,
            contactPhone: currentUser.phone || prev.contactPhone
        }));
    };

    const handleSave = async () => {
        if (!formData.fullAddress) return alert("Mohon isi alamat lengkap");
        
        setIsSaving(true);
        try {
            // Use formData.id as a more reliable indicator for existing addresses
            if (formData.id && (editingId || formData.id) && onUpdateAddress) {
                await onUpdateAddress(formData);
            } else {
                // Ensure we're not sending an ID when adding a new one
                const { id, ...addrWithoutId } = formData;
                await onAddAddress(addrWithoutId as Address);
            }
            resetForm();
        } catch (e) {
            console.error("Save address error:", e);
            alert("Gagal menyimpan alamat. Silakan coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };

    const setAsPrimary = async (addr: Address) => {
        if(onUpdateAddress) {
            await onUpdateAddress({...addr, isPrimary: true});
        }
    };

    return (
        <div className="p-4 md:p-6 bg-[#FDFBF7] dark:bg-[#0C0A09] min-h-screen animate-in fade-in text-stone-900 dark:text-stone-200 transition-colors duration-300">
            {isFormOpen ? (
                <div className="bg-white dark:bg-[#1C1917] p-6 rounded-3xl border border-stone-200 dark:border-[#2C1810] space-y-6 shadow-xl relative">
                    <button onClick={resetForm} className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                    
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">{editingId ? 'Edit Alamat' : 'Tambah Alamat'}</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Map Embed */}
                        <div className="w-full h-56 bg-stone-100 dark:bg-[#0C0A09] rounded-3xl overflow-hidden border border-stone-200 dark:border-[#292524] relative group z-0">
                            <div className="w-full h-full dark:invert dark:hue-rotate-180">
                                <MapContainer center={mapCenter} zoom={16} zoomControl={false} className="w-full h-full z-0">
                                    <TileLayer 
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    />
                                    <MapUpdater center={mapCenter} />
                                    <MapEvents onMoveEnd={handleMapMoveEnd} />
                                </MapContainer>
                            </div>
                            
                            {/* Fixed center marker */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none drop-shadow-lg">
                                <div className="relative">
                                    <MapPin className="w-10 h-10 text-green-600 fill-green-100 -mt-5" />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/20 rounded-full blur-[1px]"></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleUseMyLocation()}
                                className="absolute bottom-4 right-4 z-10 p-3 bg-white dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 shadow-lg active:scale-90 transition-transform"
                                title="Gunakan Lokasi Saya"
                            >
                                <Navigation className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                            </button>
                        </div>

                        <div className="bg-stone-50 dark:bg-[#0C0A09] p-4 rounded-2xl border border-stone-200 dark:border-[#292524] space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Alamat Lengkap</label>
                                    <textarea 
                                        className="w-full bg-transparent border-0 text-stone-900 dark:text-white p-0 focus:ring-0 placeholder-stone-400 dark:placeholder-stone-600 transition-all text-sm font-bold leading-relaxed resize-none" 
                                        rows={3} 
                                        value={formData.fullAddress} 
                                        onChange={e => setFormData({...formData, fullAddress: e.target.value})}
                                        placeholder="Tuliskan nama jalan, nomor rumah, patokan, RT/RW..." 
                                    />
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            onClick={handleRefreshMap}
                                            className="px-6 py-1.5 rounded-full border border-green-600 text-green-600 text-xs font-bold hover:bg-green-50 transition-colors"
                                        >
                                            Cari
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nama Alamat <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                className="w-full bg-white dark:bg-[#1C1917] border-b-2 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white px-0 py-2 focus:outline-none focus:border-green-600 placeholder-stone-400 dark:placeholder-stone-600 transition-all text-base font-bold" 
                                value={formData.label} 
                                onChange={e => setFormData({...formData, label: e.target.value})}
                                placeholder={role === 'recipient' ? "Cth: Panti Asuhan Kasih Ibu" : "Cth: Toko Roti Berkah"} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nama Kontak <span className="text-red-500">*</span></label>
                                    {currentUser && (
                                        <button 
                                            type="button" 
                                            onClick={handleFillFromProfile}
                                            className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 hover:text-white uppercase tracking-wider bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-600 dark:hover:bg-orange-600 px-3 py-1.5 rounded-full transition-all border border-orange-100 dark:border-orange-900/50"
                                        >
                                            <User className="w-3 h-3" />
                                            Gunakan Data Profil Saya
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="text"
                                    className="w-full bg-white dark:bg-[#1C1917] border-b-2 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white px-0 py-2 focus:outline-none focus:border-green-600 placeholder-stone-400 dark:placeholder-stone-600 transition-all text-base font-bold" 
                                    value={formData.contactName} 
                                    onChange={e => setFormData({...formData, contactName: e.target.value})}
                                    placeholder="Cth: Bpk. Ahmad" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nomor Telepon <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    className="w-full bg-white dark:bg-[#1C1917] border-b-2 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white px-0 py-2 focus:outline-none focus:border-green-600 placeholder-stone-400 dark:placeholder-stone-600 transition-all text-base font-bold" 
                                    value={formData.contactPhone} 
                                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                    placeholder="Cth: 0812..." 
                                />
                            </div>
                        </div>
                        
                        <label className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-[#0C0A09] rounded-xl border border-stone-200 dark:border-[#292524] cursor-pointer hover:border-green-500/50 transition-all">
                            <input 
                                type="checkbox" 
                                checked={formData.isPrimary} 
                                onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 bg-white dark:bg-[#1C1917] border-stone-300 dark:border-stone-600"
                            />
                            <span className="text-sm text-stone-700 dark:text-stone-300 font-bold">Jadikan Lokasi Utama</span>
                        </label>
                    </div>

                    <div className="pt-4">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving} 
                            className="w-full h-14 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-black uppercase tracking-widest rounded-full hover:bg-stone-300 dark:hover:bg-stone-700 transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIMPAN'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                    {addresses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1C1917] rounded-3xl border border-dashed border-stone-200 dark:border-[#292524] shadow-sm">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-6 border border-red-100 dark:border-red-900/30">
                                <MapPin className="w-10 h-10 text-red-500" />
                            </div>
                            <p className="text-stone-900 dark:text-stone-300 text-lg font-bold">Belum ada lokasi tersimpan</p>
                            <p className="text-sm text-stone-500 mt-2 max-w-xs text-center px-4">Tambahkan lokasi untuk memudahkan transaksi donasi.</p>
                            
                            <Button 
                                variant="outline" 
                                className="mt-8 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white w-auto px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95 mx-auto" 
                                onClick={handleAddClick}
                            >
                                <Plus className="w-5 h-5 mr-2" /> Tambah Lokasi
                            </Button>
                        </div>
                    ) : (
                        <>
                            {addresses.map(addr => (
                                <div key={addr.id} className={`bg-white dark:bg-[#1C1917] p-5 rounded-2xl border transition-all relative group overflow-hidden shadow-sm hover:shadow-md ${addr.isPrimary ? 'border-orange-500 shadow-orange-500/10' : 'border-stone-200 dark:border-[#292524] hover:border-stone-300'}`}>
                                    {addr.isPrimary && (
                                        <div className="absolute top-0 right-0 bg-orange-500 text-white dark:text-[#291300] text-[9px] px-3 py-1 rounded-bl-xl font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                                            <Check className="w-3 h-3" /> Utama
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl shrink-0 ${addr.isPrimary ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-stone-100 dark:bg-[#0C0A09] text-stone-400 dark:text-stone-500'}`}>
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 pr-12">
                                            <p className="text-stone-900 dark:text-stone-100 text-sm font-bold mb-1">{addr.label}</p>
                                            <p className="text-stone-500 dark:text-stone-400 text-xs font-medium leading-relaxed mb-2">{addr.fullAddress}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-stone-100 dark:border-[#292524]">
                                        {!addr.isPrimary && (
                                            <button onClick={() => setAsPrimary(addr)} className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#292524] text-stone-500 dark:text-stone-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-[#2C1810] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                                                <Star className="w-3 h-3" /> Set Utama
                                            </button>
                                        )}
                                        <button onClick={() => handleEditClick(addr)} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                                            <Edit3 className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => onDeleteAddress && onDeleteAddress(addr.id)} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                                            <Trash2 className="w-3 h-3" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <Button 
                                onClick={handleAddClick}
                                className="w-full h-14 bg-white dark:bg-[#1C1917] border-2 border-dashed border-stone-300 dark:border-[#292524] hover:border-orange-500 hover:text-orange-600 text-stone-400 dark:text-stone-500 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-orange-50 dark:hover:bg-orange-900/10 transform hover:scale-[1.01]"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Tambah Lokasi Lain
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
