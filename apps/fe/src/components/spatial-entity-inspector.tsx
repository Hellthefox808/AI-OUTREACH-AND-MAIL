'use client';

import React from 'react';
import { Button, Badge, useToast } from '@career-intelligence/ui';
import { CompanyItem, RecruiterItem, JobItem } from '../lib/api';

export type SelectedEntity =
  | { type: 'company'; data: CompanyItem }
  | { type: 'recruiter'; data: RecruiterItem }
  | { type: 'job'; data: JobItem }
  | null;

interface SpatialEntityInspectorProps {
  entity: SelectedEntity;
  onClose: () => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export function SpatialEntityInspector({
  entity,
  onClose,
  onOpenChatWithPrompt,
}: SpatialEntityInspectorProps) {
  const toast = useToast();

  if (!entity) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard', `${label} is now in your clipboard.`);
  };

  const renderContent = () => {
    if (entity.type === 'company') {
      const c = entity.data;
      return (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={c.tier === 'TIER_1' ? 'purple' : 'default'} className="text-[10px]">
                  {c.tier || 'TIER_3'}
                </Badge>
                <span className="text-[10px] font-mono text-slate-400">ID: {c._id.slice(-6)}</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {c.displayName || c.legalName}
              </h3>
              <a
                href={`https://${c.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:underline font-mono inline-flex items-center gap-1"
              >
                <span>{c.domain}</span>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-400/20 text-sky-300 font-bold text-lg">
              {(c.displayName || c.legalName || 'C').charAt(0)}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Legal Name</span>
              <span className="text-slate-200 font-medium truncate block mt-0.5">{c.legalName || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Tier</span>
              <span className="text-slate-200 font-medium truncate block mt-0.5">{c.tier || 'TIER_3'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1.5">Industry Sectors</span>
              <div className="flex flex-wrap gap-1.5">
                {c.industries && c.industries.length > 0 ? (
                  c.industries.map((ind) => (
                    <Badge key={ind} variant="info" className="text-[10px]">
                      {ind}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">No industries tagged</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">First Recorded</span>
              <span className="text-slate-200 font-mono text-[11px] block mt-0.5">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2">
            <Button
              variant="crystal"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => handleCopy(JSON.stringify(c, null, 2), 'Company metadata')}
            >
              <span>📋 Copy JSON Record</span>
            </Button>
            {onOpenChatWithPrompt && (
              <Button
                variant="glass"
                size="sm"
                className="w-full justify-start gap-2 text-sky-300 border-sky-400/30"
                onClick={() => {
                  onClose();
                  onOpenChatWithPrompt(`Provide comprehensive intelligence and hiring trends for ${c.displayName || c.legalName} (${c.domain})`);
                }}
              >
                <span>✦ Query AI Sourcing Insights</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (entity.type === 'recruiter') {
      const r = entity.data;
      const isVerified = r.verificationStatus === 'VERIFIED';
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={isVerified ? 'success' : r.verificationStatus === 'INVALID' ? 'danger' : 'warning'}
                  pulse={isVerified}
                  className="text-[10px]"
                >
                  {r.verificationStatus || 'PENDING'}
                </Badge>
                <span className="text-[10px] font-mono text-slate-400">SCORE: {r.deliverabilityScore ?? 85}%</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{r.name}</h3>
              <p className="text-xs text-slate-300 font-medium">
                {r.designation || 'Talent Partner'} {r.department ? `• ${r.department}` : ''}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-bold text-lg">
              {r.name.charAt(0)}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Direct Email</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-slate-100 font-mono text-xs truncate">{r.email || 'None on file'}</span>
                {r.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(r.email!, 'Email address')}
                    className="text-xs text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-400/10"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">LinkedIn Profile</span>
              {r.linkedinUrl ? (
                <a
                  href={r.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline text-xs truncate block mt-0.5"
                >
                  View Profile &rarr;
                </a>
              ) : (
                <span className="text-slate-500 text-xs mt-0.5 block">Not linked</span>
              )}
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Deliverability</span>
              <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                {r.deliverabilityScore ?? 85}% Confidence
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2">
            {r.email && (
              <Button
                variant="crystal"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleCopy(r.email!, 'Recruiter Email')}
              >
                <span>✉ Copy Verified Email</span>
              </Button>
            )}
            {onOpenChatWithPrompt && (
              <Button
                variant="glass"
                size="sm"
                className="w-full justify-start gap-2 text-sky-300 border-sky-400/30"
                onClick={() => {
                  onClose();
                  onOpenChatWithPrompt(`Draft a personalized outreach note for ${r.name} (${r.designation || 'Recruiter'}) with high deliverability focus.`);
                }}
              >
                <span>✦ Generate Tailored Outreach Note</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (entity.type === 'job') {
      const j = entity.data;
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={j.workMode === 'REMOTE' ? 'success' : 'info'} className="text-[10px]">
                  {j.workMode || 'ONSITE'}
                </Badge>
                <Badge variant="purple" className="text-[10px]">
                  {j.jobType || 'FULL_TIME'}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{j.title}</h3>
              <p className="text-xs text-slate-300 font-mono">
                {j.location || 'Remote'} {j.status ? `• ${j.status}` : ''}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/20 text-amber-300 font-bold text-lg">
              💼
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Workplace Model</span>
              <span className="text-slate-100 font-medium block mt-0.5">{j.workMode || 'REMOTE'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Requisition Status</span>
              <span className="text-emerald-400 font-medium block mt-0.5">{j.status || 'OPEN'}</span>
            </div>
            {j.applicationUrl && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Application Link</span>
                <a
                  href={j.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline text-xs truncate block mt-0.5 font-mono"
                >
                  {j.applicationUrl}
                </a>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2">
            {j.applicationUrl && (
              <a
                href={j.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="crystal" size="sm" className="w-full justify-start gap-2">
                  <span>↗ Open External Career Portal</span>
                </Button>
              </a>
            )}
            {onOpenChatWithPrompt && (
              <Button
                variant="glass"
                size="sm"
                className="w-full justify-start gap-2 text-sky-300 border-sky-400/30"
                onClick={() => {
                  onClose();
                  onOpenChatWithPrompt(`Analyze requisition "${j.title}" and formulate the top candidate match keywords and recruiter outreach strategy.`);
                }}
              >
                <span>✦ Analyze Job & Formulate Strategy</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Entity Inspector"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900/95 border-l border-white/15 p-6 flex flex-col z-10 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-right duration-220 ease-spatial overflow-y-auto">
        {/* Specular Rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent"
        />

        {/* Top Close Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
              Spatial Entity Inspector
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close inspector drawer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}
