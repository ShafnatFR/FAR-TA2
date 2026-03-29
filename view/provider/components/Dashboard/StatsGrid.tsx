
import React, { useState, useEffect } from 'react';
import { Leaf, X, HelpCircle, Sparkles } from 'lucide-react';
import { db } from '../../../../services/db';

// Dynamic Bar Chart with flexible labels
const SimpleBarChart = ({ data, labels, colorClass }: { data: number[], labels: string[], colorClass: string }) => {
    const max = Math.max(...data, 1);
  
    return (
      <div className="space-y-1 mt-2">
        <div className="flex items-end gap-[3px] h-14 px-0.5">
          {data.map((val, idx) => {
            const heightPercent = Math.max((val / max) * 100, 5);
            return (
                <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                  <div 
                      className={`w-full rounded-t-sm transition-all duration-700 ease-out ${colorClass}`} 
                      style={{ height: `${heightPercent}%` }}
                  ></div>
                </div>
            );
          })}
        </div>
        <div className="flex items-center gap-[3px] px-0.5">
          {labels.map((label, i) => (
            <span key={i} className="flex-1 text-center text-[6px] md:text-[8px] font-black text-stone-400 uppercase truncate">
              {label}
            </span>
          ))}
        </div>
      </div>
    );
};

type PeriodFilter = '7d' | '30d' | '12m';

interface StatsGridProps {
    stats: {
        totalPoints: number;
        totalPotentialPoints: number;
    };
    userId: string; // NEW: userId to fetch chart data
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, userId }) => {
    const [infoModalType, setInfoModalType] = useState<'social' | 'co2' | null>(null);
    const [period, setPeriod] = useState<PeriodFilter>('7d');
    const [chartData, setChartData] = useState<{ labels: string[], pointsData: number[], impactData: number[] }>({
        labels: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        pointsData: [0, 0, 0, 0, 0, 0, 0],
        impactData: [0, 0, 0, 0, 0, 0, 0]
    });
    const [isChartLoading, setIsChartLoading] = useState(true);

    // Fetch chart data from backend whenever userId or period changes
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        const fetchChart = async () => {
            setIsChartLoading(true);
            try {
                const result = await db.getImpactChart(userId, period);
                if (!cancelled) {
                    setChartData(result);
                }
            } catch (e) {
                console.error('Failed to fetch chart data:', e);
            } finally {
                if (!cancelled) setIsChartLoading(false);
            }
        };
        fetchChart();
        return () => { cancelled = true; };
    }, [userId, period]);

    const periodLabels: Record<PeriodFilter, string> = { '7d': '7 Hari', '30d': '30 Hari', '12m': '12 Bulan' };

    const renderInfoContent = () => {
        if (infoModalType === 'social') {
            return {
                title: "Nilai Kebaikan Sosial",
                icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
                sections: [
                    { label: "Apa Arti Angka Ini?", text: "Ini bukan sekadar angka, tapi catatan amal kebaikan Bapak/Ibu. Setiap angka mewakili satu perut yang kenyang dan satu doa terima kasih dari mereka yang membutuhkan." },
                    { label: "Mengapa Sangat Berharga?", text: "Makanan yang Bapak/Ibu sisihkan menjadi rezeki bagi tetangga atau warga sekitar yang sedang kesulitan." },
                    { label: "Dampak Bagi Masyarakat", text: "Dengan berbagi, Bapak/Ibu ikut menjaga kerukunan warga. Tidak ada tetangga yang kelaparan." },
                    { label: "Semangat Berbagi", text: "Teruslah menebar kebaikan. Sekecil apapun makanan yang diselamatkan, sangat besar artinya bagi yang lapar." }
                ],
            };
        }
        return {
            title: "Kontribusi Menjaga Bumi",
            icon: <Leaf className="w-6 h-6 text-emerald-500" />,
            sections: [
                { label: "Apa Maksud Penyelamatan Ini?", text: "Ini adalah takaran seberapa besar peran Bapak/Ibu dalam merawat bumi agar tetap lestari." },
                { label: "Bahaya Membuang Makanan", text: "Makanan yang dibuang dan membusuk akan merusak lingkungan dan mempercepat perubahan iklim." },
                { label: "Tindakan Mulia Bapak/Ibu", text: "Dengan tidak membuang makanan, Bapak/Ibu mencegah kerusakan alam." },
                { label: "Warisan Untuk Anak Cucu", text: "Langkah ini menjaga bumi tetap sejuk untuk masa depan generasi selanjutnya." }
            ],
        };
    };

    const modalContent = renderInfoContent();

    // Filter Tabs Component
    const FilterTabs = () => (
        <div className="flex gap-1 mb-3">
            {(['7d', '30d', '12m'] as PeriodFilter[]).map(p => (
                <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-1.5 text-[8px] md:text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        period === p 
                            ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm' 
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600'
                    }`}
                >
                    {periodLabels[p]}
                </button>
            ))}
        </div>
    );

    return (
        <>
            {/* Filter Tabs - positioned above both cards */}
            <FilterTabs />

            <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Card: Total Poin Sosial (Nilai Kebaikan) */}
                <div className="bg-white dark:bg-stone-900 p-4 md:p-5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    
                    <button 
                        onClick={() => setInfoModalType('social')}
                        className="absolute top-3 right-3 z-20 text-stone-300 hover:text-indigo-500 transition-colors p-1"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-2 relative z-10 pr-6">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-tight leading-none">Total Nilai Kebaikan</span>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-1">
                            <p className="text-xl md:text-2xl font-black text-stone-900 dark:text-white tabular-nums">{stats.totalPoints.toLocaleString('id-ID')}</p>
                            <span className="text-[10px] font-black text-indigo-500 uppercase">Poin</span>
                        </div>
                        <p className="text-[9px] text-stone-400 font-bold mb-2">Tabungan Kebaikan</p>
                        
                        <div className="mt-1">
                            {isChartLoading ? (
                                <div className="h-14 bg-stone-50 dark:bg-stone-800 rounded-lg animate-pulse"></div>
                            ) : (
                                <SimpleBarChart 
                                    data={chartData.pointsData} 
                                    labels={chartData.labels} 
                                    colorClass="bg-indigo-500" 
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Card: Menjaga Bumi */}
                <div className="bg-white dark:bg-stone-900 p-4 md:p-5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    
                    <button 
                        onClick={() => setInfoModalType('co2')}
                        className="absolute top-3 right-3 z-20 text-stone-300 hover:text-emerald-500 transition-colors p-1"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-2 relative z-10 pr-6">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 shrink-0">
                            <Leaf className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-tight leading-none">Menjaga Bumi</span>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-1">
                            <p className="text-xl md:text-2xl font-black text-stone-900 dark:text-white tabular-nums">{stats.totalPotentialPoints.toLocaleString('id-ID')}</p>
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Poin</span>
                        </div>
                        <p className="text-[9px] text-stone-400 font-bold mb-2">Tidak Mubazir (Sayang Dibuang)</p>
                        
                        <div className="mt-1">
                            {isChartLoading ? (
                                <div className="h-14 bg-stone-50 dark:bg-stone-800 rounded-lg animate-pulse"></div>
                            ) : (
                                <SimpleBarChart 
                                    data={chartData.impactData} 
                                    labels={chartData.labels} 
                                    colorClass="bg-emerald-500" 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* INFO MODAL / BOTTOM SHEET */}
            {infoModalType && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInfoModalType(null)}></div>
                    <div className="bg-white dark:bg-stone-900 w-full md:max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-500">
                        
                        {/* Header */}
                        <div className={`p-6 md:p-8 pb-12 ${infoModalType === 'social' ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-stone-800 shadow-lg ${infoModalType === 'social' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                        {modalContent.icon}
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${infoModalType === 'social' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            Penjelasan Untuk Anda
                                        </p>
                                        <h3 className="text-2xl font-black text-stone-900 dark:text-white leading-none tracking-tight">{modalContent.title}</h3>
                                    </div>
                                </div>
                                <button onClick={() => setInfoModalType(null)} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors dark:bg-black/20 dark:hover:bg-black/40">
                                    <X className="w-5 h-5 text-stone-500" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 -mt-6 bg-white dark:bg-stone-900 rounded-t-[2rem] space-y-6">
                            {modalContent.sections.map((section, idx) => (
                                <div key={idx} className="relative pl-4 border-l-2 border-stone-100 dark:border-stone-800 hover:border-orange-200 transition-colors group">
                                    <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest mb-1 group-hover:text-orange-600 transition-colors">
                                        {section.label}
                                    </h4>
                                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                                        {section.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                            <button 
                                onClick={() => setInfoModalType(null)}
                                className="w-full py-4 rounded-2xl bg-stone-900 dark:bg-stone-800 text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-lg"
                            >
                                Saya Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
