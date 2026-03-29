
import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, Trash2, Loader2, AlertCircle, Sparkles, Send } from 'lucide-react';
import { db } from '../../../services/db';
import { UserData } from '../../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { EmptyState } from '../../common/EmptyState';

interface FoodRequest {
    id: string;
    title: string;
    description: string;
    neededQuantity: number;
    status: string;
    postedDate: string;
}

interface RequestManagerProps {
    currentUser: UserData | null;
    onBack: () => void;
}

export const RequestManager: React.FC<RequestManagerProps> = ({ currentUser, onBack }) => {
    const [requests, setRequests] = useState<FoodRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('1');

    const fetchMyRequests = async () => {
        if (!currentUser?.id) return;
        setIsLoading(true);
        try {
            const data = await db.getFoodRequests(currentUser.id);
            setRequests(data);
        } catch (e) {
            console.error("Failed to fetch requests:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, [currentUser?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.id) return;
        
        setIsSubmitting(true);
        try {
            await db.addFoodRequest({
                receiverId: currentUser.id,
                title,
                description,
                neededQuantity: parseInt(quantity)
            });
            setTitle('');
            setDescription('');
            setQuantity('1');
            setShowAddForm(false);
            fetchMyRequests();
        } catch (e) {
            console.error("Failed to add request:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Hapus permintaan ini?")) return;
        try {
            await db.deleteFoodRequest(id);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error("Failed to delete request:", e);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight uppercase italic flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-orange-500" />
                        Pusat Permintaan
                    </h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Sampaikan apa yang Anda atau komunitas butuhkan</p>
                </div>
                <button 
                    onClick={onBack}
                    className="text-xs font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
                >
                    Kembali
                </button>
            </header>

            {!showAddForm ? (
                <div className="space-y-6">
                    <Button 
                        onClick={() => setShowAddForm(true)}
                        className="w-full h-14 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Buat Permintaan Baru
                    </Button>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 px-1">Permintaan Aktif Anda</h3>
                        
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            </div>
                        ) : requests.length === 0 ? (
                            <EmptyState 
                                icon={MessageSquare}
                                title="Belum Ada Permintaan"
                                description="Anda belum membuat permintaan makanan apa pun saat ini."
                                actionLabel="Mulai Sekarang"
                                onAction={() => setShowAddForm(true)}
                            />
                        ) : (
                            requests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm relative group overflow-hidden">
                                     <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl ${req.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                        {req.status}
                                    </div>
                                    
                                    <h4 className="font-black text-stone-900 dark:text-white mb-1 group-hover:text-orange-500 transition-colors uppercase tracking-tight text-sm">{req.title}</h4>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 line-clamp-2 leading-relaxed">{req.description}</p>
                                    
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-lg">
                                                <Sparkles className="w-3 h-3 text-orange-500" />
                                                <span>BUTUH {req.neededQuantity} PORSI</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(req.postedDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleDelete(req.id)}
                                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="p-6 bg-stone-50 dark:bg-stone-900/50 rounded-[2rem] border border-stone-100 dark:border-stone-800 space-y-5">
                        <Input 
                            label="Judul Permintaan"
                            placeholder="Contoh: Butuh Nasi Box untuk Panti"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Detail Kebutuhan</label>
                             <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Jelaskan kebutuhan Anda secara spesifik (untuk siapa, kapan dibutuhkan, dll)..."
                                className="w-full min-h-[120px] p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-700 dark:text-stone-200 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none text-sm"
                                required
                             />
                        </div>

                        <Input 
                            label="Jumlah Porsi yang Dibutuhkan"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            type="button" 
                            onClick={() => setShowAddForm(false)} 
                            className="flex-1 h-14 bg-stone-100 dark:bg-stone-800 text-stone-500 font-black uppercase tracking-widest rounded-2xl"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] h-14 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/20 active:scale-95 btn-shine"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Publikasikan</>}
                        </Button>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                        <p className="text-[9px] text-orange-600 dark:text-orange-300 leading-normal font-bold">
                            Permintaan Anda akan dipublikasikan ke seluruh Donatur di platform. Pastikan informasi yang disampaikan akurat dan sopan.
                        </p>
                    </div>
                </form>
            )}
        </div>
    );
};
