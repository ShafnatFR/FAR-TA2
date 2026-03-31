
import React, { useState, useEffect, useMemo } from 'react';
import { Truck, ArrowRight, MapPin, X, Navigation, MessageCircle, ArrowDown, CheckCircle2, Clock, PackageCheck, UserCheck, Phone, Box, ShieldCheck, Bike, Car, Loader2, Search, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { DistributionTask, ClaimHistoryItem, UserData, FoodItem, Address } from '../../../types';

interface ExtendedDistributionTask extends DistributionTask {
    volunteerId?: string;
    // Expanded Data for Detail View
    fullData: {
        donorName: string;
        donorPhone: string;
        donorLocation: string;
        receiverName: string;
        receiverPhone: string;
        receiverLocation: string;
        items: string;
        quantity: string;
        imageUrl: string;
        description: string;
        ingredients: string[];
        points: number;
        foodCondition: number;
        distanceStr: string;
        vehicle: string;
        status: string;
    }
}

interface DistributionProps {
    claims?: ClaimHistoryItem[];
    users?: UserData[]; // Users data for phone lookup
    inventory?: FoodItem[]; // Inventory for ingredients lookup
    allAddresses?: Address[];
    onRefresh?: () => void;
    currentUser?: UserData | null;
}

export const Distribution: React.FC<DistributionProps> = ({ claims = [], users = [], inventory = [], allAddresses = [], onRefresh, currentUser }) => {
  const [activeDeliveries, setActiveDeliveries] = useState<ExtendedDistributionTask[]>([]);
  const [showAssignVolunteerModal, setShowAssignVolunteerModal] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<ExtendedDistributionTask | null>(null);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [volunteerSearch, setVolunteerSearch] = useState('');

  // Filter Real Volunteers from users list
  const availableVolunteers = useMemo(() => {
      const volds = users.filter(u => 
        (u.role === 'RELAWAN' || u.role === 'volunteer') && 
        u.status?.toLowerCase() === 'active'
      );
      
      if (!volunteerSearch.trim()) return volds;
      return volds.filter(v => v.name.toLowerCase().includes(volunteerSearch.toLowerCase()));
  }, [users, volunteerSearch]);

  // Perbarui list hanya jika data claims berubah
  useEffect(() => {
      const tasks: ExtendedDistributionTask[] = claims
        // FILTER: Hanya tampilkan yang deliveryMethod-nya 'delivery'
        .filter(c => c.deliveryMethod === 'delivery' || c.deliveryMethod === 'BOTH')
        .map(c => {
            // 1. Lookup Provider Info
            const providerUser = users.find(u => String(u.id).trim() === String(c.providerId).trim());
            const providerAddr = allAddresses.find(a => String(a.userId) === String(c.providerId) && a.isPrimary) || allAddresses.find(a => String(a.userId) === String(c.providerId));
            const donorName = providerAddr ? providerAddr.label : c.providerName;
            const donorPhone = providerUser?.phone || providerAddr?.phone || '6285215376975'; 
            const donorLocation = providerAddr?.fullAddress || c.location?.address || 'Lokasi Donatur';

            // 2. Lookup Receiver Info
            const receiverUser = users.find(u => String(u.id).trim() === String(c.receiverId).trim());
            const receiverAddr = allAddresses.find(a => String(a.userId) === String(c.receiverId) && a.isPrimary) || allAddresses.find(a => String(a.userId) === String(c.receiverId));
            const receiverName = receiverAddr ? receiverAddr.label : (c.receiverName || 'Penerima');
            const receiverPhone = c.receiverPhone || receiverUser?.phone || receiverAddr?.phone || '6285215376975';
            const receiverLocation = receiverAddr?.fullAddress || (c as any).receiverLocation?.address || 'Lokasi Penerima';

            // 3. Lookup Food Details
            const foodItem = inventory.find(i => String(i.id).trim() === String(c.foodId).trim());
            const ingredients = foodItem?.aiVerification?.ingredients || [];
            
            // Logic Vehicle Recommendation
            const isLargeQuantity = (c.claimedQuantity || '').toLowerCase().includes('box') && parseInt(c.claimedQuantity || '0') > 5;
            const vehicle = isLargeQuantity ? 'Mobil' : 'Motor';

            return {
                id: c.id,
                volunteer: c.courierName || 'Belum Ditugaskan',
                volunteerId: c.volunteerId,
                from: donorName,
                to: receiverName,
                status: c.status === 'completed' ? 'completed' : c.courierStatus === 'picking_up' ? 'picking_up' : c.courierStatus === 'delivering' ? 'delivering' : 'pending',
                startTime: c.date,
                priority: 'normal',
                distance: '2.5 km',
                fullData: {
                    donorName: donorName,
                    donorPhone,
                    donorLocation,
                    receiverName: receiverName,
                    receiverPhone,
                    receiverLocation,
                    items: c.foodName,
                    quantity: c.claimedQuantity || '1 Porsi',
                    imageUrl: c.imageUrl,
                    description: c.description || 'Tidak ada deskripsi',
                    ingredients,
                    points: 150, 
                    foodCondition: 100,
                    distanceStr: '2.5 km',
                    vehicle,
                    status: c.status
                }
            };
        });
      setActiveDeliveries(tasks);
  }, [claims, users, inventory, allAddresses]);

  const handleAssignVolunteer = async (claimId: string, volunteer: UserData) => {
      setIsAssigning(volunteer.id);
      try {
          const { db } = await import('../../../services/db');
          await db.assignVolunteer(claimId, volunteer.id, volunteer.name, currentUser);
          
          if (onRefresh) onRefresh();
          setShowAssignVolunteerModal(null);
          setVolunteerSearch('');
      } catch (err) {
          console.error("Assignment failed:", err);
          alert("Gagal menugaskan relawan. Silakan coba lagi.");
      } finally {
          setIsAssigning(null);
      }
  };

  // Helper untuk membuka WhatsApp
  const openWhatsApp = (phone: string, message: string) => {
      let targetPhone = "";
      if (phone && phone.length > 5) {
          let cleanPhone = phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('0')) {
              targetPhone = '62' + cleanPhone.slice(1);
          } else if (cleanPhone.startsWith('62')) {
              targetPhone = cleanPhone;
          } else {
              targetPhone = '62' + cleanPhone;
          }
      } else {
          // Fallback Default Admin
          targetPhone = "6285215376975";
      }
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // REAL-TIME LOOKUP FUNCTION
  const getVolunteerPhone = (name: string, id?: string): string => {
      if (id) {
          const userById = users.find(u => String(u.id).trim() === String(id).trim());
          if (userById && userById.phone) return userById.phone;
      }
      if (name) {
          const userByName = users.find(u => u.name.trim().toLowerCase() === name.trim().toLowerCase());
          if (userByName && userByName.phone) return userByName.phone;
          
          const userByFuzzy = users.find(u => 
              u.name.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(u.name.toLowerCase())
          );
          if (userByFuzzy && userByFuzzy.phone) return userByFuzzy.phone;
      }
      return "";
  };

  const handleChatVolunteer = (volunteerName: string, volunteerId?: string) => {
      const phone = getVolunteerPhone(volunteerName, volunteerId);
      const message = `Halo Relawan ${volunteerName}, saya Admin Logistik Food AI Rescue. Status pengiriman bagaimana?`;
      openWhatsApp(phone, message);
  };

  const handleChatDonor = (data: ExtendedDistributionTask['fullData']) => {
      const message = `Halo Donatur *${data.donorName}*, saya Admin Food AI Rescue. Terkait pengambilan donasi *${data.items}*...`;
      openWhatsApp(data.donorPhone, message);
  };

  const handleChatReceiver = (data: ExtendedDistributionTask['fullData']) => {
      const message = `Halo Penerima *${data.receiverName}*, saya Admin Food AI Rescue. Terkait pengiriman donasi *${data.items}*...`;
      openWhatsApp(data.receiverPhone, message);
  };

  const pendingCount = activeDeliveries.filter(d => d.status === 'pending').length;
  const activeCount = activeDeliveries.filter(d => d.status === 'picking_up' || d.status === 'delivering').length;

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter">
                <Truck className="w-8 h-8 text-orange-600" /> Distribusi & Logistik
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.5rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Pengiriman</h4>
                <p className="text-3xl font-black text-stone-900 dark:text-white italic">{activeDeliveries.length}</p>
            </div>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.5rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Sedang Berjalan</h4>
                <p className="text-3xl font-black text-orange-600 italic">{activeCount}</p>
            </div>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.5rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Butuh Relawan</h4>
                <p className="text-3xl font-black text-red-500 italic">{pendingCount}</p>
            </div>
        </div>

        <div className="space-y-4">
            {activeDeliveries.length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-bold uppercase text-xs tracking-widest">Belum ada aktivitas distribusi aktif (Delivery Only).</div>
            ) : (
                activeDeliveries.map(task => (
                    <div key={task.id} className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-orange-500/30 transition-all gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-black bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded text-stone-500 tracking-widest">{task.id}</span>
                                <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <div>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Asal</p>
                                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{task.from}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-orange-500 hidden md:block" />
                                <div>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tujuan</p>
                                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{task.to}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Relawan</p>
                                    <p className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase italic">{task.volunteer}</p>
                                </div>
                                {(task.volunteer !== 'Belum Ditugaskan' && task.volunteer !== 'Selesai') && (
                                    <Button 
                                        onClick={() => handleChatVolunteer(task.volunteer, task.volunteerId)} 
                                        className="h-10 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-green-500/20 flex items-center gap-2 rounded-xl w-auto"
                                    >
                                        <MessageCircle className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Chat WA</span>
                                    </Button>
                                )}
                            </div>
                            
                            {task.status === 'pending' ? (
                                <Button className="h-10 text-[10px] font-black tracking-widest px-6 w-full md:w-auto" onClick={() => setShowAssignVolunteerModal(task.id)}>TUGASKAN</Button>
                            ) : (
                                <Button variant="outline" className="h-10 text-[10px] font-black tracking-widest px-6 border-2 w-full md:w-auto" onClick={() => setShowDetailModal(task)}>DETAIL STATUS</Button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* MISSION DETAIL MODAL */}
        {showDetailModal && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-stone-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/5 flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                        <div>
                            <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase italic tracking-tighter">Mission Control</h3>
                            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">ID: {showDetailModal.id} • Relawan: {showDetailModal.volunteer}</p>
                        </div>
                        <button onClick={() => setShowDetailModal(null)} className="p-3 bg-white dark:bg-stone-800 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors border border-stone-200 dark:border-stone-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#FDFBF7] dark:bg-stone-900">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/3 aspect-square md:aspect-video rounded-3xl overflow-hidden relative shadow-lg group">
                                <img src={showDetailModal.fullData.imageUrl} alt="Food" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                                    <h4 className="text-white font-black text-lg leading-tight">{showDetailModal.fullData.items}</h4>
                                    <p className="text-white/80 text-xs font-medium">{showDetailModal.fullData.quantity}</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex flex-col justify-center items-center text-center">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Transportasi</p>
                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-black text-xl">
                                        {showDetailModal.fullData.vehicle === 'Motor' ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                                        {showDetailModal.fullData.vehicle}
                                    </div>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 flex flex-col justify-center items-center text-center">
                                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2">Jarak Tempuh</p>
                                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-xl">
                                        <Navigation className="w-6 h-6" /> {showDetailModal.fullData.distanceStr}
                                    </div>
                                </div>
                                <div className="col-span-2 bg-white dark:bg-stone-800 p-5 rounded-[2rem] border border-stone-200 dark:border-stone-700">
                                    <h5 className="font-black text-xs text-stone-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Kondisi Paket</h5>
                                    <p className="text-sm text-stone-600 dark:text-stone-300 italic">"{showDetailModal.fullData.description}"</p>
                                    {showDetailModal.fullData.ingredients.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {showDetailModal.fullData.ingredients.map((ing, i) => (
                                                <span key={i} className="text-[9px] font-bold bg-stone-100 dark:bg-stone-900 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 text-stone-500">{ing}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800">
                            <h3 className="font-black text-stone-900 dark:text-white uppercase italic tracking-tighter mb-8 text-lg">Logistik & Kontak</h3>
                            
                            <div className="relative pl-4 space-y-10 border-l-2 border-dashed border-stone-200 dark:border-stone-700 ml-2">
                                <div className="relative">
                                    <div className="absolute -left-[23px] top-0 w-6 h-6 bg-orange-500 rounded-full border-4 border-white dark:border-stone-900 shadow-sm flex items-center justify-center text-[10px] text-white font-bold">1</div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">TITIK PENJEMPUTAN (DONATUR)</p>
                                            <h4 className="font-bold text-stone-900 dark:text-white text-lg">{showDetailModal.fullData.donorName}</h4>
                                            <p className="text-xs text-stone-500 mt-0.5 max-w-md">{showDetailModal.fullData.donorLocation}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleChatDonor(showDetailModal.fullData)}
                                            className="h-10 w-auto px-5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-green-600 hover:bg-green-50 text-[10px] font-black uppercase tracking-widest shadow-none border border-stone-200 dark:border-stone-700 flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Hubungi Donatur
                                        </Button>
                                    </div>
                                </div>

                                <div className="ml-4 p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                                    <StatusStep 
                                        icon={<Clock className="w-4 h-4" />}
                                        title="Menuju Lokasi"
                                        description="Relawan sedang bergerak ke titik jemput"
                                        status={showDetailModal.status !== 'pending' ? 'completed' : 'active'}
                                        isLast={false}
                                    />
                                    <StatusStep 
                                        icon={<PackageCheck className="w-4 h-4" />}
                                        title="Barang Diambil"
                                        description="Donasi telah divalidasi dan dibawa relawan"
                                        status={showDetailModal.status === 'delivering' || showDetailModal.status === 'completed' ? 'completed' : showDetailModal.status === 'picking_up' ? 'active' : 'pending'}
                                        isLast={false}
                                    />
                                    <StatusStep 
                                        icon={<UserCheck className="w-4 h-4" />}
                                        title="Selesai Diantar"
                                        description="Donasi diterima oleh penerima manfaat"
                                        status={showDetailModal.status === 'completed' ? 'completed' : showDetailModal.status === 'delivering' ? 'active' : 'pending'}
                                        isLast={true}
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[23px] top-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-stone-900 shadow-sm flex items-center justify-center text-[10px] text-white font-bold">2</div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">TITIK PENGANTARAN (PENERIMA)</p>
                                            <h4 className="font-bold text-stone-900 dark:text-white text-lg">{showDetailModal.fullData.receiverName}</h4>
                                            <p className="text-xs text-stone-500 mt-0.5 max-w-md">{showDetailModal.fullData.receiverLocation}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleChatReceiver(showDetailModal.fullData)}
                                            className="h-10 w-auto px-5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-green-600 hover:bg-green-50 text-[10px] font-black uppercase tracking-widest shadow-none border border-stone-200 dark:border-stone-700 flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Hubungi Penerima
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-stone-500">Relawan Bertugas:</span>
                            <div className="flex items-center gap-2 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-black uppercase text-stone-800 dark:text-white">{showDetailModal.volunteer}</span>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleChatVolunteer(showDetailModal.volunteer, showDetailModal.volunteerId)}
                            className="w-auto h-12 px-6 bg-[#25D366] hover:bg-[#128C7E] text-white border-0 shadow-lg shadow-green-500/20 font-black uppercase tracking-widest rounded-2xl text-xs flex items-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" /> Chat Relawan
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* ASSIGN VOLUNTEER MODAL */}
        {showAssignVolunteerModal && (
            <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] w-full max-w-md border-2 border-orange-500/10 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-black text-2xl text-stone-900 dark:text-white uppercase italic tracking-tight">Tugaskan Relawan</h3>
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Sistem Logistik Food AI Rescue</p>
                        </div>
                        <button onClick={() => setShowAssignVolunteerModal(null)} className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="space-y-6">
                        {/* Search Box */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cari nama relawan..." 
                                className="w-full pl-12 pr-4 py-4 bg-stone-100 dark:bg-stone-800 border-none rounded-2xl text-stone-800 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                value={volunteerSearch}
                                onChange={(e) => setVolunteerSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                            {availableVolunteers.length === 0 ? (
                                <div className="text-center py-10">
                                    <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Tidak ada relawan tersedia.</p>
                                </div>
                            ) : (
                                availableVolunteers.map(vol => (
                                    <button 
                                        key={vol.id}
                                        disabled={isAssigning !== null}
                                        onClick={() => handleAssignVolunteer(showAssignVolunteerModal, vol)} 
                                        className={`w-full p-4 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500/50 border border-transparent rounded-2xl transition-all group ${isAssigning === vol.id ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-white">
                                                <img src={vol.avatar} alt={vol.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-black text-stone-900 dark:text-white text-sm leading-tight italic">{vol.name}</p>
                                                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">{vol.points} Poin • Aktif</p>
                                            </div>
                                        </div>
                                        {isAssigning === vol.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                        ) : (
                                            <div className="bg-white dark:bg-stone-700 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                        <Button variant="ghost" className="w-full h-14 font-black uppercase tracking-widest text-[10px] border-2 border-stone-100 dark:border-stone-800 text-stone-400" onClick={() => setShowAssignVolunteerModal(null)}>BATALKAN PENUGASAN</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// HELPER COMPONENT UNTUK LANGKAH STATUS
const StatusStep = ({ icon, title, description, status, isLast }: { icon: React.ReactNode, title: string, description: string, status: 'completed' | 'active' | 'pending', isLast: boolean }) => {
    return (
        <div className="flex flex-col items-center">
            <div className="flex items-start gap-4 w-full">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                    status === 'completed' ? 'bg-green-600 text-white' : 
                    status === 'active' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 
                    'bg-stone-200 dark:bg-stone-800 text-stone-400'
                }`}>
                    {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : icon}
                </div>
                <div className="flex-1 pt-0.5">
                    <h4 className={`text-xs font-black uppercase tracking-tight ${status === 'pending' ? 'text-stone-400' : 'text-stone-900 dark:text-white'}`}>
                        {title}
                    </h4>
                    <p className={`text-[9px] font-medium leading-relaxed ${status === 'pending' ? 'text-stone-400' : 'text-stone-500'}`}>
                        {description}
                    </p>
                </div>
            </div>
            {!isLast && (
                <div className="flex justify-center w-8 mr-auto ml-0 my-1">
                    <ArrowDown className={`w-3 h-3 ${status === 'completed' ? 'text-green-600' : 'text-stone-200 dark:text-stone-800'}`} />
                </div>
            )}
        </div>
    );
};
