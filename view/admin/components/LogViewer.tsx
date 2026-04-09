
import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Activity, AlertCircle, Info, ShieldAlert, RefreshCw, User, Database, Terminal } from 'lucide-react';
import { db } from '../../../services/db';
import { SystemLog } from '../../../types';

export const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({ query: '', severity: 'all' });

    useEffect(() => {
        fetchLogs();
    }, []);

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

    const filteredLogs = logs.filter(log => {
        const matchesQuery = !filter.query || 
            log.action.toLowerCase().includes(filter.query.toLowerCase()) ||
            log.actor_name.toLowerCase().includes(filter.query.toLowerCase()) ||
            log.details.toLowerCase().includes(filter.query.toLowerCase());
        
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight italic leading-none">Log Aktivitas Sistem</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Database className="w-3 h-3" /> Audit Trail & History Pengamanan Data
                    </p>
                </div>
                
                <button 
                    onClick={fetchLogs} 
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 transition-all active:scale-95 shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Refresh Logs</span>
                </button>
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
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800">Level</th>
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
                                            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed min-w-[200px] max-w-sm">{log.details}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getSeverityStyles(log.severity)}`}>
                                                {getSeverityIcon(log.severity)}
                                                {log.severity}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
