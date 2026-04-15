
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Sparkles, Share2, Loader2, Copy, Check, Save, Edit3, Send, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '../components/Button';
import { db } from '../../services/db';
import { contentWriter } from '../../services/contentWriter';
import { UserData, FoodItem } from '../../types';

interface CSRWriterEditorProps {
    currentUser: UserData | null;
    foodItems: FoodItem[];
    onBack: () => void;
}

export const CSRWriterEditor: React.FC<CSRWriterEditorProps> = ({ currentUser, foodItems, onBack }) => {
    const [selectedFoodId, setSelectedFoodId] = useState<string>(foodItems[0]?.id || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableContent, setEditableContent] = useState('');
    const [resultTitle, setResultTitle] = useState('');
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredItems = useMemo(() => {
        return foodItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [foodItems, searchTerm]);

    const handleGenerate = async () => {
        const product = foodItems.find(f => f.id === selectedFoodId);
        if (!product) return alert("Pilih produk untuk mendapatkan konteks dampak.");

        setIsGenerating(true);
        try {
            const content = await contentWriter.writeCSR({
                foodName: product.name,
                donorName: currentUser?.name || "Perusahaan Kami",
                impactPoints: Math.round(Math.random() * 500 + 100), 
                co2Saved: parseFloat((Math.random() * 30 + 5).toFixed(1))
            }, currentUser?.role || 'corporate_donor');
            
            setResultTitle(`Impact Report: ${product.name}`);
            setEditableContent(content);
            setIsEditing(true);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!currentUser?.id || !editableContent) return;
        
        setIsSaving(true);
        try {
            await db.saveCorporateAIResult({
                donorId: currentUser.id,
                foodId: selectedFoodId ? Number(selectedFoodId) : 0,
                type: 'CSR_COPY',
                title: resultTitle,
                content: editableContent
            });
            alert("Berhasil disimpan ke riwayat Anda!");
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(editableContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-stone-950 flex flex-col md:max-w-5xl md:mx-auto md:relative md:h-[95vh] md:rounded-[3rem] md:shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <header className="p-6 flex items-center justify-between bg-white/80 dark:bg-stone-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-100 dark:border-stone-900">
                <button 
                    onClick={onBack}
                    className="p-3 bg-stone-100 dark:bg-stone-900 rounded-2xl text-stone-600 dark:text-stone-300 active:scale-90 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center flex-1">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white leading-none tracking-tight uppercase italic flex items-center justify-center gap-2">
                        <Share2 className="w-5 h-5 text-pink-500" /> CSR Copywriter
                    </h2>
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mt-1">Impact Storyteller AI</p>
                </div>
                <div className="w-11"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Controls (4/12) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">Konteks Produk</h3>
                                <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-stone-800 shadow-sm text-pink-600' : 'text-stone-400'}`}
                                    >
                                        <LayoutGrid className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-stone-800 shadow-sm text-pink-600' : 'text-stone-400'}`}
                                    >
                                        <List className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari Riwayat..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 focus:border-pink-500 focus:outline-none text-[11px] font-bold"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                {filteredItems.length === 0 ? (
                                    <p className="text-[10px] text-stone-400 font-medium p-4 text-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-2xl">Menu tidak ditemukan.</p>
                                ) : (
                                    <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {filteredItems.map(f => (
                                            <button 
                                                key={f.id}
                                                onClick={() => setSelectedFoodId(f.id)}
                                                className={`relative transition-all group overflow-hidden rounded-[1.5rem] border-2 ${viewMode === 'grid' ? 'aspect-square' : 'p-3 flex items-center gap-3'} ${selectedFoodId === f.id ? 'border-pink-500 shadow-lg shadow-pink-500/20 bg-pink-50/50 dark:bg-pink-900/10' : 'border-stone-100 dark:border-stone-800'}`}
                                            >
                                                <img src={f.imageUrl} alt={f.name} className={`${viewMode === 'grid' ? 'absolute inset-0' : 'w-10 h-10 rounded-xl'} object-cover`} />
                                                {viewMode === 'grid' && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />}
                                                <div className={`${viewMode === 'grid' ? 'absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent' : 'flex-1 text-left line-clamp-1'}`}>
                                                    <p className={`text-[9px] font-black uppercase line-clamp-2 leading-tight ${viewMode === 'grid' ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{f.name}</p>
                                                </div>
                                                {selectedFoodId === f.id && (
                                                    <div className={`${viewMode === 'grid' ? 'absolute top-2 right-2' : 'ml-auto'} bg-pink-500 p-1 rounded-full`}>
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button 
                                onClick={handleGenerate}
                                disabled={isGenerating || foodItems.length === 0}
                                className="w-full h-14 bg-pink-600 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Tulis Impact Story</>}
                            </Button>
                        </div>
                    </div>

                    {/* Editor Area (8/12) */}
                    <div className="lg:col-span-8 space-y-4">
                        {!editableContent ? (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
                                <Share2 className="w-12 h-12 text-stone-200" />
                                <p className="text-xs text-stone-400 font-medium">Pilih produk di sidebar dan klik "Tulis Impact Story" untuk memulai.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">AI Story Editor</h4>
                                    <div className="flex gap-2">
                                        <button onClick={copyToClipboard} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-lg text-stone-500 transition-colors">
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <textarea 
                                        value={editableContent}
                                        onChange={(e) => setEditableContent(e.target.value)}
                                        className="w-full min-h-[450px] p-8 rounded-[3rem] bg-stone-50 dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 focus:border-pink-500 focus:outline-none text-stone-800 dark:text-stone-200 text-sm leading-relaxed font-medium transition-all shadow-sm"
                                        placeholder="Tulis narasi CSR di sini..."
                                    />
                                    <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Edit3 className="w-4 h-4 text-pink-500" />
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <Button 
                                        onClick={handleSave} 
                                        isLoading={isSaving}
                                        className="flex-1 h-14 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Simpan ke Riwayat
                                    </Button>
                                    <Button className="flex-1 h-14 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-pink-500/20">
                                        <Send className="w-4 h-4 mr-2" /> Publish Social Impact
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
