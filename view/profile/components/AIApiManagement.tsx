
import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, ShieldCheck, Zap, Info, AlertCircle, Loader2, Sparkles, Server } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { db } from '../../../services/db';
import { UserData } from '../../../types';

interface AIApiManagementProps {
    currentUser: UserData;
}

export const AIApiManagement: React.FC<AIApiManagementProps> = ({ currentUser }) => {
    const [keys, setKeys] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState({ label: '', key: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setIsLoading(true);
        try {
            const data = await db.getUserAIKeys(currentUser.id);
            setKeys(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddKey = async () => {
        if (!newKey.label || !newKey.key) {
            setError('Label dan API Key wajib diisi');
            return;
        }
        if (!newKey.key.startsWith('AIza')) {
            setError('Format Gemini API Key tidak valid (harus dimulai dengan AIza)');
            return;
        }

        setIsAdding(true);
        setError('');
        try {
            await db.addUserAIKey(currentUser.id, newKey.key, newKey.label);
            setNewKey({ label: '', key: '' });
            setIsAdding(false);
            fetchKeys();
        } catch (e: any) {
            setError(e.message || 'Gagal menyimpan API Key');
            setIsAdding(false);
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm('Hapus API Key ini? Fitur AI canggih mungkin tidak dapat digunakan jika Anda tidak memiliki key lain atau tidak berlangganan.')) return;
        try {
            await db.deleteUserAIKey(currentUser.id, id);
            fetchKeys();
        } catch (e) {
            alert('Gagal menghapus key');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Status Section */}
            <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-6 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all"></div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Status Layanan AI</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                currentUser.ai_subscription_status === 'SUBSCRIBER' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' 
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}>
                                {currentUser.ai_subscription_status === 'SUBSCRIBER' ? 'Paket Berlangganan' : 'Paket Gratis'}
                            </span>
                        </div>
                    </div>
                </div>

                {currentUser.ai_subscription_status === 'SUBSCRIBER' ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-2xl p-4 flex gap-3">
                        <Zap className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium leading-relaxed">
                            Anda memiliki akses premium. Sistem menggunakan <b>Dedicated Master Key</b> yang dikelola oleh Admin. Tidak perlu memasukkan API Key sendiri.
                        </p>
                    </div>
                ) : (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-2xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-orange-600 shrink-0" />
                        <p className="text-sm text-orange-800 dark:text-orange-300 font-medium leading-relaxed">
                            Akses AI terbatas pada validasi makanan. Untuk menggunakan fitur <b>Kreator Resep</b> dan <b>CSR Writer</b>, silakan masukkan API Key Gemini Anda sendiri di bawah ini.
                        </p>
                    </div>
                )}
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Kunci API Saya ({keys.length})</h3>
                </div>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Memuat Data...</span>
                    </div>
                ) : keys.length === 0 ? (
                    <div className="bg-stone-50 dark:bg-stone-900/50 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[2rem] p-10 text-center">
                        <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
                            <Key className="w-6 h-6" />
                        </div>
                        <h4 className="text-stone-900 dark:text-white font-bold uppercase text-xs tracking-widest">Belum Ada Key</h4>
                        <p className="text-stone-500 text-[10px] mt-2 max-w-[200px] mx-auto uppercase leading-tight font-black">Masukkan key Anda untuk membuka fitur AI lanjutan</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {keys.map((k) => (
                            <div key={k.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 flex items-center justify-between group hover:border-orange-200 dark:hover:border-orange-900/30 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 group-hover:text-orange-600 transition-colors">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-stone-900 dark:text-white tracking-tight">{k.label}</p>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Aktif sejak {new Date(k.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteKey(k.id)}
                                    className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add New Key Form */}
            <div className="bg-stone-900 dark:bg-orange-950/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400"></div>
                
                <h3 className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-3 mb-6">
                    <Plus className="w-5 h-5 text-orange-500" /> Tambah API Key Baru
                </h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Label / Nama Model</label>
                        <input 
                            type="text"
                            placeholder="Contoh: Gemini Pro - Utama"
                            value={newKey.label}
                            onChange={(e) => setNewKey({...newKey, label: e.target.value})}
                            className="w-full bg-stone-800 dark:bg-stone-900/50 border border-stone-700 dark:border-stone-800 text-white p-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Gemini API Key</label>
                        <input 
                            type="password"
                            placeholder="AIzaSy..."
                            value={newKey.key}
                            onChange={(e) => setNewKey({...newKey, key: e.target.value})}
                            className="w-full bg-stone-800 dark:bg-stone-900/50 border border-stone-700 dark:border-stone-800 text-white p-4 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <Button 
                        onClick={handleAddKey} 
                        isLoading={isAdding}
                        className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-950/40 mt-4 rounded-2xl"
                    >
                        Simpan Konfigurasi
                    </Button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-stone-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-500 shrink-0">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest">Kemandirian API</h4>
                        <p className="text-stone-500 text-[9px] font-bold mt-1 leading-relaxed">
                            Data API Key disimpan secara terenkripsi dan hanya digunakan untuk akun Anda. Menggunakan key pribadi membantu kami menjaga keberlanjutan platform Food AI Rescue.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
