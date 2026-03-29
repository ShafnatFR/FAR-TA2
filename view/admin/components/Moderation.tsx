
import React, { useState, useEffect, useMemo } from 'react';
import { Shield, X, CheckCircle2, Clock, Filter, ChevronLeft, ChevronRight, Package, MessageCircle, Image as ImageIcon, ArrowUpDown } from 'lucide-react';
import { Button } from '../../components/Button';
import { Report, ClaimHistoryItem } from '../../../types';

interface ModerationProps {
    claims?: ClaimHistoryItem[];
    onReportUpdate?: () => void;
}

export const Moderation: React.FC<ModerationProps> = ({ claims = [], onReportUpdate }) => {
  // Transform reported claims to Report type
  const realReports: Report[] = useMemo(() => {
      return claims
        .filter(c => c.isReported && c.reportId) // Only include existing reports
        .map(c => {
            let evidence = c.reportEvidence;
            return {
                id: String((c as any).reportId), // Use actual DB report ID
                orderId: c.id,
                foodName: c.foodName,
                title: (c as any).reportReason || 'Masalah Umum',
                description: (c as any).reportDescription || 'Tidak ada deskripsi rinci.',
                date: c.date,
                status: ((c as any).reportStatus || 'NEW').toUpperCase(),
                reporter: c.receiverName || 'Penerima Manfaat',
                reporterPhone: (c as any).reporterPhone || c.receiverPhone,
                target: c.providerName,
                targetPhone: c.donorPhone,
                isUrgent: true,
                type: 'quality',
                evidenceUrl: evidence
            };
        });
  }, [claims]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Local state to manage status changes within the admin session
  const [localStatuses, setLocalStatuses] = useState<{[key: string]: string}>({});

  const handleAction = async (status: 'RESOLVED' | 'REJECTED' | 'IN_PROGRESS') => {
      if(selectedReport) {
          try {
              const { db } = await import('../../../services/db');
              await db.updateReportStatus(selectedReport.id, status);
              setLocalStatuses(prev => ({...prev, [selectedReport.id]: status}));
              if (onReportUpdate) onReportUpdate();
              if (status !== 'IN_PROGRESS') setSelectedReport(null);
          } catch (error) {
              console.error("Failed to update report status:", error);
              alert("Gagal memperbarui status laporan.");
          }
      }
  };

  const handleOpenDetail = (report: Report) => {
      const currentStatus = getStatus(report);
      setSelectedReport({...report, status: currentStatus as any});
  };

  const handleChatUser = async (role: 'Pelapor' | 'Terlapor', name: string) => {
      // Determine phone number based on role
      const phone = role === 'Pelapor'
          ? (selectedReport as any)?.reporterPhone
          : (selectedReport as any)?.targetPhone;
      const phoneClean = (phone || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
      const message = `Halo ${role} ${name}, saya Admin Moderasi Food AI Rescue. Saya ingin menindaklanjuti laporan yang masuk.`;
      
      // Auto-set to IN_PROGRESS if currently NEW when starting interaction
      if (selectedReport && getStatus(selectedReport) === 'NEW') {
          await handleAction('IN_PROGRESS');
      }
      
      window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatus = (report: Report) => localStatuses[report.id] || report.status;

  const filteredReports = useMemo(() => {
      let filtered = realReports.filter(r => {
          const currentStatus = getStatus(r);
          const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;
          
          if (!matchesStatus) return false;
          
          if (!searchQuery) return true;
          
          const q = searchQuery.toLowerCase();
          const priorityLabel = r.priority === 'high' ? 'urgent' : 'medium';
          const statusLabel = currentStatus === 'REJECTED' ? 'ditolak' : 
                            currentStatus === 'RESOLVED' ? 'selesai' : 
                            currentStatus === 'IN_PROGRESS' ? 'diproses' : 'baru';

          return (
              r.title.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q) ||
              r.target?.toLowerCase().includes(q) ||
              r.foodName.toLowerCase().includes(q) ||
              priorityLabel.includes(q) ||
              statusLabel.includes(q) ||
              r.category?.toLowerCase().includes(q)
          );
      });

      // Sort by date accurately
      return filtered.sort((a, b) => {
          const dateA = new Date(a.date).getTime() || 0;
          const dateB = new Date(b.date).getTime() || 0;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [realReports, filterStatus, sortOrder, localStatuses, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  useEffect(() => {
      setCurrentPage(1);
  }, [filterStatus]);

  // Helper to parse evidence
  const getEvidenceList = (report: Report) => {
      if (!report.evidenceUrl) return [];
      if (Array.isArray(report.evidenceUrl)) return report.evidenceUrl;
      if (report.evidenceUrl.startsWith('[')) {
          try {
              return JSON.parse(report.evidenceUrl);
          } catch(e) {
              return [report.evidenceUrl];
          }
      }
      return [report.evidenceUrl];
  };

  return (
    <div className="space-y-8 animate-in fade-in">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" /> Moderasi Laporan
          </h2>
       </div>

       {/* Top Summary Cards */}
       <div className="grid grid-cols-4 gap-4">
           {/* ... Keep summary cards same as before ... */}
           <div 
                onClick={() => setFilterStatus('all')}
                className={`p-5 rounded-2xl border-l-4 border-stone-800 shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${filterStatus === 'all' ? 'bg-stone-100 dark:bg-stone-800 ring-2 ring-stone-200 dark:ring-stone-700' : 'bg-white dark:bg-stone-900'}`}
            >
               <h3 className="text-3xl font-black text-stone-900 dark:text-white">{realReports.length}</h3>
               <p className="text-xs text-stone-500 uppercase font-bold mt-1">Total Laporan</p>
           </div>
           <div 
                 onClick={() => setFilterStatus('NEW')}
                 className={`p-5 rounded-2xl border-l-4 border-red-500 shadow-sm bg-red-50/50 cursor-pointer transition-all hover:scale-[1.02] ${filterStatus === 'NEW' ? 'ring-2 ring-red-200' : ''}`}
             >
                <h3 className="text-3xl font-black text-red-600">{realReports.filter(r => getStatus(r) === 'NEW').length}</h3>
                <p className="text-xs text-red-500 uppercase font-bold mt-1">Baru</p>
            </div>
            <div 
                 onClick={() => setFilterStatus('IN_PROGRESS')}
                 className={`p-5 rounded-2xl border-l-4 border-orange-500 shadow-sm bg-orange-50/50 cursor-pointer transition-all hover:scale-[1.02] ${filterStatus === 'IN_PROGRESS' ? 'ring-2 ring-orange-200' : ''}`}
             >
                <h3 className="text-3xl font-black text-orange-600">{realReports.filter(r => getStatus(r) === 'IN_PROGRESS').length}</h3>
                <p className="text-xs text-orange-500 uppercase font-bold mt-1">Diproses</p>
            </div>
            <div 
                 onClick={() => setFilterStatus('RESOLVED')}
                 className={`p-5 rounded-2xl border-l-4 border-green-500 shadow-sm bg-green-50/50 cursor-pointer transition-all hover:scale-[1.02] ${filterStatus === 'RESOLVED' ? 'ring-2 ring-green-200' : ''}`}
             >
                <h3 className="text-3xl font-black text-green-600">{realReports.filter(r => getStatus(r) === 'RESOLVED').length}</h3>
                <p className="text-xs text-green-500 uppercase font-bold mt-1">Selesai</p>
            </div>
       </div>

       {/* Search & Filter */}
       <div className="flex gap-4 items-center">
            <input 
                 type="text" 
                 placeholder="Cari tipe, isi, target, prioritas atau status..." 
                 value={searchQuery}
                 onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setCurrentPage(1);
                 }}
                 className="flex-1 p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FDFBF7] dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
            />
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-bold text-stone-600 dark:text-stone-300">Filter:</span>
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-2.5 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-300 focus:outline-none focus:border-orange-500"
                >
                    <option value="all">Semua Status</option>
                    <option value="NEW">Baru</option>
                    <option value="IN_PROGRESS">Diproses</option>
                    <option value="RESOLVED">Selesai</option>
                    <option value="REJECTED">Ditolak</option>
                </select>

                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-2.5 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-300 hover:border-orange-500 transition-colors"
                    title={`Urutkan: ${sortOrder === 'asc' ? 'Terlama' : 'Terbaru'}`}
                >
                    <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
                    <span className="hidden md:inline">{sortOrder === 'asc' ? 'ASC' : 'DESC'}</span>
                </button>
            </div>
       </div>

       {/* Report List */}
       <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
               <thead className="bg-stone-50 dark:bg-stone-950 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                   <tr>
                       <th className="p-5">Laporan</th>
                       <th className="p-5">Target</th>
                       <th className="p-5">Prioritas</th>
                       <th className="p-5">Status</th>
                       <th className="p-5 text-right">Aksi</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                   {currentReports.length === 0 ? (
                       <tr>
                           <td colSpan={5} className="p-8 text-center text-stone-500">
                               Tidak ada laporan dengan status ini.
                           </td>
                       </tr>
                   ) : (
                       currentReports.map(report => {
                       const currentStatus = getStatus(report);
                       return (
                       <tr key={report.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                           <td className="p-5">
                               <p className="font-bold text-sm text-stone-900 dark:text-white mb-1">{report.title}</p>
                               <div className="flex items-center gap-1 text-xs text-stone-500 mb-1">
                                   <Package className="w-3 h-3" /> {report.foodName}
                               </div>
                               <p className="text-xs text-stone-400 line-clamp-1 max-w-xs">{report.description}</p>
                               <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400">
                                   <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {report.reporter}</span>
                                   <span>•</span>
                                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.date}</span>
                               </div>
                           </td>
                           <td className="p-5">
                               <div className="flex items-center gap-2 text-sm text-stone-600">
                                   <span className="p-1.5 bg-blue-100 rounded text-blue-600"><Shield className="w-4 h-4" /></span>
                                   <span className="font-medium">{report.target}</span>
                               </div>
                           </td>
                           <td className="p-5">
                               <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${report.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                   {report.priority === 'high' ? 'Urgent' : 'Medium'}
                               </span>
                           </td>
                             <td className="p-5">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                                     currentStatus === 'NEW' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                     currentStatus === 'RESOLVED' ? 'bg-green-50 text-green-600 border border-green-100' : 
                                     currentStatus === 'REJECTED' ? 'bg-stone-100 text-stone-600 border border-stone-200' : 
                                     'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                     {currentStatus}
                                 </span>
                             </td>
                            <td className="p-5 text-right">
                                <Button variant="outline" className="h-9 w-auto text-xs px-4" onClick={() => handleOpenDetail(report)}>Detail</Button>
                            </td>
                       </tr>
                   )})
                   )}
               </tbody>
           </table>

           {/* Pagination Footer */}
           {filteredReports.length > 0 && (
            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredReports.length)} of {filteredReports.length} reports
                </span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                    </button>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-200 px-2">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                    </button>
                </div>
            </div>
          )}
       </div>
       
       {selectedReport && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
                    
                    <div className="mb-6">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase mb-2 ${selectedReport.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {selectedReport.priority} Priority
                        </span>
                        <h3 className="text-xl font-bold text-stone-900 dark:text-white">{selectedReport.title}</h3>
                        <p className="text-stone-500 text-sm mt-1">{selectedReport.date} • Oleh {selectedReport.reporter}</p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 mb-6">
                        <p className="text-sm font-bold text-stone-900 dark:text-white mb-2">Deskripsi Masalah</p>
                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{selectedReport.description}</p>
                        
                        {/* EVIDENCE GALLERY */}
                        {getEvidenceList(selectedReport).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                                <p className="text-xs font-bold text-stone-500 uppercase mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Bukti Foto</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {getEvidenceList(selectedReport).map((img, i) => (
                                        <img key={i} src={img} alt={`Bukti ${i}`} className="w-full h-32 object-cover rounded-lg border border-stone-200" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mb-6">
                        <Button variant="outline" className="flex-1 text-xs" onClick={() => handleChatUser('Pelapor', selectedReport.reporter)}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Chat Pelapor
                        </Button>
                        <Button variant="outline" className="flex-1 text-xs" onClick={() => handleChatUser('Terlapor', selectedReport.target || 'Donatur')}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Chat Terlapor
                        </Button>
                    </div>

                     <div className="grid grid-cols-2 gap-3">
                          <Button variant="ghost" onClick={() => handleAction('REJECTED')}>Tolak Laporan</Button>
                          <Button onClick={() => handleAction('RESOLVED')} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai</Button>
                     </div>
                </div>
            </div>
       )}
    </div>
  );
};
