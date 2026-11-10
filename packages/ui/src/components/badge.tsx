import React from 'react';
import { cn } from '../index';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline' | 'glass';
  pulse?: boolean;
}

export function Badge({ className, variant = 'default', pulse = false, children, ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-slate-800/80 text-slate-300 border-white/10 shadow-xs',
    success:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-xs',
    warning:
      'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-xs',
    danger:
      'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-xs',
    info:
      'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-xs',
    purple:
      'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-xs',
    outline:
      'bg-transparent text-slate-300 border-white/20',
    glass:
      'bg-white/10 text-white border-white/25 backdrop-blur-md shadow-glass-sm',
  };

  const pulseColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    purple: 'bg-purple-400',
    outline: 'bg-slate-300',
    glass: 'bg-white',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide backdrop-blur-sm transition-colors duration-160 select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              pulseColors[variant]
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              pulseColors[variant]
            )}
          />
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}
