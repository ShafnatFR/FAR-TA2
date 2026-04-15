
import React, { useState } from 'react';
import { Trophy, TrendingUp, Flame, Gift, CheckCircle, Award, MapPin, Clock, Info, X, Target, Zap, BarChart3, ChevronDown, ChevronUp, Medal } from 'lucide-react';
import { RankLevel, DailyQuest } from '../../../types';
import { SOCIAL_SYSTEM, ACHIEVEMENT_BADGES } from '../../../constants';
import { CounterUp } from '../../components/CounterUp';

interface StatsDashboardProps {
    stats: {
        points: number;
        missionsCompleted: number;
        totalDistance: number;
        hoursContributed: number;
        currentRank: string;
        nextRank: string;
        progressToNext: number;
        weeklyActivity: number[];
    };
    ranks: RankLevel[];
    quests: DailyQuest[];
    isLoading?: boolean;
    socialSystem?: any;
}

const ActivityChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  const days = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];
  
  return (
    <div className="flex items-end gap-3 h-32 mt-6 pt-6 border-t border-stone-100">
      {data.map((val, idx) => (
        <div key={idx} className="flex-1 flex flex-col justify-end group relative h-full">
           <div className="relative w-full flex-1 flex items-end">
              <div 
                className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-500 hover:to-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]" 
                style={{ height: `${(val / max) * 100}%`, minHeight: '4px' }}
              ></div>
           </div>
           <p className="text-[10px] font-black text-center text-stone-400 group-hover:text-orange-500 mt-2 transition-colors">{days[idx]}</p>
        </div>
      ))}
    </div>
  );
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, quests, isLoading, socialSystem }) => {
  const [showRankDetails, setShowRankDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const volunteerSystem = socialSystem?.volunteer || SOCIAL_SYSTEM.volunteer;
  const currentRankObj = volunteerSystem.tiers.slice().reverse().find((t: any) => stats.points >= t.minPoints) || volunteerSystem.tiers[0];
  const nextRankObj = volunteerSystem.tiers.find((t: any) => t.minPoints > stats.points);
  const progressToNext = nextRankObj 
    ? Math.min(((stats.points - currentRankObj.minPoints) / (nextRankObj.minPoints - currentRankObj.minPoints)) * 100, 100)
    : 100;

  // Hitung Badge yang sudah didapat
  const unlockedBadgesCount = ACHIEVEMENT_BADGES.filter(b =>
    (b.role === 'volunteer' || b.role === 'all') && stats.points >= b.minPoints
  ).length;
  const totalBadges = ACHIEVEMENT_BADGES.filter(b => b.role === 'volunteer' || b.role === 'all').length;

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 min-h-[300px] animate-in fade-in">
            <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-stone-100 dark:border-stone-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Memuat Dashboard...</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">Sinkronisasi statistik terbaru Anda.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6 pb-8 transition-all duration-500 animate-in fade-in">
       
       {/* Dropdown Header */}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between gap-2 px-1 focus:outline-none group"
       >
          <div className="flex items-center gap-2">
             <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-5 h-5 text-orange-600" />
             </div>
             <h2 className="text-lg font-black uppercase tracking-tighter text-stone-900 dark:text-white text-left">Statistik & Misi Harian</h2>
          </div>
          <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-orange-100 text-orange-600 rotate-180' : 'text-stone-400 hover:bg-stone-100'}`}>
             <ChevronDown className="w-5 h-5" />
          </div>
       </button>

       {/* Dropdown Content */}
       <div className={`space-y-6 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          
          {/* URUTAN 1 & 2: Rank & Badge Count (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Current Status Card (Rank) */}
              <div className="bg-white rounded-3xl p-6 text-stone-900 border border-orange-100 shadow-lg relative overflow-hidden group h-full flex flex-col justify-between">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"></div>
                 
                 <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm text-3xl">
                          {currentRankObj.icon}
                       </div>
                       <div>
                          <p className="text-orange-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Peringkat Anda</p>
                          <h2 className="text-xl font-black tracking-tight leading-tight uppercase text-stone-900">{currentRankObj.name}</h2>
                       </div>
                    </div>
                    <button onClick={() => setShowRankDetails(true)} className="p-2 bg-stone-50 rounded-xl border border-stone-200 text-stone-400 hover:text-orange-500 transition-colors">
                      <Info className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="relative z-10">
                    <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                       <span className="text-stone-400">Berikutnya: <span className="text-stone-700">{nextRankObj?.name || 'MAX'}</span></span>
                       <span className="text-orange-600">{Math.round(progressToNext)}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
                       <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-1000 shadow-sm" style={{width: `${progressToNext}%`}}></div>
                    </div>
                 </div>
              </div>

              {/* 2. Badge Count Card */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transform scale-150 transition-transform group-hover:scale-125">
                      <Medal className="w-32 h-32 text-orange-500" />
                  </div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl">
                              <Award className="w-6 h-6" />
                          </div>
                          <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Koleksi Badge</h3>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-black text-stone-900"><CounterUp end={unlockedBadgesCount} /></span>
                          <span className="text-sm font-bold text-stone-400">/ {totalBadges} Terbuka</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-2 font-medium">Terus selesaikan misi untuk membuka lebih banyak pencapaian!</p>
                  </div>
              </div>
          </div>

          {/* URUTAN 3: Daily Quests */}
          <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-black text-stone-800 text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" /> Misi Harian Relawan
                 </h3>
                 <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-widest">Reset: 08:32:10</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {quests.map(quest => (
                    <div key={quest.id} className={`group border rounded-[1.5rem] p-5 relative overflow-hidden transition-all duration-500 ${quest.completed ? 'bg-orange-50/50 border-orange-200' : 'bg-stone-50/30 border-stone-100 hover:border-orange-200'}`}>
                       <div className="flex justify-between items-start mb-4 relative z-10">
                          <div>
                             <h4 className={`font-black text-xs uppercase tracking-wider mb-1 ${quest.completed ? 'text-orange-600' : 'text-stone-700'}`}>{quest.title}</h4>
                             <span className="text-[10px] font-bold text-stone-400">{quest.current}/{quest.target} Tercapai</span>
                          </div>
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 shadow-sm transition-all ${quest.completed ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-100'}`}>
                             <Gift className="w-3 h-3" /> +{quest.reward}
                          </div>
                       </div>
                       <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden relative z-10">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${quest.completed ? 'bg-orange-500' : 'bg-stone-300'}`} style={{ width: `${Math.min((quest.current / quest.target) * 100, 100)}%` }}></div>
                       </div>
                       {quest.completed && <div className="absolute inset-0 bg-orange-500/[0.02] animate-pulse pointer-events-none"></div>}
                    </div>
                 ))}
              </div>
          </div>

          {/* URUTAN 4: Chart & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="font-black uppercase tracking-widest text-stone-500 text-xs flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" /> Intensitas Mingguan
                       </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-stone-900"><CounterUp end={stats.weeklyActivity.reduce((a, b) => a + b, 0)} /></span>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Misi Selesai</p>
                    </div>
                 </div>
                 <ActivityChart data={stats.weeklyActivity} />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                  {[
                      { icon: Award, label: "Total Poin", value: stats.points, color: "text-orange-600", bg: "bg-orange-50" },
                      { icon: CheckCircle, label: "Misi Selesai", value: stats.missionsCompleted, color: "text-blue-600", bg: "bg-blue-50" },
                      { icon: MapPin, label: "KM Jarak", value: stats.totalDistance, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { icon: Clock, label: "Jam Kontribusi", value: stats.hoursContributed, color: "text-amber-600", bg: "bg-amber-50" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-4 md:p-5 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center text-center group hover:border-orange-200 transition-all duration-300 justify-center">
                       <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} mb-3 group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-5 h-5" />
                       </div>
                       <span className="text-xl font-black text-stone-900 mb-1 leading-none">
                         <CounterUp end={item.value} decimals={idx === 2 ? 1 : 0} />
                       </span>
                       <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                  ))}
              </div>
          </div>

       </div>

       {showRankDetails && (
        <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-lg max-h-[85vh] flex flex-col relative shadow-2xl overflow-hidden border border-stone-200">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter italic">Hierarchy of Honor</h3>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mt-1">Level Pengabdian Sosial</p>
                </div>
                <button onClick={() => setShowRankDetails(false)} className="p-3 bg-white rounded-2xl text-stone-400 hover:text-stone-900 transition-colors border border-stone-200">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(volunteerSystem.tiers || []).map((rank: any) => {
                    const isCurrent = rank.name === currentRankObj.name;
                    const isPassed = stats.points >= rank.minPoints;
                    
                    return (
                    <div key={rank.id} className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 ${
                        isCurrent 
                            ? 'bg-orange-50 border-orange-300 shadow-md scale-[1.02] z-10' 
                            : isPassed
                                ? 'bg-stone-50 border-stone-100 opacity-80'
                                : 'bg-white border-stone-50 opacity-40'
                        }`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                            isCurrent 
                                ? 'bg-white text-orange-600 border border-orange-200' 
                                : 'bg-stone-100 text-stone-400 border border-stone-200'
                        }`}>
                        {rank.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${isCurrent ? 'text-stone-900' : 'text-stone-500'}`}>
                                {rank.name}
                                {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-ping"></div>}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {rank.benefits.map((b,i) => <span key={i} className="text-[8px] font-black uppercase tracking-widest bg-stone-200/50 px-2 py-1 rounded-md text-stone-500">{b}</span>)}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-xs font-black block ${isCurrent ? 'text-orange-600' : 'text-stone-300'}`}>{rank.minPoints.toLocaleString()}</span>
                            <span className="text-[9px] font-black text-stone-300 uppercase">PTS</span>
                        </div>
                    </div>
                    );
                })}
            </div>
            
            <div className="p-8 border-t border-stone-100 bg-stone-50/80">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Poin Saat Ini:</span>
                    <span className="font-black text-stone-900 text-2xl tracking-tighter">{stats.points.toLocaleString()} <span className="text-xs text-orange-600">PTS</span></span>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
