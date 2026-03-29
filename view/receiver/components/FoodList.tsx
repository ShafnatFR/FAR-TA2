
import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Clock, Search, Info, ChevronLeft, ChevronRight, Heart, LayoutGrid, StretchHorizontal, Timer, MapPin, Truck, Package, Store, Sparkles, Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { Input } from '../../components/Input';
import { EmptyState } from '../../common/EmptyState';
import { FoodItem } from '../../../types';
import { optimizeUnsplashUrl } from '../../../utils/imageOptimizer';
import { StoreIcon } from './StoreIcon';
import { formatDateTime } from '../../../utils/transformers';

interface FoodListProps {
  onOpenNotifications: () => void;
  onSelectItem: (item: FoodItem) => void;
  foodItems: FoodItem[];
  savedIds: Set<string>;
  onToggleSave: (item: FoodItem) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  disableExpiryLogic?: boolean;
}

export const FoodList: React.FC<FoodListProps> = ({ 
  onOpenNotifications, 
  onSelectItem, 
  onOpenRequests,
  foodItems, 
  savedIds, 
  onToggleSave,
  isLoading,
  onRefresh,
  disableExpiryLogic = false
}) => {
  const [filterMethod, setFilterMethod] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredFood = foodItems
    .filter(item => {
      const matchesMethod = filterMethod === 'all' || item.deliveryMethod === filterMethod || item.deliveryMethod === 'both';
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.providerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Real-time expiry check (bypassed if disableExpiryLogic is true)
      const isNotExpired = disableExpiryLogic 
          ? true 
          : (item.status === 'available' && (item.expiryTime ? new Date(item.expiryTime) > new Date() : true));
      
      return matchesMethod && matchesSearch && isNotExpired;
    })
    .sort((a, b) => {
      // Primary: Date Descending (Newest first)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (dateB !== dateA) return dateB - dateA;
      
      // Secondary: Name Ascending (A-Z)
      return a.name.localeCompare(b.name);
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFood.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFood.length / itemsPerPage);

  useEffect(() => {
      setCurrentPage(1);
  }, [filterMethod, searchQuery]);

  const renderMethodBadge = (method: string) => {
      if (method === 'pickup') {
          return (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300 flex items-center gap-1">
                <Package className="w-3 h-3" /> Ambil
            </span>
          );
      } else if (method === 'delivery') {
          return (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 flex items-center gap-1">
                <Truck className="w-3 h-3" /> Antar
            </span>
          );
      } else {
          return (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 flex items-center gap-1">
                <Store className="w-3 h-3" /> Pickup & Antar
            </span>
          );
      }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-32">
      <header className="mb-6 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white leading-none tracking-tight">Makanan Sekitar</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-xs font-bold">Surplus makanan layak konsumsi.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onOpenRequests} 
                className="p-3 text-stone-500 hover:text-blue-600 transition-colors bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 relative group"
                title="Pusat Permintaan"
            >
                <MessageSquare className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black rounded-full shadow-lg group-hover:scale-110 transition-transform">BUTUH</span>
            </button>
            <button 
                onClick={onOpenNotifications} 
                className="p-3 text-stone-500 hover:text-orange-500 transition-colors bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800"
            >
                <Bell className="w-6 h-6" />
            </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2">
          <Input 
              label="" 
              placeholder="Cari makanan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5 text-stone-400" />}
              className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm rounded-2xl"
              containerClassName="flex-1"
          />
          {onRefresh && (
              <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="w-14 h-14 bg-white dark:bg-stone-900 text-stone-500 hover:text-orange-500 border border-stone-200 dark:border-stone-800 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-90 disabled:opacity-50"
                  title="Refresh"
              >
                  <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
          )}
        </div>
        
        <div className="flex justify-between items-center gap-4">
             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
                {['all', 'pickup', 'delivery'].map(method => (
                    <button 
                        key={method}
                        onClick={() => setFilterMethod(method as any)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterMethod === method ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-stone-900 text-stone-500 border border-stone-200 dark:border-stone-800'}`}
                    >
                        {method === 'all' ? 'Semua' : method === 'pickup' ? 'Ambil Sendiri' : 'Diantar'}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 shrink-0">
                <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                    <button 
                        onClick={() => setLayoutMode('grid')}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${layoutMode === 'grid' ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setLayoutMode('list')}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${layoutMode === 'list' ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <StretchHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 animate-in fade-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-stone-200 dark:border-stone-800 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-orange-600 dark:text-orange-400 font-black text-xs uppercase tracking-[0.2em] mt-6 animate-pulse">
                    Mencari Makanan...
                </p>
            </div>
        ) : currentItems.length === 0 ? (
           <EmptyState 
             icon={Info} 
             title="Tidak Ada Makanan" 
             description={searchQuery ? `Tidak ditemukan makanan dengan kata kunci "${searchQuery}".` : "Belum ada donasi makanan yang tersedia."}
           />
        ) : (
            <>
                <div className={`grid gap-3 md:gap-5 ${layoutMode === 'grid' ? 'grid-cols-2 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {currentItems.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => onSelectItem(item)}
                        className={`
                            group bg-white dark:bg-stone-900 rounded-[1.5rem] border border-stone-200 dark:border-stone-800 
                            transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl cursor-pointer relative overflow-hidden flex
                            ${layoutMode === 'list' ? 'flex-row h-32 md:h-40 p-3 md:p-4 gap-4 md:gap-6' : 'flex-col p-3 md:p-4 gap-3'}
                        `}
                    >
                        <div className={`shrink-0 rounded-xl overflow-hidden bg-stone-100 relative ${layoutMode === 'list' ? 'w-28 md:w-36 h-full' : 'w-full aspect-square'}`}>
                            <img src={optimizeUnsplashUrl(item.imageUrl, layoutMode === 'list' ? 400 : 800)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            
                            <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">
                                <div className="bg-white/95 dark:bg-stone-900/80 backdrop-blur-md text-stone-900 dark:text-white px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-lg border border-white/20 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-green-500 fill-green-500" />
                                    <span>AI SCORE {item.aiVerification?.halalScore}</span>
                                </div>
                            </div>

                            <div className="absolute top-2 right-2 z-10">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleSave(item); }}
                                    className={`p-1.5 rounded-lg backdrop-blur-md shadow-sm border transition-all active:scale-90 ${
                                        savedIds.has(item.id) 
                                        ? 'bg-orange-500 border-orange-500 text-white' 
                                        : 'bg-white/80 dark:bg-stone-900/80 border-white/20 text-stone-600 dark:text-stone-300 hover:text-orange-500'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${savedIds.has(item.id) ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            <div className="absolute bottom-2 left-2 right-2">
                                <div className={`backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-bold text-white text-center border border-white/10 ${item.currentQuantity > 0 ? 'bg-black/60' : 'bg-red-600/80'}`}>
                                    {item.currentQuantity > 0 ? `Sisa ${item.currentQuantity}` : 'Habis'}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1 gap-1">
                                    <h3 className={`font-black text-stone-900 dark:text-white leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 ${layoutMode === 'grid' ? 'text-xs md:text-sm' : 'text-sm md:text-lg'}`}>
                                        {item.name}
                                    </h3>
                                </div>
                                
                                <div className="space-y-1 mt-1">
                                    <p className="text-[9px] font-bold text-stone-500 flex items-center gap-1 truncate">
                                        <StoreIcon className="w-3 h-3" /> {item.providerName}
                                    </p>
                                    <p className="text-stone-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Timer className="w-2.5 h-2.5" /> Exp: {formatDateTime(item.distributionEnd || item.expiryTime)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                                <div>
                                    {renderMethodBadge(item.deliveryMethod)}
                                </div>
                                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>

                {filteredFood.length > itemsPerPage && (
                    <div className="flex items-center justify-between pt-6 border-t border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredFood.length)} dari {filteredFood.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                            </button>
                            <span className="text-xs font-black text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-xl">
                                {currentPage}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};
