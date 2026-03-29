
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, FoodItem, ClaimHistoryItem, SavedItem, UserData, FAQItem, SocialImpactData, BroadcastMessage, Address } from './types';
import { isFoodExpired } from './utils/transformers';
import { LoginView } from './view/auth/Login';
import { RegisterView } from './view/auth/Register';
import { ForgotPasswordView } from './view/auth/ForgotPassword';
import { ProviderIndex } from './view/provider';
import { ReceiverIndex } from './view/receiver';
import { VolunteerIndex } from './view/volunteer';
import { AdminIndex } from './view/admin';
import { ProfileIndex } from './view/profile';
import { NotificationsPage } from './view/common/Notifications';
import { InventoryManager } from './view/provider/components/Inventory';
import { ReportsView } from './view/provider/components/Reports';
import { ReviewsView } from './view/provider/components/Reviews';
import { VerificationPendingModal } from './view/common/VerificationPendingModal'; 
import { VerificationRejectedModal } from './view/common/VerificationRejectedModal';
import { Home, User, Box, Loader2, History } from 'lucide-react';
import { db } from './services/db';

const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 Minutes

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('login');
  const [role, setRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  // State for Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // State for Profile Initial Tab (Main vs Address vs History)
  const [profileInitialTab, setProfileInitialTab] = useState<'main' | 'address' | 'history'>('main');

  // State for Deep Linking (Redirect to specific order detail)
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  
  // State for History Filter Deep Linking (Reported/Rated)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'rated' | 'reported' | null>(null);

  const [isSubNavOpen, setIsSubNavOpen] = useState(false);
  
  // DATA STATE
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]); 
  
  const [globalUsers, setGlobalUsers] = useState<UserData[]>([]);

  // Centralized Global Broadcast Data
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([
    { id: '1', title: 'Update Sistem v1.3.0', content: 'Kami telah memperbarui sistem poin dan menambahkan fitur AI Quality Audit baru. Terima kasih atas dukungan Anda!', target: 'all', status: 'sent', sentAt: '20 Feb 2025', readCount: 850 },
    { id: '2', title: 'Maintenance Server Berhasil', content: 'Pemeliharaan sistem rutin telah selesai dilakukan. Aplikasi kini lebih stabil.', target: 'all', status: 'sent', sentAt: '18 Feb 2025', readCount: 720 },
    { id: '3', title: 'Misi Baru: Area Gedebage', content: 'Ada 5 donasi besar membutuhkan pengantaran segera di area Gedebage. Cek menu logistik!', target: 'volunteer', status: 'sent', sentAt: '15 Feb 2025', readCount: 156 }
  ]);

  const [globalFAQs, setGlobalFAQs] = useState<FAQItem[]>([
      { id: 'f1', question: 'Apa itu Food AI Rescue?', answer: 'Platform penyelamatan surplus pangan berbasis AI yang menghubungkan bisnis makanan dengan komunitas yang membutuhkan untuk mengurangi pemborosan makanan.', category: 'Umum' },
      { id: 'f2', question: 'Bagaimana cara kerja sistem reputasi (poin)?', answer: 'Sistem reputasi dihitung berdasarkan keaktifan dan integritas Anda:\n- **Donatur:** Mendapat poin dari jumlah makanan yang diselamatkan dan rating ulasan.\n- **Penerima:** Mendapat poin dari ulasan yang diberikan dan ketepatan waktu penukaran.\n- **Relawan:** Mendapat poin dari jarak tempuh dan keberhasilan misi.', category: 'Umum' }
  ]);

  // Global App Settings from Backend
  const [appSettings, setAppSettings] = useState<{ disableExpiryLogic: boolean }>({ disableExpiryLogic: false });

  // --- SESSION CHECK ON MOUNT ---
  useEffect(() => {
    const checkSession = () => {
        // Cek Local Storage (Remember Me) atau Session Storage (Sementara)
        const savedSession = localStorage.getItem('far_session') || sessionStorage.getItem('far_session');
        
        if (savedSession) {
            try {
                const parsedUser = JSON.parse(savedSession);
                setRole(parsedUser.role);
                setCurrentUser(parsedUser);
                setCurrentView('dashboard');
            } catch (e) {
                console.error("Session parse error", e);
                localStorage.removeItem('far_session');
                sessionStorage.removeItem('far_session');
            }
        }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
        if (!role || !currentUser) return; 
        
        const cacheKey = `far_global_data_${currentUser.id}_${role}`;
        
        // 1. Check Global Cache
        if (!forceRefresh) {
            const cachedContent = localStorage.getItem(cacheKey);
            if (cachedContent) {
                try {
                    const { inventory, claims, settings, timestamp } = JSON.parse(cachedContent);
                    const now = Date.now();
                    
                    if (now - timestamp < CACHE_EXPIRY_MS) {
                        console.log(`%c[GLOBAL-CACHE-VALID] Using cached data for ${role}`, 'color: #059669; font-weight: bold;');
                        if (inventory) setFoodItems(inventory);
                        if (claims) setClaimHistory(claims);
                        if (settings) setAppSettings(settings);
                        
                        // Still need to fetch these if relevant as they aren't fully cached here
                        if (role === 'volunteer') {
                            const allAddrs = await db.getAddresses();
                            setAllAddresses(allAddrs);
                            const users = await db.getUsers();
                            setGlobalUsers(users);
                        }
                        if (role === 'admin_manager' || role === 'super_admin') {
                            const users = await db.getUsers();
                            setGlobalUsers(users);
                        }
                        return; // EXIT EARLY
                    }
                } catch (e) {
                    console.error("Global cache parse error", e);
                }
            }
        }

        setIsGlobalLoading(true);
        try {
            const providerIdFilter = role === 'provider' ? currentUser.id : undefined;
            const claimsFilters = role === 'provider' 
                ? { providerId: currentUser.id } 
                : (role === 'receiver' ? { receiverId: currentUser.id } : {});

            console.log("Fetching Data with Filters:", { providerIdFilter, claimsFilters });

            const [inventoryData, claimsData, settingsData] = await Promise.all([
                db.getInventory(providerIdFilter),
                db.getClaims(claimsFilters),
                db.getSettings()
            ]);

            if (settingsData) setAppSettings(settingsData);
            if (inventoryData) setFoodItems(inventoryData);
            
            let finalClaims = claimsData || [];
            if (role === 'receiver' && claimsData) {
                finalClaims = claimsData.filter(c => c.receiverId === currentUser.id);
            }
            setClaimHistory(finalClaims);

            // Update GLOBAL CACHE
            localStorage.setItem(cacheKey, JSON.stringify({
                inventory: inventoryData,
                claims: finalClaims,
                settings: settingsData,
                timestamp: Date.now()
            }));

            if (role === 'volunteer') {
                const allAddrs = await db.getAddresses();
                setAllAddresses(allAddrs);
            } 

            if (role === 'admin_manager' || role === 'super_admin' || role === 'volunteer') {
                const users = await db.getUsers();
                setGlobalUsers(users);
            }
            
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setIsGlobalLoading(false);
        }
  }, [role, currentUser]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]); 

  const profileStats = useMemo(() => {
    const completedHistory = claimHistory.filter(c => c.status === 'completed');
    const activeHistory = claimHistory.filter(c => c.status === 'active');

    if (role === 'provider') {
        const ratingSum = completedHistory.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        const avgRating = completedHistory.length ? (ratingSum / completedHistory.length).toFixed(1) : '5.0';
        
        const pointsFromHistory = completedHistory.reduce((acc, curr) => acc + (curr.socialImpact?.totalPoints || 0), 0);
        
        return {
            label1: 'Donasi', value1: foodItems.length + completedHistory.length,
            label2: 'Rating', value2: parseFloat(avgRating),
            label3: 'Poin', value3: pointsFromHistory + (currentUser?.points || 0)
        };
    } 
    else if (role === 'volunteer') {
        if (!currentUser || !currentUser.id) {
             return { label1: 'Misi', value1: 0, label2: 'Jam', value2: 0, label3: 'Poin', value3: 0 };
        }

        const myCompletedMissions = completedHistory.filter(c => 
            c.deliveryMethod !== 'pickup' && 
            (
                (c.volunteerId && String(c.volunteerId) === String(currentUser.id)) || 
                (c.courierName && c.courierName === currentUser.name)
            )
        );
        
        const missionsCount = myCompletedMissions.length;
        const basePoints = currentUser.points || 0;
        
        const estimatedHours = missionsCount > 0 ? Math.ceil(missionsCount * 0.8) : 0;

        return {
            label1: 'Misi', value1: missionsCount,
            label2: 'Jam', value2: estimatedHours, 
            label3: 'Poin', value3: (missionsCount * 150) + basePoints
        };
    } 
    else { 
        const claims = completedHistory.length + activeHistory.length;
        const basePoints = currentUser?.points || 0;
        return {
            label1: 'Klaim', value1: claims,
            label2: 'Disimpan', value2: savedItems.length,
            label3: 'Poin', value3: (claims * 10) + basePoints
        };
    }
  }, [role, claimHistory, foodItems, savedItems, currentUser]);

  const handleLogin = (data: Partial<UserData> & { role: UserRole; email?: string }, remember: boolean = false) => {
      setRole(data.role);
      
      let finalName = data.name;
      if (!finalName) {
          finalName = data.role === 'provider' ? 'Restoran Berkah' : 
                      data.role === 'volunteer' ? 'Budi Santoso' : 
                      data.role === 'admin_manager' ? 'Admin Manager' : 
                      'Siti Aminah';
      }

      const userObject: UserData = {
          id: data.id || '1',
          name: finalName,
          email: data.email || 'user@foodairescue.com',
          role: data.role || 'receiver',
          status: (data.status as any) || 'active',
          points: data.points !== undefined ? data.points : 0, 
          joinDate: data.joinDate || '2025-01-01',
          phone: data.phone || '08123456789',
          address: data.address || '',
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=random`,
          isNewUser: data.isNewUser // Capture isNewUser from login/register response
      };

      setCurrentUser(userObject);
      
      // PERSIST SESSION
      const sessionString = JSON.stringify(userObject);
      if (remember) {
          localStorage.setItem('far_session', sessionString);
      } else {
          sessionStorage.setItem('far_session', sessionString);
      }

      setCurrentView('dashboard');
  };

  const handleRegister = (formData: any, remember: boolean = false) => {
      // Auto Login after register
      handleLogin(formData, remember);
  };

  const handleUpdateUser = (data: UserData) => {
      setCurrentUser(data);
      // Update session storage if exists
      if (localStorage.getItem('far_session')) {
          localStorage.setItem('far_session', JSON.stringify(data));
      } else if (sessionStorage.getItem('far_session')) {
          sessionStorage.setItem('far_session', JSON.stringify(data));
      }
  };

  const handleEditAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && currentUser) {
          setIsGlobalLoading(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              try {
                  const url = await db.uploadImage(base64, `avatar_${currentUser.id}_${Date.now()}.jpg`, 'profiles');
                  const updatedUser = { ...currentUser, avatar: url };
                  await db.upsertUser(updatedUser);
                  handleUpdateUser(updatedUser);
                  alert("Foto profil berhasil diperbarui!");
              } catch (error) {
                  console.error("Avatar upload failed", error);
                  alert("Gagal mengunggah foto profil. Periksa koneksi.");
              } finally {
                  setIsGlobalLoading(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleLogout = () => {
      // Clear Sessions
      localStorage.removeItem('far_session');
      sessionStorage.removeItem('far_session');

      setRole(null);
      setCurrentUser(null);
      setCurrentView('login');
      setFoodItems([]);
      setClaimHistory([]);
      setGlobalUsers([]); 
  };

  // UPDATE user status after tour completion
  const handleCompleteTour = async () => {
      if (!currentUser) return;
      
      // 1. Optimistic Update Local State
      const updatedUser = { ...currentUser, isNewUser: false };
      setCurrentUser(updatedUser);
      
      // Update session storage as well to keep state consistent on refresh
      const sessionKey = localStorage.getItem('far_session') ? 'far_session' : 'far_session'; // Check where it is stored
      if (localStorage.getItem('far_session')) localStorage.setItem('far_session', JSON.stringify(updatedUser));
      else sessionStorage.setItem('far_session', JSON.stringify(updatedUser));

      // 2. Persist to DB (Send false, backend handles 0 conversion)
      try {
          await db.upsertUser(updatedUser);
          console.log("User tour status updated.");
      } catch (error) {
          console.error("Failed to update user tour status:", error);
      }
  };

  const handleAcceptMission = (claimId: string, volunteerName: string) => {
      setClaimHistory(prev => prev.map(c => 
          c.id === claimId 
            ? { ...c, courierName: volunteerName, courierStatus: 'picking_up', volunteerId: currentUser?.id } 
            : c
      ));

      db.updateClaimStatus(claimId, 'active', { 
          courierName: volunteerName, 
          courierStatus: 'picking_up',
          volunteerId: currentUser?.id 
      });
  };

  const handleUpdateStatus = async (claimId: string, newStatus: 'completed' | 'active', extraData?: any) => {
      setClaimHistory(prev => prev.map(c => {
          if (c.id === claimId) {
              const updated = { ...c, status: newStatus, ...extraData };
              if (extraData && extraData.isScanned) {
                  updated.isScanned = true;
              }
              if (newStatus === 'completed') {
                  updated.isScanned = true; 
                  if (c.deliveryMethod !== 'pickup') {
                      updated.courierStatus = 'completed';
                  }
              }
              return updated;
          }
          return c;
      }));

      try {
          const payload = { ...extraData };
          if (newStatus === 'completed') {
              payload.isScanned = true;
              payload.courierStatus = 'completed'; 
          }
          await db.updateClaimStatus(claimId, newStatus, payload);
      } catch (error) {
          console.error("Failed to update status in DB:", error);
          alert("Gagal menyimpan status ke server. Coba lagi.");
      }
  };

  const handleClaimFood = async (item: FoodItem, quantityStr: string, method: 'pickup' | 'delivery'): Promise<string | null> => {
      const isAlreadyClaimed = claimHistory.some(c => 
          c.status === 'active' && 
          c.foodName === item.name && 
          c.providerName === item.providerName
      );

      if (isAlreadyClaimed) {
          alert("Anda sudah memiliki klaim aktif untuk produk ini. Selesaikan dulu pesanan tersebut sebelum mengambil lagi.");
          return null;
      }

      const quantityNum = parseInt(quantityStr.replace(/\D/g, '')) || 1;
      
      let proportionalImpact: SocialImpactData | undefined;
      if (item.socialImpact) {
          const ratio = quantityNum / item.initialQuantity;
          proportionalImpact = {
              ...item.socialImpact,
              totalPoints: Math.round(item.socialImpact.totalPoints * ratio),
              co2Saved: parseFloat((item.socialImpact.co2Saved * ratio).toFixed(2)),
              waterSaved: Math.round(item.socialImpact.waterSaved * ratio),
              landSaved: parseFloat((item.socialImpact.landSaved * ratio).toFixed(2)),
              wasteReduction: parseFloat((item.socialImpact.wasteReduction * ratio).toFixed(2))
          };
      }

      const uniqueCode = `FAR-${Math.floor(1000 + Math.random() * 9000)}`;
      const newClaim: ClaimHistoryItem = {
          id: `CLM-${Date.now()}`,
          foodId: item.id, 
          providerId: item.providerId, 
          receiverId: currentUser?.id, 
          providerName: item.providerName,
          foodName: item.name,
          date: new Date().toISOString(),
          status: 'active',
          isScanned: false,
          imageUrl: item.imageUrl,
          uniqueCode: uniqueCode, 
          claimedQuantity: quantityStr,
          deliveryMethod: method, 
          location: item.location,
          distributionHours: { start: '18:00', end: '21:00' },
          description: item.description,
          socialImpact: proportionalImpact 
      };

      try {
          await db.processClaimTransaction(item.id, quantityNum, newClaim);
          const updatedInventory = await db.getInventory();
          const updatedClaims = await db.getClaims({ receiverId: currentUser?.id }); 
          
          setFoodItems(updatedInventory);
          
          if (updatedClaims) {
              setClaimHistory(updatedClaims);
          }
          
          return uniqueCode;

      } catch (error: any) {
          console.error("Claim Transaction Failed:", error);
          alert(`Gagal melakukan klaim: ${error.message}`);
          return null;
      }
  };

  const handleSubmitReview = async (claimId: string, rating: number, comment: string, media: string[]) => {
      try {
          await db.submitReview(claimId, rating, comment, media);
          setClaimHistory(prev => prev.map(c => 
              c.id === claimId ? { ...c, rating, review: comment, reviewMedia: media } : c
          ));
      } catch (error) {
          console.error("Failed to submit review:", error);
          alert("Gagal mengirim ulasan ke database. Coba lagi.");
      }
  };

  const handleSubmitReport = async (claimId: string, reason: string, description: string, evidence: string[]) => {
      try {
          await db.submitReport(claimId, reason, description, evidence);
          const evidenceStr = JSON.stringify(evidence);
          setClaimHistory(prev => prev.map(c => 
              c.id === claimId ? { ...c, isReported: true, reportReason: reason, reportDescription: description, reportEvidence: evidenceStr } : c
          ));
      } catch (error) {
          console.error("Failed to submit report:", error);
          alert("Gagal mengirim laporan ke database. Coba lagi.");
      }
  };

  const handleProviderNavigation = (view: string) => {
      if (view === 'inventory-reported') {
          setCurrentView('reports'); 
      } else if (view === 'inventory-rated') {
          setCurrentView('reviews'); 
      } else {
          setHistoryFilter(null);
          setCurrentView(view);
      }
  };

  const renderContent = () => {
      if (currentView === 'login') return <LoginView onLogin={handleLogin} onNavigate={setCurrentView as any} />;
      if (currentView === 'register') return <RegisterView onNavigate={setCurrentView as any} onRegister={handleRegister} />;
      if (currentView === 'forgot-password') return <ForgotPasswordView onNavigate={setCurrentView as any} />;
      
      // CHECK ACCOUNT STATUS HERE
      if (currentUser && role !== 'admin_manager' && role !== 'super_admin') {
          if (currentUser.status?.toUpperCase() === 'SUSPENDED') {
              return <VerificationRejectedModal onLogout={handleLogout} userName={currentUser.name} />;
          }
          if (currentUser.status?.toUpperCase() === 'PENDING') {
              return <VerificationPendingModal onLogout={handleLogout} userName={currentUser.name} />;
          }
      }

      if (isGlobalLoading && !foodItems.length && role !== 'receiver' && role !== 'volunteer') {
          return (
              <div className="flex flex-col items-center justify-center min-h-[80vh]">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                  <p className="text-stone-500 font-bold animate-pulse">Menghubungkan ke Database...</p>
              </div>
          );
      }

      if (currentView === 'notifications') return (
        <NotificationsPage 
          role={role} 
          onBack={() => setCurrentView('dashboard')} 
          claimHistory={claimHistory} 
          inventory={foodItems} 
          userName={currentUser?.name}
          broadcastMessages={broadcastMessages}
          currentUserId={currentUser?.id} 
        />
      );
      
      if (currentView === 'profile') return (
          <ProfileIndex 
            role={role!} 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme}
            onNavigate={setCurrentView} 
            initialView={profileInitialTab as any} 
            savedItems={savedItems}
            setSavedItems={setSavedItems}
            claimHistory={claimHistory}
            setClaimHistory={setClaimHistory}
            availableFoodForDetail={foodItems}
            onClaim={(item, qty) => handleClaimFood(item, qty, 'pickup')} 
            globalFAQs={globalFAQs} 
            stats={profileStats}
            onSubmitReview={handleSubmitReview} 
            onSubmitReport={handleSubmitReport} 
            onRefresh={() => fetchData(true)} 
            allAddresses={allAddresses}
            onUpdateUser={handleUpdateUser}
            onEditAvatar={handleEditAvatar}
          />
      );

      if (role === 'provider') {
          if (currentView === 'inventory') return (
            <InventoryManager 
                foodItems={foodItems} 
                setFoodItems={setFoodItems} 
                claimHistory={claimHistory} 
                setClaimHistory={setClaimHistory}
                targetOrderId={targetOrderId}
                clearTargetOrder={() => setTargetOrderId(null)}
                initialFilter={historyFilter} 
                onUpdateStatus={handleUpdateStatus} 
                currentUser={currentUser}
                onRefresh={() => fetchData(true)}
                onNavigate={(view) => {
                    if (view === 'profile-address') {
                        setProfileInitialTab('address');
                        setCurrentView('profile');
                    } else {
                        setCurrentView(view);
                    }
                }} 
            />
          );

          if (currentView === 'reports') return (
              <div className="p-6 md:p-8 max-w-5xl mx-auto pb-32">
                  <div className="flex items-center gap-4 mb-6">
                      <button onClick={() => setCurrentView('dashboard')} className="p-2 rounded-full hover:bg-stone-100">
                          <Box className="w-5 h-5 text-stone-500" />
                      </button>
                      <h1 className="text-2xl font-black uppercase italic">Pusat Masalah</h1>
                  </div>
                  <ReportsView 
                    onNavigateToOrder={(orderId) => { setTargetOrderId(orderId); setCurrentView('inventory'); }} 
                    claims={claimHistory} 
                  />
              </div>
          );

          if (currentView === 'reviews') return (
              <div className="p-6 md:p-8 max-w-5xl mx-auto pb-32">
                  <div className="flex items-center gap-4 mb-6">
                      <button onClick={() => setCurrentView('dashboard')} className="p-2 rounded-full hover:bg-stone-100">
                          <Box className="w-5 h-5 text-stone-500" />
                      </button>
                      <h1 className="text-2xl font-black uppercase italic">Ulasan Diterima</h1>
                  </div>
                  <ReviewsView 
                    onNavigateToOrder={(orderId) => { setTargetOrderId(orderId); setCurrentView('inventory'); }} 
                    claims={claimHistory}
                  />
              </div>
          );
          
          return (
            <ProviderIndex 
                onOpenNotifications={() => setCurrentView('notifications')} 
                onNavigate={handleProviderNavigation} 
                isSubNavOpen={isSubNavOpen} 
                onToggleSubNav={() => setIsSubNavOpen(!isSubNavOpen)}
                foodItems={foodItems}
                claimHistory={claimHistory}
                currentUser={currentUser}
                onCompleteOnboarding={handleCompleteTour} // PASS FUNCTION
            />
          );
      }

      if (role === 'receiver') {
          // Filter out expired items for receivers, unless disabled by admin
          const activeFoodItems = appSettings.disableExpiryLogic 
              ? foodItems 
              : foodItems.filter(item => !isFoodExpired(item.distributionEnd, item.expiryTime));
          
          return (
            <ReceiverIndex 
                onOpenNotifications={() => setCurrentView('notifications')} 
                onNavigateToHistory={() => { setProfileInitialTab('history'); setCurrentView('profile'); }}
                foodItems={activeFoodItems}
                savedItems={savedItems}
                disableExpiryLogic={appSettings.disableExpiryLogic}
                onToggleSave={(item) => {
                    if (savedItems.some(s => s.id === item.id)) {
                        setSavedItems(savedItems.filter(s => s.id !== item.id));
                    } else {
                        setSavedItems([...savedItems, { id: item.id, name: item.name, provider: item.providerName, image: item.imageUrl, status: 'available' }]);
                    }
                }}
                onClaim={handleClaimFood} 
                claimHistory={claimHistory} 
                currentUser={currentUser} 
                isLoading={isGlobalLoading} 
                onRefresh={() => fetchData(true)} 
            />
          );
      }

      if (role === 'volunteer') {
          return (
            <VolunteerIndex 
                onOpenNotifications={() => setCurrentView('notifications')} 
                activeClaims={claimHistory}
                onAcceptMission={handleAcceptMission}
                onUpdateStatus={handleUpdateStatus} 
                currentUser={currentUser}
                allAddresses={allAddresses} 
                isLoading={isGlobalLoading} 
                onRefresh={() => fetchData(true)} 
                globalUsers={globalUsers}
                inventory={foodItems}
            />
          );
      }

      if (role === 'admin_manager' || role === 'super_admin') {
          return (
            <AdminIndex 
                role={role} 
                onLogout={handleLogout} 
                currentUser={currentUser} 
                globalUsers={globalUsers} 
                setGlobalUsers={setGlobalUsers} 
                globalInventory={foodItems}
                globalClaims={claimHistory}
                globalFAQs={globalFAQs} 
                setGlobalFAQs={setGlobalFAQs} 
                broadcastMessages={broadcastMessages}
                setBroadcastMessages={setBroadcastMessages}
                allAddresses={allAddresses}
                appSettings={appSettings}
                setAppSettings={setAppSettings}
                onRefresh={() => fetchData(true)}
            />
          );
      }

      return <div>Unknown Role</div>;
  };

  const showBottomNav = role && !['login', 'register', 'forgot-password'].includes(currentView) && !role.includes('admin') && currentUser?.status?.toUpperCase() === 'ACTIVE';

  return (
    <div className="bg-[#FDFBF7] dark:bg-stone-950 min-h-screen text-stone-900 dark:text-white font-sans flex flex-col">
      <div className="flex-1">
        {renderContent()}
      </div>
      
      {showBottomNav && (
          <nav className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex justify-around py-3.5 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] safe-area-bottom">
              <button 
                onClick={() => { setProfileInitialTab('main'); setCurrentView('dashboard'); }} 
                className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentView === 'dashboard' ? 'text-orange-600' : 'text-stone-400'}`}
              >
                  <Home className={`w-5 h-5 ${currentView === 'dashboard' ? 'fill-orange-600/10' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
              </button>
              
              {role === 'provider' && (
                  <button 
                    onClick={() => { setHistoryFilter(null); setCurrentView('inventory'); }} 
                    className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentView === 'inventory' ? 'text-orange-600' : 'text-stone-400'}`}
                  >
                      <Box className={`w-5 h-5 ${currentView === 'inventory' ? 'fill-orange-600/10' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Stok</span>
                  </button>
              )}

              {role === 'receiver' && (
                  <button 
                    onClick={() => { setProfileInitialTab('history'); setCurrentView('profile'); }} 
                    className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentView === 'profile' && profileInitialTab === 'history' ? 'text-orange-600' : 'text-stone-400'}`}
                  >
                      <History className={`w-5 h-5 ${currentView === 'profile' && profileInitialTab === 'history' ? 'fill-orange-600/10' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Riwayat</span>
                  </button>
              )}

              <button 
                onClick={() => { setProfileInitialTab('main'); setCurrentView('profile'); }} 
                className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentView === 'profile' && profileInitialTab !== 'history' ? 'text-orange-600' : 'text-stone-400'}`}
              >
                  <User className={`w-5 h-5 ${currentView === 'profile' && profileInitialTab !== 'history' ? 'fill-orange-600/10' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Profil</span>
              </button>
          </nav>
      )}
    </div>
  );
};

export default App;
