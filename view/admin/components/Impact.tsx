
import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Leaf, Globe, Target, Calendar, Trees, Loader2, AlertTriangle, RefreshCcw, Edit2, Check, X, Info } from 'lucide-react';
import { Button } from '../../components/Button';
import { UserData } from '../../../types';

interface AdminTarget {
    metric_key: string;
    target_value: number;
    label: string;
}

interface ImpactChartData {
    labels: string[];
    wasteData: number[];
    socialData: number[];
    co2Data: number[];
}

interface DashboardStats {
    totalSavedKg: number;
    totalCo2Saved: number;
    uniqueBeneficiaries: number;
    completedClaims: number;
}

// Helper Chart Component
const AdminBarChart = ({ data, labels, colorClass, height = "h-40" }: { data: number[], labels: string[], colorClass: string, height?: string }) => {
    const max = Math.max(...data, 1);
    return (
      <div className={`flex items-end gap-2 ${height} mt-6 w-full px-2`}>
        {data.map((val, idx) => (
          <div key={idx} className="flex-1 flex flex-col justify-end group relative h-full">
            <div className="relative w-full flex-1 flex items-end">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-700 ${colorClass} ${val > 0 ? 'opacity-80' : 'opacity-20'} group-hover:opacity-100 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] origin-bottom`} 
                  style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? '6px' : '2px' }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                        {val.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                    </div>
                </div>
            </div>
            <p className="text-[8px] md:text-[9px] text-center text-stone-400 mt-2 font-black uppercase tracking-tighter truncate">{labels[idx]}</p>
          </div>
        ))}
      </div>
    );
};

interface ImpactProps {
    currentUser?: UserData | null;
}

export const Impact: React.FC<ImpactProps> = ({ currentUser }) => {
  const [filter, setFilter] = useState<string>('harian');
  const [chartData, setChartData] = useState<ImpactChartData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [targets, setTargets] = useState<AdminTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for target editing
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { db } = await import('../../../services/db');
      
      // Fetch everything in parallel
      const [impactRes, dashboardRes, targetsRes] = await Promise.all([
        db.getAdminImpact(filter),
        db.getAdminDashboard(),
        db.getAdminTargets()
      ]);

      setChartData(impactRes);
      setStats(dashboardRes.stats);
      setTargets(targetsRes);
    } catch (err: any) {
      console.error('[ImpactDashboard] Fetch error:', err);
      setError(err.message || 'Gagal memuat data dampak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleUpdateTarget = async (key: string) => {
    const val = parseFloat(tempValue);
    if (isNaN(val)) return;

    try {
      const { db } = await import('../../../services/db');
      await db.updateAdminTarget(key, val, currentUser);
      fetchData(); // Refresh to get updated targets/stats
      setTargets(prev => prev.map(t => t.metric_key === key ? { ...t, target_value: val } : t));
      setEditingTarget(null);
    } catch (err) {
      alert('Gagal mengupdate target');
    }
  };

  const currentTargetKg = targets.find(t => t.metric_key === 'waste_kg')?.target_value || 50000;
  const currentSavedKg = stats?.totalSavedKg || 0;
  const targetPercentage = Math.min(100, parseFloat(((currentSavedKg / currentTargetKg) * 100).toFixed(1)));
  
  const circumference = 351.8;
  const strokeOffset = circumference - (circumference * targetPercentage / 100);

  if (loading && !chartData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in">
            <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            <p className="text-xs font-black text-stone-500 uppercase tracking-widest">Menganalisis Data ESG...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in">
            <AlertTriangle className="w-12 h-12 text-red-600" />
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">{error}</p>
            <button onClick={fetchData} className="px-6 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" /> Coba Lagi
            </button>
        </div>
    );
  }

  return (
      <div className="space-y-8 animate-in fade-in pb-20 px-1">
          {/* Header & Filter */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                  <h2 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3 tracking-tighter italic uppercase">
                      <TrendingUp className="w-8 h-8 text-orange-600" /> Dashboard Dampak ESG
                  </h2>
                  <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mt-2 border-l-2 border-orange-500 pl-3">Agregasi Real-Time dari Database</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700">
                  {['harian', 'bulanan', 'tahunan'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            filter === t 
                            ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-sm' 
                            : 'text-stone-400 hover:text-stone-600'
                        }`}
                      >
                          {t}
                      </button>
                  ))}
              </div>
          </div>
          
          {/* Top Row: Primary Impacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Waste Reduction */}
              <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
                  <div>
                    <h3 className="font-black text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Leaf className="w-4 h-4 text-green-500" /> Food Rescue Efficiency</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-6xl font-black text-stone-900 dark:text-white tracking-tighter italic">{currentSavedKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                        <span className="text-xl font-bold text-stone-400 italic">kg</span>
                    </div>
                  </div>
                  <div className="mt-10">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                        <span>Tren Penyelamatan ({filter})</span>
                        <span className="text-green-500 font-bold">+{chartData?.wasteData.reduce((a,b)=>a+b, 0).toFixed(1)}kg Periode Ini</span>
                    </p>
                    {chartData && <AdminBarChart data={chartData.wasteData} labels={chartData.labels} colorClass="bg-green-500" />}
                  </div>
              </div>

              {/* Card 2: Social Reach */}
              <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div>
                      <h3 className="font-black text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" /> Community Outreach
                      </h3>
                      <div className="flex items-baseline gap-2">
                          <p className="text-6xl font-black text-stone-900 dark:text-white tracking-tighter italic">{stats?.uniqueBeneficiaries || 0}</p>
                          <span className="text-xl font-bold text-stone-400 italic">Instansi</span>
                      </div>
                  </div>
                  <div className="mt-10">
                      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>Aktivitas Donasi ({filter})</span>
                          <span className="text-blue-500 font-bold">{chartData?.socialData.reduce((a,b)=>a+b,0)} Transaksi</span>
                      </p>
                      {chartData && <AdminBarChart data={chartData.socialData} labels={chartData.labels} colorClass="bg-blue-500" />}
                  </div>
              </div>
          </div>

          {/* KPI Strategi Row */}
          <div className="bg-gradient-to-br from-[#0F0F0F] to-[#1A110D] rounded-[3rem] p-8 md:p-12 text-white shadow-3xl border border-white/5 relative overflow-hidden">
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-center relative z-10">
                   
                   {/* Left Column: Management */}
                   <div className="xl:col-span-4 space-y-8">
                       <div>
                           <span className="inline-block px-4 py-1.5 bg-orange-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl shadow-orange-900/40 font-mono">KPIS & TARGETS</span>
                           <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter italic leading-none">STRATEGI<br />CAPAIAN ESG</h3>
                           <p className="text-stone-400 text-sm leading-relaxed max-w-sm font-medium italic">"Menciptakan ekosistem sirkular melalui pemanfaatan surplus pangan yang terukur."</p>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-4">
                           {targets.map((target) => (
                               <div key={target.metric_key} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md flex items-center justify-between group/tile">
                                   <div>
                                       <p className="text-[9px] font-black text-stone-500 tracking-widest uppercase mb-1">{target.label}</p>
                                       {editingTarget === target.metric_key ? (
                                           <div className="flex items-center gap-2">
                                               <input 
                                                 type="number" 
                                                 value={tempValue} 
                                                 onChange={(e) => setTempValue(e.target.value)}
                                                 className="bg-white/10 border border-white/20 rounded px-2 py-1 text-lg font-black w-24 text-white focus:outline-none focus:ring-1 ring-orange-500"
                                                 autoFocus
                                               />
                                               <button onClick={() => handleUpdateTarget(target.metric_key)} className="p-1 bg-green-600 rounded-lg hover:bg-green-700"><Check className="w-4 h-4" /></button>
                                               <button onClick={() => setEditingTarget(null)} className="p-1 bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
                                           </div>
                                       ) : (
                                           <div className="flex items-center gap-3">
                                               <p className="text-2xl font-black italic text-white">
                                                   {target.target_value.toLocaleString('id-ID')} 
                                                   <span className="text-xs not-italic font-bold text-stone-500 ml-1">
                                                       {target.metric_key.includes('kg') ? 'KG' : 'USER'}
                                                   </span>
                                               </p>
                                               <button 
                                                 onClick={() => { setEditingTarget(target.metric_key); setTempValue(target.target_value.toString()); }}
                                                 className="opacity-0 group-hover/tile:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-lg hover:bg-white/10"
                                               >
                                                   <Edit2 className="w-3 h-3 text-stone-400" />
                                               </button>
                                           </div>
                                       )}
                                   </div>
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${target.metric_key === 'waste_kg' ? 'bg-orange-600' : 'bg-white/10 text-orange-500'}`}>
                                       {target.metric_key === 'waste_kg' ? <Target className="w-6 h-6" /> : target.metric_key === 'co2_kg' ? <Globe className="w-6 h-6" /> : <Trees className="w-6 h-6" />}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* Right Column: Visuals */}
                   <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/5 p-6 md:p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
                        
                        {/* Carbon Offsetting Chart */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Carbon Offsetting
                                    </h4>
                                    <p className="text-2xl font-black tracking-tight mt-1 italic">{(stats?.totalCo2Saved || 0).toFixed(1)} <span className="text-xs font-bold text-stone-500">KG CO2</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-400 italic">~{((stats?.totalCo2Saved || 0) / 20).toFixed(1)}</p>
                                    <p className="text-[8px] text-stone-500 font-black uppercase">Pohon Diselamatkan</p>
                                </div>
                            </div>
                            {chartData && <AdminBarChart data={chartData.co2Data} labels={chartData.labels} colorClass="bg-orange-600" height="h-32" />}
                            <div className="pt-2 flex items-center gap-2 text-[9px] text-stone-500 font-bold uppercase tracking-wider">
                                <Info className="w-3 h-3" /> Akumulasi jejak karbon tereduksi
                            </div>
                        </div>

                        {/* Zero Waste Progress Gauge */}
                        <div className="flex flex-col items-center justify-center border-l border-white/10 pl-0 md:pl-8">
                            <div className="w-56 h-56 relative animate-in zoom-in-75 duration-1000">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                                    <defs>
                                        <linearGradient id="gauge_grad_new" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#EA580C" />
                                            <stop offset="100%" stopColor="#FBBF24" />
                                        </linearGradient>
                                    </defs>
                                    <circle 
                                        cx="64" cy="64" r="56" 
                                        stroke="rgba(255,255,255,0.05)" 
                                        strokeWidth="8" 
                                        fill="transparent" 
                                    />
                                    <circle 
                                        cx="64" cy="64" r="56" 
                                        stroke="url(#gauge_grad_new)" 
                                        strokeWidth="10" 
                                        fill="transparent" 
                                        strokeDasharray={circumference} 
                                        strokeDashoffset={strokeOffset} 
                                        strokeLinecap="round" 
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-white italic tracking-tighter leading-none">{targetPercentage}%</span>
                                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-2 px-2 py-0.5 bg-orange-500/10 rounded">Progress Capaian</span>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                                <Trees className="w-3.5 h-3.5 text-green-500" /> Target: {currentTargetKg.toLocaleString('id-ID')} KG
                            </div>
                        </div>
                   </div>
               </div>

               {/* Decorative Background Glows */}
               <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
               <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[80px] pointer-events-none"></div>
          </div>
      </div>
  );
};
