
import React, { useEffect, useState } from 'react';
import { Leaf, Users, Globe, AlertTriangle, Package, Truck, UserPlus, FileText, Megaphone, ArrowRight, Activity, TrendingUp, TrendingDown, Clock, Crown, Loader2, RefreshCcw, Timer } from 'lucide-react';

interface AdminDashboardData {
    stats: {
        totalSavedKg: number;
        totalCo2Saved: number;
        uniqueBeneficiaries: number;
        completedClaims: number;
        totalClaims: number;
        activeInventory: number;
        totalUsers: number;
        pendingReports: number;
        totalReports: number;
    };
    usersByRole: { [key: string]: number };
    topDonors: {
        id: number;
        name: string;
        avatar: string | null;
        totalDonations: number;
        totalKg: number;
    }[];
    trend: {
        labels: string[];
        wasteSparkline: number[];
        co2Sparkline: number[];
        claimSparkline: number[];
        growthPercent: number | null;
    };
    expiringSoon: {
        id: number;
        name: string;
        expiryTime: string;
        qty: number;
        providerName: string;
    }[];
    recentActivities: {
        type: 'claim' | 'food' | 'user' | 'report';
        id: number;
        foodName: string;
        actorName: string;
        date: string;
        status: string;
        description: string;
    }[];
}

interface OverviewProps {
    onNavigate: (tab: string) => void;
    currentUser?: any;
}

// Mini sparkline bar chart for stat cards
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-[3px] h-8 mt-3">
            {data.map((val, idx) => (
                <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all duration-500 ${color} ${val > 0 ? 'opacity-60 hover:opacity-100' : 'opacity-15'}`}
                    style={{ height: `${Math.max((val / max) * 100, val > 0 ? 8 : 3)}%` }}
                />
            ))}
        </div>
    );
};

export const Overview: React.FC<OverviewProps> = ({ onNavigate, currentUser }) => {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const { db } = await import('../../../services/db');
            const result = await db.getAdminDashboard();
            setData(result);
        } catch (err: any) {
            console.error('[AdminDashboard] Fetch error:', err);
            setError(err.message || 'Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (isNaN(seconds) || seconds < 0) return 'Baru saja';
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
        return "Baru saja";
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'claim': return Truck;
            case 'food': return Package;
            case 'user': return UserPlus;
            case 'report': return AlertTriangle;
            default: return Activity;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'claim': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'food': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'user': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'report': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-stone-100 text-stone-600';
        }
    };

    const getExpiryUrgency = (expiryTime: string) => {
        const hoursLeft = Math.max(0, (new Date(expiryTime).getTime() - Date.now()) / (1000 * 60 * 60));
        if (hoursLeft < 3) return { label: `${Math.floor(hoursLeft * 60)}m`, color: 'text-red-600 bg-red-50' };
        if (hoursLeft < 12) return { label: `${Math.floor(hoursLeft)}j`, color: 'text-orange-600 bg-orange-50' };
        return { label: `${Math.floor(hoursLeft)}j`, color: 'text-yellow-600 bg-yellow-50' };
    };

    const getRoleLabel = (role: string) => {
        const map: { [k: string]: string } = { 
            individual_donor: 'Donatur (Individu)', 
            corporate_donor: 'Donatur (Korporat)', 
            recipient: 'Penerima', 
            volunteer: 'Relawan', 
            admin: 'Admin', 
            super_admin: 'Super Admin' 
        };
        return map[role] || role;
    };

    const getRoleColor = (role: string) => {
        const map: { [k: string]: string } = { 
            individual_donor: 'bg-blue-500', 
            corporate_donor: 'bg-blue-600', 
            recipient: 'bg-emerald-500', 
            volunteer: 'bg-orange-500', 
            admin: 'bg-purple-500', 
            super_admin: 'bg-red-500' 
        };
        return map[role] || 'bg-stone-500';
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                </div>
                <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">Memuat Dashboard...</p>
            </div>
        );
    }

    // Error State
    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">{error || 'Data tidak tersedia'}</p>
                <button onClick={fetchDashboard} className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
                    <RefreshCcw className="w-4 h-4" /> Coba Lagi
                </button>
            </div>
        );
    }

    const { stats, usersByRole, topDonors, trend, expiringSoon, recentActivities } = data;

    const dashboardStats = [
        {
            label: "TOTAL PENYELAMATAN", value: stats.totalSavedKg.toLocaleString('id-ID', { maximumFractionDigits: 1 }),
            unit: "kg", subValue: `${stats.completedClaims} Klaim Selesai`,
            trend: "up", icon: Leaf, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30",
            target: 'impact', sparkline: trend.wasteSparkline, sparkColor: 'bg-green-500'
        },
        {
            label: "KOMUNITAS AKTIF", value: `${stats.totalUsers}`,
            unit: "User", subValue: `${stats.activeInventory} Donasi Aktif`,
            trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30",
            target: 'community', sparkline: trend.claimSparkline, sparkColor: 'bg-blue-500'
        },
        {
            label: "JEJAK KARBON (CO₂)", value: `-${stats.totalCo2Saved.toLocaleString('id-ID', { maximumFractionDigits: 1 })}`,
            unit: "Kg", subValue: `~${(stats.totalCo2Saved / 20).toFixed(0)} Pohon`,
            trend: "down", icon: Globe, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/30",
            target: 'impact', sparkline: trend.co2Sparkline, sparkColor: 'bg-teal-500'
        },
        {
            label: "LAPORAN AKTIF", value: `${stats.pendingReports}`,
            unit: "", subValue: `${stats.totalReports} Total Laporan`,
            trend: stats.pendingReports > 0 ? "alert" : "neutral", icon: AlertTriangle,
            color: stats.pendingReports > 0 ? "text-red-600" : "text-stone-500",
            bg: stats.pendingReports > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-stone-100 dark:bg-stone-800",
            target: 'moderation', sparkline: [], sparkColor: ''
        }
    ];

    const quickActions = [
        { label: "Kelola User", icon: Users, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600", desc: `${stats.totalUsers} pengguna terdaftar`, target: 'community' },
        { label: "Laporan", icon: AlertTriangle, color: "bg-red-50 dark:bg-red-900/20 text-red-600", desc: `${stats.pendingReports} perlu tindakan`, target: 'moderation' },
        { label: "Broadcast", icon: Megaphone, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600", desc: "Kirim notifikasi", target: 'communication' },
        { label: "CMS", icon: FileText, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-600", desc: "Edit konten", target: 'content' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-[#E65100] to-[#FB8C00] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-black mb-3 tracking-tight">Halo, Admin!</h2>
                    <p className="text-orange-50 font-medium text-lg leading-relaxed mb-2">Sistem berjalan optimal. Saat ini ada <strong className="bg-white/20 px-2 py-0.5 rounded text-white">{stats.activeInventory}</strong> item donasi aktif tersedia.</p>
                    {trend.growthPercent !== null && (
                        <div className="flex items-center gap-2 mb-6">
                            {trend.growthPercent >= 0 ? (
                                <span className="flex items-center gap-1 text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-bold">
                                    <TrendingUp className="w-4 h-4" /> +{trend.growthPercent}% dari minggu lalu
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-bold">
                                    <TrendingDown className="w-4 h-4" /> {trend.growthPercent}% dari minggu lalu
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
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
                        <button
                            onClick={fetchDashboard}
                            className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-4 py-3 rounded-xl transition-all border border-white/10 flex items-center gap-2"
                            title="Refresh Dashboard"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {/* Decorative */}
                <div className="absolute -right-20 -top-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-20 -bottom-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => onNavigate(stat.target)}
                        className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-all cursor-pointer group active:scale-[0.97]"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color} ${stat.bg} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            {stat.trend === 'alert' && stats.pendingReports > 0 && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                </span>
                            )}
                        </div>
                        <h3 className="text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            {stat.label} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                        </h3>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-black text-stone-900 dark:text-white">{stat.value}</span>
                            <span className="text-sm font-bold text-stone-400">{stat.unit}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                            {stat.subValue}
                        </span>
                        {stat.sparkline.length > 0 && (
                            <Sparkline data={stat.sparkline} color={stat.sparkColor} />
                        )}
                    </div>
                ))}
            </div>

            {/* Main Grid: Activities + Quick Actions + Top Donors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Activity Feed */}
                <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-orange-500" /> Aktivitas Terbaru
                        </h3>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live dari Database
                        </span>
                    </div>

                    {recentActivities.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-50">
                            <Activity className="w-12 h-12 text-stone-300 mb-2" />
                            <p className="text-sm font-bold text-stone-400">Belum ada aktivitas tercatat di database.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivities.map((activity, idx) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div key={`${activity.type}-${activity.id}-${idx}`} className="flex gap-4 items-start group/item hover:bg-stone-50 dark:hover:bg-stone-800/30 p-3 -mx-3 rounded-2xl transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.type)} transition-transform group-hover/item:scale-110`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-stone-800 dark:text-stone-200 line-clamp-1">
                                                {activity.type === 'claim' && `${activity.actorName} → ${activity.foodName}`}
                                                {activity.type === 'food' && `${activity.actorName} menambah stok: ${activity.foodName}`}
                                                {activity.type === 'user' && `User baru: ${activity.actorName}`}
                                                {activity.type === 'report' && `Laporan: ${activity.foodName}`}
                                            </p>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{activity.description}</p>
                                        </div>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold whitespace-nowrap shrink-0 pt-1">
                                            {getTimeAgo(activity.date)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-4 uppercase tracking-wider">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onNavigate(action.target)}
                                    className="flex flex-col p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left group/btn border border-transparent hover:border-stone-200 dark:hover:border-stone-600"
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${action.color} group-hover/btn:scale-110 transition-transform shadow-sm`}>
                                        <action.icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-stone-900 dark:text-white text-xs">{action.label}</span>
                                    <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">{action.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Top Donatur */}
                    {topDonors.length > 0 && (
                        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
                            <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Crown className="w-4 h-4 text-orange-500" /> Top Donatur
                            </h3>
                            <div className="space-y-3">
                                {topDonors.map((donor, idx) => (
                                    <div key={donor.id} className="flex items-center gap-3 group/donor">
                                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-orange-500 text-white' : idx === 1 ? 'bg-stone-300 text-stone-700' : 'bg-stone-200 text-stone-500'}`}>
                                            {idx + 1}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                                            {donor.avatar ? (
                                                <img src={donor.avatar} alt={donor.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-black text-stone-500">{donor.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{donor.name}</p>
                                            <p className="text-[10px] text-stone-400">{donor.totalDonations} donasi</p>
                                        </div>
                                        <span className="text-xs font-black text-green-600 whitespace-nowrap">{donor.totalKg} kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: User Distribution + Expiring Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Role Distribution */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> Distribusi Pengguna
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(usersByRole).map(([role, count]) => {
                            const percentage = stats.totalUsers > 0 ? ((count as number) / stats.totalUsers * 100).toFixed(0) : '0';
                            return (
                                <div key={role} className="group/role">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{getRoleLabel(role)}</span>
                                        <span className="text-xs font-bold text-stone-500">{count as number} <span className="text-stone-400">({percentage}%)</span></span>
                                    </div>
                                    <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getRoleColor(role)}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total</span>
                        <span className="text-lg font-black text-stone-900 dark:text-white">{stats.totalUsers} <span className="text-xs font-bold text-stone-400">User</span></span>
                    </div>
                </div>

                {/* Expiring Soon Alert */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                        <Timer className="w-4 h-4 text-orange-500" /> Segera Kedaluwarsa
                        {expiringSoon.length > 0 && (
                            <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-black">{expiringSoon.length} ITEM</span>
                        )}
                    </h3>
                    {expiringSoon.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400">
                            <Package className="w-10 h-10 mb-2 opacity-30" />
                            <p className="text-xs font-bold uppercase tracking-widest">Tidak ada item yang akan kedaluwarsa dalam 24 jam</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {expiringSoon.map(item => {
                                const urgency = getExpiryUrgency(item.expiryTime);
                                return (
                                    <div key={item.id} className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors">
                                        <div className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black ${urgency.color} flex items-center gap-1`}>
                                            <Clock className="w-3 h-3" /> {urgency.label}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{item.name}</p>
                                            <p className="text-[10px] text-stone-400">{item.providerName} • {item.qty} porsi</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
