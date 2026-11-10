import React from 'react';
import { cn } from '../index';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  material?: 'ambient' | 'frosted' | 'crystal' | 'dark' | 'solid';
  interactive?: boolean;
}

export function Card({
  className,
  material = 'frosted',
  interactive = false,
  children,
  ...props
}: CardProps) {
  const materials = {
    ambient:
      'bg-slate-900/30 backdrop-blur-md border border-white/[0.06] shadow-glass-sm text-slate-100',
    frosted:
      'bg-slate-900/65 backdrop-blur-xl border border-white/[0.1] shadow-glass-md text-slate-100',
    crystal:
      'bg-slate-800/75 backdrop-blur-2xl border border-white/[0.18] shadow-glass-crystal text-white',
    dark:
      'bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/[0.08] shadow-glass-lg text-slate-100',
    solid:
      'bg-slate-900 border border-slate-800 text-slate-100 shadow-md',
  };

  const interactiveStyles = interactive
    ? 'transition-all duration-220 ease-standard hover:-translate-y-1 hover:shadow-glass-lg hover:border-white/25 cursor-pointer'
    : 'transition-colors duration-220';

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        materials[material],
        interactiveStyles,
        className
      )}
      {...props}
    >
      {/* Specular top rim highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-400', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0 border-t border-white/[0.06]', className)} {...props} />;
}
