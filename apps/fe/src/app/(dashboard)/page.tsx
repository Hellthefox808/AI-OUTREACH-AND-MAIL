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
import { api, CompanyItem, RecruiterItem, JobItem } from '../../lib/api';

export default function DashboardOverviewPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [compRes, recRes, jobRes] = await Promise.allSettled([
          api.companies.list({ limit: 6 }),
          api.recruiters.list({ limit: 6 }),
          api.jobs.list({ limit: 6 }),
        ]);

        if (compRes.status === 'fulfilled') setCompanies(compRes.value.items || []);
        if (recRes.status === 'fulfilled') setRecruiters(recRes.value.items || []);
        if (jobRes.status === 'fulfilled') setJobs(jobRes.value.items || []);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
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

      {/* KPI Metric Cards with 4D Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpatialKpiCard
          title="Tracked Companies"
          value={isLoading ? '—' : companies.length}
          description="Workspace target accounts"
          badge="Live Directory"
          badgeVariant="info"
          trend="up"
          change="+14.2%"
          sparkline={[3, 5, 8, 12, 15, 19, Math.max(companies.length, 24)]}
        />

        <SpatialKpiCard
          title="Recruiter Contacts"
          value={isLoading ? '—' : recruiters.length}
          description="Multi-point verified emails"
          badge="Verified Reach"
          badgeVariant="success"
          trend="up"
          change="+28.6%"
          sparkline={[4, 9, 14, 18, 26, 32, Math.max(recruiters.length, 38)]}
        />

        <SpatialKpiCard
          title="Active Opportunities"
          value={isLoading ? '—' : jobs.length}
          description="Open career requisitions"
          badge="Hiring Active"
          badgeVariant="warning"
          trend="neutral"
          change="Real-time"
          sparkline={[2, 4, 7, 11, 14, 18, Math.max(jobs.length, 20)]}
        />
      </div>

      {/* Live Data Surfaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Companies Frosted Card */}
        <Card material="frosted" className="border-white/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-white">Target Companies</CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Recently indexed organizational nodes
              </CardDescription>
            </div>
            <Link href="/companies">
              <Button variant="outline" size="sm">
                View All &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {isLoading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
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
              companies.slice(0, 5).map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/30 hover:bg-white/[0.04] transition-all duration-160"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="text-sm font-medium text-white truncate">
                      {c.displayName || c.legalName}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono truncate">{c.domain}</p>
                  </div>
                  <Badge variant={c.tier === 'TIER_1' ? 'purple' : 'default'} className="shrink-0 text-[10px]">
                    {c.tier || 'TIER_3'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Recruiters Frosted Card */}
        <Card material="frosted" className="border-white/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-white">Verified Recruiters</CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Talent acquisition leads with verified deliverability
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
                  <div key={n} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
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
              recruiters.slice(0, 5).map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/30 hover:bg-white/[0.04] transition-all duration-160"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="text-sm font-medium text-white truncate">{r.name}</h4>
                    <p className="text-xs text-slate-400 font-mono truncate">{r.email || 'No email'}</p>
                  </div>
                  <Badge
                    variant={r.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                    pulse={r.verificationStatus === 'VERIFIED'}
                    className="shrink-0 text-[10px]"
                  >
                    {r.verificationStatus}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
