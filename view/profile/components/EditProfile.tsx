
import React, { useState, useRef } from 'react';
import { User, Mail, Edit, Loader2, ChevronDown, ChevronUp, MapPin, Check, Info, AlertTriangle, Camera, Image, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { db } from '../../../services/db';
import { UserData, Address } from '../../../types';
import { ImageCropperModal } from '../../components/ImageCropperModal';

interface EditProfileProps {
    userData: UserData; 
    onSave: (data: UserData) => void;
    addresses?: Address[];
    onDirtyChange?: (isDirty: boolean) => void;
    triggerSave?: boolean;
}

export const EditProfile: React.FC<EditProfileProps> = ({ userData, onSave, addresses = [], onDirtyChange, triggerSave }) => {
    const [form, setForm] = useState<UserData>(userData);
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [matchingAddresses, setMatchingAddresses] = useState<Address[]>([]);
    // syncConfigs stores { [id]: { name: boolean, phone: boolean } }
    const [syncConfigs, setSyncConfigs] = useState<Record<number, { name: boolean; phone: boolean }>>({});
    const [expandedAddressId, setExpandedAddressId] = useState<number | null>(null);
    
    // Cropper state
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    // Avatar Selection state
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Webcam state and refs
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (onDirtyChange) {
            const isDirty = JSON.stringify(form) !== JSON.stringify(userData);
            onDirtyChange(isDirty);
        }
    }, [form, userData, onDirtyChange]);

    // Handle external save trigger
    React.useEffect(() => {
        if (triggerSave && !isSaving) {
            handleSave();
        }
    }, [triggerSave]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        // Auto format +62
        if (val.startsWith('62')) val = val.substring(2);
        if (val.startsWith('0')) val = val.substring(1);
        val = val.substring(0, 13);
        
        let formatted = val;
        // Simple visual formatting for UI only
        if (val.length > 3) formatted = val.substring(0, 3) + '-' + val.substring(3);
        if (val.length > 7) formatted = formatted.substring(0, 8) + '-' + val.substring(7);

        setPhoneError(val.length < 9 ? 'Nomor terlalu pendek' : '');
        setForm({ ...form, phone: formatted });
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setForm({...form, email: val});
        setEmailError(!val.includes('@') ? 'Format email salah' : '');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setIsCropperOpen(true);
                setIsAvatarModalOpen(false); // Close selection modal
            };
            reader.readAsDataURL(file);
        }
        // Reset input so the same file can be selected again if needed
        e.target.value = '';
    };

    const startWebcam = async () => {
        setIsAvatarModalOpen(false);
        setIsWebcamOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
            setIsWebcamOpen(false);
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsWebcamOpen(false);
    };

    const captureWebcam = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
            stopWebcam();
            setTempImage(imageDataUrl);
            setIsCropperOpen(true);
        }
    };

    const handleCropComplete = async (croppedBase64: string) => {
        setIsCropperOpen(false);
        // Only save to preview locally to prevent abandoning an uploaded image
        setForm({ ...form, avatar: croppedBase64 });
        setTempImage(null);
    };

    const handleSave = async (syncIds?: number[]) => {
        setIsSaving(true);
        try {
            const payload = { ...form };

            // 1. Upload pending avatar if preview is base64
            if (payload.avatar && payload.avatar.startsWith('data:image/')) {
                const filename = `avatar_${Date.now()}.jpg`;
                const url = await db.uploadImage(payload.avatar, filename, 'fotoProfil');
                payload.avatar = url;
                // update local state silently so it's not base64 anymore
                setForm(prev => ({ ...prev, avatar: url }));
            }

            if (payload.phone) {
                payload.phone = String(payload.phone).replace(/\D/g, '');
            }

            // Sync detection logic
            const oldName = userData.name;
            const oldPhone = String(userData.phone || '').replace(/\D/g, '');
            const newName = payload.name;
            const newPhone = payload.phone;

            const nameChanged = oldName !== newName;
            const phoneChanged = oldPhone !== newPhone;
            // If name/phone changed and we haven't shown modal yet
            if ((nameChanged || phoneChanged) && !syncIds && addresses.length > 0) {
                const matches = addresses.filter(addr => 
                    addr.contactName === oldName || 
                    String(addr.contactPhone || '').replace(/\D/g, '') === oldPhone
                );

                if (matches.length > 0) {
                    setMatchingAddresses(matches);
                    
                    // Initial config: only sync fields that actually matched the old value
                    const initialConfigs: Record<number, { name: boolean; phone: boolean }> = {};
                    matches.forEach(m => {
                        const id = Number(m.id);
                        initialConfigs[id] = {
                            name: m.contactName === oldName,
                            phone: String(m.contactPhone || '').replace(/\D/g, '') === oldPhone
                        };
                    });
                    setSyncConfigs(initialConfigs);
                    
                    setIsSyncModalOpen(true);
                    setIsSaving(false);
                    return;
                }
            }

            delete (payload as any).password;
            delete (payload as any).points;
            delete (payload as any).role;
            delete (payload as any).status;
            delete (payload as any).joinDate;

            if (payload.id) {
                // If syncIds provided from modal (selective sync), it's handled via syncConfigs now
                const finalPayload = syncIds ? { ...payload, syncConfigs } : payload;
                await db.upsertUser(finalPayload as any);
            }
            
            setIsSyncModalOpen(false);
            onSave(form); 
            alert("Profil berhasil diperbarui!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Gagal menyimpan perubahan ke server. Pastikan koneksi aman.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleField = (id: number, field: 'name' | 'phone') => {
        setSyncConfigs(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: !prev[id][field]
            }
        }));
    };

    const setBothFields = (id: number, val: boolean) => {
        setSyncConfigs(prev => ({
            ...prev,
            [id]: { name: val, phone: val }
        }));
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-8 animate-in fade-in">
            <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-stone-800 relative mb-4 ring-4 ring-orange-50 dark:ring-stone-800 group overflow-hidden">
                    <img src={form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`} className="w-full h-full rounded-full object-cover" alt="avatar" />
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                    <button 
                        onClick={() => !isUploading && setIsAvatarModalOpen(true)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-20 w-full h-full border-0"
                    >
                        <Edit className="w-6 h-6 text-white" />
                    </button>
                </div>
                <p className="text-sm text-stone-500">Ketuk atau arahkan ke foto untuk mengubah</p>
            </div>
            <div className="space-y-5">
                <Input 
                    label="Nama Lengkap" 
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})} 
                    icon={<User className="w-4 h-4" />} 
                    placeholder={
                        form.role === 'recipient' ? "Cth: Panti Asuhan Kasih Ibu" : 
                        form.role === 'provider' ? "Cth: Toko Roti Berkah" : 
                        "Contoh: Budi Santoso"
                    }
                />
                <Input label="Email Address" type="email" value={form.email} onChange={handleEmailChange} icon={<Mail className="w-4 h-4" />} error={emailError} />
                <Input label="Nomor Telepon" type="tel" value={form.phone} onChange={handlePhoneChange} leftAddon={<span className="text-stone-600 dark:text-stone-400">+62</span>} placeholder="8xx-xxxx-xxxx" error={phoneError} />
            </div>
            {/* UI Profile Editor ... (Existing code) */}
            <div className="pt-4">
                <Button onClick={() => handleSave()} disabled={!!phoneError || !!emailError || isUploading || isSaving}>
                    {isUploading ? 'Mengunggah Foto...' : isSaving ? 'Menyimpan ke Database...' : 'Simpan Perubahan'}
                </Button>
            </div>

            {/* SYNC SELECTION MODAL */}
            {isSyncModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-8 pb-4 text-center">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Sinkronisasi Alamat</h3>
                            <p className="text-stone-500 text-sm mt-2 font-medium">Kami mendeteksi beberapa alamat Anda menggunakan kontak profil lama. Ingin mengupdate mereka?</p>
                        </div>

                        {/* Address List */}
                        <div className="px-6 py-2 max-h-[350px] overflow-y-auto space-y-4">
                            {matchingAddresses.map(addr => {
                                const id = Number(addr.id);
                                const config = syncConfigs[id] || { name: false, phone: false };
                                const isSelected = config.name || config.phone;
                                const isExpanded = expandedAddressId === id;

                                return (
                                    <div 
                                        key={id}
                                        className={`group relative p-4 rounded-3xl border-2 transition-all ${
                                            isSelected 
                                            ? 'bg-green-50 dark:bg-green-900/10 border-green-500 shadow-md shadow-green-500/10' 
                                            : 'bg-stone-50 dark:bg-stone-800/50 border-transparent hover:border-stone-200 dark:hover:border-stone-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className={`mt-0.5 p-3 rounded-2xl ${isSelected ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'}`}>
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="pr-2">
                                                    <p className={`font-black uppercase tracking-widest text-[9px] ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-stone-500'}`}>{addr.label}</p>
                                                    <p className="text-sm font-black text-stone-900 dark:text-white mt-0.5 max-w-[180px] truncate leading-tight">{addr.fullAddress}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <button 
                                                    onClick={() => setBothFields(id, !isSelected)}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-green-600 border-green-600' : 'border-stone-300 dark:border-stone-600'}`}
                                                >
                                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </button>
                                                <button 
                                                    onClick={() => setExpandedAddressId(isExpanded ? null : id)}
                                                    className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40' : 'hover:bg-black/5 text-stone-400'}`}
                                                >
                                                    {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Granular Toggles & Detail */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 animate-in slide-in-from-top-2">
                                                {/* Field Selection Pills */}
                                                <div className="flex gap-2 mb-4">
                                                    {[
                                                        { label: 'Nama', field: 'name' as const },
                                                        { label: 'Telepon', field: 'phone' as const }
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.field}
                                                            onClick={() => toggleField(id, opt.field)}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                                config[opt.field] 
                                                                ? 'bg-green-600 border-green-600 text-white shadow-md' 
                                                                : 'border-stone-200 dark:border-stone-700 text-stone-400'
                                                            }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setBothFields(id, true)}
                                                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                            config.name && config.phone
                                                            ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                                                            : 'border-stone-200 dark:border-stone-700 text-stone-400'
                                                        }`}
                                                    >
                                                        Keduanya
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block pl-1">Data Lama</span>
                                                        <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl text-[11px] font-bold text-stone-600 dark:text-stone-400 space-y-1.5 border border-transparent">
                                                            <div className="flex items-center gap-2">
                                                                <span className="opacity-50">👤</span> {addr.contactName}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="opacity-50">📞</span> {addr.contactPhone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block pl-1">Data Baru</span>
                                                        <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-2xl text-[11px] font-bold text-orange-700 dark:text-orange-400 space-y-1.5 border border-orange-100 dark:border-orange-900/30">
                                                            <div className={`flex items-center gap-2 ${config.name ? 'text-green-600 dark:text-green-400' : 'opacity-40'}`}>
                                                                <span>👤</span> {config.name ? form.name : addr.contactName}
                                                            </div>
                                                            <div className={`flex items-center gap-2 ${config.phone ? 'text-green-600 dark:text-green-400' : 'opacity-40'}`}>
                                                                <span>📞</span> {config.phone ? form.phone : addr.contactPhone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-8 pt-6 grid grid-cols-2 gap-4 bg-stone-50 dark:bg-stone-800/20 border-t border-stone-100 dark:border-stone-800">
                            <button 
                                onClick={() => handleSave([])}
                                className="h-14 border-2 border-stone-200 dark:border-stone-700 text-stone-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
                            >
                                Abaikan
                            </button>
                            <button 
                                onClick={() => handleSave(Object.keys(syncConfigs).map(Number))}
                                className={`h-14 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 shadow-xl group ${
                                    (Object.values(syncConfigs) as {name:boolean, phone:boolean}[]).every(c => c.name && c.phone) 
                                    ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/30' 
                                    : 'bg-green-600 hover:bg-green-500 shadow-green-500/30'
                                }`}
                            >
                                {(Object.values(syncConfigs) as {name:boolean, phone:boolean}[]).every(c => c.name && c.phone) ? 'Ubah Semuanya' : 'Ubah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* IMAGE CROPPER MODAL */}
            {isCropperOpen && tempImage && (
                <ImageCropperModal 
                    image={tempImage} 
                    onCropComplete={handleCropComplete} 
                    onClose={() => {
                        setIsCropperOpen(false);
                        setTempImage(null);
                    }} 
                />
            )}
            {/* HIDDEN INPUTS FOR AVATAR */}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} disabled={isUploading} />

            {/* AVATAR SELECTION MODAL */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 md:bg-white dark:bg-stone-800/20">
                            <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Pilih Sumber Foto</h3>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-white p-2 bg-stone-100 dark:bg-stone-800 rounded-full transition-colors active:scale-95">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            <button 
                                onClick={startWebcam}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-active:scale-95 transition-transform">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className="font-bold text-stone-900 dark:text-white text-base">Ambil Foto</h4>
                                    <p className="text-xs text-stone-500 mt-0.5">Gunakan kamera perangkat</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-all group"
                            >
                                <div className="w-12 h-12 bg-stone-200 dark:bg-stone-700 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 shadow-sm group-active:scale-95 transition-transform">
                                    <Image className="w-6 h-6" />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className="font-bold text-stone-900 dark:text-white text-base">Pilih File</h4>
                                    <p className="text-xs text-stone-500 mt-0.5">Pilih dari galeri foto Anda</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* WEBCAM CAPTURE MODAL */}
            {isWebcamOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
                            <h3 className="text-white font-bold text-sm tracking-widest uppercase">Kamera Web</h3>
                            <button onClick={stopWebcam} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover rounded-t-3xl transform scale-x-[-1]" 
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="p-6 flex justify-center bg-stone-900">
                            <button 
                                onClick={captureWebcam}
                                className="w-16 h-16 rounded-full border-4 border-orange-500 flex items-center justify-center hover:bg-stone-800 transition-colors active:scale-95 group"
                            >
                                <div className="w-12 h-12 bg-orange-500 rounded-full group-hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
