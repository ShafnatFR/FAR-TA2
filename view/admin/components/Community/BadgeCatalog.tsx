
import React, { useState } from 'react';
import { Gift, PlusCircle, Target } from 'lucide-react';
import { Badge } from '../../../../types';
import { ACHIEVEMENT_BADGES } from '../../../../constants';
import { BadgeModal } from './BadgeModal';

export const BadgeCatalog: React.FC = () => {
    const [badges, setBadges] = useState<Badge[]>(ACHIEVEMENT_BADGES);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [badgeForm, setBadgeForm] = useState<Badge>({ id: '', name: '', icon: '🏆', image: '', description: '', role: 'all', minPoints: 0, awardedTo: 0 });

    const handleSaveBadge = (newBadge: Badge) => {
        if (newBadge.id) {
            setBadges(badges.map(b => b.id === newBadge.id ? newBadge : b));
        } else {
            setBadges([{ ...newBadge, id: Date.now().toString() }, ...badges]);
        }
        setShowBadgeModal(false);
    };

    const handleDeleteBadge = (id: string) => {
        setBadges(badges.filter(b => b.id !== id));
        setShowBadgeModal(false);
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-400">
            {/* Header Badges */}
            <div className="bg-[#2D1B14] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-white relative shadow-2xl overflow-hidden border border-white/5">
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10 gap-3">
                    <div className="space-y-0.5">
                        <h3 className="font-black text-xl flex items-center gap-2.5 text-white italic tracking-tighter uppercase leading-none">
                            <Gift className="w-5 h-5 text-orange-500" /> Katalog Badges
                        </h3>
                        <p className="text-stone-400 text-[10px] font-medium">Apresiasi khusus untuk pahlawan penyelamat pangan.</p>
                    </div>
                    <button
                        onClick={() => { setBadgeForm({ id: '', name: '', icon: '🏆', image: '', description: '', role: 'all', minPoints: 0, awardedTo: 0 }); setShowBadgeModal(true); }}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                        <PlusCircle className="w-4 h-4 text-orange-500" /> TAMBAH BADGE
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    {badges.map(badge => (
                        <div
                            key={badge.id}
                            onClick={() => { setBadgeForm(badge); setShowBadgeModal(true); }}
                            className="bg-[#1F120D] rounded-2xl w-full border border-white/5 hover:border-orange-500/30 transition-all duration-300 group flex flex-col cursor-pointer shadow-lg overflow-hidden"
                        >
                            {/* Badge Item UI */}
                            <div className="h-28 w-full relative overflow-hidden">
                                {badge.image ? (
                                    <>
                                        <img src={badge.image} alt="bg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F120D] via-[#1F120D]/30 to-transparent"></div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900"></div>
                                )}
                                <div className="absolute top-2.5 left-2.5">
                                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/10 ${(badge.role === 'individual_donor' || badge.role === 'corporate_donor' || badge.role === 'provider') ? 'bg-blue-600 text-white' :
                                            badge.role === 'volunteer' ? 'bg-green-600 text-white' :
                                                (badge.role === 'recipient' || badge.role === 'receiver') ? 'bg-amber-500 text-white' : 'bg-stone-600 text-white'
                                        }`}>
                                        {badge.role}
                                    </span>
                                </div>
                                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl bg-[#2D1B14] border-2 border-[#1F120D] flex items-center justify-center text-2xl shadow-xl z-20 group-hover:scale-110 transition-transform">
                                    {badge.icon}
                                </div>
                            </div>
                            <div className="flex-1 pt-5 pb-4 px-4 text-center flex flex-col justify-between items-center gap-2">
                                <div className="space-y-0.5">
                                    <h4 className="font-black text-white text-xs leading-tight uppercase italic tracking-tight">{badge.name}</h4>
                                    <p className="text-xs text-stone-500 font-medium line-clamp-1 leading-relaxed">{badge.description}</p>
                                </div>
                                <div className="w-full">
                                    <div className="flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-orange-400 bg-orange-950/30 border border-orange-500/20 py-1.5 rounded-lg w-full group-hover:bg-orange-500 group-hover:text-white transition-all">
                                        <Target className="w-2.5 h-2.5" /> {badge.minPoints} PTS
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showBadgeModal && (
                <BadgeModal
                    badge={badgeForm}
                    onClose={() => setShowBadgeModal(false)}
                    onSave={handleSaveBadge}
                    onDelete={handleDeleteBadge}
                />
            )}
        </div>
    );
};
