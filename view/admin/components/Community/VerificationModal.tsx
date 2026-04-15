
import React from 'react';
import { X, Shield, Calendar, Mail, Phone, MapPin, ExternalLink, MessageCircle, Check } from 'lucide-react';
import { Button } from '../../../components/Button';
import { UserData } from '../../../../types';

interface VerificationModalProps {
    user: UserData;
    onClose: () => void;
    onProcess: (status: 'active' | 'suspended') => void;
    isProcessing: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ user, onClose, onProcess, isProcessing }) => {
    const handleWhatsAppChat = () => {
        let message = '';
        switch(user.role) {
            case 'individual_donor':
            case 'corporate_donor':
                message = `Halo ${user.name}, saya Admin dari Food AI Rescue. Saya ingin memverifikasi data usaha Anda untuk aktivasi akun Donatur. Apakah ada waktu untuk diskusi sebentar?`;
                break;
            case 'volunteer':
                message = `Halo ${user.name}, terima kasih telah mendaftar sebagai Relawan di Food AI Rescue. Saya ingin mengonfirmasi area jangkauan dan ketersediaan Anda sebelum mengaktifkan akun.`;
                break;
            case 'recipient':
                message = `Halo ${user.name}, kami telah menerima pendaftaran Anda sebagai Penerima Manfaat di Food AI Rescue. Kami perlu memverifikasi identitas Anda untuk keamanan komunitas.`;
                break;
            default:
                message = `Halo ${user.name}, verifikasi akun Food AI Rescue.`;
        }

        const encodedMessage = encodeURIComponent(message);
        const phone = user.phone || '6285215376975';
        
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const formatDateDisplay = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return <span className="font-bold text-stone-900 dark:text-white">{dateString}</span>;

        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        const h = String(hours).padStart(2, '0');

        return (
            <div className="flex items-center flex-wrap gap-x-2 font-bold text-stone-900 dark:text-white text-sm mt-0.5">
                <span>{`${d}/${m}/${y}`}</span>
                <span className="text-stone-400">-</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">{`${h}:${minutes}:${seconds}`}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                    ampm === 'PM' 
                    ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' 
                    : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                }`}>
                    {ampm}
                </span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-lg text-stone-900 dark:text-white uppercase tracking-tighter">Verifikasi {user.role}</h3>
                        <p className="text-xs text-stone-500">Tinjau data sebelum menyetujui akses.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-stone-200 dark:bg-stone-800 rounded-full hover:bg-stone-300 transition-colors">
                        <X className="w-5 h-5 text-stone-600 dark:text-white" />
                    </button>
                </div>

                {/* Body Content - Scrollable */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg ${
                            (user.role === 'individual_donor' || user.role === 'corporate_donor') ? 'bg-orange-600' : user.role === 'volunteer' ? 'bg-orange-500' : 'bg-orange-400'
                        }`}>
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-stone-900 dark:text-white leading-tight">{user.name}</h2>
                                {user.status === 'pending' && (
                                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg animate-bounce shadow-lg shadow-red-500/30 tracking-widest italic">NEW</span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-stone-500">{user.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Role</p>
                            <p className="font-bold text-stone-900 dark:text-white">{user.role}</p>
                        </div>
                        <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Bergabung</p>
                            {formatDateDisplay(user.joinDate)}
                        </div>
                        <div className="col-span-2 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                            <p className="font-bold text-stone-900 dark:text-white tracking-wider">{user.email}</p>
                        </div>
                        <div className="col-span-2 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Phone className="w-3 h-3" /> Kontak WhatsApp</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-black text-stone-600 shadow-sm">+62</span>
                                <p className="font-bold text-stone-900 dark:text-white tracking-wider">{user.phone?.startsWith('62') ? user.phone.substring(2) : user.phone || '85215376975'}</p>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Alamat Lengkap</p>
                            {user.address ? (
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.address!)}`, '_blank')}
                                    className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 flex justify-between items-center group hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-200 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-stone-700 rounded-full text-blue-500 shadow-sm">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-stone-900 dark:text-white text-sm line-clamp-1">{user.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                                        Buka Maps <ExternalLink className="w-3 h-3 ml-1" />
                                    </div>
                                </button>
                            ) : (
                                <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 font-bold text-stone-400 text-sm">
                                    Alamat belum diisi
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 shrink-0 relative z-20">
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            onClick={handleWhatsAppChat} 
                            className="h-12 bg-[#25D366] hover:bg-[#128C7E] text-white border-0 shadow-lg shadow-green-500/20 font-black uppercase tracking-widest rounded-2xl w-full"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" /> HUBUNGI WA
                        </Button>
                        
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onProcess('active'); }}
                            disabled={isProcessing}
                            className="h-12 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/20 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><Check className="w-4 h-4" /> ACC AKUN</>
                            )}
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => onProcess('suspended')}
                        disabled={isProcessing}
                        className="w-full mt-3 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors"
                    >
                        Tolak Pendaftaran
                    </button>
                </div>
            </div>
        </div>
    );
};