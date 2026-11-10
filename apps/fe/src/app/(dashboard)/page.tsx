'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  SpatialKpiCard,
  SpatialSkeleton,
  SpatialTooltip,
  useToast,
} from '@career-intelligence/ui';
import {
  api,
  CompanyItem,
  RecruiterItem,
  JobItem,
  WorkspaceAnalyticsOverview,
  WorkspaceAnalyticsBreakdown,
} from '../../lib/api';
import { DataChatDrawer } from '../../components/data-chat-drawer';

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

type SelectedEntity =
  | { type: 'company'; data: CompanyItem }
  | { type: 'recruiter'; data: RecruiterItem }
  | { type: 'job'; data: JobItem }
  | null;

export default function DashboardOverviewPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<WorkspaceAnalyticsOverview | null>(null);
  const [breakdown, setBreakdown] = useState<WorkspaceAnalyticsBreakdown | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'recruiters' | 'jobs'>('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  const openChatWithPrompt = (prompt: string) => {
    setChatPrompt(prompt);
    setIsChatOpen(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [overviewRes, breakdownRes, compRes, recRes, jobRes] = await Promise.allSettled([
          api.analytics.getOverview(),
          api.analytics.getBreakdown(),
          api.companies.list({ limit: 8 }),
          api.recruiters.list({ limit: 8 }),
          api.jobs.list({ limit: 8 }),
        ]);

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
        if (breakdownRes.status === 'fulfilled') setBreakdown(breakdownRes.value);
        if (compRes.status === 'fulfilled') setCompanies(compRes.value.items || []);
        if (recRes.status === 'fulfilled') setRecruiters(recRes.value.items || []);
        if (jobRes.status === 'fulfilled') setJobs(jobRes.value.items || []);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const companyTrend = overview?.companies.trend.map((t) => t.count) || [2, 4, 7, 10, 14, 18, 22];
  const recruiterTrend = overview?.recruiters.trend.map((t) => t.count) || [4, 8, 12, 19, 24, 30, 36];
  const jobTrend = overview?.jobs.trend.map((t) => t.count) || [1, 3, 5, 8, 11, 14, 18];

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in pb-12">
      {/* Spatial Mission Control Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/40 p-6 backdrop-blur-xl shadow-glass-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400">
              Autonomous Intelligence Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Talent Discovery & Outreach Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time multi-tenant intelligence pipeline synchronized with background workers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SpatialTooltip content="Explore workspace metrics & records using natural language AI">
            <Button
              variant="crystal"
              size="sm"
              onClick={() => setIsChatOpen(true)}
              className="border-sky-400/40 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:bg-sky-500/30"
            >
              ✦ AI Data Chat
            </Button>
          </SpatialTooltip>
          <Link href="/companies">
            <Button variant="crystal" size="sm">
              + New Company
            </Button>
          </Link>
          <Link href="/recruiters">
            <Button variant="crystal" size="sm">
              + New Recruiter
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="glass" size="sm">
              + New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Column KPI Metric Cards with Dynamic Aggregations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SpatialKpiCard
          title="Tracked Companies"
          value={isLoading ? '—' : overview?.companies.total ?? companies.length}
          description={`${overview?.companies.activeHiring ?? 0} actively hiring`}
          badge="Live Accounts"
          badgeVariant="info"
          trend="up"
          change="+14.2%"
          sparkline={companyTrend}
        />

        <SpatialKpiCard
          title="Recruiter Contacts"
          value={isLoading ? '—' : overview?.recruiters.total ?? recruiters.length}
          description={`${overview?.recruiters.verificationRate ?? 0}% verified rate`}
          badge="Verified Reach"
          badgeVariant="success"
          trend="up"
          change="+28.6%"
          sparkline={recruiterTrend}
        />

        <SpatialKpiCard
          title="Active Opportunities"
          value={isLoading ? '—' : overview?.jobs.active ?? jobs.length}
          description={`${overview?.jobs.byWorkMode?.['REMOTE'] ?? 0} remote roles`}
          badge="Open Requisitions"
          badgeVariant="warning"
          trend="neutral"
          change="Real-time"
          sparkline={jobTrend}
        />

        <SpatialKpiCard
          title="Deliverability Health"
          value={isLoading ? '—' : `${overview?.systemHealth.deliverabilityIndex ?? 85}%`}
          description={overview?.systemHealth.status ?? 'OPTIMAL'}
          badge="Safe Sender"
          badgeVariant="purple"
          trend="up"
          change="DMARC/SPF"
          sparkline={[82, 85, 87, 88, 92, 94, overview?.systemHealth.deliverabilityIndex ?? 95]}
        />
      </div>

      {/* Sector Intelligence & Skill Demand Breakdowns */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Hiring Sectors */}
          <Card material="frosted" className="border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <h3 className="text-xs font-bold tracking-tight text-white uppercase">Top Hiring Sectors</h3>
              <Badge variant="info" className="text-[10px]">Industries</Badge>
            </div>
            <div className="space-y-2 pt-1">
              {breakdown.topIndustries.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No sector data available yet.</p>
              ) : (
                breakdown.topIndustries.slice(0, 5).map((item, idx) => {
                  const maxCount = Math.max(...breakdown.topIndustries.map((i) => i.count), 1);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 truncate max-w-[200px]">{item.industry}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{item.count} accounts</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* In-Demand Skills */}
          <Card material="frosted" className="border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <h3 className="text-xs font-bold tracking-tight text-white uppercase">In-Demand Skills</h3>
              <Badge variant="purple" className="text-[10px]">Requisitions</Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {breakdown.topSkills.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No required skills parsed yet.</p>
              ) : (
                breakdown.topSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:border-sky-500/40 transition-colors"
                  >
                    <span>{s.skill}</span>
                    <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1 rounded">
                      {s.count}
                    </span>
                  </span>
                ))
              )}
            </div>
          </Card>

          {/* Deliverability & Work Mode Split */}
          <Card material="frosted" className="border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <h3 className="text-xs font-bold tracking-tight text-white uppercase">Work Mode & Deliverability</h3>
              <Badge variant="success" className="text-[10px]">Health</Badge>
            </div>
            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Work Mode Split:</span>
                <div className="flex gap-2 mt-1.5">
                  {breakdown.jobModeDistribution.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex-1 p-2 rounded-lg bg-slate-900/50 border border-white/[0.06] text-center"
                    >
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{m.mode}</div>
                      <div className="text-xs font-bold text-white mt-0.5">{m.count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Verified Email Ratio:</span>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  {breakdown.recruiterVerificationDistribution.map((s, idx) => (
                    <div
                      key={idx}
                      title={`${s.status}: ${s.count} (${s.percentage}%)`}
                      style={{ width: `${s.percentage}%` }}
                      className={`h-full ${
                        s.status === 'VERIFIED'
                          ? 'bg-emerald-500'
                          : s.status === 'UNVERIFIED'
                          ? 'bg-amber-500'
                          : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter / Filter Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          {(['all', 'companies', 'recruiters', 'jobs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-160 capitalize ${
                activeTab === tab
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab === 'all' ? 'All Intelligence' : tab}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-500">
          Sync: {formatDate(overview?.systemHealth.lastSynchronizedAt)}
        </span>
      </div>

      {/* Split Main Content Area: Tables & Investigation Side Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Primary Data Surface */}
        <div
          className={`space-y-6 transition-all duration-300 w-full ${
            selectedEntity ? 'lg:w-2/3' : 'lg:w-full'
          }`}
        >
          {/* Target Companies Card */}
          {(activeTab === 'all' || activeTab === 'companies') && (
            <Card material="frosted" className="border-white/[0.08]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <CardTitle className="text-base font-semibold text-white">Target Companies</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Select an account to open the interactive investigation panel
                  </CardDescription>
                </div>
                <Link href="/companies">
                  <Button variant="outline" size="sm">
                    View Directory &rarr;
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((n) => (
                      <SpatialSkeleton key={n} className="h-14 w-full" />
                    ))}
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No target companies recorded yet.</p>
                    <Link href="/companies" className="inline-block mt-3">
                      <Button variant="crystal" size="sm">Add First Company</Button>
                    </Link>
                  </div>
                ) : (
                  companies.map((c) => {
                    const isSelected = selectedEntity?.type === 'company' && selectedEntity.data._id === c._id;
                    return (
                      <div
                        key={c._id}
                        onClick={() => setSelectedEntity({ type: 'company', data: c })}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-160 cursor-pointer ${
                          isSelected
                            ? 'border-sky-500/50 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                            : 'border-white/[0.06] bg-slate-900/30 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="text-sm font-medium text-white truncate">
                            {c.displayName || c.legalName}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono truncate">{c.domain}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                            {formatDate(c.createdAt)}
                          </span>
                          <Badge
                            variant={c.tier === 'TIER_1' ? 'purple' : 'default'}
                            className="text-[10px]"
                          >
                            {c.tier || 'TIER_3'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Verified Recruiters Card */}
          {(activeTab === 'all' || activeTab === 'recruiters') && (
            <Card material="frosted" className="border-white/[0.08]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <CardTitle className="text-base font-semibold text-white">Verified Recruiters</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Deliverability-verified recruitment leads and talent partners
                  </CardDescription>
                </div>
                <Link href="/recruiters">
                  <Button variant="outline" size="sm">
                    View All &rarr;
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((n) => (
                      <SpatialSkeleton key={n} className="h-14 w-full" />
                    ))}
                  </div>
                ) : recruiters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No recruiter contacts discovered yet.</p>
                    <Link href="/recruiters" className="inline-block mt-3">
                      <Button variant="crystal" size="sm">Add Recruiter</Button>
                    </Link>
                  </div>
                ) : (
                  recruiters.map((r) => {
                    const isSelected = selectedEntity?.type === 'recruiter' && selectedEntity.data._id === r._id;
                    return (
                      <div
                        key={r._id}
                        onClick={() => setSelectedEntity({ type: 'recruiter', data: r })}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-160 cursor-pointer ${
                          isSelected
                            ? 'border-sky-500/50 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                            : 'border-white/[0.06] bg-slate-900/30 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="text-sm font-medium text-white truncate">{r.name}</h4>
                          <p className="text-xs text-slate-400 font-mono truncate">{r.email || 'No email'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                            {formatDate(r.createdAt)}
                          </span>
                          <Badge
                            variant={r.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                            pulse={r.verificationStatus === 'VERIFIED'}
                            className="text-[10px]"
                          >
                            {r.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Active Jobs Card */}
          {(activeTab === 'all' || activeTab === 'jobs') && (
            <Card material="frosted" className="border-white/[0.08]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <CardTitle className="text-base font-semibold text-white">Active Career Opportunities</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Indexed openings with matching applicant qualification signals
                  </CardDescription>
                </div>
                <Link href="/jobs">
                  <Button variant="outline" size="sm">
                    View Jobs &rarr;
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((n) => (
                      <SpatialSkeleton key={n} className="h-14 w-full" />
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No job requisitions indexed yet.</p>
                    <Link href="/jobs" className="inline-block mt-3">
                      <Button variant="crystal" size="sm">Add First Job</Button>
                    </Link>
                  </div>
                ) : (
                  jobs.map((j) => {
                    const isSelected = selectedEntity?.type === 'job' && selectedEntity.data._id === j._id;
                    return (
                      <div
                        key={j._id}
                        onClick={() => setSelectedEntity({ type: 'job', data: j })}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-160 cursor-pointer ${
                          isSelected
                            ? 'border-sky-500/50 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                            : 'border-white/[0.06] bg-slate-900/30 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="text-sm font-medium text-white truncate">{j.title}</h4>
                          <p className="text-xs text-slate-400 truncate">
                            {j.workMode || 'REMOTE'} &bull; {j.location || 'Anywhere'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                            {formatDate(j.createdAt)}
                          </span>
                          <Badge variant="info" className="text-[10px]">
                            {j.jobType || 'FULL_TIME'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Investigation / Details Side Panel */}
        {selectedEntity && (
          <div className="w-full lg:w-1/3 animate-fade-in sticky top-6">
            <Card material="crystal" className="border-sky-500/30 shadow-glass-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
                    Investigation Dossier
                  </span>
                  <CardTitle className="text-base font-bold text-white mt-0.5 truncate">
                    {selectedEntity.type === 'company' &&
                      (selectedEntity.data.displayName || selectedEntity.data.legalName)}
                    {selectedEntity.type === 'recruiter' && selectedEntity.data.name}
                    {selectedEntity.type === 'job' && selectedEntity.data.title}
                  </CardTitle>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  aria-label="Close investigation panel"
                >
                  &times;
                </button>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-xs">
                {selectedEntity.type === 'company' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Domain:</span>
                        <span className="font-mono text-sky-300">{selectedEntity.data.domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tier:</span>
                        <Badge variant="purple">{selectedEntity.data.tier || 'TIER_3'}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Indexed Date:</span>
                        <span className="text-slate-300">{formatDate(selectedEntity.data.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button
                        variant="crystal"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedEntity.data.domain);
                          toast.success('Domain Copied', selectedEntity.data.domain);
                        }}
                      >
                        <span>📋 Copy Domain Link</span>
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        className="w-full justify-start gap-2 text-sky-300 border-sky-400/30"
                        onClick={() =>
                          openChatWithPrompt(
                            `Provide deep research, hiring signals, and talent sourcing strategy for ${selectedEntity.data.displayName || selectedEntity.data.legalName} (${selectedEntity.data.domain})`
                          )
                        }
                      >
                        <span>✦ Query AI Sourcing Intelligence</span>
                      </Button>
                      <Link href={`/companies`} className="block w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          Deep Research Profile &rarr;
                        </Button>
                      </Link>
                      {selectedEntity.data.canonicalWebsite && (
                        <a
                          href={selectedEntity.data.canonicalWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            Visit Website &rarr;
                          </Button>
                        </a>
                      )}
                    </div>
                  </>
                )}

                {selectedEntity.type === 'recruiter' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-mono text-emerald-300">
                          {selectedEntity.data.email || 'Pending resolution'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Deliverability:</span>
                        <Badge
                          variant={
                            selectedEntity.data.verificationStatus === 'VERIFIED'
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {selectedEntity.data.verificationStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Role:</span>
                        <span className="text-slate-300">
                          {selectedEntity.data.designation || 'Talent Acquisition'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Discovered:</span>
                        <span className="text-slate-300">{formatDate(selectedEntity.data.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {selectedEntity.data.email && (
                        <Button
                          variant="crystal"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedEntity.data.email!);
                            toast.success('Email Copied', selectedEntity.data.email!);
                          }}
                        >
                          <span>✉ Copy Verified Email</span>
                        </Button>
                      )}
                      <Button
                        variant="glass"
                        size="sm"
                        className="w-full justify-start gap-2 text-sky-300 border-sky-400/30"
                        onClick={() =>
                          openChatWithPrompt(
                            `Draft a high-deliverability recruiter outreach note to ${selectedEntity.data.name} (${selectedEntity.data.designation || 'Recruiter'})`
                          )
                        }
                      >
                        <span>✦ Draft Outreach with AI</span>
                      </Button>
                      <Link href={`/recruiters`} className="block w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          Trigger Verification Pipeline &rarr;
                        </Button>
                      </Link>
                    </div>
                  </>
                )}

                {selectedEntity.type === 'job' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Work Mode:</span>
                        <Badge variant="info">{selectedEntity.data.workMode || 'REMOTE'}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type:</span>
                        <span className="text-slate-300">{selectedEntity.data.jobType || 'FULL_TIME'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="text-slate-300">{selectedEntity.data.location || 'Remote'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Opened:</span>
                        <span className="text-slate-300">{formatDate(selectedEntity.data.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button
                        variant="glass"
                        size="sm"
                        className="w-full justify-start gap-2 text-sky-300 border-sky-400/30"
                        onClick={() =>
                          openChatWithPrompt(
                            `Analyze requisition "${selectedEntity.data.title}" and identify key qualification criteria and applicant pitch.`
                          )
                        }
                      >
                        <span>✦ Analyze Requisition Signals</span>
                      </Button>
                      {selectedEntity.data.applicationUrl && (
                        <a
                          href={selectedEntity.data.applicationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <Button variant="crystal" size="sm" className="w-full">
                            Open Application URL &rarr;
                          </Button>
                        </a>
                      )}
                      <Link href="/jobs" className="block w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          Candidate Matching Matrix &rarr;
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Natural Language AI Data Chat Drawer */}
      <DataChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialPrompt={chatPrompt}
      />
    </div>
  );
}
