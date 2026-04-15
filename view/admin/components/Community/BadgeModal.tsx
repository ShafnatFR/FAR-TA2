
import React, { useState, useEffect } from 'react';
import { X, Trash2, Upload } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Badge } from '../../../../types';

interface BadgeModalProps {
    badge: Badge;
    onClose: () => void;
    onSave: (badge: Badge) => void;
    onDelete: (id: string) => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ badge, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<Badge>(badge);
    const emojiList = ['🏆', '⭐', '🌟', '🔥', '💎', '🚀', '🌍', '❤️', '🍀', '👑', '🎯', '⚡', '🎖️', '🎗️', '🎨', '💡', '🌱', '🛡️', '🤝', '🎓', '🥇', '🥈', '🥉', '🎁'];

    useEffect(() => {
        setFormData(badge);
    }, [badge]);

    const handleSave = () => {
        if (!formData.name) return alert("Nama badge wajib diisi");
        onSave(formData);
    };

    const handleDelete = () => {
        if (confirm(`Hapus badge "${formData.name}"?`)) {
            onDelete(formData.id);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 relative flex flex-col max-h-[90vh] border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-black text-lg text-stone-900 dark:text-white italic uppercase tracking-tight">Konfigurasi Badge</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                    <Input label="NAMA PENGHARGAAN" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama Badge" labelClassName="font-black text-[9px] tracking-widest" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">TARGET ROLE</label>
                            <select value={formData.role || 'all'} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-bold text-[11px] focus:outline-none appearance-none transition-all shadow-sm">
                                <option value="all">Semua</option>
                                <option value="provider">Provider/Donatur</option>
                                <option value="volunteer">Volunteer/Relawan</option>
                                <option value="receiver">Receiver/Penerima</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">MINIMAL POIN</label>
                            <Input type="number" label="" placeholder="0" value={formData.minPoints} onChange={e => setFormData({ ...formData, minPoints: parseInt(e.target.value) || 0 })} className="h-10 font-black text-orange-600 text-xs shadow-sm" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">IKON VISUAL</label>
                        <div className="grid grid-cols-6 gap-1.5 p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200">
                            {emojiList.map(emoji => (
                                <button key={emoji} onClick={() => setFormData({ ...formData, icon: emoji })} className={`text-xl p-1 rounded-lg hover:bg-white transition-all transform hover:scale-110 ${formData.icon === emoji ? 'bg-white ring-1 ring-orange-500 scale-110 shadow-md' : 'opacity-30'}`}>{emoji}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">GAMBAR SAMPUL</label>
                        <div className="relative border-2 border-dashed border-stone-200 rounded-[1.25rem] p-1.5 overflow-hidden hover:border-orange-500 transition-all bg-stone-50/50 group h-28 flex flex-col items-center justify-center cursor-pointer">
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                                    <button onClick={() => setFormData({ ...formData, image: '' })} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[8px] font-black uppercase tracking-widest"><Trash2 className="w-4 h-4 mr-1" /> HAPUS</button>
                                </>
                            ) : (
                                <div className="text-center p-2"><Upload className="w-5 h-5 text-stone-400 mx-auto mb-1" /><p className="text-[8px] text-stone-500 font-black uppercase">PILIH GAMBAR</p></div>
                            )}
                            <input type="file" accept="image/*" className={`absolute inset-0 opacity-0 cursor-pointer ${formData.image ? 'pointer-events-none' : ''}`} onChange={e => {
                                if (e.target.files?.[0]) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
                                    reader.readAsDataURL(e.target.files[0]);
                                }
                            }} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800 mt-5 gap-2.5 shrink-0">
                    {formData.id && (
                        <button onClick={handleDelete} className="w-full sm:w-11 h-11 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all border border-red-100 shrink-0"><Trash2 className="w-5 h-5" /></button>
                    )}
                    <div className="flex w-full gap-2.5">
                        <Button variant="ghost" onClick={onClose} className="flex-1 h-11 font-black uppercase tracking-widest text-[9px] border border-stone-200">TUTUP</Button>
                        <Button onClick={handleSave} className="flex-1 h-11 font-black uppercase tracking-widest text-[9px] shadow-xl shadow-orange-500/30">SIMPAN BADGE</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
