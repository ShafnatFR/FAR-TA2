import React, { useState, useEffect } from 'react';
import { Settings, Lock, Loader2, CheckCircle, Bug } from 'lucide-react';
import { Button } from '../../components/Button';
import { db } from '../../../services/db';

interface SystemSetting {
    id: string;
    name: string;
    description: string;
    value: boolean | number | string;
    type: 'toggle' | 'slider' | 'select' | 'input';
    category: string;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    unit?: string;
}

export const SystemConfig: React.FC<{ appSettings?: any, setAppSettings?: any }> = ({ appSettings, setAppSettings }) => {
    const [settings, setSettings] = useState<SystemSetting[]>([
        // Emergency Controls
        { id: 'maintenance', name: 'Maintenance Mode', description: 'Matikan semua akses user sementara.', value: false, type: 'toggle', category: 'emergency' },
        { id: 'disable_signup', name: 'Disable New Signups', description: 'Cegah pendaftaran user baru.', value: false, type: 'toggle', category: 'emergency' },
        { id: 'readonly_mode', name: 'Read-Only Mode', description: 'User hanya bisa melihat, tidak bisa menambah/edit data.', value: false, type: 'toggle', category: 'emergency' },
        // Debug
        { id: 'disableExpiryLogic', name: 'Abaikan Kedaluwarsa Data (Debug)', description: 'Tampilkan semua makanan tanpa mengecek waktu kedaluwarsa (bypass isFoodExpired frontend & backend).', value: appSettings?.disableExpiryLogic || false, type: 'toggle', category: 'debug' }
    ]);

    useEffect(() => {
        if (appSettings) {
             setSettings(prev => prev.map(s => s.id === 'disableExpiryLogic' ? { ...s, value: appSettings.disableExpiryLogic } : s));
        }
    }, [appSettings]);

    const [activeCategory, setActiveCategory] = useState('emergency');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const categories = [
        { id: 'emergency', name: 'Emergency Controls', icon: Lock, color: 'red' },
        { id: 'debug', name: 'Developer & Debugging', icon: Bug, color: 'orange' },
    ];

    const updateSetting = (id: string, value: boolean | number | string) => {
        setSettings(settings.map(s => s.id === id ? { ...s, value } : s));
        setHasChanges(true);
    };

    const handleSaveConfig = async () => {
        setIsSaving(true);
        // Map settings to push to backend
        const settingsToUpdate = {
             disableExpiryLogic: settings.find(s => s.id === 'disableExpiryLogic')?.value
        };

        try {
            const updated = await db.updateSettings(settingsToUpdate);
            if (setAppSettings) setAppSettings(updated);
            setHasChanges(false);
            setSuccessMessage('Konfigurasi berhasil disimpan!');
        } catch (e) {
            console.error("Failed to save settings", e);
        }
        setIsSaving(false);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const filteredSettings = settings.filter(s => s.category === activeCategory);
    const activeCatego = categories.find(c => c.id === activeCategory);

    const renderSettingControl = (setting: SystemSetting) => {
        switch (setting.type) {
            case 'toggle':
                return (
                    <button
                        onClick={() => updateSetting(setting.id, !setting.value)}
                        className={`w-14 h-7 rounded-full p-1 transition-colors ${setting.value ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${setting.value ? 'translate-x-7' : ''}`} />
                    </button>
                );
            case 'slider':
                return (
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <input
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            value={setting.value as number}
                            onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
                            className="flex-1 accent-orange-500"
                        />
                        <span className="text-sm font-bold text-orange-500 min-w-[60px] text-right">
                            {setting.value}{setting.unit}
                        </span>
                    </div>
                );
            case 'select':
                return (
                    <select
                        value={setting.value as string}
                        onChange={(e) => updateSetting(setting.id, e.target.value)}
                        className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:border-orange-500 min-w-[150px]"
                    >
                        {setting.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'input':
                return (
                    <input
                        type="text"
                        value={setting.value as string}
                        onChange={(e) => updateSetting(setting.id, e.target.value)}
                        className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:border-orange-500 min-w-[200px]"
                    />
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-orange-500" /> System Configuration
                </h2>
                <Button onClick={handleSaveConfig} disabled={!hasChanges || isSaving} className="w-auto h-9 text-xs">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {hasChanges ? 'Save Changes' : 'No Changes'}
                </Button>
            </div>

            <div className="flex gap-6">
                {/* Category Sidebar */}
                <div className="w-56 shrink-0 space-y-2">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const colorClasses = {
                            red: 'text-red-500 bg-red-50 dark:bg-red-900/20',
                        };
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${activeCategory === cat.id
                                        ? `${colorClasses[cat.color as keyof typeof colorClasses]} font-bold`
                                        : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm">{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Settings Panel */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                        <div className={`p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3 ${activeCatego?.color === 'red' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-orange-50 dark:bg-orange-900/10'}`}>
                            {activeCatego && <activeCatego.icon className={`w-5 h-5 ${activeCatego.color === 'red' ? 'text-red-500' : 'text-orange-500'}`} />}
                            <h3 className="font-bold text-stone-900 dark:text-white">{activeCatego?.name}</h3>
                        </div>

                        <div className="divide-y divide-stone-100 dark:divide-stone-800">
                            {filteredSettings.map(setting => (
                                <div key={setting.id} className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                    <div className="flex-1 pr-4">
                                        <p className="font-bold text-stone-900 dark:text-white">{setting.name}</p>
                                        <p className="text-xs text-stone-500">{setting.description}</p>
                                    </div>
                                    {renderSettingControl(setting)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
