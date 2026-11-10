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
} from '@career-intelligence/ui';
import {
  api,
  CompanyItem,
  RecruiterItem,
  JobItem,
  WorkspaceAnalyticsOverview,
} from '../../lib/api';

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
  const [overview, setOverview] = useState<WorkspaceAnalyticsOverview | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'recruiters' | 'jobs'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [overviewRes, compRes, recRes, jobRes] = await Promise.allSettled([
          api.analytics.getOverview(),
          api.companies.list({ limit: 8 }),
          api.recruiters.list({ limit: 8 }),
          api.jobs.list({ limit: 8 }),
        ]);

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
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
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
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
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
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
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
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
                      <Link href={`/companies`} className="block w-full">
                        <Button variant="crystal" size="sm" className="w-full">
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
                      <Link href={`/recruiters`} className="block w-full">
                        <Button variant="crystal" size="sm" className="w-full">
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
    </div>
  );
}
