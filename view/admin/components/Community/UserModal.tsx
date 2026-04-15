import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { UserData } from '../../../../types';

interface UserModalProps {
    user: UserData | null;
    onClose: () => void;
    onSave: (user: UserData) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<UserData>({
        id: 'new',
        name: '',
        email: '',
        role: 'volunteer',
        status: 'active',
        points: 0,
        joinDate: new Date().toLocaleDateString('en-CA'),
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 relative border border-white/10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"><X className="w-5 h-5" /></button>
                <h3 className="font-black text-lg text-stone-900 dark:text-white mb-6 italic uppercase tracking-tight leading-tight">{formData.id === 'new' ? 'Registrasi User' : 'Profil Manajemen'}</h3>
                <div className="space-y-4">
                    <Input label="NAMA LENGKAP" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama User" labelClassName="font-black text-[9px] tracking-widest" />
                    <Input label="ALAMAT EMAIL" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="nama@email.com" labelClassName="font-black text-[9px] tracking-widest" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">PERAN</label>
                            <select value={formData.role || 'volunteer'} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-bold text-[11px] focus:outline-none appearance-none shadow-sm transition-all">
                                <option value="individual_donor">Donatur Individu</option>
                                <option value="corporate_donor">Donatur Korporat</option>
                                <option value="volunteer">Relawan</option>
                                <option value="recipient">Penerima</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">STATUS</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-bold text-[11px] focus:outline-none appearance-none shadow-sm transition-all">
                                <option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <Input label="POIN / RANK EXP" type="number" value={formData.points?.toString() || '0'} onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })} placeholder="0" labelClassName="font-black text-[9px] tracking-widest" />
                    <div className="flex gap-2.5 mt-8">
                        <Button variant="ghost" onClick={onClose} className="h-10 font-black uppercase text-[9px] border border-stone-100 flex-1">BATAL</Button>
                        <Button onClick={handleSave} className="h-10 font-black uppercase text-[9px] shadow-xl shadow-orange-500/30 flex-1">SIMPAN DATA</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};