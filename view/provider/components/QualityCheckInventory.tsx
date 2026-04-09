import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShieldCheck, Zap, CheckCircle2, AlertOctagon, 
  Clock, List, FileText, ShieldAlert, BookOpen, AlertTriangle, Edit3, Save, X, Plus, Leaf, TrendingUp, Info, ChevronDown, Award, Loader2
} from 'lucide-react';
import { Button } from '../../components/Button';
import { FoodItem, UserData, Address } from '../../../types';
import { QualityCheckInventoryInput } from './QualityCheckInventoryInput';
import { db } from '../../../services/db';
import { ImpactBreakdownItem } from '../../../services/foodVerification';

interface QualityCheckInventoryProps {
  onBack: () => void;
  onSuccess: (item: FoodItem) => void;
  currentUser?: UserData | null; 
}

export const QualityCheckInventory: React.FC<QualityCheckInventoryProps> = ({ onBack, onSuccess, currentUser }) => {
  const [view, setView] = useState<'input' | 'result'>('input');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [activeCalcTab, setActiveCalcTab] = useState<'co2' | 'social'>('co2');
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  
  const [isPublishing, setIsPublishing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedReasoning, setEditedReasoning] = useState('');
  const [editedIngredients, setEditedIngredients] = useState<{name: string, category: string}[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  useEffect(() => {
      const loadAddresses = async () => {
          if (currentUser?.id) {
              try {
                  const addrs = await db.getAddresses(currentUser.id);
                  setUserAddresses(addrs);
              } catch (e) {
                  console.error("Failed to load addresses", e);
              }
          }
      };
      loadAddresses();
  }, [currentUser]);

  const handleAnalysisComplete = (result: any, image: string, data: any) => {
    setAnalysisResult(result);
    setPreviewImage(image);
    setFormData(data);
    setEditedReasoning(result.reasoning || '');
    setEditedIngredients(result.detectedItems || []);
    setView('result');
  };

  const handleAddIngredient = () => {
      if(newIngredient.trim()) {
          setEditedIngredients([...editedIngredients, { name: newIngredient, category: 'Lainnya' }]);
          setNewIngredient('');
      }
  };

  const handleRemoveIngredient = (index: number) => {
      setEditedIngredients(editedIngredients.filter((_, i) => i !== index));
  };

  const handleFinalPublish = async () => {
      if (!analysisResult || !formData || isPublishing) return;
      
      setIsPublishing(true);
      try {
          let imageUrl = previewImage || '';
          if (previewImage && previewImage.startsWith('data:image')) {
              try {
                  imageUrl = await db.uploadImage(previewImage, `food_${Date.now()}.jpg`, 'inventory');
              } catch (e: any) {
                  console.error("Image upload failed:", e);
                  if (e.message && (e.message.includes("DriveApp") || e.message.includes("izin"))) {
                      alert("GAGAL UPLOAD GAMBAR: Backend belum diotorisasi. Hubungi developer.");
                      setIsPublishing(false);
                      return; 
                  }
              }
          }

          const qtyNum = parseInt(formData.quantity) || 0;
          const providerName = currentUser?.name || "Restoran Berkah";
          const selectedAddress = userAddresses.find(a => a.id === formData.addressId) || userAddresses.find(a => a.isPrimary) || userAddresses[0];
          
          if (!selectedAddress) {
              alert("Anda belum memiliki alamat tersimpan. Mohon lengkapi profil.");
              setIsPublishing(false);
              return;
          }

          const locationForLocal = { 
              lat: selectedAddress.lat || -6.914744, 
              lng: selectedAddress.lng || 107.60981, 
              address: selectedAddress.fullAddress,
              addressId: selectedAddress.id 
          };

          const newItem: FoodItem = {
              id: "", 
              providerId: currentUser?.id, 
              name: formData.name,
              description: isEditing ? editedReasoning : analysisResult.reasoning, 
              quantity: `${formData.quantity} ${formData.quantityUnit}`,
              initialQuantity: qtyNum,
              currentQuantity: qtyNum,
              minQuantity: parseInt(formData.minClaim) || 1,
              maxQuantity: parseInt(formData.maxClaim) || qtyNum,
              expiryTime: formData.distributionEnd ? formData.distributionEnd.split('T')[1] : '23:59',
              createdAt: new Date().toISOString(),
              distributionStart: formData.distributionStart,
              distributionEnd: formData.distributionEnd,
              imageUrl: imageUrl,
              providerName: providerName, 
              location: locationForLocal,
              status: 'available',
              deliveryMethod: formData.deliveryMethod,
              aiVerification: { 
                  isEdible: analysisResult.qualityPercentage >= 70,
                  halalScore: analysisResult.halalScore || 100,
                  qualityScore: analysisResult.qualityPercentage || 0,
                  reason: isEditing ? editedReasoning : analysisResult.reasoning,
                  ingredients: (isEditing ? editedIngredients : analysisResult.detectedItems)
                      ?.map((i:any) => i.name)
                      .filter((name: string) => {
                          const allergens = [
                              ...(analysisResult.detectedAllergens || []),
                              ...(formData.allergens ? formData.allergens.split(',').map((s:string) => s.trim()) : [])
                          ].map(a => a.toLowerCase());
                          return !allergens.includes(name.toLowerCase());
                      }) || [],
                  allergens: Array.from(new Set([
                      ...(analysisResult.detectedAllergens || []),
                      ...(formData.allergens ? formData.allergens.split(',').map((s:string) => s.trim()) : [])
                  ]))
              },
              socialImpact: analysisResult.socialImpact
          };

          const savedItem = await db.addFoodItem(newItem);
          const finalItem = { ...newItem, ...savedItem, location: locationForLocal };
          onSuccess(finalItem);

      } catch (error) {
          console.error("Failed to publish item:", error);
          alert("Gagal menyimpan produk.");
      } finally {
          setIsPublishing(false);
      }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm min-h-[80vh] flex flex-col relative overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between sticky top-0 bg-white dark:bg-stone-900 z-10 text-stone-900 dark:text-white">
            <div className="flex items-center gap-3">
                <button onClick={view === 'result' ? () => setView('input') : onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold">
                    {view === 'input' ? 'Daftarkan Donasi Baru' : 'Hasil Audit Kualitas AI'}
                </h2>
            </div>
            {view === 'result' && analysisResult?.qualityPercentage >= 70 && (
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isPublishing}
                    className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${isEditing ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                    {isEditing ? <><Save className="w-4 h-4" /> Simpan</> : <><Edit3 className="w-4 h-4" /> Edit Data</>}
                </button>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 md:px-8">
            {view === 'input' ? (
                <QualityCheckInventoryInput onAnalysisComplete={handleAnalysisComplete} onBack={onBack} addresses={userAddresses} />
            ) : (
                <div className="w-full max-w-3xl mx-auto py-8 space-y-8 pb-32 animate-in slide-in-from-bottom-12 duration-700">
                     
                     <div className="bg-[#1A1D27] dark:bg-[#0F1117] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
                        <div className="relative z-10">
                            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">QUALITY PERCENTAGE</p>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <div className="text-8xl font-black text-[#00E676] tracking-tighter italic leading-none">{analysisResult.qualityPercentage}%</div>
                                <div className={`inline-flex px-6 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest ${analysisResult.qualityPercentage >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {analysisResult.qualityPercentage >= 70 ? (
                                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> APPROVED</span>
                                    ) : (
                                        <span className="flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> REJECTED</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center">
                                    <p className="text-stone-500 text-[9px] font-black uppercase tracking-widest mb-1">HYGIENE SCORE</p>
                                    <p className="text-2xl font-bold flex items-center gap-2 text-yellow-400"><Zap className="w-5 h-5 fill-current" /> {analysisResult.hygieneScore}/100</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-indigo-500/20 p-4 rounded-3xl border border-indigo-500/30 flex flex-col justify-center">
                                        <p className="text-indigo-300 text-[8px] font-black uppercase tracking-widest mb-1">SOCIAL SCORE</p>
                                        <p className="text-lg font-bold flex items-center gap-1 text-white"><TrendingUp className="w-4 h-4" /> +{analysisResult.socialImpact?.totalPoints || 0}</p>
                                    </div>
                                    <div className="bg-emerald-500/20 p-4 rounded-3xl border border-emerald-500/30 flex flex-col justify-center">
                                        <p className="text-emerald-300 text-[8px] font-black uppercase tracking-widest mb-1">CO2 SAVED</p>
                                        <p className="text-lg font-bold flex items-center gap-1 text-white"><Leaf className="w-4 h-4" /> {analysisResult.socialImpact?.co2Saved || 0}kg</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button 
                                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                                    className="flex items-center gap-2 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-widest px-2"
                                >
                                    <Info className="w-3.5 h-3.5" /> Info Metodologi AI
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isInfoExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <div className={`overflow-hidden transition-all duration-500 ${isInfoExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                    <div className="bg-black/40 border border-[#2C1810] rounded-2xl p-5 space-y-6">
                                        <div className="flex bg-stone-900/50 p-1 rounded-xl border border-white/5">
                                            <button onClick={() => setActiveCalcTab('co2')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeCalcTab === 'co2' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-50'}`}>
                                                <Leaf className="w-3 h-3" /> CO2 Saved Breakdown
                                            </button>
                                            <button onClick={() => setActiveCalcTab('social')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeCalcTab === 'social' ? 'bg-indigo-600 text-white shadow-lg' : 'text-stone-50'}`}>
                                                <Award className="w-3 h-3" /> Social Score Breakdown
                                            </button>
                                        </div>

                                        {/* DYNAMIC BREAKDOWN DISPLAY */}
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div>
                                                <p className="font-bold text-stone-400 mb-3 text-[10px] uppercase tracking-widest">
                                                    METODOLOGI PERHITUNGAN (LCA STANDARD)
                                                </p>
                                                <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-6">
                                                    <code className={`block text-[10px] font-mono ${activeCalcTab === 'co2' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                        {activeCalcTab === 'co2' 
                                                            ? 'CO2 Saved = Σ (Berat Komponen x Faktor Emisi Kategori)' 
                                                            : 'Total Poin = Σ (Berat Komponen x Faktor Dampak Sosial)'}
                                                    </code>
                                                </div>

                                                {/* SECTION 1: ANALISIS KANDUNGAN PER 1 PORSI */}
                                                <div className="flex justify-between items-end mb-2">
                                                    <p className="font-bold text-stone-300 text-[10px] uppercase tracking-widest">
                                                        ANALISIS KANDUNGAN PER 1 PORSI
                                                    </p>
                                                    <span className="text-[10px] font-black text-orange-500">
                                                        Bobot: {(formData.weightPerUnit || 500)}g
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2 mb-6">
                                                    {(activeCalcTab === 'co2' 
                                                        ? analysisResult.socialImpact?.co2Breakdown 
                                                        : analysisResult.socialImpact?.socialBreakdown
                                                    )?.map((item: ImpactBreakdownItem, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-[11px] border-b border-white/10 pb-1 last:border-0">
                                                            <span className="text-stone-300">{item.name}</span>
                                                            <div className="text-right font-mono">
                                                                <span className="text-stone-500">{item.weightKg}kg</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/20">
                                                        <span className="text-[10px] font-bold text-stone-400">Total {activeCalcTab === 'co2' ? 'CO2' : 'Poin'} (1 Porsi)</span>
                                                        <span className={`font-black text-sm ${activeCalcTab === 'co2' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                            {activeCalcTab === 'co2' 
                                                                ? `${analysisResult.socialImpact?.co2PerPortion} kg CO2`
                                                                : `${analysisResult.socialImpact?.pointsPerPortion} Pts`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* SECTION 2: AKUMULASI TOTAL */}
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6 text-center">
                                                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">AKUMULASI TOTAL DONASI</p>
                                                    <p className="text-xl font-black text-white">
                                                        {activeCalcTab === 'co2' ? analysisResult.socialImpact?.co2PerPortion : analysisResult.socialImpact?.pointsPerPortion} 
                                                        <span className="text-stone-500 text-sm mx-2">x</span> 
                                                        <span className="text-orange-500">{analysisResult.socialImpact?.portionCount} Porsi</span> 
                                                        <span className="text-stone-500 text-sm mx-2">=</span> 
                                                        <span className={`${activeCalcTab === 'co2' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                                            {activeCalcTab === 'co2' 
                                                                ? `${analysisResult.socialImpact?.co2Saved} kg`
                                                                : `${analysisResult.socialImpact?.totalPoints}`
                                                            }
                                                        </span>
                                                    </p>
                                                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${activeCalcTab === 'co2' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                                        {activeCalcTab === 'co2' ? 'CO2' : 'POIN'}
                                                    </p>
                                                </div>

                                                {/* SECTION 3: RINCIAN TOTAL */}
                                                <p className="font-bold text-orange-500 mb-2 text-[10px] uppercase tracking-widest">
                                                    PERHITUNGAN LEBIH LANJUT (BATCH TOTAL)
                                                </p>
                                                <p className="text-[9px] font-bold text-stone-500 mb-2 uppercase tracking-widest">
                                                    RINCIAN KOMPONEN TERDETEKSI:
                                                </p>

                                                <div className="space-y-3">
                                                    {(activeCalcTab === 'co2' 
                                                        ? analysisResult.socialImpact?.co2Breakdown 
                                                        : analysisResult.socialImpact?.socialBreakdown
                                                    )?.map((item: ImpactBreakdownItem, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2 last:border-0">
                                                            <div className="flex flex-col">
                                                                <span className="text-stone-300 font-bold">{item.name}</span>
                                                            </div>
                                                            <div className="text-right font-mono">
                                                                <div className="text-stone-400 text-[9px]">
                                                                    {item.weightKg}kg x {analysisResult.socialImpact?.portionCount} x {item.factor} =
                                                                </div>
                                                                <span className={`font-bold ${activeCalcTab === 'co2' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                                    {(item.result * (analysisResult.socialImpact?.portionCount || 1)).toFixed(1)} {activeCalcTab === 'co2' ? 'kg' : 'pts'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-3 border-t-2 border-white/10 flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">TOTAL {activeCalcTab === 'co2' ? 'EMISI' : 'POIN'}</span>
                                                        <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">TERCEGAH</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-xl font-black block leading-none ${activeCalcTab === 'co2' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                                            {activeCalcTab === 'co2' 
                                                                ? `${analysisResult.socialImpact?.co2Saved} kg`
                                                                : `${analysisResult.socialImpact?.totalPoints}`
                                                            }
                                                        </span>
                                                        <span className={`text-[10px] font-bold uppercase ${activeCalcTab === 'co2' ? 'text-emerald-700' : 'text-indigo-700'}`}>
                                                            {activeCalcTab === 'co2' ? 'CO2' : 'POIN'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 mt-6 border-t border-white/10">
                                <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> DESKRIPSI HASIL ANALISIS</h4>
                                <div className={`bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4 ${isEditing ? 'ring-2 ring-orange-500/50' : ''}`}>
                                    {isEditing ? (
                                        <textarea value={editedReasoning} onChange={(e) => setEditedReasoning(e.target.value)} className="w-full bg-black/20 text-white p-3 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-orange-500" rows={4} />
                                    ) : (
                                        <p className="text-stone-200 text-sm leading-relaxed font-medium italic">"{editedReasoning || analysisResult.reasoning}"</p>
                                    )}
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                         <div className="space-y-4">
                            <h4 className="font-black text-sm text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2"><List className="w-4 h-4 text-orange-500" /> Item Terdeteksi dalam Foto</h4>
                            <div className="flex flex-wrap gap-2">
                                {(isEditing ? editedIngredients : (analysisResult.detectedItems || []))
                                    .filter((item: any) => {
                                        const allergens = (analysisResult.detectedAllergens || []).map((a: string) => a.toLowerCase());
                                        return !allergens.includes(item.name.toLowerCase());
                                    })
                                    .map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
                                        <span className="text-sm font-black text-blue-700 dark:text-blue-300 uppercase tracking-tighter">{item.name}</span>
                                        {isEditing && <button onClick={() => handleRemoveIngredient(i)} className="ml-1 p-0.5 bg-red-100 rounded-full text-red-500 hover:bg-red-200"><X className="w-3 h-3" /></button>}
                                    </div>
                                ))}
                            </div>
                         </div>
  
                         {/* DOUBLE BADGE SYSTEM: ALLERGENS */}
                         <div className="space-y-4 animate-in slide-in-from-left-4 duration-500">
                            <h4 className="font-black text-sm text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> Peringatan Alergen
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {analysisResult.detectedAllergens && analysisResult.detectedAllergens.length > 0 ? (
                                    analysisResult.detectedAllergens.map((allergen: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl">
                                            <span className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tighter">{allergen}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-stone-400 italic px-1">Tidak ada alergen kritis terdeteksi.</p>
                                )}
                            </div>
                         </div>
                      </div>
 
                      <div className="grid grid-cols-1 gap-4">
                         <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                             <h4 className="font-black text-xs text-stone-900 dark:text-white uppercase mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Masa Simpan Aman</h4>
                             <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Prediksi hingga: <span className="text-blue-600 dark:text-blue-400">{analysisResult.shelfLifePrediction}</span></p>
                         </div>
                      </div>
 
                      {analysisResult.qualityPercentage >= 70 && (
                         <Button 
                             onClick={handleFinalPublish} 
                             isLoading={isPublishing}
                             disabled={isPublishing}
                             className="h-16 text-lg font-black tracking-widest uppercase shadow-xl shadow-orange-500/20 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500"
                         >
                             {isPublishing ? 'MENYIMPAN KE DATABASE...' : <><Plus className="w-6 h-6 mr-2" /> PUBLIKASIKAN PRODUK</>}
                         </Button>
                      )}
                 </div>
            )}
        </div>
    </div>
  );
};
