
import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, Clock, Navigation, CheckCircle, Package, ChevronRight, PlayCircle, Bike, Car, Box, AlertTriangle, ShieldCheck, MessageCircle, Copy } from 'lucide-react';
import { Button } from '../../components/Button';
import { VolunteerTask } from '../../../types';

interface MissionDetailProps {
    task: VolunteerTask;
    onBack: () => void;
    onAccept?: () => void;
    volunteerName?: string;
}

export const MissionDetail: React.FC<MissionDetailProps> = ({ task, onBack, onAccept, volunteerName = "Relawan" }) => {
    const isLargeQuantity = task.quantity?.toLowerCase().includes('box') && parseInt(task.quantity) > 5;
    const vehicleRecommendation = isLargeQuantity ? 'Mobil' : 'Motor';

    const handleCopy = (text?: string) => {
        if (!text || text === "Alamat Donatur Tidak Ditemukan" || text === "Alamat Penerima Belum Diisi") return;
        navigator.clipboard.writeText(text);
        alert("Alamat berhasil disalin ke clipboard!");
    };

    const handleFullRoute = () => {
        if (!userLocation) {
            alert("Lokasi Anda belum terdeteksi. Pastikan GPS aktif.");
            return;
        }

        const donorQuery = task.donorLocation?.address && task.donorLocation.address !== "Lokasi tidak tersedia"
            ? encodeURIComponent(task.donorLocation.address)
            : task.donorLocation?.lat && task.donorLocation?.lng
                ? `${task.donorLocation.lat},${task.donorLocation.lng}`
                : "";

        const receiverQuery = task.receiverLocation?.address && task.receiverLocation.address !== "Lokasi tidak tersedia"
            ? encodeURIComponent(task.receiverLocation.address)
            : task.receiverLocation?.lat && task.receiverLocation?.lng
                ? `${task.receiverLocation.lat},${task.receiverLocation.lng}`
                : "";

        if (!donorQuery || !receiverQuery) {
            alert("Lokasi penjemputan atau pengantaran tidak valid.");
            return;
        }

        // Google Maps URL with waypoints
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${receiverQuery}&waypoints=${donorQuery}&travelmode=driving`;
        window.open(url, '_blank');
    };

    const handleContact = (phone: string | number | undefined, role: 'donor' | 'receiver') => {
        if (!phone || String(phone).length < 5) {
            alert(`Nomor telepon ${role === 'donor' ? 'Donatur' : 'Penerima'} tidak tersedia atau belum diisi.`);
            return;
        }

        const cleanPhone = String(phone).replace(/\D/g, '');
        // Format +62
        const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        let message = "";

        if (role === 'donor') {
            message = `Halo Kak *${task.from}*, saya *${volunteerName}* (Relawan Food AI Rescue).\n\n` +
                      `Saya akan menjemput donasi:\n` +
                      `ID: *#${task.id}*\n` +
                      `Menu: ${task.items}\n` +
                      `Tanggal: ${dateStr}\n\n` +
                      `Mohon kesediaannya. Terima kasih.`;
        } else {
            message = `Halo Kak *${task.to}*, saya *${volunteerName}* (Relawan Food AI Rescue).\n\n` +
                      `Saya sedang mengantar pesanan Anda:\n` +
                      `ID: *#${task.id}*\n` +
                      `Menu: ${task.items}\n` +
                      `Tanggal: ${dateStr}\n\n` +
                      `Mohon ditunggu di lokasi titik antar. Terima kasih.`;
        }

        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                    // Default to Monas if permission denied, just to show something or handle gracefully
                    // setUserLocation({ lat: -6.175392, lng: 106.827153 });
                }
            );
        }
    }, []);

    // Construct multi-point route: User -> Donor -> Receiver
    // Using legacy Google Maps Embed format with +to: for waypoints in daddr
    const donorQuery = task.donorLocation?.address && task.donorLocation.address !== "Lokasi tidak tersedia"
        ? encodeURIComponent(task.donorLocation.address)
        : task.donorLocation?.lat && task.donorLocation?.lng
            ? `${task.donorLocation.lat},${task.donorLocation.lng}`
            : "";

    const receiverQuery = task.receiverLocation?.address && task.receiverLocation.address !== "Lokasi tidak tersedia"
        ? encodeURIComponent(task.receiverLocation.address)
        : task.receiverLocation?.lat && task.receiverLocation?.lng
            ? `${task.receiverLocation.lat},${task.receiverLocation.lng}`
            : "";

    const mapUrl = userLocation && donorQuery && receiverQuery
        ? `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${donorQuery}+to:${receiverQuery}&dirflg=d&output=embed`
        : "";

    return (
        <div className="fixed inset-0 bg-[#FDFBF7] dark:bg-stone-950 z-[100] overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Header / Navbar */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 p-4 flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-stone-800 dark:text-white" />
                </button>
                <div>
                    <h2 className="font-black text-lg text-stone-900 dark:text-white leading-none">Detail Misi</h2>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">#{task.id}</p>
                </div>
            </div>

            <div className="p-6 pb-40 space-y-6 max-w-2xl mx-auto">
                
                {/* 2. Manifest Muatan (Detail Makanan) */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h3 className="font-black text-stone-900 dark:text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Box className="w-4 h-4 text-orange-500" /> Manifest Muatan
                    </h3>
                    
                    <div className="flex gap-4 items-start mb-6">
                        <img src={task.imageUrl} alt={task.items} className="w-20 h-20 rounded-2xl object-cover bg-stone-100" />
                        <div>
                            <h4 className="font-bold text-lg text-stone-900 dark:text-white leading-tight">{task.items}</h4>
                            <p className="text-sm text-stone-500 font-medium mt-1">{task.quantity}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Kondisi {task.foodCondition}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-100 dark:border-stone-800">
                        <p className="text-xs text-stone-500 leading-relaxed italic">
                            "{task.description}"
                        </p>
                        {task.ingredients && task.ingredients.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                                <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Kandungan Utama:</p>
                                <div className="flex flex-wrap gap-2">
                                    {task.ingredients.map((ing, i) => (
                                        <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Timeline Rute (Logistik) */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h3 className="font-black text-stone-900 dark:text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-orange-500" /> Rencana Perjalanan
                    </h3>
                    
                    <div className="relative pl-4 space-y-8 border-l-2 border-dashed border-stone-200 dark:border-stone-700 ml-2">
                        {/* Jemput */}
                        <div className="relative">
                            <div className="absolute -left-[23px] top-0 w-6 h-6 bg-orange-500 rounded-full border-4 border-white dark:border-stone-900 shadow-sm flex items-center justify-center text-[10px] text-white font-bold">1</div>
                            <div>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">TITIK PENJEMPUTAN</p>
                                <h4 className="font-bold text-stone-900 dark:text-white">{task.from}</h4>
                                <div className="flex items-start gap-2 mt-0.5">
                                    <p className="text-xs text-stone-500 flex-1 leading-relaxed">{task.donorLocation?.address}</p>
                                    <button 
                                        onClick={() => handleCopy(task.donorLocation?.address)}
                                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors shrink-0 active:scale-95"
                                        title="Salin Alamat Donatur"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded text-stone-600 dark:text-stone-400 font-bold flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Buka: {task.donorOpenHours}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Antar */}
                        <div className="relative">
                            <div className="absolute -left-[23px] top-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-stone-900 shadow-sm flex items-center justify-center text-[10px] text-white font-bold">2</div>
                            <div>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">TITIK PENGANTARAN</p>
                                <h4 className="font-bold text-stone-900 dark:text-white">{task.to}</h4>
                                <div className="flex items-start gap-2 mt-0.5">
                                    <p className="text-xs text-stone-500 flex-1 leading-relaxed">{task.receiverLocation?.address}</p>
                                    <button 
                                        onClick={() => handleCopy(task.receiverLocation?.address)}
                                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors shrink-0 active:scale-95"
                                        title="Salin Alamat Penerima"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 0. Embed Map Route */}
                <div className="w-full h-64 bg-stone-200 dark:bg-stone-800 rounded-[2rem] overflow-hidden shadow-sm border border-stone-200 dark:border-stone-800 relative">
                    {mapUrl ? (
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            scrolling="no" 
                            marginHeight={0} 
                            marginWidth={0} 
                            src={mapUrl}
                            className="w-full h-full"
                            title="Route Map"
                        ></iframe>
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-400 text-xs font-bold uppercase tracking-widest">
                            Memuat Peta...
                        </div>
                    )}
                    {/* Overlay Info Stage */}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5">
                            <Navigation className="w-3 h-3" />
                            {task.stage === 'pickup' || task.status === 'available' ? 'Rute Jemput' : 'Rute Antar'}
                        </p>
                    </div>
                </div>

                {/* 4. Action Buttons (Navigation & Chat) */}
                <div className="space-y-3">
                    {/* Navigation */}
                    <Button
                        onClick={handleFullRoute}
                        className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 border-0 flex items-center justify-center gap-2"
                    >
                        <Navigation className="w-5 h-5" /> LIHAT RUTE LENGKAP (3 TITIK)
                    </Button>

                    {/* Chat Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => handleContact(task.donorPhone, 'donor')}
                            className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                            <MessageCircle className="w-4 h-4 mr-2 text-green-600" /> Chat Donatur
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => handleContact(task.receiverPhone, 'receiver')}
                            className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                            <MessageCircle className="w-4 h-4 mr-2 text-green-600" /> Chat Penerima
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar (Fixed) */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-stone-800 z-[110] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-2xl mx-auto flex gap-4">
                    {task.status === 'available' ? (
                        <Button 
                            onClick={onAccept}
                            className="h-14 rounded-2xl text-base font-black uppercase tracking-widest bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-xl shadow-orange-900/30 border-0 flex-1"
                        >
                            <PlayCircle className="w-5 h-5 mr-2 fill-current" /> AMBIL MISI INI
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleFullRoute}
                            className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white shadow-lg border-0"
                        >
                            <Navigation className="w-5 h-5 mr-2" /> LIHAT RUTE LENGKAP
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
