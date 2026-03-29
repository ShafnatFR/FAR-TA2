
import React, { useMemo, useState } from 'react';
import { Bell } from 'lucide-react'; 
import { DashboardStats } from './components/Dashboard';
import { FoodItem, ClaimHistoryItem, UserData } from '../../types';
import { NotificationsPage } from '../common/Notifications';
import { OnboardingTour } from '../common/OnboardingTour';
import { ImpactWidget } from './components/Dashboard/ImpactWidget';
import { NearbyRequests } from './components/Dashboard/NearbyRequests';
import { db } from '../../services/db';

interface ProviderIndexProps {
  onOpenNotifications: () => void;
  isSubNavOpen: boolean;
  onToggleSubNav: () => void;
  onNavigate: (view: string) => void;
  foodItems?: FoodItem[];
  claimHistory?: ClaimHistoryItem[];
  currentUser?: UserData | null;
  onCompleteOnboarding?: () => void; // New Prop
}

export const ProviderIndex: React.FC<ProviderIndexProps> = ({ 
    onNavigate, 
    foodItems = [], 
    claimHistory = [], 
    currentUser,
    onCompleteOnboarding 
}) => {
  const [viewMode, setViewMode] = useState<'main' | 'notifications'>('main');
  const [socialImpact, setSocialImpact] = useState<any>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(true);
  
  const userName = currentUser?.name || 'Restoran Berkah';

  // Fetch Aggregate Social Impact Data
  React.useEffect(() => {
      if (currentUser?.id) {
          const fetchImpact = async () => {
              setIsLoadingImpact(true);
              try {
                  const data = await db.getSocialImpact(currentUser.id);
                  setSocialImpact(data);
              } catch (e) {
                  console.error("Failed to fetch social impact:", e);
              } finally {
                  setIsLoadingImpact(false);
              }
          };
          fetchImpact();
      }
  }, [currentUser?.id]);

  const handleFinishTour = () => {
      if (onCompleteOnboarding) {
          onCompleteOnboarding();
      }
  };

  const stats = useMemo(() => {
      const myClaims = claimHistory.filter(h => h.providerName === userName);
      const completedOrders = myClaims.filter(h => h.status?.toLowerCase() === 'completed');
      
      // REAL RATING CALCULATION
      const ratedOrders = completedOrders.filter(h => h.rating && h.rating > 0);
      const totalRating = ratedOrders.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      const avgRating = ratedOrders.length > 0 ? parseFloat((totalRating / ratedOrders.length).toFixed(1)) : 5.0;

      const pendingReports = myClaims.filter(h => h.isReported).length;
      
      return {
          totalPoints: socialImpact?.totalPoints || 0,
          totalPotentialPoints: socialImpact?.totalPotentialPoints || 0,
          activeStock: foodItems.length,
          completedOrders: completedOrders.length,
          pendingReports,
          avgRating
      };
  }, [foodItems, claimHistory, userName, socialImpact]);

  if (viewMode === 'notifications') {
      return (
        <NotificationsPage 
            role="provider" 
            onBack={() => setViewMode('main')} 
            claimHistory={claimHistory} 
            inventory={foodItems}
            userName={userName} 
        />
      );
  }

  return (
    <>
        {currentUser?.isNewUser && (
            <OnboardingTour role="provider" onFinish={handleFinishTour} />
        )}
        
        <div className="p-6 md:p-8 max-w-5xl mx-auto pb-32">
            <header className="mb-8 flex justify-between items-start">
                <div className="animate-in slide-in-from-left duration-500">
                    <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter leading-none italic uppercase">Dashboard Donatur</h1>
                    <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mt-2 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-lg w-fit">Integritas Pangan AI</p>
                </div>
                
                <button 
                    onClick={() => setViewMode('notifications')} 
                    className="relative p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-orange-600 transition-all shadow-sm group active:scale-95"
                >
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-600 border-2 border-white rounded-full animate-pulse"></span>
                </button>
            </header>
            
            <DashboardStats 
                setActiveTab={onNavigate} 
                stats={stats}
                userId={String(currentUser?.id || '')}
            />

            <div className="mt-10">
                <NearbyRequests />
            </div>
        </div>
    </>
  );
};
