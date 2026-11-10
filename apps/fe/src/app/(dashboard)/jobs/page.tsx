'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  SpatialModal,
  SpatialTabs,
  SpatialSkeletonTable,
  useToast,
} from '@career-intelligence/ui';
import { api, JobItem } from '../../../lib/api';
import { SpatialEntityInspector } from '../../../components/spatial-entity-inspector';

export default function JobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [workMode, setWorkMode] = useState<'REMOTE' | 'HYBRID' | 'ONSITE'>('REMOTE');
  const [jobType, setJobType] = useState<'FULL_TIME' | 'CONTRACT'>('FULL_TIME');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadJobs = async (cursor?: string) => {
    try {
      setIsLoading(true);
      const res = await api.jobs.list({
        limit: 15,
        cursor,
        workMode: workModeFilter !== 'ALL' ? workModeFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setJobs(res.items || []);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [workModeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.info('Exporting CSV', 'Compiling career opportunities...');
      const csvData = await api.jobs.export('csv', {
        workMode: workModeFilter !== 'ALL' ? workModeFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (typeof csvData === 'string') {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-postings-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download Complete', 'Job requisitions CSV exported.');
      }
    } catch {
      toast.error('Export Failed', 'Unable to export job requisitions.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setCreateError('Please specify job title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError(null);
      await api.jobs.create({
        title,
        location: location.trim() || undefined,
        applicationUrl: applicationUrl.trim() || undefined,
        workMode,
        jobType,
      });
      toast.success('Requisition Active', `${title} indexed into workspace.`);
      setShowCreateModal(false);
      setTitle('');
      setLocation('');
      setApplicationUrl('');
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create job';
      setCreateError(msg);
      toast.error('Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.workMode || '').toLowerCase().includes(q)
    );
  });

  const filterTabs = [
    { id: 'ALL', label: 'All Openings', count: jobs.length },
    { id: 'REMOTE', label: 'Remote', count: jobs.filter((j) => j.workMode === 'REMOTE').length },
    { id: 'HYBRID', label: 'Hybrid' },
    { id: 'ONSITE', label: 'Onsite' },
  ];

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Active Career Requisitions</h2>
          <p className="text-xs text-slate-400">
            Discovered employment opportunities mapped to applicant qualification profiles
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Filter requisitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-60 h-9 text-xs"
              leftIcon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
          </form>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
            className="text-xs"
          >
            ↓ Export CSV
          </Button>
          <Button variant="crystal" size="sm" onClick={() => setShowCreateModal(true)}>
            + Add Requisition
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center overflow-x-auto pb-1">
        <SpatialTabs
          tabs={filterTabs}
          activeTab={workModeFilter}
          onChange={setWorkModeFilter}
        />
      </div>

      {/* Layer 5: Spatial Modal for Job Creation */}
      <SpatialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Career Opportunity"
        description="Index an active job requisition into the workspace candidate matching engine."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="crystal"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateJob}
            >
              Save Requisition
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          {createError && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/25">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Role Title"
                placeholder="e.g. Senior Machine Learning Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              label="Application URL"
              type="url"
              placeholder="https://careers.company.com/job/101"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Work Mode
              </label>
              <select
                className="flex h-10 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as 'REMOTE' | 'HYBRID' | 'ONSITE')}
              >
                <option value="REMOTE" className="bg-slate-900 text-white">Remote</option>
                <option value="HYBRID" className="bg-slate-900 text-white">Hybrid</option>
                <option value="ONSITE" className="bg-slate-900 text-white">Onsite</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Job Type
              </label>
              <select
                className="flex h-10 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={jobType}
                onChange={(e) => setJobType(e.target.value as 'FULL_TIME' | 'CONTRACT')}
              >
                <option value="FULL_TIME" className="bg-slate-900 text-white">Full-Time</option>
                <option value="CONTRACT" className="bg-slate-900 text-white">Contract / Interim</option>
              </select>
            </div>
          </div>
        </form>
      </SpatialModal>

      {/* Table Container Card */}
      <Card material="frosted" className="border-white/[0.08]">
        {isLoading ? (
          <SpatialSkeletonTable rows={6} cols={6} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Work Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requisition Link</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    No job postings found matching your active filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((j) => (
                  <TableRow
                    key={j._id}
                    onClick={() => setSelectedJob(j)}
                    className="hover:bg-white/[0.05] cursor-pointer transition-colors"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💼</span>
                        <span>{j.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">
                      {j.location || 'Global / Flexible'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          j.workMode === 'REMOTE'
                            ? 'success'
                            : j.workMode === 'HYBRID'
                            ? 'info'
                            : 'default'
                        }
                        className="text-[10px]"
                      >
                        {j.workMode || 'REMOTE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={j.status === 'ACTIVE' ? 'glass' : 'outline'} pulse={j.status === 'ACTIVE'} className="text-[10px]">
                        {j.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {j.applicationUrl ? (
                        <span className="font-mono text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1">
                          <span>Apply</span>
                          <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(j.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination controls */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.06] bg-slate-950/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadJobs()}
            disabled={isLoading}
            className="text-xs text-slate-300"
          >
            Reset / First Page
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || !nextCursor || isLoading}
            onClick={() => nextCursor && loadJobs(nextCursor)}
            className="text-xs"
          >
            Next Page &rarr;
          </Button>
        </div>
      </Card>

      {/* Spatial Entity Inspector Drawer */}
      <SpatialEntityInspector
        entity={selectedJob ? { type: 'job', data: selectedJob } : null}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
