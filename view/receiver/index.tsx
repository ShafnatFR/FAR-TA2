
import React, { useState, useEffect } from 'react';
import { FoodItem, SavedItem, ClaimHistoryItem, UserData } from '../../types';
import { FoodList } from './components/FoodList';
import { FoodDetail } from './components/FoodDetail';
import { SuccessClaimSplash } from '../common/SuccessClaimSplash';
import { RequestManager } from './components/RequestManager';

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
