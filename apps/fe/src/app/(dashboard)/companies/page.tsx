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
  SpatialSkeletonTable,
  useToast,
} from '@career-intelligence/ui';
import { api, CompanyItem } from '../../../lib/api';
import { SpatialEntityInspector } from '../../../components/spatial-entity-inspector';

export default function CompaniesPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadCompanies = async (cursor?: string) => {
    try {
      setIsLoading(true);
      const res = await api.companies.list({
        limit: 15,
        cursor,
        tier: selectedTier !== 'ALL' ? selectedTier : undefined,
        search: searchQuery.trim() || undefined,
      });
      setCompanies(res.items || []);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [selectedTier]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCompanies();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.info('Exporting CSV', 'Compiling company records for download...');
      const csvData = await api.companies.export('csv', {
        tier: selectedTier !== 'ALL' ? selectedTier : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (typeof csvData === 'string') {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `companies-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download Complete', 'Companies CSV successfully exported.');
      }
    } catch {
      toast.error('Export Failed', 'Unable to generate CSV at this time.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !domain) {
      setCreateError('Please specify company name and domain.');
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError(null);
      await api.companies.create({
        legalName: displayName,
        displayName,
        domain: domain.toLowerCase().trim(),
      });
      toast.success('Company Tracked', `${displayName} added to workspace.`);
      setShowCreateModal(false);
      setDisplayName('');
      setDomain('');
      await loadCompanies();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create company';
      setCreateError(msg);
      toast.error('Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName || c.legalName || '').toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Target Companies</h2>
          <p className="text-xs text-slate-400">
            Track, enrich, and map employer hierarchies for recruitment intelligence
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Filter companies..."
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
            + Add Company
          </Button>
        </div>
      </div>

      {/* Tier Filter Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        {(['ALL', 'TIER_1', 'TIER_2', 'TIER_3'] as const).map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-160 ${
              selectedTier === tier
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tier === 'ALL' ? 'All Tiers' : tier.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Layer 5: Spatial Modal for Company Creation */}
      <SpatialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Track New Company"
        description="Add a target organization to the workspace research queue."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="crystal"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateCompany}
            >
              Save Company
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          {createError && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/25">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Company Name"
              placeholder="e.g. Anthropic, Stripe, Apple"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label="Primary Domain"
              placeholder="e.g. anthropic.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
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
                <TableHead>Company</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Industries</TableHead>
                <TableHead>Added Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No company records match your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((c) => (
                  <TableRow
                    key={c._id}
                    onClick={() => setSelectedCompany(c)}
                    className="hover:bg-white/[0.05] cursor-pointer transition-colors"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 font-bold text-xs">
                          {(c.displayName || c.legalName || 'C').charAt(0)}
                        </div>
                        <span>{c.displayName || c.legalName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-sky-400 hover:text-sky-300">
                        {c.domain}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.tier === 'TIER_1' ? 'purple' : 'default'}
                        className="text-[10px]"
                      >
                        {c.tier || 'TIER_3'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.industries && c.industries.length > 0 ? (
                          c.industries.map((ind) => (
                            <Badge key={ind} variant="info" className="text-[10px]">
                              {ind}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
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
            onClick={() => loadCompanies()}
            disabled={isLoading}
            className="text-xs text-slate-300"
          >
            Reset / First Page
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || !nextCursor || isLoading}
            onClick={() => nextCursor && loadCompanies(nextCursor)}
            className="text-xs"
          >
            Next Page &rarr;
          </Button>
        </div>
      </Card>

      {/* Spatial Entity Inspector Drawer */}
      <SpatialEntityInspector
        entity={selectedCompany ? { type: 'company', data: selectedCompany } : null}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
