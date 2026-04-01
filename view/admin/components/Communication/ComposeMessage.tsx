
import React from 'react';
import { Bold, Italic, List, Send } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

interface ComposeMessageProps {
    formData: { title: string, content: string, target: string, type: string };
    setFormData: React.Dispatch<React.SetStateAction<{ title: string, content: string, target: string, type: string }>>;
    onSend: () => Promise<void>;
    isSubmitting: boolean;
}

export const ComposeMessage: React.FC<ComposeMessageProps> = ({ formData, setFormData, onSend, isSubmitting }) => {
    const insertFormatting = (format: string) => {
        const textarea = document.getElementById('broadcast-content') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.content.substring(start, end);

        let formattedText = '';
        switch (format) {
            case 'bold': formattedText = `**${selectedText || 'teks tebal'}**`; break;
            case 'italic': formattedText = `_${selectedText || 'teks miring'}_`; break;
            case 'list': formattedText = `\n• ${selectedText || 'item list'}`; break;
        }

        const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
        setFormData({ ...formData, content: newContent });
    };

    return (
        <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-4">
                <Input
                    label="Judul Notifikasi"
                    placeholder="Contoh: Info Pemeliharaan Sistem"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Target Segmen</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { value: 'all', label: 'Semua', icon: '👥' },
                            { value: 'provider', label: 'Donatur', icon: '🏪' },
                            { value: 'volunteer', label: 'Relawan', icon: '🚴' },
                            { value: 'receiver', label: 'Penerima', icon: '👤' },
                            { value: 'admin', label: 'Admin', icon: '🛡️' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, target: opt.value })}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${formData.target === opt.value
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-600'
                                    : 'border-stone-100 dark:border-stone-800 text-stone-400 hover:border-stone-200'
                                    }`}
                            >
                                <div className="text-xl">{opt.icon}</div>
                                <p className="text-[9px] font-black uppercase tracking-tighter">{opt.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Tipe Pengumuman</label>
                    <div className="flex gap-2">
                        {[
                            { value: 'info', label: 'Informasi', color: 'blue' },
                            { value: 'success', label: 'Pembaruan', color: 'green' },
                            { value: 'warning', label: 'Pemberitahuan', color: 'orange' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: opt.value })}
                                className={`px-4 py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === opt.value
                                    ? opt.value === 'info' ? 'border-blue-500 bg-blue-50 text-blue-600' : 
                                      opt.value === 'success' ? 'border-green-500 bg-green-50 text-green-600' : 
                                      'border-orange-500 bg-orange-50 text-orange-600'
                                    : 'border-stone-100 dark:border-stone-800 text-stone-400 hover:border-stone-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1 px-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Konten Pesan</label>
                        <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200">
                            <button onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-white rounded transition-colors"><Bold className="w-3.5 h-3.5" /></button>
                            <button onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-white rounded transition-colors"><Italic className="w-3.5 h-3.5" /></button>
                            <button onClick={() => insertFormatting('list')} className="p-1.5 hover:bg-white rounded transition-colors"><List className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    <textarea
                        id="broadcast-content"
                        className="w-full h-48 p-5 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-[1.5rem] text-black dark:text-white font-medium text-sm leading-relaxed focus:outline-none focus:border-orange-500 transition-all resize-none shadow-inner"
                        placeholder="Tulis pesan anda disini..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-right">{formData.content.length} Karakter</p>
                </div>

                <Button 
                    onClick={onSend} 
                    disabled={isSubmitting || !formData.title || !formData.content}
                    className="h-14 font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 bg-gradient-to-r from-orange-700 to-amber-600"
                >
                    {isSubmitting ? 'MENGIRIM BROADCAST...' : <><Send className="w-5 h-5 mr-2" /> KIRIM BROADCAST SEKARANG</>}
                </Button>
            </div>
        </div>
    );
};
