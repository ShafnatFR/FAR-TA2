
import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Activity, AlertCircle, Info, ShieldAlert, RefreshCw, User, Database, Terminal, Loader2, Download, Eye, X } from 'lucide-react';
import { db } from '../../../services/db';
import { SystemLog } from '../../../types';

export const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({ query: '', severity: 'all' });
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);
    
    // ... fetchLogs and downloadLogs stay the same ...
    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const data = await db.getSystemLogs();
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadLogs = () => {
        if (logs.length === 0) return;
        
        const headers = ["ID", "Waktu", "Aktor ID", "Aktor", "Aksi", "Detail", "Level"];
        
        const sanitize = (val: any) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
            return `"${str}"`;
        };

        const rows = logs.map(log => [
            sanitize(log.id),
            sanitize(new Date(log.created_at).toLocaleString('id-ID')),
            sanitize(log.actor_id),
            sanitize(log.actor_name || 'System'),
            sanitize(log.action),
            sanitize(log.details),
            sanitize(log.severity)
        ]);

        const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\r\n");
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredLogs = logs.filter(log => {
        const matchesQuery = !filter.query || 
            log.action.toLowerCase().includes(filter.query.toLowerCase()) ||
            log.actor_name.toLowerCase().includes(filter.query.toLowerCase()) ||
            log.details?.toLowerCase().includes(filter.query.toLowerCase());
        
        const matchesSeverity = filter.severity === 'all' || log.severity === filter.severity;
        
        return matchesQuery && matchesSeverity;
    });

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'warning': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'error': return <ShieldAlert className="w-3 h-3" />;
            case 'warning': return <AlertCircle className="w-3 h-3" />;
            default: return <Info className="w-3 h-3" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight italic leading-none">Log Aktivitas Sistem</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Database className="w-3 h-3" /> Audit Trail & History Pengamanan Data
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={downloadLogs}
                        disabled={logs.length === 0 || isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:active:scale-100"
                    >
                        <Download className="w-4 h-4" /> Download CSV
                    </button>

                    <button 
                        onClick={fetchLogs} 
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Refresh Logs</span>
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
                <div className="relative group md:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Cari aksi, aktor, atau detail log..."
                        value={filter.query}
                        onChange={(e) => setFilter({...filter, query: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-950/50 border border-stone-100 dark:border-stone-800 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={filter.severity}
                        onChange={(e) => setFilter({...filter, severity: e.target.value})}
                        className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-950/50 border border-stone-100 dark:border-stone-800 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Semua Level</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-stone-50/50 dark:bg-stone-950/50">
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800">Waktu</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800">Aktor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800">Aksi</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800">Detail</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Mengambil Data Log...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-stone-400">
                                            <Terminal className="w-10 h-10 opacity-20" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Tidak ada log yang ditemukan</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-stone-400" />
                                                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-tighter">
                                                    {new Date(log.created_at).toLocaleString('id-ID', { hour12: false })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500">
                                                    <User className="w-3 h-3" />
                                                </div>
                                                <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">{log.actor_name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-orange-500" />
                                                <span className="text-xs font-bold text-stone-900 dark:text-white capitalize">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed truncate max-w-[200px]">{log.details}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-500 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-300">
                        <header className="p-8 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase italic leading-none">Detail Aktivitas</h3>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">ID Log: #{selectedLog.id}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl hover:bg-stone-100 transition-all active:scale-90"
                            >
                                <X className="w-5 h-5 text-stone-500" />
                            </button>
                        </header>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 dark:bg-stone-950/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Aktor</span>
                                    <p className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">{selectedLog.actor_name}</p>
                                    <span className="text-[8px] text-stone-500">ID: {selectedLog.actor_id}</span>
                                </div>
                                <div className="p-4 bg-stone-50 dark:bg-stone-950/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Waktu</span>
                                    <p className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                        {new Date(selectedLog.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                    <span className="text-[8px] text-stone-500">
                                        {new Date(selectedLog.created_at).toLocaleTimeString('id-ID', { hour12: false })} WIB
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Tindakan</span>
                                <div className="flex items-center gap-2 text-stone-900 dark:text-white">
                                    <Activity className="w-4 h-4 text-orange-500" />
                                    <p className="font-bold text-lg">{selectedLog.action}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-stone-50 dark:bg-stone-950/50 rounded-[2rem] border border-stone-100 dark:border-stone-800">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">Detail Perubahan</span>
                                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 leading-relaxed italic">
                                    "{selectedLog.details}"
                                </p>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${getSeverityStyles(selectedLog.severity)}`}>
                                <div className="flex items-center gap-2">
                                    {getSeverityIcon(selectedLog.severity)}
                                    <span className="text-[10px] font-black uppercase tracking-widest">Level Urgensi</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest underline decoration-2">{selectedLog.severity}</span>
                            </div>
                        </div>

                        <footer className="p-8 bg-stone-50 dark:bg-stone-950/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-800 transition-all active:scale-95"
                            >
                                Tutup
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};
