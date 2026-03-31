
import React, { useState, useRef, useMemo } from 'react';
import { Layout, Trash2, Edit, Plus, X, BookOpen, HelpCircle, Bold, Italic, List, ListOrdered, Filter, Eye, Smartphone, Tablet, Laptop, ChevronDown, ChevronUp, MessageSquare, Truck, User, Store, Search, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { FAQItem, UserData } from '../../../types';

interface ContentCMSProps {
    faqs?: FAQItem[];
    setFaqs?: React.Dispatch<React.SetStateAction<FAQItem[]>>;
    onRefresh?: () => void;
    currentUser?: UserData | null;
}

// Simple Markdown Parser for Preview
const parseMarkdown = (text: string) => {
    if (!text) return '';
    // Bold: **text**
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: _text_
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    // Lists: * text or - text
    html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '<li class="list-disc ml-4">$1</li>');
    // Newlines
    html = html.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

// Sub-component for Device Frame Preview
const DeviceFrame: React.FC<{ device: 'phone' | 'tablet' | 'laptop', children: React.ReactNode }> = ({ device, children }) => {
    const frames = {
        phone: "w-[300px] h-[580px] border-[10px] rounded-[2.5rem]",
        tablet: "w-[380px] h-[500px] border-[12px] rounded-[2rem]",
        laptop: "w-[420px] h-[300px] border-[6px] rounded-t-xl border-b-0"
    };

    return (
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className={`${frames[device]} bg-white dark:bg-stone-900 border-stone-800 dark:border-stone-700 shadow-2xl relative overflow-hidden transition-all duration-500`}>
                {device === 'phone' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-stone-800 dark:bg-stone-700 rounded-b-2xl z-20" />
                )}
                <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#FDFBF7] dark:bg-stone-950">
                    {children}
                </div>
            </div>
            {device === 'laptop' && (
                <div className="w-[460px] h-6 bg-stone-700 dark:bg-stone-600 rounded-b-lg relative shadow-xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-stone-500/30 rounded-b" />
                </div>
            )}
        </div>
    );
};

export const ContentCMS: React.FC<ContentCMSProps> = ({ faqs = [], setFaqs, onRefresh, currentUser }) => {
  const [previewDevice, setPreviewDevice] = useState<'phone' | 'tablet' | 'laptop'>('phone');
  const [faqForm, setFaqForm] = useState<FAQItem>({ id: '', question: '', answer: '', category: 'Umum' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingFaq, setIsEditingFaq] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States for Preview Logic
  const [openCategory, setOpenCategory] = useState<string | null>('Umum');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const categories = ['Umum', 'SOP Donatur', 'SOP Penerima', 'Relawan & Logistik'];

  const getCategoryStyles = (category: string) => {
      switch (category) {
          case 'SOP Donatur': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200';
          case 'SOP Penerima': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-orange-200';
          case 'Relawan & Logistik': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200';
          default: return 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200';
      }
  };

  const getIcon = (cat: string) => {
      if (cat.includes('Donatur')) return Store;
      if (cat.includes('Penerima')) return User;
      if (cat.includes('Relawan')) return Truck;
      return BookOpen;
  };

  const filteredFaqs = useMemo(() => {
      let result = faqs;
      if (filterCategory !== 'Semua') {
          result = result.filter(f => f.category === filterCategory);
      }
      if (searchQuery.trim()) {
          result = result.filter(f => 
            f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
            f.answer.toLowerCase().includes(searchQuery.toLowerCase())
          );
      }
      return result;
  }, [faqs, filterCategory, searchQuery]);

  const groupedFaqs = useMemo(() => {
      const groups: { [key: string]: FAQItem[] } = {};
      // Add current form to groups for live preview if it's the one being edited
      const displayFaqs = isModalOpen && faqForm.question 
        ? [...faqs.filter(f => f.id !== faqForm.id), faqForm]
        : faqs;

      displayFaqs.forEach(item => {
          const cat = item.category || 'Umum';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
      });
      return groups;
  }, [faqs, faqForm, isModalOpen]);

  const handleSaveFaq = async () => {
      if (!setFaqs) return;
      if (!faqForm.question.trim() || !faqForm.answer.trim()) {
          alert('Mohon isi Judul (Pertanyaan) dan Deskripsi (Jawaban)');
          return;
      }

      setIsSaving(true);
      try {
          const { db } = await import('../../../services/db');
          const savedFaq = await db.upsertFAQ(faqForm, currentUser);
          
          if (onRefresh) onRefresh();
          if (isEditingFaq) {
              setFaqs(prev => prev.map(f => f.id === faqForm.id ? savedFaq : f));
          } else {
              setFaqs(prev => [savedFaq, ...prev]);
          }
          setIsModalOpen(false);
      } catch (err) {
          console.error('[ContentCMS] Save failure:', err);
          alert('Gagal menyimpan FAQ ke database.');
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteFaq = async (id: string) => {
      if (!setFaqs) return;
      if (confirm('Hapus konten ini secara permanen dari database?')) {
          try {
              const { db } = await import('../../../services/db');
              await db.deleteFAQ(id, currentUser);
              if (onRefresh) onRefresh();
              setFaqs(prev => prev.filter(f => f.id !== id));
          } catch (err) {
              alert('Gagal menghapus FAQ.');
          }
      }
  };

  const insertFormat = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let replacement = '';
    if (type === 'bold') replacement = `**${selectedText}**`;
    if (type === 'italic') replacement = `_${selectedText}_`;
    if (type === 'list') replacement = `\n* ${selectedText}`;
    if (type === 'number') replacement = `\n1. ${selectedText}`;
    
    const newAnswer = text.substring(0, start) + replacement + text.substring(end);
    setFaqForm({ ...faqForm, answer: newAnswer });
  };

  return (
      <div className="space-y-6 animate-in fade-in pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter">
                      <Layout className="w-8 h-8 text-orange-600" /> Manajemen Konten FAQ
                  </h2>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Pusat Informasi & SOP Komunitas</p>
              </div>
              <Button 
                className="w-full md:w-auto h-12 px-6 font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20"
                onClick={() => { setFaqForm({ id: `faq-${Date.now()}`, question: '', answer: '', category: 'Umum' }); setIsEditingFaq(false); setIsModalOpen(true); }}
              >
                  <Plus className="w-5 h-5 mr-2" /> TAMBAH FAQ
              </Button>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">
              
              {/* KOLOM KIRI: Manajemen Data */}
              <div className="flex-1 w-full space-y-6">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 bg-white dark:bg-stone-900 p-0.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                          <Search className="w-4 h-4 text-stone-400 ml-4 shrink-0" />
                          <input 
                              type="text" 
                              placeholder="Cari pertanyaan atau jawaban..." 
                              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 text-stone-900 dark:text-stone-200 placeholder-stone-400"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                          />
                      </div>
                      
                      <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-x-auto scrollbar-hide">
                          <button 
                            onClick={() => setFilterCategory('Semua')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterCategory === 'Semua' ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                          >
                              Semua
                          </button>
                          {categories.map(cat => (
                              <button 
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterCategory === cat ? 'bg-white dark:bg-stone-800 text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                              >
                                  {cat.replace('SOP ', '')}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* FAQ List */}
                  <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                          <h4 className="font-black text-stone-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-orange-600" /> 
                              {filterCategory === 'Semua' ? 'Daftar Konten' : filterCategory} ({filteredFaqs.length})
                          </h4>
                      </div>
                      
                      <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[700px] overflow-y-auto custom-scrollbar">
                          {filteredFaqs.length === 0 ? (
                              <div className="p-12 text-center text-stone-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                                  {faqs.length === 0 ? 'Belum ada konten FAQ.' : 'Tidak ditemukan konten yang cocok.'}
                              </div>
                          ) : (
                              filteredFaqs.map(faq => (
                                  <div key={faq.id} className="p-6 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-all group">
                                      <div className="flex justify-between items-start mb-2 gap-4">
                                          <div className="flex-1">
                                              <h5 className="font-black text-sm text-stone-900 dark:text-white leading-tight uppercase italic">{faq.question}</h5>
                                              <div className="flex items-center gap-2 mt-2">
                                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase border ${getCategoryStyles(faq.category || 'Umum')}`}>
                                                      {faq.category}
                                                  </span>
                                              </div>
                                          </div>
                                          <div className="flex gap-2 shrink-0">
                                              <button onClick={() => { setFaqForm(faq as any); setIsEditingFaq(true); setIsModalOpen(true); }} className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm"><Edit className="w-4 h-4" /></button>
                                              <button onClick={() => handleDeleteFaq(faq.id || '')} className="w-9 h-9 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                          </div>
                                      </div>
                                      <div className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-medium mt-3 bg-stone-100/30 dark:bg-stone-950/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 italic line-clamp-2">
                                          {faq.answer}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>

              {/* KOLOM KANAN: Live Device Preview */}
              <div className="w-full xl:w-[480px] sticky top-8 animate-in slide-in-from-right duration-500">
                  <div className="bg-stone-100 dark:bg-stone-900/40 rounded-[3rem] p-6 border border-stone-200 dark:border-stone-800 shadow-xl">
                      
                      <div className="flex justify-between items-center mb-8">
                          <h4 className="font-black text-stone-800 dark:text-stone-200 text-xs uppercase tracking-widest flex items-center gap-2">
                              <Eye className="w-4 h-4 text-orange-600" /> Live Preview
                          </h4>
                          
                          <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700 shadow-inner">
                              {[
                                  { id: 'phone', icon: Smartphone },
                                  { id: 'tablet', icon: Tablet },
                                  { id: 'laptop', icon: Laptop }
                              ].map(d => (
                                  <button 
                                    key={d.id} 
                                    onClick={() => setPreviewDevice(d.id as any)} 
                                    className={`p-2 rounded-lg transition-all ${previewDevice === d.id ? 'bg-white dark:bg-stone-700 text-orange-600 shadow-md scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                                  >
                                      <d.icon className="w-3.5 h-3.5" />
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-center">
                          <DeviceFrame device={previewDevice}>
                              {/* Mock Header Perangkat */}
                              <div className="h-16 bg-gradient-to-r from-orange-600 to-amber-500 flex items-center px-6 text-white sticky top-0 z-10">
                                    <ChevronDown className="w-6 h-6 rotate-90 mr-4" />
                                    <h4 className="font-black text-sm uppercase italic tracking-tight">Pusat Bantuan</h4>
                              </div>

                              {/* Konten FAQ di dalam Frame */}
                              <div className="p-4 space-y-6">
                                  <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 shrink-0">
                                          <BookOpen className="w-5 h-5" />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 mb-1">Panduan Pengguna</h4>
                                          <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">Cari jawaban cepat untuk kendala Anda.</p>
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      {Object.keys(groupedFaqs).length === 0 ? (
                                          <div className="p-8 text-center bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
                                              <p className="text-[10px] text-stone-400 font-bold uppercase">No Content to display</p>
                                          </div>
                                      ) : (
                                          Object.keys(groupedFaqs).map((category, idx) => {
                                              const Icon = getIcon(category);
                                              const isCatOpen = openCategory === category;
                                              return (
                                                  <div key={idx} className="bg-white dark:bg-stone-900 rounded-[1.5rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                                                      <button onClick={() => setOpenCategory(isCatOpen ? null : category)} className={`w-full flex justify-between items-center p-4 text-left transition-colors ${isCatOpen ? 'bg-orange-50 dark:bg-orange-950' : ''}`}>
                                                          <span className="flex gap-2 items-center font-black text-stone-900 dark:text-stone-200 text-xs uppercase italic">
                                                              <Icon className={`w-4 h-4 ${isCatOpen ? 'text-orange-600' : 'text-stone-400'}`} />
                                                              {category}
                                                          </span>
                                                          {isCatOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                                                      </button>
                                                      
                                                      {isCatOpen && (
                                                          <div className="p-2 space-y-1 border-t border-stone-50 dark:border-stone-800">
                                                              {groupedFaqs[category].map((item, i) => {
                                                                  const isFaqOpen = openFaq === `${idx}-${i}`;
                                                                  return (
                                                                      <div key={i} className="rounded-xl overflow-hidden">
                                                                          <button onClick={() => setOpenFaq(isFaqOpen ? null : `${idx}-${i}`)} className={`w-full flex justify-between items-start gap-3 p-3 text-left font-bold text-[11px] transition-colors ${isFaqOpen ? 'text-orange-600 bg-orange-50/50' : 'text-stone-700 dark:text-stone-300'}`}>
                                                                              {item.question}
                                                                              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform mt-0.5 ${isFaqOpen ? 'rotate-180' : ''}`} />
                                                                          </button>
                                                                          {isFaqOpen && (
                                                                              <div className="p-3 pt-0 pl-4 text-[10px] text-stone-500 leading-relaxed italic border-l-2 border-orange-500 ml-3 mb-2">
                                                                                  {parseMarkdown(item.answer)}
                                                                              </div>
                                                                          )}
                                                                      </div>
                                                                  );
                                                              })}
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })
                                      )}
                                  </div>

                                  <div className="bg-stone-900 dark:bg-black rounded-2xl p-6 text-center text-white border border-white/5 shadow-lg">
                                      <h5 className="font-black text-xs uppercase mb-3 tracking-widest">Butuh Bantuan?</h5>
                                      <button className="bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 mx-auto shadow-xl shadow-green-500/20 active:scale-95 transition-all">
                                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Support
                                      </button>
                                  </div>
                              </div>
                          </DeviceFrame>
                      </div>
                  </div>
              </div>
          </div>

          {/* EDIT/ADD MODAL */}
          {isModalOpen && (
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative border-2 border-orange-100 dark:border-stone-800 animate-in zoom-in-95 duration-300">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="p-6 md:p-8 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950/50">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
                                  <HelpCircle className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="font-black text-stone-900 dark:text-white text-lg uppercase italic tracking-tight leading-tight">{isEditingFaq ? 'Edit Konten FAQ' : 'Buat Konten FAQ Baru'}</h3>
                                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Editor FAQ Food AI Rescue</p>
                              </div>
                          </div>
                          <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-stone-700 shadow-sm"><X className="w-5 h-5" /></button>
                      </div>

                      <div className="p-6 md:p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Judul FAQ (Pertanyaan)</label>
                              <input type="text" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} placeholder="Masukkan pertanyaan..." className="w-full p-4 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-2xl text-black dark:text-white font-bold text-sm focus:outline-none focus:border-orange-500 transition-all" />
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Kategori Konten</label>
                              <select value={faqForm.category} onChange={e => setFaqForm({...faqForm, category: e.target.value})} className="w-full p-4 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-2xl text-black dark:text-white font-bold text-sm focus:outline-none focus:border-orange-500 appearance-none transition-all">
                                  <option value="Umum">Umum / General</option>
                                  <option value="SOP Donatur">SOP Donatur (Provider)</option>
                                  <option value="SOP Penerima">SOP Penerima (Receiver)</option>
                                  <option value="Relawan & Logistik">Relawan & Logistik (Volunteer)</option>
                              </select>
                          </div>

                          <div className="space-y-2">
                              <div className="flex justify-between items-center mb-1 px-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Deskripsi FAQ (Jawaban)</label>
                                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
                                    <button onClick={() => insertFormat('bold')} className="p-1.5 hover:bg-white dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300 transition-colors" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => insertFormat('italic')} className="p-1.5 hover:bg-white dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300 transition-colors" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                                    <div className="w-px h-3.5 bg-stone-300 dark:bg-stone-600 mx-1"></div>
                                    <button onClick={() => insertFormat('list')} className="p-1.5 hover:bg-white dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300 transition-colors" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => insertFormat('number')} className="p-1.5 hover:bg-white dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300 transition-colors" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                              <textarea ref={textareaRef} className="w-full p-5 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-[1.5rem] text-black dark:text-white font-medium text-sm leading-relaxed focus:outline-none focus:border-orange-500 transition-all min-h-[220px]" placeholder="Tuliskan jawaban lengkap di sini..." value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} />
                          </div>
                      </div>

                      <div className="p-6 md:p-8 bg-stone-50 dark:bg-stone-950/50 border-t border-stone-100 dark:border-stone-800 flex gap-4">
                          <Button variant="ghost" className="flex-1 h-14 font-black uppercase text-[10px] tracking-[0.2em] border-2 border-stone-200 dark:border-stone-700 text-stone-400" onClick={() => setIsModalOpen(false)}>BATALKAN</Button>
                          <Button 
                            className="flex-[2] h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20" 
                            onClick={handleSaveFaq}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> MENERBITKAN...
                                </div>
                            ) : (
                                isEditingFaq ? 'SIMPAN PERUBAHAN' : 'TERBITKAN FAQ'
                            )}
                          </Button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};
