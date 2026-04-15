
import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Edit2, Save, X, ShieldCheck, Zap, Heart, Gift, Target, Upload } from 'lucide-react';
import { db } from '../../../services/db';
import { Badge } from '../../../types';
import { BadgeModal } from './Community/BadgeModal';

export const RanksManagement = () => {
    const [activeTab, setActiveTab] = useState<'levels' | 'badges'>('levels');
    const [levels, setLevels] = useState<any[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Level Modal State
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any>(null);
    const [levelFormData, setLevelFormData] = useState({
        role: 'PROVIDER',
        name: '',
        min_points: 0,
        benefits: [] as string[],
        color: 'bg-stone-500',
        icon: '🌱'
    });
    const [newBenefit, setNewBenefit] = useState('');

    // Badge Modal State
    const [isShowBadgeModal, setIsShowBadgeModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [levelsData, badgesData] = await Promise.all([
                db.getRankLevels(),
                db.getBadges()
            ]);
            setLevels(levelsData);
            setBadges(badgesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LEVEL HANDLERS ---
    const handleEditLevel = (level: any) => {
        setEditingLevel(level);
        setLevelFormData({
            role: level.role,
            name: level.name,
            min_points: level.min_points,
            benefits: level.benefits || [],
            color: level.color,
            icon: level.icon
        });
        setIsLevelModalOpen(true);
    };

    const handleDeleteLevel = async (id: number) => {
        if (!window.confirm("Hapus level ini? Tindakan ini tidak dapat dibatalkan.")) return;
        try {
            await db.deleteRankLevel(id, null);
            fetchData();
        } catch (error) {
            alert("Gagal menghapus level.");
        }
    };

    const handleLevelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.upsertRankLevel(
                editingLevel ? { ...levelFormData, id: editingLevel.id } : levelFormData,
                null
            );
            setIsLevelModalOpen(false);
            setEditingLevel(null);
            fetchData();
        } catch (error) {
            alert("Gagal menyimpan level.");
        }
    };

    const addBenefit = () => {
        if (!newBenefit.trim()) return;
        setLevelFormData({
            ...levelFormData,
            benefits: [...levelFormData.benefits, newBenefit.trim()]
        });
        setNewBenefit('');
    };

    const removeBenefit = (index: number) => {
        setLevelFormData({
            ...levelFormData,
            benefits: levelFormData.benefits.filter((_, i) => i !== index)
        });
    };

    // --- DRAG AND DROP HANDLERS ---
    const [draggedLevelId, setDraggedLevelId] = useState<number | null>(null);

    const onDragStart = (e: React.DragEvent, id: number) => {
        setDraggedLevelId(id);
        e.dataTransfer.setData('levelId', id.toString());
        // Custom drag image could be set here
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow drop
    };

    const onDrop = async (e: React.DragEvent, newRole: string) => {
        e.preventDefault();
        const id = parseInt(e.dataTransfer.getData('levelId'));
        if (!id) return;

        const levelToUpdate = levels.find(l => l.id === id);
        if (!levelToUpdate || levelToUpdate.role === newRole) return;

        // Optimistic UI update
        const originalLevels = [...levels];
        setLevels(levels.map(l => l.id === id ? { ...l, role: newRole } : l));

        try {
            await db.upsertRankLevel({ ...levelToUpdate, role: newRole }, null);
            // Optionally fetch fresh data
        } catch (error) {
            console.error("Drop failed:", error);
            setLevels(originalLevels);
            alert("Gagal memindahkan level. Periksa koneksi.");
        } finally {
            setDraggedLevelId(null);
        }
    };

    // --- BADGE HANDLERS ---
    const handleEditBadge = (badge: Badge) => {
        setEditingBadge(badge);
        setIsShowBadgeModal(true);
    };

    const handleSaveBadge = async (updatedBadge: Badge) => {
        try {
            await db.upsertBadge(updatedBadge, null);
            setIsShowBadgeModal(false);
            setEditingBadge(null);
            fetchData();
        } catch (error) {
            alert("Gagal menyimpan badge.");
        }
    };

    const handleDeleteBadge = async (id: string) => {
        try {
            await db.deleteBadge(id, null);
            setIsShowBadgeModal(false);
            setEditingBadge(null);
            fetchData();
        } catch (error) {
            alert("Gagal menghapus badge.");
        }
    };

    const roles = [
        { id: 'PROVIDER', label: 'Donatur (Provider)', icon: Heart, color: 'text-orange-500', dbRole: 'provider' },
        { id: 'VOLUNTEER', label: 'Relawan', icon: Zap, color: 'text-blue-500', dbRole: 'volunteer' },
        { id: 'RECIPIENT', label: 'Penerima', icon: ShieldCheck, color: 'text-green-500', dbRole: 'receiver' }
    ];

    if (loading && levels.length === 0) return (
        <div className="flex items-center justify-center p-20 min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">Milestone & Rewards</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">Pengaturan tingkatan level pengguna dan katalog badge pencapaian.</p>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800">
                    <button 
                        onClick={() => setActiveTab('levels')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'levels' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                    >
                        <Zap className="w-4 h-4" /> Tingkatan Level
                    </button>
                    <button 
                        onClick={() => setActiveTab('badges')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'badges' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                    >
                        <Award className="w-4 h-4" /> Medali (Badges)
                    </button>
                </div>

                <div className="flex-shrink-0">
                    {activeTab === 'levels' ? (
                        <button 
                            onClick={() => { setEditingLevel(null); setLevelFormData({ role: 'PROVIDER', name: '', min_points: 0, benefits: [], color: 'bg-stone-500', icon: '🌱' }); setIsLevelModalOpen(true); }}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:bg-orange-600 hover:text-white active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Tambah Tingkatan
                        </button>
                    ) : (
                        <button 
                            onClick={() => { setEditingBadge({ id: '', name: '', icon: '🏆', image: '', description: '', role: 'all', minPoints: 0, awardedTo: 0 }); setIsShowBadgeModal(true); }}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:bg-orange-600 hover:text-white active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Tambah Medali
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {roles.map(role => (
                    <div 
                        key={role.id} 
                        className={`space-y-6 flex flex-col transition-all duration-300 ${activeTab === 'levels' ? '' : 'opacity-100'}`}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, role.id)}
                    >
                        <div className="flex items-center justify-between p-5 bg-white dark:bg-stone-900 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 shadow-sm relative overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-r ${role.id === 'PROVIDER' ? 'from-orange-50 to-transparent dark:from-orange-950/20' : role.id === 'VOLUNTEER' ? 'from-blue-50 to-transparent dark:from-blue-950/20' : 'from-green-50 to-transparent dark:from-green-950/20'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-stone-50 dark:bg-stone-800 ${role.color}`}>
                                    <role.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-black italic uppercase text-sm tracking-tighter text-stone-900 dark:text-white">{role.label}</h3>
                            </div>
                            <span className="text-[10px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-widest">{activeTab === 'levels' ? 'Ranks' : 'Badges'}</span>
                        </div>
                        
                        <div className={`flex-1 space-y-4 p-4 rounded-[2.5rem] border-2 border-dashed border-stone-100 dark:border-stone-800 transition-colors ${draggedLevelId ? 'border-orange-200 bg-orange-50/10' : ''}`}>
                            {activeTab === 'levels' ? (
                                // --- LEVELS LIST ---
                                levels.filter(l => l.role === role.id).length === 0 ? (
                                    <div className="py-20 text-center space-y-2 opacity-30">
                                        <Zap className="w-8 h-8 mx-auto text-stone-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada rank</p>
                                    </div>
                                ) : (
                                    levels.filter(l => l.role === role.id).map(level => (
                                        <div 
                                            key={level.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, level.id)}
                                            className={`group relative bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all cursor-grab active:cursor-grabbing ${draggedLevelId === level.id ? 'opacity-40 animate-pulse' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 ${level.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner`}>
                                                        {level.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-stone-900 dark:text-white leading-tight">{level.name}</h4>
                                                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{level.min_points.toLocaleString()} POIN</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditLevel(level)} className="p-2 text-stone-400 hover:text-orange-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteLevel(level.id)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Keuntungan:</p>
                                                <ul className="space-y-1">
                                                    {(level.benefits || []).map((b: string, i: number) => (
                                                        <li key={i} className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 font-medium line-clamp-1">
                                                            <div className="w-1 h-1 rounded-full bg-orange-500" />
                                                            {b}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                // --- BADGES LIST ---
                                badges.filter(b => b.role === role.dbRole || b.role === 'all').length === 0 ? (
                                    <div className="py-20 text-center space-y-2 opacity-30">
                                        <Award className="w-8 h-8 mx-auto text-stone-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada badge</p>
                                    </div>
                                ) : (
                                    badges.filter(b => b.role === role.dbRole || b.role === 'all').map(badge => (
                                        <div 
                                            key={badge.id}
                                            onClick={() => handleEditBadge(badge)}
                                            className="group relative bg-[#1F120D] dark:bg-stone-900 rounded-[2rem] border border-[#2D1B14] dark:border-stone-800 p-1 shadow-sm hover:shadow-2xl hover:border-orange-500/30 transition-all cursor-pointer overflow-hidden"
                                        >
                                            <div className="h-32 w-full relative rounded-[1.8rem] overflow-hidden">
                                                {badge.image ? (
                                                    <img src={badge.image} alt={badge.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                ) : (
                                                    <div className="w-full h-full bg-stone-800"></div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent"></div>
                                                <div className="absolute top-4 left-4">
                                                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-stone-900/40 backdrop-blur-md text-white border border-white/10`}>
                                                        {badge.role === 'all' ? 'Umum' : role.label}
                                                    </span>
                                                </div>
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-3xl bg-[#2D1B14] border-4 border-[#1F120D] flex items-center justify-center text-3xl shadow-2xl z-20 group-hover:scale-110 transition-transform">
                                                    {badge.icon}
                                                </div>
                                            </div>
                                            
                                            <div className="pt-8 pb-6 px-6 text-center space-y-2">
                                                <h4 className="font-black text-white italic truncate text-sm uppercase tracking-tight">{badge.name}</h4>
                                                <p className="text-[10px] text-stone-500 font-medium line-clamp-1">{badge.description}</p>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-950/30 border border-orange-500/20 rounded-full">
                                                    <Target className="w-3 h-3 text-orange-500" />
                                                    <span className="text-[9px] font-black text-orange-500">{badge.minPoints} POIN</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Level Modal Form */}
            {isLevelModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase italic">{editingLevel ? 'Edit Level' : 'Tambah Level Baru'}</h3>
                                <p className="text-xs text-stone-500 font-medium">Konfigurasi milestone pengguna.</p>
                            </div>
                            <button onClick={() => setIsLevelModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                                <X className="w-6 h-6 text-stone-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleLevelSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Target Peran</label>
                                    <select 
                                        value={levelFormData.role}
                                        onChange={e => setLevelFormData({ ...levelFormData, role: e.target.value })}
                                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        <option value="PROVIDER">DONATUR</option>
                                        <option value="VOLUNTEER">RELAWAN</option>
                                        <option value="RECIPIENT">PENERIMA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Icon (Emoji)</label>
                                    <input 
                                        type="text"
                                        value={levelFormData.icon}
                                        onChange={e => setLevelFormData({ ...levelFormData, icon: e.target.value })}
                                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="🌱"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Nama Tingkatan</label>
                                <input 
                                    type="text"
                                    value={levelFormData.name}
                                    onChange={e => setLevelFormData({ ...levelFormData, name: e.target.value })}
                                    required
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Contoh: Sang Pahlawan"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Min. Poin</label>
                                    <input 
                                        type="number"
                                        value={levelFormData.min_points}
                                        onChange={e => setLevelFormData({ ...levelFormData, min_points: parseInt(e.target.value) })}
                                        required
                                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Warna (CSS Class)</label>
                                    <input 
                                        type="text"
                                        value={levelFormData.color}
                                        onChange={e => setLevelFormData({ ...levelFormData, color: e.target.value })}
                                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="bg-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Keuntungan (Benefits)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newBenefit}
                                        onChange={e => setNewBenefit(e.target.value)}
                                        className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Tambah keuntungan..."
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                    />
                                    <button 
                                        type="button"
                                        onClick={addBenefit}
                                        className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-4 rounded-2xl hover:bg-orange-500 hover:text-white transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {levelFormData.benefits.map((b, i) => (
                                        <span key={i} className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-orange-100 dark:border-orange-900/30">
                                            {b}
                                            <button type="button" onClick={() => removeBenefit(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-900/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    {editingLevel ? 'Perbarui Level' : 'Simpan Level Baru'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Badge Modal Component */}
            {isShowBadgeModal && editingBadge && (
                <BadgeModal 
                    badge={editingBadge}
                    onClose={() => setIsShowBadgeModal(false)}
                    onSave={handleSaveBadge}
                    onDelete={handleDeleteBadge}
                />
            )}
        </div>
    );
};
