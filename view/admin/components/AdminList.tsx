
import React, { useState, useEffect } from 'react';
import { Crown, UserPlus, Edit, Trash2, X, ChevronLeft, ChevronRight, Loader2, ShieldCheck, Mail, ShieldAlert, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminUser, SystemLog, UserData } from '../../../types';

interface AdminListProps {
    currentUser: UserData | null;
    onMenuRefresh?: () => void;
}

export const AdminList: React.FC<AdminListProps> = ({ currentUser, onMenuRefresh }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ id: '', name: '', email: '', password: '', role: 'admin', permissions: [] as string[], status: 'active' });
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);

  // Pagination for logs
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 10;
  
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
        const { db } = await import('../../../services/db');
        const data = await db.getAdmins();
        setAdmins(data);
    } catch (err) {
        console.error("Fetch admins failed:", err);
    } finally {
        setLoadingAdmins(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
        const { db } = await import('../../../services/db');
        const data = await db.getSystemLogs();
        setLogs(data);
    } catch (err) {
        console.error("Fetch logs failed:", err);
    } finally {
        setLoadingLogs(false);
    }
  };

  useEffect(() => {
     fetchAdmins();
     fetchLogs();
  }, []);

  const indexOfLastLog = logPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalLogPages = Math.ceil(logs.length / logsPerPage);

  const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const { db } = await import('../../../services/db');
          await db.upsertAdmin(newAdminForm, currentUser);
          await fetchAdmins();
          await fetchLogs();
          if (onMenuRefresh) onMenuRefresh();
          setShowAddAdminModal(false);
          setNewAdminForm({ id: '', name: '', email: '', password: '', role: 'admin', permissions: [], status: 'active' });
          setIsEditingAdmin(false);
          alert(isEditingAdmin ? "Data admin diperbarui!" : "Admin baru berhasil ditambahkan!");
      } catch (err: any) {
          alert("Gagal menyimpan admin: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };

  const handleEditAdmin = (admin: AdminUser) => {
      setNewAdminForm({ 
          id: admin.id, 
          name: admin.name, 
          email: admin.email, 
          password: '', // Don't pre-fill password
          role: admin.role, 
          permissions: admin.permissions,
          status: admin.status 
      });
      setIsEditingAdmin(true);
      setShowAddAdminModal(true);
  };

  const handleDeleteAdmin = async (id: string) => {
      if (id === currentUser?.id) {
          alert("Anda tidak bisa menghapus akun Anda sendiri.");
          return;
      }
      if (confirm('Apakah anda yakin ingin menghapus admin ini?')) {
          try {
              const { db } = await import('../../../services/db');
              await db.deleteAdmin(id, currentUser);
              await fetchAdmins();
              await fetchLogs();
              if (onMenuRefresh) onMenuRefresh();
              alert("Admin dihapus.");
          } catch (err: any) {
              alert("Gagal menghapus admin: " + err.message);
          }
      }
  };

  const togglePermission = (perm: string) => {
    if (newAdminForm.permissions.includes(perm)) {
        setNewAdminForm({ ...newAdminForm, permissions: newAdminForm.permissions.filter(p => p !== perm) });
    } else {
        setNewAdminForm({ ...newAdminForm, permissions: [...newAdminForm.permissions, perm] });
    }
  };

  const handleExportLogs = () => {
      if (logs.length === 0) return;
      
      const headers = ["ID", "Waktu", "Aktor ID", "Aktor", "Aksi", "Detail", "Level"];
      
      const sanitize = (val: any) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
          return `"${str}"`;
      };

      const rows = logs.map(log => [
          sanitize(log.id),
          sanitize(new Date(log.created_at || log.timestamp).toLocaleString('id-ID')),
          sanitize(log.actor_id),
          sanitize(log.actor_name || log.actor || 'System'),
          sanitize(log.action),
          sanitize(log.details),
          sanitize(log.severity || 'info')
      ]);

      const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleExportAdmins = () => {
      if (admins.length === 0) return;
      
      const headers = ["ID", "Nama", "Email", "Role", "Status", "Poin", "Dibuat Pada"];
      
      const sanitize = (val: any) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
          return `"${str}"`;
      };

      const rows = admins.map(admin => [
          sanitize(admin.id),
          sanitize(admin.name),
          sanitize(admin.email),
          sanitize(admin.role),
          sanitize(admin.status),
          sanitize(admin.points || 0),
          sanitize(new Date(admin.created_at).toLocaleString('id-ID'))
      ]);

      const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `admin_list_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <Crown className="w-8 h-8 text-orange-600" /> Admin Management
                </h2>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 ml-11">Kelola tim pengelola dan pantau aktivitas sistem</p>
             </div>
             <div className="flex gap-2">
                 <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl border-2" onClick={handleExportAdmins}>Download Admins</Button>
                 <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl border-2" onClick={handleExportLogs}>Download Logs</Button>
                 <Button className="text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-orange-500/20" onClick={() => { setIsEditingAdmin(false); setNewAdminForm({ id: '', name: '', email: '', password: '', role: 'admin', permissions: [], status: 'active' }); setShowAddAdminModal(true); }}><UserPlus className="w-4 h-4 mr-2" /> Add Admin</Button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ADMIN LIST */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                    <div className="p-6 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 font-black text-xs text-stone-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-green-600" /> Authorized Personnel
                    </div>
                    <div className="p-6 space-y-4">
                        {loadingAdmins ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
                        ) : admins.length === 0 ? (
                            <div className="text-center py-12 text-stone-400 font-bold text-xs uppercase tracking-widest">Tidak ada admin ditemukan.</div>
                        ) : admins.map(admin => (
                            <div key={admin.id} className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/30 rounded-2xl border border-stone-100 dark:border-stone-800 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-black text-stone-500 text-lg border border-stone-200 dark:border-stone-700 shadow-sm transition-transform group-hover:scale-110">
                                        {admin.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-stone-900 dark:text-white uppercase italic tracking-tight">{admin.name} {String(admin.id) === String(currentUser?.id) && <span className="text-orange-600 ml-1">(YOU)</span>}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Mail className="w-3 h-3" /> {admin.email}</span>
                                            <span className="text-stone-300">|</span>
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{admin.role.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{admin.status}</span>
                                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">Last: {admin.lastLogin}</span>
                                    </div>
                                    {admin.role !== 'super_admin' && (
                                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditAdmin(admin)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-500 hover:text-stone-900 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* AUDIT LOGS */}
            <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm h-fit">
                <div className="p-6 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 font-black text-xs flex justify-between items-center text-stone-900 dark:text-white uppercase tracking-widest">
                    <span><ShieldAlert className="w-4 h-4 inline-block mr-2 text-orange-500" /> Audit Trail</span>
                </div>
                <div className="overflow-y-auto p-4 min-h-[400px]">
                    {loadingLogs ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-stone-400 font-bold text-[10px] uppercase tracking-widest">Belum ada riwayat audit.</div>
                    ) : (
                        currentLogs.map(log => (
                            <div key={log.id} className="p-4 border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors rounded-2xl group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm ${log.severity === 'critical' ? 'bg-red-600 text-white' : log.severity === 'warning' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>{log.severity}</span>
                                    <span className="text-[9px] text-stone-400 font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                                </div>
                                <p className="text-xs font-black text-stone-900 dark:text-white uppercase italic tracking-tight">{log.action}</p>
                                <p className="text-[10px] text-stone-500 mt-1 leading-tight">{log.details}</p>
                                <div className="mt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Actor: <span className="text-stone-600 dark:text-stone-300">{log.actor_name || log.actor}</span></span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {/* Pagination Controls */}
                {logs.length > logsPerPage && (
                    <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
                        <button 
                            onClick={() => setLogPage(p => Math.max(p - 1, 1))} 
                            disabled={logPage === 1}
                            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                        </button>
                        <span className="text-[10px] font-black text-stone-700 dark:text-stone-300 uppercase tracking-widest">
                            PAGE {logPage} OF {totalLogPages}
                        </span>
                        <button 
                            onClick={() => setLogPage(p => Math.min(p + 1, totalLogPages))} 
                            disabled={logPage === totalLogPages}
                            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Add/Edit Admin Modal */}
        {showAddAdminModal && (
            <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[3rem] shadow-2xl p-8 relative border border-white/10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    <button onClick={() => setShowAddAdminModal(false)} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors"><X className="w-6 h-6" /></button>
                    <h3 className="font-black text-2xl mb-6 text-stone-900 dark:text-white uppercase italic tracking-tight">{isEditingAdmin ? 'Edit Admin' : 'New Commander'}</h3>
                    
                    <form onSubmit={handleAddAdmin} className="space-y-5">
                        <Input label="FULL NAME" value={newAdminForm.name} onChange={e => setNewAdminForm({...newAdminForm, name: e.target.value})} required className="rounded-2xl" labelClassName="text-[10px] font-black tracking-widest" />
                        <Input label="EMAIL ADDRESS" type="email" value={newAdminForm.email} onChange={e => setNewAdminForm({...newAdminForm, email: e.target.value})} required className="rounded-2xl" labelClassName="text-[10px] font-black tracking-widest" />
                        
                        {!isEditingAdmin && (
                            <Input label="INITIAL PASSWORD" type="password" value={newAdminForm.password} onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})} required className="rounded-2xl" labelClassName="text-[10px] font-black tracking-widest" />
                        )}
                        {isEditingAdmin && (
                            <Input label="NEW PASSWORD (OPTIONAL)" type="password" value={newAdminForm.password} onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})} placeholder="Biarkan kosong jika tidak ingin ganti" className="rounded-2xl" labelClassName="text-[10px] font-black tracking-widest" />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Level Access</label>
                                <select className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl text-sm font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20" value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})}>
                                    <option value="admin">Administrator</option>
                                    <option value="super_admin">Super Commander</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Account Status</label>
                                <select className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl text-sm font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20" value={newAdminForm.status} onChange={e => setNewAdminForm({...newAdminForm, status: e.target.value})}>
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Specific Permissions</label>
                            <div className="flex flex-wrap gap-2">
                                {['moderation', 'distribution', 'users', 'content', 'config'].map(perm => (
                                    <button 
                                      type="button" 
                                      key={perm}
                                      onClick={() => togglePermission(perm)}
                                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${newAdminForm.permissions.includes(perm) ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-stone-100 text-stone-500 border-transparent dark:bg-stone-800'}`}
                                    >
                                        {perm}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-stone-100 dark:border-stone-800">
                            <Button variant="ghost" onClick={() => setShowAddAdminModal(false)} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                            <Button type="submit" isLoading={isSaving} className="px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
                                {isEditingAdmin ? 'SAVE CHANGES' : 'CREATE PERSONNEL'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
