
import React from 'react';
import { Crown } from 'lucide-react';
import { LeaderboardItem } from '../../../types';

interface LeaderboardProps {
    data: LeaderboardItem[];
    mode?: 'live' | 'history';
    onToggleMode?: (mode: 'live' | 'history') => void;
    historicalData?: any[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
    data, 
    mode = 'live', 
    onToggleMode, 
    historicalData = [] 
}) => {
    const isLive = mode === 'live';
    const displayData = isLive ? data : historicalData.map(h => ({
        id: h.user_id,
        name: h.name,
        points: h.points,
        rank: h.rank,
        avatar: h.avatar
    }));

    const top1 = displayData.find(i => i.rank === 1);
    const top2 = displayData.find(i => i.rank === 2);
    const top3 = displayData.find(i => i.rank === 3);
    const others = displayData.filter(i => i.rank > 3);

    return (
        <div className="space-y-4">
             {/* Orange Podium Card */}
             <div className="bg-[#EF6C00] rounded-[2rem] p-6 text-white text-center shadow-lg relative overflow-hidden">
                {/* Header */}
                <div className="mb-10">
                    <h2 className="flex items-center justify-center gap-2 text-xl font-extrabold tracking-tight">
                        <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Papan Peringkat
                    </h2>
                    <p className="text-sm font-medium opacity-90">{isLive ? 'Relawan terbaik saat ini' : 'Arsip Juara di masa lalu'}</p>

                    {/* Toggle Buttons */}
                    <div className="flex bg-black/20 p-1 rounded-xl mt-4 w-fit mx-auto border border-white/10">
                        <button 
                            onClick={() => onToggleMode?.('live')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-white text-orange-600 shadow-md' : 'text-white/60 hover:text-white'}`}
                        >
                            Live
                        </button>
                        <button 
                            onClick={() => onToggleMode?.('history')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isLive ? 'bg-white text-orange-600 shadow-md' : 'text-white/60 hover:text-white'}`}
                        >
                            Sejarah
                        </button>
                    </div>
                </div>
                
                {/* Podium Grid */}
                <div className="flex items-end justify-center gap-2 md:gap-4 px-2 pb-2">
                    
                    {/* Rank 2 - Left */}
                    <div className="flex flex-col items-center flex-1 max-w-[100px] animate-in slide-in-from-bottom-8 duration-700">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-blue-200 bg-orange-400/50 backdrop-blur-md mb-3 flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden">
                            {top2?.avatar?.startsWith('http') ? (
                                <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                            ) : (
                                top2?.avatar
                            )}
                        </div>
                        <div className="w-full bg-white/20 rounded-t-2xl h-24 flex items-center justify-center text-4xl font-black">
                            2
                        </div>
                        <div className="mt-2 w-full">
                            <p className="text-[10px] md:text-xs font-bold truncate leading-tight">{top2?.name}</p>
                            <p className="text-[10px] md:text-xs font-medium opacity-80">{top2?.points}</p>
                        </div>
                    </div>

                    {/* Rank 1 - Center */}
                    <div className="flex flex-col items-center flex-1 max-w-[120px] -mb-1 animate-in slide-in-from-bottom-12 duration-1000">
                         <div className="relative mb-3">
                            <Crown className="w-7 h-7 text-yellow-400 fill-yellow-400 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce duration-[3000ms]" />
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-yellow-400 bg-orange-400 flex items-center justify-center font-black text-xl md:text-2xl shadow-xl ring-4 ring-orange-500/30 overflow-hidden">
                                {top1?.avatar?.startsWith('http') ? (
                                    <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                                ) : (
                                    top1?.avatar
                                )}
                            </div>
                         </div>
                        <div className="w-full bg-gradient-to-t from-white/10 to-white/30 rounded-t-2xl h-36 flex items-center justify-center text-6xl font-black shadow-inner">
                            1
                        </div>
                        <div className="mt-2 w-full">
                            <p className="text-xs md:text-sm font-black truncate">{top1?.name}</p>
                            <p className="text-xs md:text-sm font-black text-yellow-300">{top1?.points}</p>
                        </div>
                    </div>

                    {/* Rank 3 - Right */}
                    <div className="flex flex-col items-center flex-1 max-w-[100px] animate-in slide-in-from-bottom-6 duration-500">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-orange-200/50 bg-orange-400/50 backdrop-blur-md mb-3 flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden">
                            {top3?.avatar?.startsWith('http') ? (
                                <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover" />
                            ) : (
                                top3?.avatar
                            )}
                        </div>
                        <div className="w-full bg-white/20 rounded-t-2xl h-20 flex items-center justify-center text-4xl font-black">
                            3
                        </div>
                        <div className="mt-2 w-full">
                            <p className="text-[10px] md:text-xs font-bold truncate leading-tight">{top3?.name}</p>
                            <p className="text-[10px] md:text-xs font-medium opacity-80">{top3?.points}</p>
                        </div>
                    </div>

                </div>
             </div>

             {/* List for Rank 4 and above */}
             <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                 {others.map((user) => (
                     <div key={user.id} className="flex items-center p-5 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors group">
                         <span className="w-8 font-bold text-stone-400 group-hover:text-orange-500 transition-colors text-sm">{user.rank}</span>
                         <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-100 flex items-center justify-center font-bold text-xs text-stone-500 mr-4 shadow-sm overflow-hidden">
                             {user.avatar?.startsWith('http') ? (
                                 <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                             ) : (
                                 user.avatar
                             )}
                         </div>
                         <div className="flex-1">
                             <p className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition-colors">{user.name}</p>
                         </div>
                         <div className="text-right">
                             <span className="text-sm font-black text-[#EF6C00]">{user.points}</span>
                             <span className="text-[10px] font-bold text-stone-300 ml-1">pts</span>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};
