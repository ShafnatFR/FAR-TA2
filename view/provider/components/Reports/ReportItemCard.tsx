import React from 'react';
import { AlertTriangle, ShoppingBag, User, Calendar, Package, ChevronRight, MessageSquare } from 'lucide-react';
import { Report } from '../../../../types';

interface ReportItemCardProps {
    report: Report;
    onClick: () => void;
}

export const ReportItemCard: React.FC<ReportItemCardProps> = ({ report, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 p-5 md:p-6 shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col md:flex-row md:items-center gap-5"
        >
            {/* Urgent Indicator Stripe */}
            {report.isUrgent && (
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500"></div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className={`p-2 rounded-xl shrink-0 ${report.isUrgent ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10'}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight truncate group-hover:text-orange-600 transition-colors">
                                {report.title}
                            </h3>
                            {report.isUrgent && (
                                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/20">
                                    Urgent
                                </span>
                            )}
                            {report.status === 'new' && (
                                <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                                    New
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold text-xs mt-1">
                            <Package className="w-3.5 h-3.5" /> 
                            <span className="truncate">{report.foodName}</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed line-clamp-2 md:line-clamp-1 italic bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-100 dark:border-stone-800 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-300" />
                    "{report.description}"
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                            <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-stone-500 uppercase tracking-widest">ID: {report.orderId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                            <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-stone-500">{report.reporter}</span>
                    </div>
                </div>
            </div>

            {/* Right Side / Meta Info Area */}
            <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-800 md:pl-6 shrink-0">
                <div className="flex flex-col items-start md:items-end">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">TANGGAL LAPORAN</span>
                    <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {report.date}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                        report.status === 'resolved' 
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                    }`}>
                        {report.status}
                    </div>
                    <ChevronRight className="w-6 h-6 text-stone-300 group-hover:text-orange-500 transition-colors hidden md:block" />
                </div>
            </div>
        </div>
    );
};