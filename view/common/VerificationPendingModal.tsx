
import React from 'react';
import { ShieldAlert, MessageCircle, LogOut, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';

interface VerificationPendingModalProps {
  onLogout: () => void;
  onRefresh: () => void;
  userName?: string;
}

export const VerificationPendingModal: React.FC<VerificationPendingModalProps> = ({ onLogout, onRefresh, userName }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showStatusAlert, setShowStatusAlert] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh();
    
    // Give it some time to fetch and then show alert if still pending
    setTimeout(() => {
        setIsRefreshing(false);
        setShowStatusAlert(true);
    }, 2000);
  };

  const handleContactAdmin = () => {
    const adminNumber = "6285215376975"; // Nomor Super Admin
    const message = `Halo Admin Food AI Rescue,\n\nSaya pengguna baru dengan nama *${userName || 'User'}*.\nStatus akun saya masih *Pending*.\n\nMohon bantuannya untuk verifikasi akun saya agar bisa mulai berkontribusi. Terima kasih.`;
    
    window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#0F0502] flex items-center justify-center p-6 animate-in fade-in duration-500">
        {/* Background Ambience */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-700/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-sm bg-[#1C100B] border border-orange-900/30 rounded-[2.5rem] p-8 text-center relative shadow-2xl shadow-orange-900/20 overflow-hidden">
            
            {/* Top Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-amber-500"></div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-orange-500/30 relative">
                    <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping opacity-20"></div>
                    <ShieldAlert className="w-10 h-10 text-orange-500" />
                    <div className="absolute bottom-0 right-0 bg-[#1C100B] rounded-full p-1 border border-orange-900/30">
                        <Lock className="w-4 h-4 text-stone-400" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Verifikasi Diperlukan
                </h2>
                
                <div className="bg-orange-950/30 border border-orange-900/30 rounded-xl p-4 mb-6 w-full">
                    <p className="text-orange-200/80 text-xs font-medium leading-relaxed">
                        Halo <strong className="text-orange-500">{userName}</strong>, akun Anda sedang dalam antrean verifikasi Admin.
                    </p>
                    {showStatusAlert && (
                        <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/30 p-2 rounded-lg animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-[10px] font-bold text-red-500 text-left leading-tight">
                                Akun belum aktif. Segera hubungi admin untuk verifikasi.
                            </p>
                        </div>
                    )}
                    <p className="text-stone-500 text-[10px] mt-2 italic">
                        Semua fitur terkunci hingga akun diaktifkan.
                    </p>
                </div>

                <div className="flex gap-4 w-full">
                    <button 
                        onClick={handleRefresh}
                        className="h-12 w-12 shrink-0 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 flex items-center justify-center transition-all active:scale-95 group"
                        title="Perbarui Status"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                    <Button 
                        onClick={handleContactAdmin}
                        className="h-12 flex-1 rounded-2xl font-black uppercase tracking-widest bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-green-900/20 border-0 flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5 fill-current" /> Admin
                    </Button>
                </div>

                <button 
                    onClick={onLogout}
                    className="mt-6 text-stone-500 hover:text-stone-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors py-2"
                >
                    <LogOut className="w-4 h-4" /> Keluar Akun
                </button>
            </div>
        </div>
    </div>
  );
};
