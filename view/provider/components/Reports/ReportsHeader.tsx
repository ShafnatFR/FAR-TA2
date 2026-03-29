
import React from 'react';
import { LayoutGrid, StretchHorizontal } from 'lucide-react';

interface ReportsHeaderProps {
    count: number;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({ count }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic">Pusat Masalah <span className="text-orange-500">({count})</span></h2>
        </div>
    );
};
