
import React, { useState, useEffect } from 'react';
import { FoodItem, SavedItem, ClaimHistoryItem, UserData } from '../../types';
import { FoodList } from './components/FoodList';
import { FoodDetail } from './components/FoodDetail';
import { SuccessClaimSplash } from '../common/SuccessClaimSplash';
import { RequestManager } from './components/RequestManager';
import { KitchenScanner } from '../common/KitchenScanner';
import { Sparkles, Utensils } from 'lucide-react';

interface ReceiverIndexProps {
  onOpenNotifications: () => void;
  onNavigateToHistory: () => void;
  foodItems: FoodItem[];
  savedItems: SavedItem[];
  onToggleSave: (item: FoodItem) => void;
  onClaim: (item: FoodItem, quantity: string, method: 'pickup' | 'delivery') => Promise<string | null>; // Updated return type
  claimHistory?: ClaimHistoryItem[]; 
  currentUser?: UserData | null; 
  isLoading?: boolean;
  onRefresh?: () => void;
  disableExpiryLogic?: boolean;
}

export const ReceiverIndex: React.FC<ReceiverIndexProps> = ({ 
  onOpenNotifications, 
  onNavigateToHistory, 
  foodItems, 
  savedItems,
  onToggleSave,
  onClaim,
  claimHistory = [],
  currentUser,
  isLoading: isGlobalLoading = false, // Default to false if not provided
  onRefresh,
  disableExpiryLogic = false
}) => {
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const [showKitchenScanner, setShowKitchenScanner] = useState(false);
  
  // Merge internal loading logic (from previous impl) with global loading
  const [isMounting, setIsMounting] = useState(true);
  
  // State for Splash Screen
  const [showSplash, setShowSplash] = useState(false);
  const [splashData, setSplashData] = useState<{ foodName: string; providerName: string; code: string } | null>(null);

  // Trigger loading animation on mount (local effect)
  useEffect(() => {
      setIsMounting(true);
      const timer = setTimeout(() => {
          setIsMounting(false);
      }, 800); // 800ms delay for smooth transition
      return () => clearTimeout(timer);
  }, []);

  const isLoading = isMounting || isGlobalLoading;

  const handleClaimWrapper = async (qty: string, method: 'pickup' | 'delivery') => {
      if (!selectedItem) return;
      
      const result = await onClaim(selectedItem, qty, method);
      
      if (result) {
          // Success! Show splash
          setSplashData({
              foodName: selectedItem.name,
              providerName: selectedItem.providerName,
              code: result
          });
          setSelectedItem(null); // Close detail modal
          setShowSplash(true); // Open splash
      }
  };

  const handleCloseSplash = () => {
      setShowSplash(false);
      setSplashData(null);
  };

  const handleViewTicket = () => {
      handleCloseSplash();
      onNavigateToHistory();
  };

  return (
    <>
        {showRequests ? (
            <RequestManager 
                currentUser={currentUser} 
                onBack={() => setShowRequests(false)} 
            />
        ) : selectedItem ? (
            <FoodDetail 
                item={selectedItem} 
                onBack={() => setSelectedItem(null)} 
                onClaim={handleClaimWrapper} 
                isSaved={savedItems.some(s => s.id === selectedItem.id)}
                onToggleSave={() => onToggleSave(selectedItem)}
                claimHistory={claimHistory} 
                currentUser={currentUser} 
            />
        ) : (
            <>
                {/* Kitchen Scanner Promo Widget */}
                <div className="px-6 pt-8 max-w-5xl mx-auto">
                    <div className="bg-stone-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/40">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Kitchen AI</span>
                                </div>
                                <h3 className="text-lg font-black text-white leading-tight">Sulap Sisa Makanan <br/> Jadi Masakan Lezat</h3>
                            </div>
                            <button 
                                onClick={() => setShowKitchenScanner(true)}
                                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-stone-900 shadow-xl active:scale-90 transition-all"
                            >
                                <Utensils className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <FoodList 
                    onOpenNotifications={onOpenNotifications} 
                    onSelectItem={setSelectedItem} 
                    onOpenRequests={() => setShowRequests(true)}
                    foodItems={foodItems} 
                    savedIds={new Set(savedItems.map(s => s.id))}
                    onToggleSave={onToggleSave}
                    isLoading={isLoading}
                    onRefresh={onRefresh}
                    disableExpiryLogic={disableExpiryLogic}
                />
            </>
        )}

        {showKitchenScanner && (
            <KitchenScanner 
                currentUser={currentUser} 
                onBack={() => setShowKitchenScanner(false)} 
            />
        )}

        {showSplash && splashData && (
            <SuccessClaimSplash 
                foodName={splashData.foodName}
                providerName={splashData.providerName}
                uniqueCode={splashData.code}
                onClose={handleCloseSplash}
                onViewTicket={handleViewTicket}
            />
        )}
    </>
  );
};
