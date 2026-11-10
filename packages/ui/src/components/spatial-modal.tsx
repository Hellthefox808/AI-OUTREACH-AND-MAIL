'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

export interface SpatialModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SpatialModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: SpatialModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spatial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Layer 0 / Backdrop blur */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-320 ease-standard"
      />

      {/* Layer 5 / Elevated Spatial Dialog */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthClasses[maxWidth]} z-10 animate-in fade-in-0 zoom-in-95 duration-220 ease-spatial`}
      >
        <Card material="crystal" className="shadow-2xl border-white/20">
          <CardHeader className="flex flex-row items-start justify-between border-b border-white/[0.08] pb-4">
            <div className="space-y-1 pr-6">
              <CardTitle id="spatial-modal-title" className="text-xl font-semibold tracking-tight text-white">
                {title}
              </CardTitle>
              {description && <CardDescription className="text-xs text-slate-400">{description}</CardDescription>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </CardHeader>

          <CardContent className="pt-6">{children}</CardContent>

          {footer && <CardFooter className="flex justify-end gap-3 pt-4">{footer}</CardFooter>}
        </Card>
      </div>
    </div>
  );
}
