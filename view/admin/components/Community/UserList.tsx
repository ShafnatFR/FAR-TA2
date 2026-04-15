
import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, AlertCircle, Eye, Edit3, Trash2, ChevronLeft, ChevronRight, RefreshCw, Shield } from 'lucide-react';
import { Button } from '../../../components/Button';
import { UserData, FoodItem, ClaimHistoryItem } from '../../../../types';
import { UserModal } from './UserModal';
import { VerificationModal } from './VerificationModal';
import { db } from '../../../../services/db';

interface UserListProps {
    users: UserData[];
    setUsers: React.Dispatch<React.SetStateAction<UserData[]>>;
    inventory: FoodItem[];
    claims: ClaimHistoryItem[];
    pendingCount: number;
    currentUser: UserData | null;
}

export const UserList: React.FC<UserListProps> = ({ users, setUsers, inventory, claims, pendingCount, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [verificationUser, setVerificationUser] = useState<UserData | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate points logic (FIXED: Added ID filtering)
    const calculatePoints = (user: UserData): number => {
        let points = user.points || 0;
        if (user.role === 'individual_donor' || user.role === 'corporate_donor') {
            const completedOrders = claims.filter(c => (c.providerId === user.id || c.providerName === user.name) && c.status === 'completed').length;
            const activeStock = inventory.filter(i => i.providerId === user.id || i.providerName === user.name).length;
            points += (completedOrders * 50) + (activeStock * 10);
        } else if (user.role === 'volunteer') {
            const missions = claims.filter(c => (c.volunteerId === user.id || c.courierName === user.name) && c.status === 'completed').length;
            points += (missions * 150);
        } else if (user.role === 'recipient') {
            // FIX: Ensure we only count claims belonging to THIS user
            const myClaims = claims.filter(c => c.receiverId === user.id && c.status === 'completed').length;
            points += (myClaims * 10);
        }
        return points;
    };

    const handleRefresh = async () => {
        setIsProcessing(true);
        try {
            const latestUsers = await db.getUsers();
            setUsers(latestUsers);
        } catch (error) {
            console.error("Failed to refresh users:", error);
            alert("Gagal memperbarui data pengguna.");
        } finally {
            setIsProcessing(false);
        }
    };

    const processedUsers = users
        .filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        })
        .sort((a, b) => {
            // 1. Prioritize Pending Status
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            
            // 2. Sort DESC by ID (Assuming ID represents creation order/timestamp)
            // String comparison works for timestamps or padded numbers
            return String(b.id).localeCompare(String(a.id));
        });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = processedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedUsers.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter]);

    const handleSaveUser = async (user: UserData) => {
        setIsProcessing(true);
        try {
            await db.upsertUser({ ...user, actor: currentUser ? { id: currentUser.id, name: currentUser.name } : undefined });
            if (user.id === 'new') {
                setUsers(prev => [{ ...user, id: Date.now().toString() }, ...prev]);
            } else {
                setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            }
            setIsUserModalOpen(false);
            setSelectedUser(null);
            alert("Data pengguna berhasil diperbarui!");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Gagal menyimpan data pengguna.");
        } finally {
            setIsProcessing(false);
        }
    };

    const processVerification = async (status: 'active' | 'suspended') => {
        if (!verificationUser) return;
        
        setIsProcessing(true);
        try {
            // 1. Prepare updated user object
            const updatedUser = { ...verificationUser, status: status };
            
            // 2. Save to Database
            await db.upsertUser({ 
                ...updatedUser, 
                actor: currentUser ? { id: currentUser.id, name: currentUser.name } : undefined 
            });

            // 3. Update Local State
            setUsers(prev => prev.map(u => u.id === verificationUser.id ? updatedUser : u));
            
            // 4. Feedback
            if (status === 'active') {
                alert(`✅ Akun ${verificationUser.name} berhasil diaktifkan.`);
            } else {
                alert(`⛔ Akun ${verificationUser.name} telah ditolak (Non-Activated).`);
            }
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Gagal memproses verifikasi. Periksa koneksi internet.");
        } finally {
            setIsProcessing(false);
            setVerificationUser(null);
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-left duration-400">
            {/* Header User */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                        Manajemen Pengguna
                        {pendingCount > 0 && (
                            <div className="relative group cursor-help">
                                <span className="absolute -inset-1 bg-red-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></span>
                                <span className="relative text-[9px] bg-gradient-to-r from-red-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full not-italic font-black tracking-wider shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                    {pendingCount} PENDING
                                </span>
                            </div>
                        )}
                    </h2>
                    <p className="text-[10px] text-stone-500 font-medium">Monitoring hak akses dan verifikasi anggota baru.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRefresh} 
                        disabled={isProcessing}
                        className="h-10 w-10 shrink-0 aspect-square flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-500 hover:text-orange-600 hover:border-orange-200 transition-all disabled:opacity-50 shadow-sm"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    </button>
                    <Button
                        className="h-10 px-5 bg-orange-600 font-black uppercase text-[10px] tracking-widest whitespace-nowrap"
                        onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }}
                    >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH USER
                    </Button>
                </div>
            </div>

            {/* Filter User */}
            <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1 bg-white dark:bg-stone-900 p-0.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                    <Search className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-2 text-stone-900 dark:text-stone-200 placeholder-stone-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 lg:flex gap-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-2 rounded-xl text-[10px] font-bold text-stone-700 dark:text-stone-300 focus:outline-none focus:border-orange-500 appearance-none shadow-sm min-w-[110px]"
                    >
                        <option value="all">Semua Peran</option>
                        <option value="individual_donor">Donatur Individu</option>
                        <option value="corporate_donor">Donatur Korporat</option>
                        <option value="recipient">Penerima</option>
                        <option value="volunteer">Relawan</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-2 rounded-xl text-[10px] font-bold text-stone-700 dark:text-stone-300 focus:outline-none focus:border-orange-500 appearance-none shadow-sm min-w-[110px]"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Table User */}
            <div className="bg-white dark:bg-stone-900 rounded-[1.25rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead className="bg-stone-50 dark:bg-stone-950 text-stone-400 text-[9px] uppercase font-black tracking-[0.1em] border-b border-stone-100 dark:border-stone-800">
                            <tr>
                                <th className="px-3 py-3 w-full">Identitas</th>
                                <th className="px-3 py-3 w-px whitespace-nowrap">Peran</th>
                                <th className="px-3 py-3 w-px whitespace-nowrap text-center">Poin</th>
                                <th className="px-3 py-3 w-px whitespace-nowrap">Status</th>
                                <th className="px-3 py-3 w-px whitespace-nowrap text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {currentUsers.map(user => {
                                const isPending = user.status === 'pending';
                                const displayPoints = calculatePoints(user);
                                return (
                                    <tr
                                        key={user.id}
                                        className={`
                                        transition-all group
                                        ${isPending
                                                ? 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 border-l-4 border-l-amber-500'
                                                : user.status === 'suspended' 
                                                    ? 'bg-red-50/50 dark:bg-red-900/5 hover:bg-red-50 border-l-4 border-l-red-500'
                                                    : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30 border-l-4 border-l-transparent'
                                            }
                                    `}
                                    >
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black shadow-sm shrink-0 text-[10px] ${(user.role === 'individual_donor' || user.role === 'corporate_donor') ? 'bg-orange-600' : user.role === 'volunteer' ? 'bg-orange-500' : 'bg-orange-400'
                                                    }`}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-xs text-stone-900 dark:text-white truncate">{user.name}</p>
                                                        {isPending && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                                <span className="text-[7px] font-black bg-red-500 text-white px-1 py-0.5 rounded italic leading-none animate-bounce">NEW</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-stone-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap border ${isPending ? 'bg-white/50 border-amber-200 text-amber-700' : 'bg-stone-100 dark:bg-stone-800 border-transparent text-stone-500'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`font-black text-sm tracking-tighter ${isPending ? 'text-amber-700 dark:text-amber-500' : 'text-stone-900 dark:text-white'}`}>
                                                {displayPoints.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] uppercase font-black tracking-widest whitespace-nowrap flex items-center gap-1 w-fit ${user.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    user.status === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {user.status === 'pending' && <AlertCircle className="w-2.5 h-2.5" />}
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {isPending ? (
                                                <div className="flex justify-end">
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => setVerificationUser(user)}
                                                        disabled={isProcessing}
                                                        className="h-8 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-2 text-[9px] font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 border-b-2 border-amber-700 italic tracking-wider whitespace-nowrap"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" /> VERIFIKASI AKUN
                                                    </button>
                                                </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                                                    <button className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest">
                        Data {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedUsers.length)} / {processedUsers.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-200 disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                        </button>
                        <div className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-[9px] font-black text-orange-600 uppercase tracking-widest shadow-sm">Hal {currentPage} / {totalPages}</div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-200 disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
                        >
                            <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                        </button>
                    </div>
                </div>
            </div>

            {verificationUser && (
                <VerificationModal
                    user={verificationUser}
                    onClose={() => setVerificationUser(null)}
                    onProcess={processVerification}
                    isProcessing={isProcessing}
                />
            )}

            {isUserModalOpen && (
                <UserModal
                    user={selectedUser}
                    onClose={() => { setIsUserModalOpen(false); setSelectedUser(null); }}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};
