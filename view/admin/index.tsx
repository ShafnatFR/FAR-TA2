
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Shield, Truck, BarChart3, Megaphone, 
  FileText, Settings, UserCog, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { UserRole, UserData, FoodItem, ClaimHistoryItem, FAQItem, BroadcastMessage, Address } from '../../types';
import { Overview } from './components/Overview';
import { Community } from './components/Community';
import { Moderation } from './components/Moderation';
import { Distribution } from './components/Distribution';
import { Impact } from './components/Impact';
import { Communication } from './components/Communication';
import { ContentCMS } from './components/ContentCMS';
import { SystemConfig } from './components/SystemConfig';
import { AdminList } from './components/AdminList';

interface AdminIndexProps {
  role: UserRole;
  onLogout: () => void;
  currentUser: UserData | null;
  globalUsers: UserData[];
  setGlobalUsers: React.Dispatch<React.SetStateAction<UserData[]>>;
  globalInventory: FoodItem[];
  globalClaims: ClaimHistoryItem[];
  globalFAQs: FAQItem[];
  setGlobalFAQs: React.Dispatch<React.SetStateAction<FAQItem[]>>;
  broadcastMessages: BroadcastMessage[];
  setBroadcastMessages: React.Dispatch<React.SetStateAction<BroadcastMessage[]>>;
  allAddresses?: Address[];
  appSettings?: any;
  setAppSettings?: React.Dispatch<React.SetStateAction<any>>;
  onRefresh?: () => Promise<void>;
}

export const AdminIndex: React.FC<AdminIndexProps> = ({ 
    role, 
    onLogout, 
    currentUser, 
    globalUsers, 
    setGlobalUsers, 
    globalInventory, 
    globalClaims, 
    globalFAQs, 
    setGlobalFAQs,
    broadcastMessages,
    setBroadcastMessages,
    allAddresses = [],
    appSettings,
    setAppSettings,
    onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'community', label: 'Komunitas', icon: Users },
    { id: 'moderation', label: 'Moderasi', icon: Shield },
    { id: 'distribution', label: 'Distribusi', icon: Truck },
    { id: 'impact', label: 'Dampak ESG', icon: BarChart3 },
    { id: 'communication', label: 'Broadcast', icon: Megaphone },
    { id: 'content', label: 'Konten CMS', icon: FileText },
    { id: 'admins', label: 'Admin List', icon: UserCog },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview 
                  onNavigate={setActiveTab} 
                  stats={{
                      usersCount: globalUsers.length,
                      claimsCount: globalClaims.length,
                      inventoryCount: globalInventory.length,
                      reportsCount: globalClaims.filter(c => c.isReported && c.reportId && c.reportStatus?.toUpperCase() !== 'RESOLVED' && c.reportStatus?.toUpperCase() !== 'REJECTED').length
                  }}
                  claims={globalClaims}
                  inventory={globalInventory}
                  users={globalUsers}
               />;
      case 'community':
        return <Community 
                  users={globalUsers} 
                  setUsers={setGlobalUsers} 
                  inventory={globalInventory} 
                  claims={globalClaims} 
               />;
      case 'moderation':
        return <Moderation claims={globalClaims} onReportUpdate={() => onRefresh && onRefresh()} />;
      case 'distribution':
        return <Distribution claims={globalClaims} users={globalUsers} inventory={globalInventory} allAddresses={allAddresses} />;
      case 'impact':
        return <Impact claims={globalClaims} />;
      case 'communication':
        return <Communication broadcastMessages={broadcastMessages} setBroadcastMessages={setBroadcastMessages} />;
      case 'content':
        return <ContentCMS faqs={globalFAQs} setFaqs={setGlobalFAQs} />;
      case 'admins':
        return <AdminList />;
      case 'settings':
        return <SystemConfig appSettings={appSettings} setAppSettings={setAppSettings} />;
      default:
        return <Overview 
                  onNavigate={setActiveTab} 
                  stats={{
                      usersCount: globalUsers.length,
                      claimsCount: globalClaims.length,
                      inventoryCount: globalInventory.length,
                      reportsCount: globalClaims.filter(c => c.isReported).length
                  }}
               />;
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] dark:bg-stone-950 font-sans overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#120D0A] text-stone-400 transform transition-all duration-300 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:flex md:flex-col
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        w-64
      `}>
        <div className={`p-6 border-b border-white/5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
                <div>
                    <h1 className="text-xl font-black text-white italic tracking-tighter">ADMIN</h1>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-orange-500">Food AI Rescue</p>
                </div>
            )}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-stone-400"><X className="w-6 h-6" /></button>
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                className="hidden md:block text-stone-500 hover:text-white transition-colors"
            >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all 
                        ${activeTab === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'hover:bg-white/5 hover:text-white'}
                        ${isSidebarCollapsed ? 'justify-center px-2' : ''}
                    `}
                    title={isSidebarCollapsed ? item.label : ''}
                >
                    <item.icon className={`w-5 h-5 ${isSidebarCollapsed ? 'w-6 h-6' : ''}`} />
                    {!isSidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}
                </button>
            ))}
        </nav>

        <div className="p-4 border-t border-white/5">
            <div className={`flex items-center gap-3 px-4 py-3 mb-2 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center font-bold text-white text-xs shrink-0">A</div>
                {!isSidebarCollapsed && (
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Admin'}</p>
                        <p className="text-[9px] uppercase font-bold text-stone-500 truncate">{role?.replace('_', ' ')}</p>
                    </div>
                )}
            </div>
            <button 
                onClick={onLogout}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-xs font-black uppercase tracking-widest ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={isSidebarCollapsed ? 'Keluar' : ''}
            >
                <LogOut className="w-4 h-4" /> {!isSidebarCollapsed && 'Keluar'}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 z-40">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-stone-600 dark:text-stone-300">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-black text-stone-900 dark:text-white italic">ADMIN DASHBOARD</span>
            <div className="w-8"></div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </div>
      </main>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};
