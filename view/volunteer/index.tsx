
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Navigation, History, Trophy, Bell, BarChart3, Star, Keyboard, Camera, X, CheckCircle2, AlertCircle, LayoutDashboard, ChevronDown, ScanLine, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatsDashboard } from './components/StatsDashboard';
import { MissionList } from './components/MissionList';
import { Leaderboard } from './components/Leaderboard';
import { HistoryList } from './components/HistoryList';
import { MissionDetail } from './components/MissionDetail';
import { VolunteerTask, RankLevel, DailyQuest, LeaderboardItem, ClaimHistoryItem, UserData, Address, FoodItem } from '../../types';
import { SOCIAL_SYSTEM } from '../../constants';
import { NotificationsPage } from '../common/Notifications';
// @ts-ignore
import jsQR from 'https://esm.sh/jsqr@1.4.0';

interface VolunteerIndexProps {
  onOpenNotifications: () => void;
  activeClaims?: ClaimHistoryItem[];
  onAcceptMission?: (claimId: string, volunteerName: string) => void;
  onUpdateStatus?: (claimId: string, status: 'completed' | 'active', extraData?: any) => void;
  currentUser?: UserData | null;
  allAddresses?: Address[]; // New Prop
  isLoading?: boolean;
  onRefresh?: () => void; // Refresh Prop
  globalUsers?: UserData[];
  inventory?: FoodItem[];
}

export const VolunteerIndex: React.FC<VolunteerIndexProps> = ({ 
    onOpenNotifications, 
    activeClaims = [],
    onAcceptMission,
    onUpdateStatus,
    currentUser,
    allAddresses = [],
    isLoading: isGlobalLoading = false,
    onRefresh,
    globalUsers = [],
    inventory = []
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  
  // Local Loading State for Splash Content
  const [isMounting, setIsMounting] = useState(true);
  
  // Local Refreshing State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ... (keep scanner state & logic as is)
  const [showScanner, setShowScanner] = useState(false);
  const [scanningForTaskId, setScanningForTaskId] = useState<string | number | null>(null);
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [viewMode, setViewMode] = useState<'main' | 'notifications'>('main');
  
  const [verificationResult, setVerificationResult] = useState<{ status: 'success' | 'error' | 'already_taken' | 'idle', message: string, code?: string }>({ status: 'idle', message: '' });
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // NEW: Track locally completed tasks to lock buttons immediately
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string | number>>(new Set());

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const userName = currentUser?.name || 'Budi Santoso';

  // Trigger splash loading on mount AND on tab change
  useEffect(() => {
      setIsMounting(true);
      const timer = setTimeout(() => {
          setIsMounting(false);
      }, 800); // 800ms splash delay for smooth transition
      return () => clearTimeout(timer);
  }, [activeTab]);

  const handleRefresh = async () => {
      if (!onRefresh) return;
      setIsRefreshing(true);
      try {
          await onRefresh();
          // Reset local locks on refresh as fresh data should reflect completed status
          setCompletedTaskIds(new Set());
      } catch (error) {
          console.error("Refresh failed", error);
      } finally {
          setIsRefreshing(false);
      }
  };

  const isLoading = isMounting || isGlobalLoading || isRefreshing;

  // ... (keep scanner functions: handleVerifyCode, scanQRCode, startCamera, stopCamera) ...
  const handleVerifyCode = (code: string) => {
      if (!code || isVerifying || verificationResult.status === 'success') return;
      
      // FIX: Safe comparison for string/number ID
      const targetClaim = activeClaims.find(c => String(c.id) === String(scanningForTaskId));
      if (!targetClaim) return;

      setIsVerifying(true);
      
      // Simulate verification delay for UX
      setTimeout(() => {
          setIsVerifying(false);

          if (code.toUpperCase() !== targetClaim.uniqueCode?.toUpperCase()) {
              setVerificationResult({ 
                status: 'error', 
                message: 'KODE QR TIDAK SESUAI!', 
                code 
              });
              if (navigator.vibrate) navigator.vibrate(500);
              return;
          }

          if (targetClaim.isScanned && (targetClaim.status as any) === 'completed') {
              setVerificationResult({ 
                status: 'already_taken', 
                message: 'KODE INI SUDAH PERNAH DIGUNAKAN.', 
                code 
              });
              return;
          }

          setVerificationResult({ 
            status: 'success', 
            message: 'QR BERHASIL DIVALIDASI!', 
            code 
          });
          
          if (onUpdateStatus) {
              // DETERMINE NEXT STATE BASED ON CURRENT PHASE
              const isPickingUp = targetClaim.courierStatus === 'picking_up';
              
              if (isPickingUp) {
                  // Phase 1: Pickup from Provider -> Move to 'delivering'
                  onUpdateStatus(targetClaim.id, 'active', { courierStatus: 'delivering' });
              } else {
                  // Phase 2: Delivery to Receiver -> Complete the order
                  // Set status to 'completed' and 'isScanned' to true
                  onUpdateStatus(targetClaim.id, 'completed', { courierStatus: 'completed', isScanned: true });
                  // Lock button locally immediately
                  setCompletedTaskIds(prev => new Set(prev).add(targetClaim.id));
              }
          }
      }, 800);
  };

  const scanQRCode = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

            if (code && code.data) {
                handleVerifyCode(code.data);
            }
        }
    }
    requestRef.current = requestAnimationFrame(scanQRCode);
  };

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.error("Play failed:", e));
                requestRef.current = requestAnimationFrame(scanQRCode);
            };
        }
    } catch (err) {
        console.error("Camera error:", err);
        setScannerMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
    }
  };

  useEffect(() => {
    if (showScanner && scannerMode === 'camera') {
        const timer = setTimeout(() => startCamera(), 200);
        return () => {
            clearTimeout(timer);
            stopCamera();
        };
    } else {
        stopCamera();
    }
  }, [showScanner, scannerMode]);

  // --- MAP GLOBAL CLAIMS TO TASKS WITH ADDRESS LOOKUP ---
  const mapClaimToTask = (claim: ClaimHistoryItem): VolunteerTask => {
      // --- 1. CARI ALAMAT PENERIMA (RECEIVER) ---
      const receiverAddressData = allAddresses.find(a => 
          String(a.userId) === String(claim.receiverId) && a.isPrimary
      ) || allAddresses.find(a => String(a.userId) === String(claim.receiverId));

      const receiverLocation = receiverAddressData ? {
          lat: receiverAddressData.lat || claim.receiverLocation?.lat || -6.920000, 
          lng: receiverAddressData.lng || claim.receiverLocation?.lng || 107.615000,
          address: receiverAddressData.fullAddress || claim.receiverLocation?.address || 'Alamat Penerima Belum Diisi'
      } : { 
          lat: claim.receiverLocation?.lat || -6.920000, 
          lng: claim.receiverLocation?.lng || 107.615000, 
          address: claim.receiverLocation?.address || 'Alamat Penerima Belum Diisi' 
      };

      // --- 2. CARI ALAMAT DONATUR (PROVIDER) ---
      const providerAddressData = allAddresses.find(a => 
          String(a.userId) === String(claim.providerId) && a.isPrimary
      ) || allAddresses.find(a => String(a.userId) === String(claim.providerId));

      const donorLocation = providerAddressData ? {
          lat: providerAddressData.lat || claim.location?.lat || -6.914744,
          lng: providerAddressData.lng || claim.location?.lng || 107.60981,
          address: providerAddressData.fullAddress || claim.location?.address || 'Alamat Donatur Tidak Ditemukan'
      } : {
          lat: claim.location?.lat || -6.914744,
          lng: claim.location?.lng || 107.60981,
          address: claim.location?.address || 'Alamat Donatur Tidak Ditemukan'
      };

      // --- 3. CARI DATA USER UNTUK NOMOR TELEPON (WHATSAPP) ---
      const donorUser = globalUsers.find(u => String(u.id) === String(claim.providerId));
      const receiverUser = globalUsers.find(u => String(u.id) === String(claim.receiverId));

      let taskStatus: 'available' | 'active' | 'history' = 'available';
      if ((claim.status as string) === 'completed') taskStatus = 'history';
      else if (claim.status?.toUpperCase() !== 'COMPLETED' && currentUser?.id && claim.volunteerId && String(claim.volunteerId) === String(currentUser.id)) taskStatus = 'active';

      // Find FoodItem to get details like aiVerification
      const foodItem = inventory.find(f => String(f.id) === String(claim.foodId));
      let ingredients: string[] = [];
      let foodCondition = 100;

      if (foodItem && foodItem.aiVerification) {
          try {
              const aiData = typeof foodItem.aiVerification === 'string' 
                  ? JSON.parse(foodItem.aiVerification) 
                  : foodItem.aiVerification;
              
              if (aiData.ingredients && Array.isArray(aiData.ingredients)) {
                  ingredients = aiData.ingredients;
              }
              if (aiData.halalScore) {
                  foodCondition = aiData.halalScore;
              }
          } catch (e) {
              console.error("Error parsing aiVerification", e);
          }
      }

      return {
          id: claim.id,
          claimId: claim.id,
          from: claim.providerLocation?.label || claim.providerName,
          to: claim.receiverLocation?.label || claim.receiverName || 'Penerima Manfaat', 
          distance: 2.5,
          distanceStr: '2.5 km',
          items: `${claim.foodName} (${claim.claimedQuantity || '1 Porsi'})`,
          status: taskStatus,
          stage: (claim.status as string) === 'completed' ? 'dropoff' : (claim.courierStatus === 'picking_up' ? 'pickup' : 'dropoff'),
          imageUrl: claim.imageUrl,
          description: claim.description || 'Pengantaran Makanan',
          ingredients: ingredients,
          foodCondition: foodCondition,
          donorLocation: donorLocation,
          receiverLocation: receiverLocation,
          donorOpenHours: '09:00 - 21:00',
          receiverDistanceStr: '2.5 km',
          quantity: claim.claimedQuantity,
          donorPhone: donorUser?.phone || providerAddressData?.phone,
          receiverPhone: receiverUser?.phone || receiverAddressData?.phone || claim.receiverPhone,
          points: 150
      };
  };

  const globalTasks: VolunteerTask[] = useMemo(() => {
      if (!currentUser?.id) return [];

      return activeClaims
        .filter(claim => claim.deliveryMethod !== 'pickup') 
        .map(claim => {
            const isAssignedToMe = claim.volunteerId && String(claim.volunteerId) === String(currentUser.id);
            const isUnassigned = !claim.volunteerId && !claim.courierName;
            
            // Jika sudah diambil oleh SAYA atau masih KOSONG, baru tampilkan (untuk dipetakan)
            if (isAssignedToMe || isUnassigned) {
                return mapClaimToTask(claim);
            }
            
            // Jika sudah diambil RELAWAN LAIN (bukan saya & tidak kosong), jangan tampilkan sama sekali
            return null;
        })
        .filter((t): t is VolunteerTask => t !== null); 
  }, [activeClaims, currentUser, allAddresses, globalUsers, inventory]);

  const availableTasks = globalTasks.filter(t => t.status === 'available');
  const myActiveTasks = globalTasks.filter(t => t.status === 'active');
  
  // FIXED: Filter completed tasks accurately by checking ID first, then name fallback
  const myCompletedTasks = useMemo(() => {
      return activeClaims.filter(c => {
          const isCompleted = c.status === 'completed';
          const isDelivery = c.deliveryMethod !== 'pickup';
          
          // Strict check: Match volunteerId if exists, otherwise fallback to name
          const isMyTask = (currentUser?.id && String(c.volunteerId) === String(currentUser.id)) || 
                           (c.courierName && c.courierName === userName);

          return isCompleted && isDelivery && isMyTask;
      });
  }, [activeClaims, currentUser, userName]);

  const stats = useMemo(() => {
      const missionsCompleted = myCompletedTasks.length;
      const totalPoints = missionsCompleted * 150 + (currentUser?.points || 0);
      const totalDistance = missionsCompleted * 2.5;
      
      const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
      myCompletedTasks.forEach(c => {
          const dateParts = c.date.split('/');
          if (dateParts.length === 3) {
              const day = new Date(parseInt(dateParts[2]), parseInt(dateParts[1])-1, parseInt(dateParts[0])).getDay();
              weeklyActivity[day] += 1;
          }
      });

      const volunteerSystem = SOCIAL_SYSTEM.volunteer;
      const currentRankObj = volunteerSystem.tiers.slice().reverse().find(t => totalPoints >= t.minPoints) || volunteerSystem.tiers[0];
      const nextRankObj = volunteerSystem.tiers.find(t => t.minPoints > totalPoints);
      const progressToNext = nextRankObj ? Math.min(((totalPoints - currentRankObj.minPoints) / (nextRankObj.minPoints - currentRankObj.minPoints)) * 100, 100) : 100;

      return { points: totalPoints, missionsCompleted, totalDistance, hoursContributed: missionsCompleted, currentRank: currentRankObj.name, nextRank: nextRankObj?.name || "Max", progressToNext, weeklyActivity };
  }, [myCompletedTasks, currentUser]);

  const handleStartScan = (taskId: string | number) => {
      setScanningForTaskId(taskId);
      setVerificationResult({ status: 'idle', message: '' });
      setManualCode('');
      setShowScanner(true);
  };

  const handleHistorySelect = (originalId: string) => {
      const claim = activeClaims.find(c => String(c.id) === String(originalId));
      if (claim) {
          const task = mapClaimToTask(claim);
          setSelectedTask(task);
      }
  };

  const leaderboardData: LeaderboardItem[] = useMemo(() => {
      // Filter volunteers only
      const volunteers = globalUsers.filter(u => u.role === 'volunteer');
      
      // Sort by points descending
      const sorted = volunteers.sort((a, b) => (b.points || 0) - (a.points || 0));
      
      // Map to LeaderboardItem
      return sorted.map((u, index) => ({
          id: u.id,
          name: u.name,
          points: u.points || 0,
          rank: index + 1,
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
      })).slice(0, 10); // Top 10
  }, [globalUsers]);

  if (viewMode === 'notifications') {
      return (
        <NotificationsPage 
            role="volunteer" 
            onBack={() => setViewMode('main')} 
            claimHistory={activeClaims} 
            userName={userName} 
            currentUserId={currentUser?.id} 
        />
      );
  }

  if (selectedTask) {
      return (
        <MissionDetail 
            task={selectedTask} 
            onBack={() => setSelectedTask(null)} 
            onAccept={() => { 
                if(onAcceptMission && selectedTask.claimId) onAcceptMission(selectedTask.claimId, userName); 
                setSelectedTask(null); 
                setActiveTab('active'); 
            }} 
            volunteerName={userName} // Pass volunteer name here
        />
      );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-stone-950 flex flex-col"> 
       <div className="sticky top-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-4 md:py-6 shadow-sm">
          <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-900/20">
                <Navigation className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none italic">Logistik Relawan</h1>
                <p className="text-[10px] md:text-xs text-stone-500 font-black uppercase tracking-widest mt-1">Sistem Distribusi Pangan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {onRefresh && (
                    <button 
                        onClick={handleRefresh} 
                        disabled={isRefreshing || isGlobalLoading}
                        className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-orange-600 transition-all shadow-inner disabled:opacity-50"
                    >
                        {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    </button>
                )}
                <button onClick={() => setViewMode('notifications')} className="relative p-3 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-orange-600 transition-all shadow-inner">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto flex gap-1 mt-6 p-1 bg-stone-100 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-x-auto scrollbar-hide">
                {[
                    {id: 'available', label: `Misi (${availableTasks.length})`, icon: MapPin}, 
                    {id: 'active', label: `Aktif (${myActiveTasks.length})`, icon: Navigation}, 
                    {id: 'history', label: 'Riwayat', icon: History}
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-md ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-orange-600' : 'text-stone-400'}`} />
                        {tab.label}
                    </button>
                ))}
          </div>
       </div>

       <div className={`flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full pb-32 transition-opacity duration-300 ${isRefreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {(activeTab === 'available' || activeTab === 'active') && (
                <MissionList 
                    tasks={activeTab === 'available' ? availableTasks : myActiveTasks} 
                    activeTab={activeTab === 'available' ? 'available' : 'active'} 
                    onAcceptTask={() => {}} 
                    onScanQr={handleStartScan}
                    onSelectTask={setSelectedTask}
                    isLoading={isLoading} 
                    completedTaskIds={completedTaskIds} // Pass locally completed IDs
                />
            )}

            {activeTab === 'history' && (
                <HistoryList 
                    history={myCompletedTasks.map(c => ({ 
                        // FIX: handle numeric ID or string ID safely
                        id: parseInt(String(c.id).replace(/\D/g, '') || '0'),
                        originalId: String(c.id), // Pass original ID for accurate lookup
                        date: c.date, 
                        from: c.providerName, 
                        to: 'Penerima', 
                        items: c.foodName, 
                        points: 150,
                        status: c.status // Added status prop
                    }))} 
                    onSelect={handleHistorySelect}
                    isLoading={isLoading}
                />
            )}
       </div>

       {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in">
           <button onClick={() => { setShowScanner(false); stopCamera(); }} className="absolute top-6 right-6 p-2 bg-stone-800 rounded-full text-white z-50 hover:bg-stone-700"><X className="w-6 h-6" /></button>
           
           <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h3 className="text-white font-black text-2xl uppercase italic tracking-tight">Validator Penyerahan</h3>
                    <p className="text-stone-500 text-sm font-medium">Langkah 1: Verifikasi Identitas Penerima</p>
                </div>

                {scannerMode === 'camera' ? (
                    <div className="relative rounded-[2.5rem] overflow-hidden aspect-square bg-black border-2 border-stone-800 shadow-2xl mx-auto group">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-[scan_2s_infinite_linear]"></div>
                            <div className="absolute inset-0 border-[40px] border-black/40"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-3xl"></div>
                        </div>

                        {isVerifying && (
                            <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                            </div>
                        )}

                        {verificationResult.status !== 'idle' && (
                            <div className={`absolute inset-0 z-40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 ${
                                verificationResult.status === 'success' ? 'bg-green-600/90' : 
                                verificationResult.status === 'already_taken' ? 'bg-amber-600/90' : 'bg-red-600/90'
                            }`}>
                                {verificationResult.status === 'success' ? <CheckCircle2 className="w-16 h-16 text-white mb-4 animate-bounce" /> : <AlertCircle className="w-16 h-16 text-white mb-4 animate-shake" />}
                                <h3 className="text-white font-black text-xl uppercase italic leading-tight mb-2">{verificationResult.message}</h3>
                                {verificationResult.status !== 'success' ? (
                                    <Button onClick={() => setVerificationResult({status:'idle', message:''})} variant="outline" className="mt-6 border-white text-white">Coba Lagi</Button>
                                ) : (
                                    <Button onClick={() => { setShowScanner(false); stopCamera(); }} variant="outline" className="mt-6 border-white text-white">Lanjutkan</Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-stone-900 rounded-[2.5rem] p-8 border border-stone-800 shadow-2xl aspect-square flex flex-col justify-center relative overflow-hidden">
                        {verificationResult.status !== 'idle' && (
                            <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 ${
                                verificationResult.status === 'success' ? 'bg-green-600/95' : 
                                verificationResult.status === 'already_taken' ? 'bg-amber-600/95' : 'bg-red-600/95'
                            }`}>
                                {verificationResult.status === 'success' ? <CheckCircle2 className="w-16 h-16 text-white mb-4" /> : <AlertCircle className="w-16 h-16 text-white mb-4 animate-shake" />}
                                <h3 className="text-white font-black text-xl uppercase italic leading-tight mb-2">{verificationResult.message}</h3>
                                {verificationResult.status !== 'success' ? (
                                    <Button onClick={() => setVerificationResult({status:'idle', message:''})} variant="outline" className="mt-6 border-white text-white">Coba Lagi</Button>
                                ) : (
                                    <Button onClick={() => setShowScanner(false)} variant="outline" className="mt-6 border-white text-white">Tutup</Button>
                                )}
                            </div>
                        )}

                        <ScanLine className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h4 className="text-white font-black text-lg mb-6 text-center uppercase tracking-widest italic">Input Kode Manual</h4>
                        <Input 
                            label="KODE PENUKARAN"
                            placeholder="CONTOH: FAR-1234" 
                            value={manualCode} 
                            onChange={e => setManualCode(e.target.value.toUpperCase())}
                            className="bg-black border-stone-700 text-white text-center font-mono text-2xl h-16 mb-6"
                        />
                        <Button onClick={() => handleVerifyCode(manualCode)} disabled={!manualCode || isVerifying || verificationResult.status !== 'idle'} isLoading={isVerifying}>
                            Verifikasi Kode
                        </Button>
                    </div>
                )}

                <div className="mt-8 grid grid-cols-2 gap-4">
                    <button onClick={() => { setScannerMode('camera'); setVerificationResult({status:'idle', message:''}); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${scannerMode === 'camera' ? 'bg-orange-600 text-white border-orange-500' : 'bg-stone-900 text-stone-600 border-stone-800'}`}>
                        <Camera className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Kamera</span>
                    </button>
                    <button onClick={() => { setScannerMode('manual'); setVerificationResult({status:'idle', message:''}); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${scannerMode === 'manual' ? 'bg-orange-600 text-white border-orange-500' : 'bg-stone-900 text-stone-600 border-stone-800'}`}>
                        <Keyboard className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Keyboard</span>
                    </button>
                </div>
           </div>
        </div>
      )}
      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </div>
  );
};
