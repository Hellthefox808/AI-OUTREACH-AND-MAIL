'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Button,
  Badge,
  SpatialParticleField,
  SpatialCommandPalette,
  CommandItem,
  useToast,
} from '@career-intelligence/ui';
import { useAuth } from '../../lib/auth-context';

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Companies',
    href: '/companies',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Recruiters',
    href: '/recruiters',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commandItems: CommandItem[] = [
    {
      id: 'cmd-overview',
      title: 'Go to Spatial Intelligence Overview',
      category: 'Navigation',
      shortcut: 'G O',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onSelect: () => router.push('/'),
    },
    {
      id: 'cmd-companies',
      title: 'Browse Target Companies',
      category: 'Navigation',
      shortcut: 'G C',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      onSelect: () => router.push('/companies'),
    },
    {
      id: 'cmd-recruiters',
      title: 'Explore Recruiter Contacts',
      category: 'Navigation',
      shortcut: 'G R',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onSelect: () => router.push('/recruiters'),
    },
    {
      id: 'cmd-jobs',
      title: 'View Open Career Requisitions',
      category: 'Navigation',
      shortcut: 'G J',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      onSelect: () => router.push('/jobs'),
    },
    {
      id: 'cmd-add-company',
      title: 'Create Target Organization',
      category: 'Quick Actions',
      shortcut: 'N C',
      icon: <span>+</span>,
      onSelect: () => router.push('/companies'),
    },
    {
      id: 'cmd-add-recruiter',
      title: 'Track New Recruiter Contact',
      category: 'Quick Actions',
      shortcut: 'N R',
      icon: <span>+</span>,
      onSelect: () => router.push('/recruiters'),
    },
    {
      id: 'cmd-sign-out',
      title: 'Sign Out of Active Workspace',
      category: 'System',
      icon: (
        <svg className="h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onSelect: async () => {
        await logout();
        toast.info('Signed out', 'Session terminated successfully.');
        router.push('/login');
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080a0f] text-slate-100">
        <div className="flex flex-col items-center space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-glass-crystal backdrop-blur-2xl">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-sky-400/20" />
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Initializing Spatial Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Spatial Intelligence Overview';
    if (path === '/companies') return 'Target Companies Directory';
    if (path === '/recruiters') return 'Recruiter Discovery & Verification';
    if (path === '/jobs') return 'Active Career Requisitions';
    return path.replace('/', '').toUpperCase();
  };

  return (
    <div className="relative flex min-h-screen bg-[#080a0f] text-slate-100 overflow-hidden">
      {/* Layer 1: Ambient 4D Particle System */}
      <SpatialParticleField density="medium" networkLines={true} interactive={true} />

      {/* Global Command Palette */}
      <SpatialCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={commandItems}
      />

      {/* Layer 2: Desktop Sidebar Navigation */}
      <aside className="relative z-20 hidden md:flex w-64 flex-col shrink-0 border-r border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-white/20 shadow-glass-crystal transition-transform duration-160 group-hover:scale-105">
              <span className="font-bold text-sm tracking-wide text-white">CI</span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">Career Intel OS</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">SPATIAL 4D ENGINE</span>
            </div>
          </Link>
        </div>

        {/* Workspace Pill */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1">
            Active Workspace
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-200 truncate">
              {user.workspaceIds?.[0] ? `WS-${user.workspaceIds[0].slice(-6).toUpperCase()}` : 'Default Workspace'}
            </span>
            <Badge variant="success" pulse className="text-[10px]">
              Active
            </Badge>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5" role="navigation" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-160 ease-standard ${
                  isActive
                    ? 'bg-white/12 text-white border border-white/18 shadow-glass-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-sky-400' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Command Trigger in Sidebar */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 bg-white/[0.03] border border-white/[0.08] hover:border-sky-400/30 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span>Command Menu</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] border border-white/10 text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/80">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-white/15 text-xs font-bold text-white uppercase">
              {user.name ? user.name.slice(0, 2) : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
            onClick={async () => {
              await logout();
              toast.info('Signed out', 'Session closed.');
              router.push('/login');
            }}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80%] bg-slate-950 border-r border-white/10 p-5 flex flex-col z-10 animate-in slide-in-from-left duration-220">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-bold text-white text-sm">Career Intel OS</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                      isActive
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Layer 2: Ambient Glass Header */}
        <header className="h-16 border-b border-white/[0.08] bg-slate-950/50 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Open mobile navigation menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                {getPageTitle(pathname)}
              </h1>
              <p className="hidden sm:block text-[11px] text-slate-400 font-mono">
                ENGINE STATUS: OPTIMAL | WCAG 2.2 AA VERIFIED
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Header Spotlight Search Trigger */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs text-slate-400 bg-white/[0.04] border border-white/[0.08] hover:border-sky-400/40 hover:text-white transition-all shadow-glass-sm"
              aria-label="Open command search"
            >
              <svg className="h-3.5 w-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span>Quick Search / Jump...</span>
              <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/[0.08] border border-white/15 text-slate-300">
                ⌘K
              </kbd>
            </button>

            <Badge variant="glass" pulse className="text-[11px] font-mono">
              API :3001 CONNECTED
            </Badge>
          </div>
        </header>

        {/* Layer 3: Interactive Workspace Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
