
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Sparkles, Package, Loader2, Copy, Check, Download, Zap, Plus, CheckCircle2, Search, LayoutGrid, List, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { db } from '../../services/db';
import { packagingDesign } from '../../services/packagingDesign';
import { UserData, FoodItem } from '../../types';

interface EcoPackagingEditorProps {
    currentUser: UserData | null;
    foodItems: FoodItem[];
    onBack: () => void;
}

export const EcoPackagingEditor: React.FC<EcoPackagingEditorProps> = ({ currentUser, foodItems, onBack }) => {
    const [selectedFoodId, setSelectedFoodId] = useState<string>(foodItems[0]?.id || '');
    const [customFoodName, setCustomFoodName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [visualUrl, setVisualUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const filteredItems = useMemo(() => {
        return foodItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [foodItems, searchTerm]);

    const handleGenerate = async () => {
        const foodName = foodItems.find(f => f.id === selectedFoodId)?.name || customFoodName;
        if (!foodName) return alert("Pilih menu atau masukkan nama makanan.");

        setIsGenerating(true);
        setVisualUrl(null);
        setImageError(false);
        try {
            const content = await packagingDesign.generate(foodName, currentUser?.role || 'corporate_donor');
            setResult(content);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateVisual = () => {
        if (!result) return;
        const foodName = foodItems.find(f => f.id === selectedFoodId)?.name || customFoodName;
        
        // Build a short, focused prompt from the food name and concept
        const shortPrompt = `Eco-friendly sustainable food packaging for ${foodName}, biodegradable materials, studio product photography, minimalist clean background, premium quality, cinematic lighting, 8k`;
        const encodedPrompt = encodeURIComponent(shortPrompt);
        const seed = Math.floor(Math.random() * 9999);
        const url = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=768&seed=${seed}&nologo=true`;
        
        setImageLoading(true);
        setImageError(false);
        setVisualUrl(url);
    };

    const copyToClipboard = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
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
                        <Package className="w-5 h-5 text-indigo-500" /> Eco Packaging
                    </h2>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">AI Design Assistant</p>
                </div>
                <div className="w-11"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Selection (5/12) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">Pilih Produk</h3>
                                <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-stone-800 shadow-sm text-indigo-600' : 'text-stone-400'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-stone-800 shadow-sm text-indigo-600' : 'text-stone-400'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari Menu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border-2 border-stone-50 dark:border-stone-800 focus:border-indigo-500 focus:outline-none text-sm font-bold"
                                />
                            </div>

                            <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                                {/* Special Card: Manual Input */}
                                <button 
                                    onClick={() => setSelectedFoodId('')}
                                    className={`relative rounded-[2rem] border-2 transition-all flex items-center p-4 gap-3 group ${viewMode === 'grid' ? 'flex-col aspect-square justify-center text-center' : 'w-full'} ${!selectedFoodId ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50'}`}
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-stone-900 dark:text-white leading-tight">Input Baru</p>
                                    {!selectedFoodId && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-indigo-600" />}
                                </button>

                                {filteredItems.map(f => (
                                    <button 
                                        key={f.id}
                                        onClick={() => {
                                            setSelectedFoodId(f.id);
                                            setCustomFoodName('');
                                        }}
                                        className={`relative rounded-[2rem] border-2 overflow-hidden transition-all group ${viewMode === 'grid' ? 'aspect-square' : 'w-full p-4 flex gap-4 items-center'} ${selectedFoodId === f.id ? 'border-indigo-600' : 'border-stone-100 dark:border-stone-800'}`}
                                    >
                                        <img src={f.imageUrl} alt={f.name} className={`${viewMode === 'grid' ? 'absolute inset-0' : 'w-12 h-12 rounded-xl'} object-cover`} />
                                        {viewMode === 'grid' && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />}
                                        <div className={`${viewMode === 'grid' ? 'absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent' : 'flex-1 text-left'}`}>
                                            <p className={`text-[10px] font-black uppercase line-clamp-2 leading-tight ${viewMode === 'grid' ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{f.name}</p>
                                        </div>
                                        {selectedFoodId === f.id && (
                                            <div className={`${viewMode === 'grid' ? 'absolute top-3 right-3' : 'ml-auto'} bg-indigo-600 p-1 rounded-full shadow-lg`}>
                                                <CheckCircle2 className={`w-3 h-3 text-white`} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {!selectedFoodId && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black uppercase text-stone-400">Nama Produk Baru</label>
                                    <input 
                                        type="text"
                                        placeholder="Contoh: Catering Nasi Sehat"
                                        className="w-full p-4 rounded-2xl border-2 border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold text-sm"
                                        value={customFoodName}
                                        onChange={(e) => setCustomFoodName(e.target.value)}
                                    />
                                </div>
                            )}

                            <Button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Design Idea</>}
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Output (7/12) */}
                    <div className="lg:col-span-7 space-y-6">
                        {!result ? (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
                                <div className="w-20 h-20 bg-stone-50 dark:bg-stone-900 rounded-[2.5rem] flex items-center justify-center text-stone-200">
                                    <Package className="w-10 h-10" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">Menunggu Input</h4>
                                    <p className="text-[11px] text-stone-400 font-medium max-w-[200px] mx-auto mt-2">Pilih menu di samping untuk mulai merancang kemasan ramah lingkungan.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                {/* Result Text Card */}
                                <div className="bg-gradient-to-br from-stone-900 to-black rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Sparkles className="w-12 h-12 text-white/5" />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                                                <Zap className="w-3 h-3" /> Konsep Material Berkelanjutan
                                            </h4>
                                            <button onClick={copyToClipboard} className="text-white/40 hover:text-white transition-colors">
                                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div className="prose prose-invert max-w-none pr-2">
                                            <p className="text-stone-300 leading-7 font-medium whitespace-pre-wrap text-sm">{result}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Visual Mockup Area */}
                                <div className="bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[3rem] p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Visual Mockup</h4>
                                        <Button 
                                            onClick={handleGenerateVisual}
                                            disabled={imageLoading}
                                            variant="outline"
                                            className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 text-indigo-600 rounded-xl text-[9px] font-black uppercase py-2 px-4 shadow-none"
                                        >
                                            {imageLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ImageIcon className="w-3 h-3 mr-2" />}
                                            {visualUrl ? 'Regenerate' : 'Generate Visual'}
                                        </Button>
                                    </div>

                                    <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-black/20">
                                        {visualUrl && (
                                            <img 
                                                src={visualUrl} 
                                                alt="Packaging Mockup" 
                                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                                onLoad={() => setImageLoading(false)}
                                                onError={() => { setImageLoading(false); setImageError(true); }}
                                            />
                                        )}
                                        
                                        {/* Loading overlay */}
                                        {imageLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 animate-pulse">AI sedang menggambar...</p>
                                            </div>
                                        )}

                                        {/* Error state */}
                                        {imageError && !imageLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                                                <ImageIcon className="w-10 h-10 text-red-300" />
                                                <p className="text-[10px] font-bold text-red-400">Gagal memuat gambar</p>
                                                <button onClick={handleGenerateVisual} className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl">
                                                    Coba Lagi
                                                </button>
                                            </div>
                                        )}

                                        {/* Empty state */}
                                        {!visualUrl && !imageLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-300">
                                                <ImageIcon className="w-10 h-10 opacity-20" />
                                                <p className="text-[10px] font-bold">Klik "Generate Visual" untuk membuat mockup</p>
                                            </div>
                                        )}
                                    </div>

                                    {visualUrl && !imageLoading && !imageError && (
                                        <div className="flex gap-4">
                                            <a 
                                                href={visualUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                                            >
                                                <Download className="w-4 h-4" /> Download Design
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
