
import React, { useState, useEffect } from 'react';
import { Package, LayoutGrid, StretchHorizontal, Plus, Loader2, Lock, AlertCircle, MapPin } from 'lucide-react';
import { EmptyState } from '../../../common/EmptyState';
import { FoodItem, UserData } from '../../../../types';
import { QualityCheckInventory } from '../QualityCheckInventory';
import { ProductDetailModal } from './ProductDetailModal';
import { StockItemCard } from './StockItemCard';
import { StockHeader } from './StockHeader';
import { StockPagination } from './StockPagination';
import { InventoryNavigation } from '../InventoryNavigation';
import { Button } from '../../../components/Button';
import { db } from '../../../../services/db';
import { checkAndExpireItems } from '../../../../utils/expiryChecker';

const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 Minutes

interface StockManagerProps {
    foodItems: FoodItem[];
    setFoodItems: React.Dispatch<React.SetStateAction<FoodItem[]>>;
    currentView: 'stock' | 'orders' | 'history';
    setCurrentView: (view: 'stock' | 'orders' | 'history') => void;
    currentUser?: UserData | null;
    isLoading?: boolean;
    onRefresh?: () => void;
    onNavigate: (view: string) => void;
}

export const StockManager: React.FC<StockManagerProps> = ({ 
    foodItems, 
    setFoodItems, 
    currentView, 
    setCurrentView, 
    currentUser, 
    isLoading: isParentLoading,
    onRefresh: onParentRefresh,
    onNavigate
}) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<FoodItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    // Internal data fetching loading state
    const [isFetching, setIsFetching] = useState(true);
    
    // State to track if provider has setup an address
    const [hasAddress, setHasAddress] = useState<boolean | null>(null);

    // Function to fetch local specific data (Address & Inventory) with Caching Logic
    const fetchInventoryAndAddress = async (forceRefresh: boolean = false) => {
        const cacheKey = `far_inventory_${currentUser?.id}`;
        const addressCacheKey = `far_has_address_${currentUser?.id}`;
        
        // 1. Check Cache first if not forcing refresh
        if (!forceRefresh) {
            const cachedInventoryObj = localStorage.getItem(cacheKey);
            const cachedHasAddress = localStorage.getItem(addressCacheKey);
            
            if (cachedInventoryObj && cachedHasAddress !== null) {
                try {
                    const { data, timestamp } = JSON.parse(cachedInventoryObj);
                    const now = Date.now();
                    
                    // Check if cache is still valid (< 10 minutes)
                    if (now - timestamp < CACHE_EXPIRY_MS) {
                        console.log("%c[CACHE-VALID] Using local inventory & address data", "color: #c2410c; font-weight: bold;");
                        if (Array.isArray(data) && data.length > 0) {
                            setFoodItems(data);
                            setHasAddress(cachedHasAddress === 'true');
                            setIsFetching(false);
                            return; // EXIT EARLY
                        }
                    } else {
                        console.log("%c[CACHE-EXPIRED] Data is older than 10 mins, re-fetching...", "color: #ef4444; font-weight: bold;");
                    }
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
        }

        setIsFetching(true);
        try {
            // Pass currentUser.id to filter on backend
            const [inventoryData, addressData] = await Promise.all([
                db.getInventory(currentUser?.id),
                db.getAddresses(currentUser?.id)
            ]);

            if (inventoryData && Array.isArray(inventoryData)) {
                const processedInventory = await checkAndExpireItems(inventoryData);
                setFoodItems(processedInventory);
                // Save to Cache with TIMESTAMP
                localStorage.setItem(cacheKey, JSON.stringify({ 
                    data: processedInventory, 
                    timestamp: Date.now() 
                }));
            }

            // Check if address exists and save to Cache
            const exists = !!(addressData && addressData.length > 0);
            setHasAddress(exists);
            localStorage.setItem(addressCacheKey, String(exists));

        } catch (error) {
            console.error("Gagal memuat data:", error);
        } finally {
            setIsFetching(false);
        }
    };

    // Combined Refresh Handler
    const handleRefresh = async () => {
        // Call parent refresh (Global Data)
        if (onParentRefresh) {
            await onParentRefresh(); 
        }
        // Call local refresh with FORCE
        await fetchInventoryAndAddress(true);
    };

    // Gabungkan state loading internal dan dari parent (transisi)
    const showLoading = isFetching || isParentLoading;

    // FETCH DATA ON MOUNT
    useEffect(() => {
        if (currentUser?.id) {
            fetchInventoryAndAddress();
        } else {
            setIsFetching(false);
        }
    }, [currentUser?.id]);

    const handleAddNewItem = (newItem: FoodItem) => {
        // Optimistic Update: Tambahkan langsung ke state agar UI responsif
        const updatedItems = [newItem, ...foodItems];
        setFoodItems(updatedItems);
        setIsAddingNew(false);
        
        // Update Cache with timestamp
        localStorage.setItem(`far_inventory_${currentUser?.id}`, JSON.stringify({
            data: updatedItems,
            timestamp: Date.now()
        }));
    };

    const handleUpdateItem = (updatedItem: FoodItem) => {
        const updatedItems = foodItems.map(item => item.id === updatedItem.id ? updatedItem : item);
        setFoodItems(updatedItems);
        setSelectedProduct(updatedItem); 
        
        // Update Cache with timestamp
        localStorage.setItem(`far_inventory_${currentUser?.id}`, JSON.stringify({
            data: updatedItems,
            timestamp: Date.now()
        }));
    };

    const handleDeleteItem = (id: string) => {
        const updatedItems = foodItems.filter(item => item.id !== id);
        setFoodItems(updatedItems);
        setSelectedProduct(null);
        
        // Update Cache with timestamp
        localStorage.setItem(`far_inventory_${currentUser?.id}`, JSON.stringify({
            data: updatedItems,
            timestamp: Date.now()
        }));
    };

    // Backend now returns only the relevant items.
    const myItems = foodItems;

    // 2. Filter by Search Query
    const filteredItems = myItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    if (isAddingNew) {
        return (
            <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
                <QualityCheckInventory 
                    onBack={() => setIsAddingNew(false)} 
                    onSuccess={handleAddNewItem}
                    currentUser={currentUser} // PASS USER DATA
                />
            </div>
        );
    }

    if (selectedProduct) {
        return (
            <ProductDetailModal 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
            />
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto pb-32 animate-in fade-in slide-in-from-left-4">
            {/* 1. Header (Judul + Search + Refresh) */}
            <StockHeader 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onRefresh={handleRefresh}
                isLoading={showLoading}
            />

            {/* 2. Navigation Tab (Navbar Stok, Pesanan, Riwayat) */}
            <InventoryNavigation currentView={currentView} setCurrentView={setCurrentView} />
            
            {/* 3. Action & Toggle */}
            <div className="space-y-6">
                <div className="space-y-3">
                    {!showLoading && hasAddress === false && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex flex-col items-start gap-3 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-700 dark:text-red-400 text-xs uppercase tracking-wider mb-1">Akses Terkunci</h4>
                                    <p className="text-xs text-red-600/80 dark:text-red-300 leading-relaxed">
                                        Anda belum mengatur lokasi pengambilan. Silakan lengkapi <strong>Alamat</strong> di menu Profil untuk membuka fitur donasi.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => onNavigate('profile-address')}
                                className="ml-11 text-[10px] bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-xl font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            >
                                <MapPin className="w-3.5 h-3.5" /> Atur Alamat Pengambilan
                            </button>
                        </div>
                    )}

                    <Button 
                        onClick={() => setIsAddingNew(true)}
                        disabled={hasAddress === false || showLoading}
                        className={`w-full h-14 font-black uppercase tracking-widest rounded-2xl border-0 transition-all ${
                            (hasAddress === false || showLoading)
                            ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-xl shadow-orange-500/30 active:scale-[0.98]'
                        }`}
                    >
                        {showLoading ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> MEMERIKSA DATA...</span>
                        ) : hasAddress === false ? (
                            <span className="flex items-center gap-2"><Lock className="w-5 h-5" /> FITUR TERKUNCI</span>
                        ) : (
                            <span className="flex items-center gap-2"><Plus className="w-6 h-6" /> TAMBAH DONASI</span>
                        )}
                    </Button>
                </div>

                <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl w-full border border-stone-200 dark:border-stone-800">
                    <button 
                        onClick={() => setLayoutMode('grid')}
                        className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest ${layoutMode === 'grid' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden xs:inline">Grid</span>
                    </button>
                    <button 
                        onClick={() => setLayoutMode('list')}
                        className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest ${layoutMode === 'list' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                    >
                        <StretchHorizontal className="w-4 h-4" />
                        <span className="hidden xs:inline">List</span>
                    </button>
                </div>
            </div>
            
            {/* CONTENT AREA: Loading OR Data */}
            {showLoading ? (
                <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-orange-200 dark:border-stone-800 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <p className="text-orange-600 dark:text-orange-400 font-black text-xs uppercase tracking-[0.2em] mt-6 animate-pulse">
                        Memuat Data Stok...
                    </p>
                </div>
            ) : currentItems.length === 0 ? (
                <EmptyState 
                    icon={Package} 
                    title={searchQuery ? "Tidak Ditemukan" : "Inventory Kosong"} 
                    description={searchQuery ? `Tidak ada produk dengan kata kunci "${searchQuery}" di stok Anda.` : "Anda belum memiliki stok aktif. Mulai donasi sekarang!"}
                    // Jika address belum ada, hilangkan action button di empty state agar konsisten
                    actionLabel={searchQuery ? "Reset Pencarian" : (hasAddress !== false ? "Tambah Donasi" : undefined)}
                    onAction={searchQuery ? () => setSearchQuery('') : () => setIsAddingNew(true)}
                    className="mt-6"
                />
            ) : (
                <div className="mt-6">
                    <div className={`grid gap-3 md:gap-5 ${layoutMode === 'grid' ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {currentItems.map(item => (
                            <StockItemCard 
                                key={item.id} 
                                item={item} 
                                layoutMode={layoutMode} 
                                onClick={() => setSelectedProduct(item)} 
                            />
                        ))}
                    </div>

                    {filteredItems.length > itemsPerPage && (
                        <StockPagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            setCurrentPage={setCurrentPage} 
                            indexOfFirstItem={indexOfFirstItem} 
                            indexOfLastItem={indexOfLastItem} 
                            totalItems={filteredItems.length} 
                        />
                    )}
                </div>
            )}
        </div>
    );
};
