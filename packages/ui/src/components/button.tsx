import React from 'react';
import { cn } from '../index';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'crystal' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-medium rounded-xl select-none transition-all duration-160 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 overflow-hidden';

    const variants = {
      primary:
        'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-glass-sm border border-slate-700/60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:border-white/20',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700',
      outline:
        'border border-slate-300/80 bg-transparent text-slate-800 hover:bg-slate-100/60 active:bg-slate-200/60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5 dark:active:bg-white/10',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm border border-rose-500/50',
      crystal:
        'bg-white/10 text-white hover:bg-white/15 active:bg-white/20 border border-white/25 shadow-glass-crystal backdrop-blur-xl',
      glass:
        'bg-slate-900/60 text-slate-100 hover:bg-slate-900/80 active:bg-slate-950/90 border border-white/10 shadow-glass-sm backdrop-blur-md',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs tracking-wide gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {/* Specular highlight rim */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}

        <span className="relative z-10">{children}</span>

        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
