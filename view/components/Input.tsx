
import React from 'react';
import { InputProps } from '../../types';

export const Input: React.FC<InputProps> = ({ label, error, icon, leftAddon, rightElement, className = '', containerClassName = '', labelClassName = '', ...props }) => {
  return (
    <div className={`w-full space-y-2 group ${containerClassName}`}>
      <label className={`text-sm font-medium text-stone-600 dark:text-stone-400 group-focus-within:text-orange-500 transition-colors ${labelClassName}`}>
        {label}
      </label>
      <div className="relative flex">
        {leftAddon && (
          <div className="flex-shrink-0 z-10 inline-flex items-center px-4 rounded-l-xl border border-r-0 border-stone-300 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 font-bold text-sm">
            {leftAddon}
          </div>
        )}
        
        <div className="relative flex-1">
            {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 group-focus-within:text-orange-500 transition-colors">
                {icon}
            </div>
            )}
            <input
            className={`
                w-full 
                bg-white dark:bg-stone-900/50 
                border border-stone-300 dark:border-stone-800 
                text-stone-900 dark:text-stone-200 
                ${leftAddon ? 'rounded-r-xl rounded-l-none' : 'rounded-xl'} 
                px-4 py-3 
                ${icon ? 'pl-10' : ''}
                ${rightElement ? 'pr-12' : ''}
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                placeholder-stone-300 dark:placeholder-stone-600 
                transition-all duration-300
                ${error ? 'border-red-500 focus:border-red-500' : ''}
                ${className}
            `}
            {...props}
            />
            {rightElement && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {rightElement}
              </div>
            )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
};
