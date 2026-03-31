import React, { useState } from 'react';
import { Megaphone, Smartphone, Tablet, Laptop, Eye } from 'lucide-react';
import { ComposeMessage } from './ComposeMessage';
import { BroadcastHistory } from './BroadcastHistory';
import { DevicePreview, DeviceType } from './DevicePreview';
import { BroadcastMessage, UserData } from '../../../../types';

interface CommunicationProps {
    broadcastMessages: BroadcastMessage[];
    setBroadcastMessages?: React.Dispatch<React.SetStateAction<BroadcastMessage[]>>;
    onRefresh?: () => void;
    currentUser?: UserData | null;
}

export const Communication: React.FC<CommunicationProps> = ({ broadcastMessages, setBroadcastMessages, onRefresh, currentUser }) => {
    const [broadcastTab, setBroadcastTab] = useState<'compose' | 'history'>('compose');
    const [previewDevice, setPreviewDevice] = useState<DeviceType>('phone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state lifted to share with live preview
    const [formData, setFormData] = useState<{
        title: string;
        content: string;
        target: BroadcastMessage['target'];
        type: NonNullable<BroadcastMessage['type']>;
    }>({
        title: '',
        content: '',
        target: 'all',
        type: 'info'
    });

    const handleSendBroadcast = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Judul dan isi pesan tidak boleh kosong');
            return;
        }

        setIsSubmitting(true);
        try {
            const { db } = await import('../../../../services/db');
            const newMsg = await db.sendBroadcast({
                id: '', // Will be set by DB
                title: formData.title,
                content: formData.content,
                target: formData.target,
                type: formData.type,
                status: 'sent',
                sentAt: 'Baru saja',
                readCount: 0
            }, currentUser);

            if (setBroadcastMessages) {
                setBroadcastMessages(prev => [newMsg, ...prev]);
            }
            if (onRefresh) onRefresh();

            setFormData({ title: '', content: '', target: 'all', type: 'info' });
            setBroadcastTab('history');
            alert('Pesan broadcast berhasil dikirim ke seluruh modul target!');
        } catch (err) {
            console.error("Broadcast failed:", err);
            alert("Gagal mengirim broadcast.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter leading-none">
                        <Megaphone className="w-8 h-8 text-orange-600" /> Komunikasi Broadcast
                    </h2>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-2 border-l-2 border-orange-500 pl-3">Pusat Notifikasi Masal</p>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
                
                {/* KOLOM KIRI: Manajemen Pesanan / Compose */}
                <div className="flex-1 w-full space-y-6">
                    <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-xl w-fit border border-stone-200 dark:border-stone-800 shadow-sm">
                        <button 
                            onClick={() => setBroadcastTab('compose')} 
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${broadcastTab === 'compose' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm' : 'text-stone-500'}`}
                        >
                            Tulis Pesan
                        </button>
                        <button 
                            onClick={() => setBroadcastTab('history')} 
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${broadcastTab === 'history' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm' : 'text-stone-500'}`}
                        >
                            Riwayat
                        </button>
                    </div>

                    {broadcastTab === 'compose' ? (
                        <div className="animate-in slide-in-from-left duration-500">
                             <ComposeMessage 
                                formData={formData} 
                                setFormData={setFormData} 
                                onSend={handleSendBroadcast} 
                                isSubmitting={isSubmitting} 
                             />
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-left duration-500">
                            <BroadcastHistory messages={broadcastMessages} />
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN: Live Device Preview */}
                <div className="w-full xl:w-[480px] sticky top-8 animate-in slide-in-from-right duration-500">
                    <div className="bg-stone-100 dark:bg-stone-900/40 rounded-[3rem] p-6 border border-stone-200 dark:border-stone-800 shadow-xl">
                        
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="font-black text-stone-800 dark:text-stone-200 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Eye className="w-4 h-4 text-orange-600" /> Live Preview
                            </h4>
                            
                            <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700 shadow-inner">
                                {[
                                    { id: 'phone', icon: Smartphone },
                                    { id: 'tablet', icon: Tablet },
                                    { id: 'laptop', icon: Laptop }
                                ].map(d => (
                                    <button 
                                        key={d.id} 
                                        onClick={() => setPreviewDevice(d.id as any)} 
                                        className={`p-2 rounded-lg transition-all ${previewDevice === d.id ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-md scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        <d.icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <DevicePreview 
                                device={previewDevice}
                                title={formData.title}
                                content={formData.content}
                                target={formData.target}
                            />
                        </div>

                        <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            <p className="text-[10px] text-orange-700 dark:text-orange-400 font-bold leading-relaxed text-center">
                                Tip: Preview ini bersifat real-time. Periksa tampilan notifikasi Anda sebelum melakukan pengiriman masal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};