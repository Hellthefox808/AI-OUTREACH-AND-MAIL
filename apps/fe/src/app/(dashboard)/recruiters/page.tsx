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
import { api, RecruiterItem } from '../../../lib/api';
import { SpatialEntityInspector } from '../../../components/spatial-entity-inspector';

export default function RecruitersPage() {
  const toast = useToast();
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadRecruiters = async (cursor?: string) => {
    try {
      setIsLoading(true);
      const res = await api.recruiters.list({
        limit: 15,
        cursor,
        verificationStatus: selectedFilter !== 'ALL' ? selectedFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setRecruiters(res.items || []);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      setRecruiters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecruiters();
  }, [selectedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecruiters();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.info('Exporting CSV', 'Compiling verified recruiter contacts...');
      const csvData = await api.recruiters.export('csv', {
        verificationStatus: selectedFilter !== 'ALL' ? selectedFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (typeof csvData === 'string') {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recruiters-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download Complete', 'Recruiter directory CSV exported.');
      }
    } catch {
      toast.error('Export Failed', 'Unable to generate recruiter CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setCreateError('Please specify recruiter name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError(null);
      await api.recruiters.create({
        name,
        email: email.trim() || undefined,
        designation: designation.trim() || undefined,
        department: department.trim() || undefined,
      });
      toast.success('Recruiter Added', `${name} queued for verification.`);
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setDesignation('');
      setDepartment('');
      await loadRecruiters();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add recruiter';
      setCreateError(msg);
      toast.error('Failed to Add', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="success" pulse>VERIFIED</Badge>;
      case 'SYNTAX_VALID':
      case 'DOMAIN_VALID':
      case 'PROVIDER_CHECKED':
        return <Badge variant="info">{status}</Badge>;
      case 'RISKY':
      case 'CATCH_ALL':
        return <Badge variant="warning">{status}</Badge>;
      case 'INVALID':
      case 'SUPPRESSED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="outline">{status || 'UNVERIFIED'}</Badge>;
    }
  };

  const filteredRecruiters = recruiters.filter((r) => {
    if (selectedFilter === 'VERIFIED' && r.verificationStatus !== 'VERIFIED') return false;
    if (selectedFilter === 'RISKY' && r.verificationStatus !== 'RISKY') return false;
    if (selectedFilter === 'UNVERIFIED' && r.verificationStatus !== 'UNVERIFIED' && r.verificationStatus) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.designation || '').toLowerCase().includes(q)
    );
  });

  const filterTabs = [
    { id: 'ALL', label: 'All Contacts', count: recruiters.length },
    { id: 'VERIFIED', label: 'Verified', count: recruiters.filter((r) => r.verificationStatus === 'VERIFIED').length },
    { id: 'RISKY', label: 'Risky / Catch-All' },
    { id: 'UNVERIFIED', label: 'Pending' },
  ];

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Recruiter Discovery</h2>
          <p className="text-xs text-slate-400">
            Talent acquisition contacts with multi-stage verification & deliverability scoring
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Search recruiters..."
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
            + Add Recruiter
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center overflow-x-auto pb-1">
        <SpatialTabs
          tabs={filterTabs}
          activeTab={selectedFilter}
          onChange={setSelectedFilter}
        />
      </div>

      {/* Layer 5: Spatial Modal for Recruiter Creation */}
      <SpatialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Recruiter Contact"
        description="Record a talent acquisition specialist to automatically trigger background verification."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="crystal"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateRecruiter}
            >
              Save Recruiter
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRecruiter} className="space-y-4">
          {createError && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/25">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="e.g. sjenkins@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Designation / Role"
              placeholder="e.g. Staff Tech Recruiter"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
            <Input
              label="Department"
              placeholder="e.g. Core Infrastructure Hiring"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </form>
      </SpatialModal>

      {/* Table Container Card */}
      <Card material="frosted" className="border-white/[0.08]">
        {isLoading ? (
          <SpatialSkeletonTable rows={6} cols={5} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact Name</TableHead>
                <TableHead>Verified Email</TableHead>
                <TableHead>Designation & Team</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Indexed On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecruiters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No recruiter contacts found matching the active filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecruiters.map((r) => (
                  <TableRow
                    key={r._id}
                    onClick={() => setSelectedRecruiter(r)}
                    className="hover:bg-white/[0.05] cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-400/20 text-xs font-semibold text-indigo-300 uppercase">
                          {r.name.slice(0, 2)}
                        </div>
                        <span className="font-medium text-white">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-sky-400">
                      {r.email ? (
                        <span>{r.email}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">
                      {r.designation ? (
                        <span>
                          {r.designation}
                          {r.department && (
                            <span className="text-slate-500 font-mono"> · {r.department}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.verificationStatus)}</TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
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
            onClick={() => loadRecruiters()}
            disabled={isLoading}
            className="text-xs text-slate-300"
          >
            Reset / First Page
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || !nextCursor || isLoading}
            onClick={() => nextCursor && loadRecruiters(nextCursor)}
            className="text-xs"
          >
            Next Page &rarr;
          </Button>
        </div>
      </Card>

      {/* Spatial Entity Inspector Drawer */}
      <SpatialEntityInspector
        entity={selectedRecruiter ? { type: 'recruiter', data: selectedRecruiter } : null}
        onClose={() => setSelectedRecruiter(null)}
      />
    </div>
  );
}
