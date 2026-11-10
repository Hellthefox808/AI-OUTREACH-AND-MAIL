'use client';

import React from 'react';
import { cn } from '../index';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SpatialTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SpatialTabs({ tabs, activeTab, onChange, className }: SpatialTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter navigation"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/50 p-1 backdrop-blur-md shadow-glass-sm',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-160 ease-standard select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
              isActive
                ? 'bg-white/12 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {tab.icon && <span className="text-current">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
