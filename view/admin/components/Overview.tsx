
import React, { useMemo } from 'react';
import { Leaf, Users, Globe, AlertTriangle, Package, Truck, UserPlus, FileText, Megaphone, ArrowRight, Activity } from 'lucide-react';
import { ClaimHistoryItem, FoodItem, UserData } from '../../../types';

interface OverviewProps {
    onNavigate: (tab: string) => void;
    stats?: {
        usersCount: number;
        claimsCount: number;
        inventoryCount: number;
        reportsCount: number;
    };
    claims?: ClaimHistoryItem[];
    inventory?: FoodItem[];
    users?: UserData[];
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate, stats, claims = [], inventory = [], users = [] }) => {
  // Use passed stats or defaults
  const totalUsers = stats?.usersCount || 0;
  const totalClaims = stats?.claimsCount || 0;
  const totalInventory = stats?.inventoryCount || 0;
  const totalReports = stats?.reportsCount || 0;

  // Calculate some derived metrics based on input
  const co2Saved = (totalClaims * 2.5).toFixed(1); // 2.5kg per claim roughly

  const dashboardStats = [
    { label: "TOTAL PENYELAMATAN", value: `${totalClaims * 5} kg`, unit: "", subValue: `${totalClaims} Klaim`, trend: "up", icon: Leaf, color: "text-green-600", bg: "bg-green-100", target: 'impact' },
    { label: "KOMUNITAS AKTIF", value: `${totalUsers}`, unit: "User", subValue: "+Active", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-100", target: 'community' },
    { label: "JEJAK KARBON (C02)", value: `-${co2Saved}`, unit: "Kg", subValue: "-Est", trend: "down", icon: Globe, color: "text-teal-600", bg: "bg-teal-100", target: 'impact' },
    { label: "LAPORAN MASUK", value: `${totalReports}`, unit: "", subValue: "Need Action", trend: "neutral", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", target: 'moderation' }
  ];

  const quickActions = [
      { label: "Kelola User", icon: Users, color: "bg-blue-50 text-blue-600", desc: `${totalUsers} pengguna terdaftar`, target: 'community' },
      { label: "Laporan", icon: AlertTriangle, color: "bg-red-50 text-red-600", desc: `${totalReports} perlu tindakan`, target: 'moderation' },
      { label: "Broadcast", icon: Megaphone, color: "bg-purple-50 text-purple-600", desc: "Kirim notifikasi", target: 'communication' },
      { label: "CMS", icon: FileText, color: "bg-orange-50 text-orange-600", desc: "Edit konten", target: 'content' },
  ];

  // Helper date parser
  const parseDate = (dateStr?: string): Date => {
      if (!dateStr) return new Date(); // Fallback if undefined/missing
      // Handle "dd/mm/yyyy" or ISO strings
      if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? new Date() : d; // Fallback to now if invalid
  };

  const getTimeAgo = (date: Date) => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " tahun lalu";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " bulan lalu";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " hari lalu";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " jam lalu";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " menit lalu";
      return Math.floor(seconds) + " detik lalu";
  };

  // Generate Real-Time Activity Feed
  const recentActivities = useMemo(() => {
      let activities = [];

      // 1. Claims (Active/Completed)
      claims.forEach(c => {
          if (c.status === 'active' || c.status === 'completed') {
              activities.push({
                  id: `claim-${c.id}`,
                  text: `${c.providerName || 'Provider'} mendonasikan ${c.foodName}`, // Simplified for overview
                  desc: c.status === 'completed' ? 'Transaksi Selesai' : 'Klaim Baru Masuk',
                  date: parseDate(c.date),
                  icon: c.status === 'completed' ? Truck : Package,
                  color: c.status === 'completed' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
              });
          }
          if (c.isReported && c.reportId) { // Ensure report actually exists (not deleted from DB)
              activities.push({
                  id: `report-${c.reportId}`,
                  text: `Laporan: ${c.reportReason || 'Masalah'}`,
                  desc: `Pada pesanan ${c.foodName}`,
                  date: parseDate(c.date),
                  icon: AlertTriangle,
                  color: "bg-red-100 text-red-600"
              });
          }
      });

      // 2. Inventory (New Items)
      inventory.forEach(i => {
          activities.push({
              id: `inv-${i.id}`,
              text: `${i.providerName} menambah stok baru`,
              desc: `${i.name} (${i.quantity})`,
              date: parseDate(i.createdAt),
              icon: Package,
              color: "bg-orange-100 text-orange-600"
          });
      });

      // 3. New Users
      users.forEach(u => {
          activities.push({
              id: `user-${u.id}`,
              text: `User baru bergabung: ${u.name}`,
              desc: `Role: ${u.role}`,
              date: parseDate(u.joinDate),
              icon: UserPlus,
              color: "bg-purple-100 text-purple-600"
          });
      });

      // Sort Descending & Take top 6
      return activities
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 6);

  }, [claims, inventory, users]);

  return (
    <div className="space-y-8 animate-in fade-in">
       {/* Hero Banner */}
       <div className="bg-gradient-to-r from-[#E65100] to-[#FB8C00] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
             <h2 className="text-3xl font-black mb-3 tracking-tight">Halo, Admin!</h2>
             <p className="text-orange-50 font-medium text-lg leading-relaxed mb-8">Sistem berjalan optimal. Saat ini ada <strong className="bg-white/20 px-2 py-0.5 rounded text-white">{totalInventory}</strong> item donasi aktif tersedia.</p>
             <div className="flex gap-4">
                <button 
                    onClick={() => onNavigate('moderation')}
                    className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/20 flex items-center gap-2"
                >
                    Lihat Laporan <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onNavigate('distribution')}
                    className="bg-[#bf360c] hover:bg-[#a02c08] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2"
                >
                    Pantau Distribusi <Truck className="w-4 h-4" />
                </button>
             </div>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-20 -top-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-20 -bottom-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-2xl pointer-events-none"></div>
       </div>

       {/* Stats Cards (Clickable) */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, idx) => (
             <div 
                key={idx} 
                onClick={() => onNavigate(stat.target)}
                className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-all cursor-pointer group active:scale-95"
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color} ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    {stat.label} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black text-stone-900 dark:text-white">{stat.value}</span>
                    <span className="text-sm font-bold text-stone-500">{stat.unit}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${stat.trend === 'up' || stat.trend === 'neutral' ? 'bg-green-50 text-green-600' : 'bg-green-50 text-green-600'}`}>
                    {stat.subValue}
                </span>
             </div>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Real-time Activity Feed */}
           <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-500" /> Aktivitas Terbaru
                    </h3>
                    {/* Dummy filter for visual purpose */}
                    <span className="text-xs text-stone-400 font-medium">Real-time Feed</span>
                </div>
                
                {recentActivities.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-50">
                        <Activity className="w-12 h-12 text-stone-300 mb-2" />
                        <p className="text-sm font-bold text-stone-400">Belum ada aktivitas tercatat.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex gap-4 items-start animate-in slide-in-from-right duration-300">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.color}`}>
                                    <activity.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200 line-clamp-1">{activity.text}</p>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{activity.desc}</p>
                                    <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-bold">{getTimeAgo(activity.date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
           </div>

           {/* Quick Actions */}
           <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm h-full">
               <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-6">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-4">
                   {quickActions.map((action, idx) => (
                       <button 
                            key={idx} 
                            onClick={() => onNavigate(action.target)}
                            className="flex flex-col p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left group border border-transparent hover:border-stone-200 dark:hover:border-stone-600"
                        >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                               <action.icon className="w-5 h-5" />
                           </div>
                           <span className="font-bold text-stone-900 dark:text-white text-sm">{action.label}</span>
                           <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">{action.desc}</span>
                       </button>
                   ))}
               </div>
           </div>
       </div>
    </div>
  );
};
