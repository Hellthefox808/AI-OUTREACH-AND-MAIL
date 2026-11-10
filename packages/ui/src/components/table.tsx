import React from 'react';
import { cn } from '../index';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-xl shadow-glass-md">
      <table className={cn('w-full caption-bottom text-sm text-slate-200', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'border-b border-white/[0.08] bg-slate-900/60 backdrop-blur-md text-xs uppercase tracking-wider text-slate-400 font-semibold',
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0 divide-y divide-white/[0.04]', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-160 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] data-[state=selected]:bg-white/[0.08]',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle font-medium tracking-wider text-slate-400 select-none [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('p-4 align-middle text-slate-300 [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}
