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
} from '@career-intelligence/ui';
import { api, CompanyItem } from '../../../lib/api';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadCompanies = async (cursor?: string) => {
    try {
      setIsLoading(true);
      const res = await api.companies.list({ limit: 15, cursor });
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
  }, []);

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
      setShowCreateModal(false);
      setDisplayName('');
      setDomain('');
      await loadCompanies();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create company';
      setCreateError(msg);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Target Companies</h2>
          <p className="text-xs text-slate-400">
            Track, enrich, and map employer hierarchies for recruitment intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Filter companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-64 h-9 text-xs"
            leftIcon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            }
          />
          <Button variant="crystal" size="sm" onClick={() => setShowCreateModal(true)}>
            + Add Company
          </Button>
        </div>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                    <span className="text-xs">Loading companies from database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  No company records match your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((c) => (
                <TableRow key={c._id} className="hover:bg-white/[0.04]">
                  <TableCell className="font-medium text-white">
                    {c.displayName || c.legalName}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://${c.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                    >
                      <span>{c.domain}</span>
                      <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
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
    </div>
  );
}
