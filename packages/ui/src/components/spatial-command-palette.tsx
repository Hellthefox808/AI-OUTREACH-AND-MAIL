'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../index';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface SpatialCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export function SpatialCommandPalette({ isOpen, onClose, items }: SpatialCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredItems, selectedIndex]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group by category
  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl rounded-2xl border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-3xl overflow-hidden z-10 animate-in zoom-in-95 duration-160 ease-spatial">
        {/* Specular Rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
          <svg className="h-5 w-5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search workspace... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.06] border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or destinations found.
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filteredItems.filter((i) => i.category === category);
              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {category}
                  </div>
                  {categoryItems.map((item) => {
                    const itemGlobalIndex = filteredItems.indexOf(item);
                    const isSelected = itemGlobalIndex === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onClick={() => {
                          item.onSelect();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-100 ease-standard select-none',
                          isSelected
                            ? 'bg-sky-500/20 text-white border border-sky-400/30 shadow-glass-sm'
                            : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.icon && (
                            <span className={cn('shrink-0', isSelected ? 'text-sky-400' : 'text-slate-400')}>
                              {item.icon}
                            </span>
                          )}
                          <span className="font-medium truncate">{item.title}</span>
                        </div>
                        {item.shortcut && (
                          <kbd
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ml-2',
                              isSelected
                                ? 'bg-sky-400/20 text-sky-200 border border-sky-400/30'
                                : 'bg-white/[0.06] text-slate-400 border border-white/10'
                            )}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Helper */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-slate-950/40 px-4 py-2.5 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Career Intel OS Spatial Dispatch</span>
        </div>
      </div>
    </div>
  );
}
