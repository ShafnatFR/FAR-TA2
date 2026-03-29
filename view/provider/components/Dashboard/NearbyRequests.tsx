
import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, ArrowUpRight, Loader2, Sparkles, MapPin } from 'lucide-react';
import { db } from '../../../../services/db';

interface FoodRequest {
    id: string;
    title: string;
    description: string;
    neededQuantity: number;
    receiverName: string;
    receiverAvatar?: string;
    postedDate: string;
}

export const NearbyRequests: React.FC = () => {
    const [requests, setRequests] = useState<FoodRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await db.getFoodRequests(); // Get all active requests
                setRequests(data.slice(0, 3)); // Only show top 3 on dashboard
            } catch (e) {
                console.error("Failed to fetch nearby requests:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded"></div>
                <div className="h-24 bg-stone-100 dark:bg-stone-900 rounded-2xl"></div>
            </div>
        );
    }

    if (requests.length === 0) return null;

    return (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    Permintaan Sekitar
                </h3>
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg">
                    {requests.length} AKTIF
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {requests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm hover:border-blue-500/30 transition-all group flex items-start gap-4 cursor-pointer active:scale-[0.98]">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                    {req.title}
                                </h4>
                                <ArrowUpRight className="w-3 h-3 text-stone-300 group-hover:text-blue-500 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                            
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5 leading-relaxed">
                                {req.description}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 text-[8px] font-black text-stone-400 uppercase tracking-widest bg-stone-50 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                                    <MapPin className="w-2.5 h-2.5 text-blue-500" />
                                    {req.receiverName}
                                </div>
                                <div className="flex items-center gap-1 text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(req.postedDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
