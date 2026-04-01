
import React, { useMemo } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, ArrowLeft, Megaphone, Sparkles, Package, Truck, Star, XCircle, PlayCircle } from 'lucide-react';
import { Notification, UserRole, ClaimHistoryItem, BroadcastMessage, FoodItem } from '../../types';
import { getDateTimeParts } from '../../utils/transformers';
import { SOCIAL_SYSTEM } from '../../constants';
import { db } from '../../services/db';

interface NotificationsPageProps {
  role: UserRole;
  onBack: () => void;
  userName?: string;
  notifications: Notification[];
  currentUserId?: string; 
  onRefresh?: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ role, onBack, userName, notifications = [], currentUserId, onRefresh }) => {
  
  const handleMarkAsRead = async (notifId: string) => {
    if (!currentUserId || !onRefresh) return;
    try {
        await db.markNotificationRead(currentUserId, notifId);
        onRefresh(); // Refresh global data
    } catch (error) {
        console.error("Gagal menandai baca:", error);
    }
  };

  const getIcon = (type: string, id: string) => {
    if (String(id).startsWith('broadcast-')) return <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg"><Megaphone className="w-5 h-5" /></div>;
    
    switch (type) {
      case 'success': return <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><CheckCircle className="w-5 h-5" /></div>;
      case 'warning': return <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><Info className="w-5 h-5" /></div>; 
      case 'error': return <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><XCircle className="w-5 h-5" /></div>;
      default: return <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Info className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-screen pb-24 animate-in slide-in-from-right">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm hover:bg-stone-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-stone-900 dark:text-white">Pusat Notifikasi</h1>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Halo, {userName || 'Pengguna'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 shadow-sm">{notifications.filter(n => !n.isRead).length} BARU</span>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-32">
              <Bell className="w-16 h-16 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 font-black uppercase text-xs tracking-[0.3em]">Tidak ada aktivitas baru</p>
          </div>
        ) : (
          notifications.map(notif => {
            const isBroadcast = String(notif.id).startsWith('broadcast-');
            const timeParts = getDateTimeParts(notif.date);

            return (
                <div 
                    key={notif.id} 
                    onClick={() => !notif.isRead && handleMarkAsRead(String(notif.id))}
                    className={`p-5 rounded-[2rem] border flex gap-4 transition-all duration-300 group cursor-pointer ${
                        notif.priority === 'high' ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 
                        notif.isRead ? 'bg-white dark:bg-stone-900 opacity-60' : 
                        isBroadcast ? 'bg-[#120D0A] border-orange-500/30 text-white' : 
                        'bg-white dark:bg-stone-900 border-stone-100 shadow-sm hover:shadow-md'
                    }`}
                >
                <div className="shrink-0">{getIcon(notif.type, String(notif.id))}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-black uppercase tracking-tight italic truncate ${isBroadcast ? 'text-orange-500' : 'text-stone-900 dark:text-white'}`}>{notif.title}</h4>
                        
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            {isBroadcast && <span className="text-[7px] font-black bg-orange-600 text-white px-1.5 py-0.5 rounded tracking-tighter">PENGUMUMAN</span>}
                            {notif.priority === 'high' && <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded tracking-tighter">PENTING</span>}
                        </div>
                    </div>
                    
                    <div className={`text-xs mt-1 leading-relaxed font-medium ${isBroadcast ? 'text-stone-300' : 'text-stone-600 dark:text-stone-400'}`}>
                        {notif.message}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                        {timeParts ? (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400">
                                <span>{timeParts.date}</span>
                                <span className="text-stone-300 mx-0.5">•</span>
                                <span>{timeParts.time}</span>
                            </div>
                        ) : (
                            <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{notif.date}</p>
                        )}
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-auto"></div>}
                    </div>
                </div>
                </div>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
          <div className="mt-12 p-6 bg-stone-100 dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-stone-800 text-center">
              <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">Terima kasih telah aktif di komunitas Food AI Rescue</p>
          </div>
      )}
    </div>
  );
};
