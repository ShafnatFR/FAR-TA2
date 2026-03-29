
import React, { useState, useEffect } from 'react';
import { User, MapPin, Shield, HelpCircle, LogOut, Moon, Sun, Store, Heart, ChevronRight, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { UserRole, UserData, SavedItem, ClaimHistoryItem, FoodItem, FAQItem, Address } from '../../types';
import { ProfileHeader } from './components/ProfileHeader';
import { EditProfile } from './components/EditProfile';
import { AddressList } from './components/AddressList';
import { SecuritySettings } from './components/SecuritySettings';
import { FaqSection } from './components/FaqSection';
import { SavedItems } from './components/SavedItems';
import { ClaimHistory, ReportModal, ReviewModal } from './components/ClaimHistory';
import { ClaimHistoryDetail } from './components/ClaimHistoryDetail'; 
import { GamificationSummary } from './components/GamificationSummary';
import { PointHistory } from './components/PointHistory';
import { HistoryList } from '../volunteer/components/HistoryList';
import { FoodDetail } from '../receiver/components/FoodDetail';
import { db } from '../../services/db';

interface ProfileIndexProps {
  role: UserRole;
  currentUser: UserData | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigate: (view: string) => void;
  initialView?: 'main' | 'address' | 'history' | 'saved' | 'edit' | 'security' | 'faq' | 'point_history';
  savedItems: SavedItem[];
  setSavedItems: React.Dispatch<React.SetStateAction<SavedItem[]>>;
  claimHistory: ClaimHistoryItem[];
  setClaimHistory: React.Dispatch<React.SetStateAction<ClaimHistoryItem[]>>;
  availableFoodForDetail: FoodItem[];
  onClaim: (item: FoodItem, quantity: string) => void;
  globalFAQs: FAQItem[];
  stats: {
      label1: string; value1: number | string;
      label2: string; value2: number | string;
      label3: string; value3: number;
  };
  onSubmitReview?: (claimId: string, rating: number, comment: string, media: string[]) => void;
  onSubmitReport?: (claimId: string, reason: string, description: string, evidence: string[]) => void;
  onRefresh?: () => void; 
  allAddresses?: Address[];
  onUpdateUser?: (data: UserData) => void;
  onEditAvatar?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MenuButton = ({ icon: Icon, label, onClick, last }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${!last ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
    >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-950 flex items-center justify-center text-stone-500 dark:text-stone-400">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-stone-900 dark:text-stone-200 text-sm font-medium">{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-stone-400" />
    </button>
);

export const ProfileIndex: React.FC<ProfileIndexProps> = ({ 
    role, 
    currentUser, 
    onLogout, 
    isDarkMode, 
    toggleTheme,
    onNavigate,
    initialView = 'main',
    savedItems,
    setSavedItems,
    claimHistory,
    setClaimHistory,
    availableFoodForDetail,
    onClaim,
    globalFAQs,
    stats,
    onSubmitReview,
    onSubmitReport,
    onRefresh,
    allAddresses = [],
    onUpdateUser,
    onEditAvatar
}) => {
    const [currentView, setCurrentView] = useState<string>(initialView);
    const [userData, setUserData] = useState<UserData | null>(currentUser);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    
    // For Food Detail in Saved Items
    const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
    
    // For Claim History Detail & Actions
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<ClaimHistoryItem | null>(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);

    // Edit Profile unsaved changes state
    const [isEditDirty, setIsEditDirty] = useState(false);
    const [showConfirmBack, setShowConfirmBack] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setUserData(currentUser);
            setIsEditDirty(false); // Reset dirty state when user data is freshly loaded
        }
    }, [currentUser]);

    useEffect(() => {
        if (initialView) {
            setCurrentView(initialView);
        }
    }, [initialView]);

    useEffect(() => {
        if (currentView === 'history') {
            setIsHistoryLoading(true);
            const timer = setTimeout(() => {
                setIsHistoryLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentView]);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (currentUser?.id) {
                try {
                    const data = await db.getAddresses(currentUser.id);
                    setAddresses(data);
                } catch (e) {
                    console.error(e);
                }
            }
        };
        fetchAddresses();
    }, [currentUser]);

    const handleUpdateUser = (data: UserData) => {
        setUserData(data);
        if (onUpdateUser) onUpdateUser(data);
    };

    const handleAddAddress = async (addr: Address) => {
        if (!currentUser) return;
        const newAddr = { ...addr, userId: currentUser.id, role: currentUser.role };
        const saved = await db.addAddress(newAddr);
        setAddresses([...addresses, saved]);
    };

    const handleUpdateAddress = async (addr: Address) => {
        const updatedAddr = { ...addr, role: currentUser?.role || addr.role };
        await db.updateAddress(updatedAddr);
        // Use loose equality or String casting for ID matching as MySQL returns numbers
        setAddresses(prev => prev.map(a => String(a.id) === String(addr.id) ? { ...updatedAddr, id: a.id } : (a.isPrimary && updatedAddr.isPrimary ? { ...a, isPrimary: false } : a)));
    };

    const handleDeleteAddress = async (id: string) => {
        await db.deleteAddress(id);
        setAddresses(prev => prev.filter(a => a.id !== id));
    };

    const handleToggleSave = (item: FoodItem) => {
        if (savedItems.some(s => s.id === item.id)) {
            setSavedItems(savedItems.filter(s => s.id !== item.id));
        } else {
            setSavedItems([...savedItems, { id: item.id, name: item.name, provider: item.providerName, image: item.imageUrl, status: 'available' }]);
        }
    };

    const handleCompleteClaim = async () => {
        if (selectedHistoryItem) {
            try {
                await db.updateClaimStatus(selectedHistoryItem.id, 'completed');
                setClaimHistory(prev => prev.map(c => c.id === selectedHistoryItem.id ? { ...c, status: 'completed' } : c));
                
                // Update selected item status locally to reflect change immediately without closing modal if desired
                setSelectedHistoryItem(prev => prev ? { ...prev, status: 'completed' } : null);
                
                alert("Pesanan berhasil diselesaikan!");
            } catch (e) {
                console.error("Gagal update status", e);
                alert("Gagal memperbarui status pesanan.");
            }
        }
    };

    const handleReportSubmit = (reason: string, description: string, evidence: string[]) => {
        if (selectedHistoryItem && onSubmitReport) {
            onSubmitReport(selectedHistoryItem.id, reason, description, evidence);
            setReportModalOpen(false);
            
            // Update local state to show 'Reported' status immediately.
            // reportEvidence is now an array (string[])
            setSelectedHistoryItem(prev => prev ? { 
                ...prev, 
                isReported: true,
                reportReason: reason,
                reportDescription: description,
                reportEvidence: evidence
            } : null);
            alert("Laporan Anda telah dikirim.");
        }
    };

    const handleReviewSubmit = (rating: number, review: string, media: string[]) => {
        if (selectedHistoryItem && onSubmitReview) {
            onSubmitReview(selectedHistoryItem.id, rating, review, media);
            setReviewModalOpen(false);
            
            // Update local state to show rating & media immediately
            setSelectedHistoryItem(prev => prev ? { ...prev, rating, review, reviewMedia: media } : null);
            alert("Terima kasih atas ulasan Anda!");
        }
    };

    // Sub-view renders
    if (currentView === 'edit' && userData) {
        return (
            <div className="p-4 md:p-8 pb-32">
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => {
                            if (isEditDirty) {
                                setShowConfirmBack(true);
                            } else {
                                setCurrentView('main');
                            }
                        }} 
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-stone-900 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Edit Profil</h2>
                </div>
                <EditProfile 
                    userData={userData} 
                    onSave={(data) => {
                        handleUpdateUser(data);
                        setIsEditDirty(false);
                        if (pendingSave) {
                            setPendingSave(false);
                            setCurrentView('main');
                        }
                    }} 
                    addresses={addresses}
                    onDirtyChange={setIsEditDirty}
                    triggerSave={pendingSave}
                />

                {/* Confirm Back Modal */}
                {showConfirmBack && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-300">
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Simpan Perubahan?</h3>
                                <p className="text-stone-500 text-sm mt-2 font-medium">Anda memiliki perubahan yang belum disimpan. Ingin menyimpannya sekarang?</p>
                            </div>
                            <div className="p-6 pt-0 flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        setShowConfirmBack(false);
                                        setPendingSave(true);
                                    }}
                                    className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                >
                                    Simpan & Keluar
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowConfirmBack(false);
                                        setIsEditDirty(false);
                                        setCurrentView('main');
                                    }}
                                    className="w-full h-14 bg-white dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95"
                                >
                                    Hapus & Keluar
                                </button>
                                <button 
                                    onClick={() => setShowConfirmBack(false)}
                                    className="w-full h-14 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold text-sm transition-colors"
                                >
                                    Batal (Tetap di Sini)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (currentView === 'address') {
        return (
            <div className="pb-32">
                <div className="flex items-center gap-4 p-4 md:p-8 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
                    <button onClick={() => setCurrentView('main')} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-stone-900 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Alamat Tersimpan</h2>
                </div>
                <AddressList 
                    addresses={addresses} 
                    onAddAddress={handleAddAddress} 
                    onUpdateAddress={handleUpdateAddress} 
                    onDeleteAddress={handleDeleteAddress} 
                    role={role}
                    currentUser={currentUser}
                />
            </div>
        );
    }

    if (currentView === 'security') {
        return (
            <div className="pb-32">
                <div className="flex items-center gap-4 p-4 md:p-8 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
                    <button onClick={() => setCurrentView('main')} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-stone-900 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Keamanan</h2>
                </div>
                <SecuritySettings />
            </div>
        );
    }

    if (currentView === 'faq') {
        return (
            <div className="pb-32">
                <div className="flex items-center gap-4 p-4 md:p-8 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
                    <button onClick={() => setCurrentView('main')} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-stone-900 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Bantuan & FAQ</h2>
                </div>
                <FaqSection faqs={globalFAQs} />
            </div>
        );
    }

    if (currentView === 'point_history') {
        return (
            <PointHistory 
                currentUser={userData} 
                onBack={() => setCurrentView('main')} 
            />
        );
    }

    if (currentView === 'saved') {
        if (selectedFoodItem) {
            return (
                <FoodDetail 
                    item={selectedFoodItem} 
                    onBack={() => setSelectedFoodItem(null)} 
                    onClaim={(qty) => { onClaim(selectedFoodItem, qty); setSelectedFoodItem(null); }} 
                    isSaved={true}
                    onToggleSave={() => handleToggleSave(selectedFoodItem)}
                    claimHistory={claimHistory}
                />
            );
        }
        return (
            <div className="pb-32">
                <div className="flex items-center gap-4 p-4 md:p-8 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
                    <button onClick={() => setCurrentView('main')} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-stone-900 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Makanan Tersimpan</h2>
                </div>
                <SavedItems 
                    items={savedItems} 
                    onDelete={(ids) => setSavedItems(prev => prev.filter(i => !ids.has(i.id)))}
                    onDetail={(saved) => {
                        const food = availableFoodForDetail.find(f => f.id === saved.id);
                        if (food) setSelectedFoodItem(food);
                        else alert("Item ini sudah tidak tersedia di inventory.");
                    }}
                />
            </div>
        );
    }

    if (currentView === 'history') {
        // Jika ada item riwayat yang dipilih, tampilkan detail
        if (selectedHistoryItem && role !== 'volunteer') {
            return (
                <>
                    <ClaimHistoryDetail 
                        item={selectedHistoryItem}
                        onBack={() => setSelectedHistoryItem(null)}
                        onComplete={handleCompleteClaim}
                        onReport={() => setReportModalOpen(true)}
                        onReview={() => setReviewModalOpen(true)}
                    />
                    {reportModalOpen && (
                        <ReportModal 
                            item={selectedHistoryItem} 
                            onClose={() => setReportModalOpen(false)}
                            onSubmit={handleReportSubmit}
                        />
                    )}
                    {reviewModalOpen && (
                        <ReviewModal 
                            item={selectedHistoryItem} 
                            onClose={() => setReviewModalOpen(false)}
                            onSubmit={handleReviewSubmit}
                        />
                    )}
                </>
            );
        }

        return (
            <div className="pb-32 bg-[#FDFBF7] dark:bg-stone-950 min-h-screen">
                <div className="px-6 pt-8 pb-2 md:px-8 bg-[#FDFBF7] dark:bg-stone-900 sticky top-0 z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 dark:text-white leading-none tracking-tight">
                            {role === 'volunteer' ? 'Riwayat Misi' : 'Riwayat Makanan'}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 mt-1 text-xs font-bold">
                            {role === 'volunteer' ? 'Jejak kontribusi kebaikan Anda.' : 'Surplus makanan yang telah diselamatkan.'}
                        </p>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isHistoryLoading}
                            className="w-10 h-10 bg-white dark:bg-stone-800 text-stone-500 hover:text-orange-500 border border-stone-200 dark:border-stone-700 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-90 disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
                
                {role === 'volunteer' ? (
                    <div className="px-4 md:px-8 pt-4">
                        <HistoryList 
                            history={claimHistory
                                .filter(c => c.courierName === currentUser?.name && c.status === 'completed')
                                .map(c => {
                                    const providerAddr = allAddresses.find(a => String(a.userId) === String(c.providerId));
                                    const receiverAddr = allAddresses.find(a => String(a.userId) === String(c.receiverId));

                                    return { 
                                        // FIX: ensure id is treated as string before regex
                                        id: parseInt(String(c.id).replace(/\D/g, '') || String(Date.now())), 
                                        originalId: c.id,
                                        date: c.date, 
                                        from: providerAddr ? providerAddr.label : c.providerName, 
                                        to: receiverAddr ? receiverAddr.label : 'Penerima', 
                                        items: c.foodName, 
                                        points: 150,
                                        distance: 2.5 
                                    };
                                })
                            }
                            onFindMissions={() => onNavigate('dashboard')} 
                        />
                    </div>
                ) : (
                    <ClaimHistory 
                        history={claimHistory} 
                        onSelectItem={setSelectedHistoryItem} 
                        onSubmitReview={onSubmitReview}
                        onSubmitReport={onSubmitReport}
                        isLoading={isHistoryLoading} 
                        onRefresh={onRefresh} 
                    />
                )}
            </div>
        );
    }

    return (
        <div className="pb-32 animate-in fade-in">
            {userData && (
                <ProfileHeader 
                    userData={userData} 
                    role={role} 
                    bannerImage={null} 
                    onEditBanner={() => {}} 
                    onEditAvatar={onEditAvatar || (() => {})} 
                    stats={stats}
                    onUpdateUser={handleUpdateUser}
                />
            )}

            <div className="mt-8 px-4 space-y-6 max-w-lg mx-auto">
                {/* Gamification Widget */}
                <GamificationSummary 
                    currentUser={userData} 
                    currentPoints={typeof stats?.value3 === 'number' ? stats.value3 : 0} 
                    onViewHistory={() => setCurrentView('point_history')}
                />

                <div className="space-y-3">
                {role === 'receiver' && (
                    <>
                        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2 ml-2">Aktivitas</h3>
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                            <MenuButton icon={Heart} label="Makanan Tersimpan" onClick={() => setCurrentView('saved')} last />
                        </div>
                    </>
                )}

                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2 mt-6 ml-2">Akun</h3>
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                    <MenuButton icon={User} label="Edit Profil" onClick={() => setCurrentView('edit')} />
                    {role !== 'volunteer' && (
                        <MenuButton icon={MapPin} label="Alamat Tersimpan" onClick={() => setCurrentView('address')} />
                    )}
                    <MenuButton icon={Shield} label="Keamanan & Privasi" onClick={() => setCurrentView('security')} />
                    <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-950 flex items-center justify-center text-stone-500 dark:text-stone-400">{isDarkMode ? <Moon className="w-4 h-4 text-orange-400" /> : <Sun className="w-4 h-4 text-orange-500" />}</div>
                            <span className="text-stone-900 dark:text-stone-200 text-sm font-medium">Tema Aplikasi</span>
                        </div>
                        <span className="text-xs text-stone-500 mr-2">{isDarkMode ? 'Gelap' : 'Terang'}</span>
                    </button>
                    <MenuButton icon={HelpCircle} label="Bantuan & FAQ" onClick={() => setCurrentView('faq')} last />
                </div>
                
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden p-2 shadow-sm mt-6">
                    <Button variant="danger" onClick={onLogout} className="flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Keluar Akun</Button>
                </div>
            </div>
        </div>
    </div>
);
};
