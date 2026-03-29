
import React, { useState, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { Report, ClaimHistoryItem } from '../../../../types';
import { EmptyState } from '../../../common/EmptyState';
import { ReportsHeader } from './ReportsHeader';
import { ReportItemCard } from './ReportItemCard';
import { ReportDetailModal } from './ReportDetailModal';
import { ReportsPagination } from './ReportsPagination';

interface ReportsViewProps {
    onNavigateToOrder?: (orderId: string) => void;
    claims: ClaimHistoryItem[]; // Receive real claims data
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigateToOrder, claims = [] }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Transform Claims with reports into Report objects
  const reports = useMemo(() => {
      return claims
        .filter(c => c.isReported)
        .map(c => ({
            id: `REP-${c.id}`,
            orderId: c.id,
            foodName: c.foodName,
            title: c.reportReason || 'Masalah Tidak Spesifik',
            description: c.reportDescription || 'Pengguna tidak memberikan deskripsi detail.',
            date: c.date,
            status: (c as any).reportStatus || 'new', // Use extended type property or default
            reporter: 'Penerima Manfaat', // Could be dynamic if receiver name available
            isUrgent: true, // Default high priority for reports
            category: 'Kualitas',
            evidenceUrl: c.reportEvidence || 'https://images.unsplash.com/photo-1584263343361-901ce5794591?q=80&w=600'
        }));
  }, [claims]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const handleContactAdmin = (report: Report) => {
    const adminPhone = "6285215376975";
    const message = encodeURIComponent(
        `Halo Admin Food AI Rescue,\n\nSaya ingin menanggapi laporan berikut:\n- ID Laporan: ${report.id}\n- ID Pesanan: ${report.orderId || '-'}\n- Judul: ${report.title}\n\nBerikut tanggapan saya: `
    );
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
  };

  const handleAction = (status: 'resolved' | 'dismissed') => {
      if (selectedReport) {
          // In a real app, you would call an API here (e.g., db.respondReport)
          // For now, we simulate update locally or via alert
          alert(`Laporan ditandai sebagai ${status === 'resolved' ? 'Selesai' : 'Ditolak'}. Status akan diperbarui di database.`);
          setSelectedReport(null);
      }
  };

  const handleShowProductDetail = () => {
      if (selectedReport && selectedReport.orderId && onNavigateToOrder) {
          onNavigateToOrder(selectedReport.orderId);
      } else {
          alert("ID Pesanan tidak ditemukan pada laporan ini.");
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       <ReportsHeader 
            count={reports.length} 
       />

       <div className="flex flex-col gap-4">
          {currentReports.length === 0 && (
              <div className="py-10">
                <EmptyState 
                    icon={CheckCircle}
                    title="Bebas Laporan"
                    description="Luar biasa! Tidak ada laporan masalah pada donasi Anda."
                />
              </div>
          )}
          {currentReports.map(report => (
            <ReportItemCard 
                key={report.id} 
                report={report} 
                onClick={() => setSelectedReport(report)} 
            />
          ))}
          
          {reports.length > itemsPerPage && (
            <ReportsPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                totalItems={reports.length}
            />
          )}
       </div>

       {selectedReport && (
           <ReportDetailModal 
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
                onShowProductDetail={handleShowProductDetail}
                onHandleAction={handleAction}
                onContactAdmin={handleContactAdmin}
           />
       )}
    </div>
  );
};
