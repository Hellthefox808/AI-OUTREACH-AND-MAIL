/**
 * High-fidelity Multi-Tenant In-Memory State Engine for E2E Testing.
 *
 * Emulates MongoDB 7 replica set behavior, unique constraints, compound indexes,
 * SHA-256 token lookups, soft-deletes, and cursor-based pagination without
 * external Docker/MongoDB daemon requirements.
 */

import { Types } from "mongoose";

export class InMemoryStateEngine {
  public users: Map<string, any> = new Map();
  public workspaces: Map<string, any> = new Map();
  public memberships: Map<string, any> = new Map();
  public roles: Map<string, any> = new Map();
  public permissions: Map<string, any> = new Map();
  public sessions: Map<string, any> = new Map();
  public companies: Map<string, any> = new Map();
  public recruiters: Map<string, any> = new Map();
  public jobs: Map<string, any> = new Map();

  clear(): void {
    this.users.clear();
    this.workspaces.clear();
    this.memberships.clear();
    this.roles.clear();
    this.permissions.clear();
    this.sessions.clear();
    this.companies.clear();
    this.recruiters.clear();
    this.jobs.clear();
  }

  // --- Users ---
  createUserRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findByEmail: async (email: string) => {
        for (const user of this.users.values()) {
          if (user.email.toLowerCase() === email.toLowerCase() && !user.deletedAt) {
            return { ...user };
          }
        }
        return null;
      },
      findById: async (id: string | Types.ObjectId) => {
        const idStr = id.toString();
        const user = this.users.get(idStr);
        if (user && !user.deletedAt) {
          return { ...user };
        }
        return null;
      },
      create: async (data: any) => {
        const id = data._id || new Types.ObjectId();
        const record = {
          failedLoginAttempts: 0,
          lockedUntil: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          _id: id,
        };
        this.users.set(id.toString(), record);
        return { ...record };
      },
      updateById: async (id: string | Types.ObjectId, data: any) => {
        const idStr = id.toString();
        const user = this.users.get(idStr);
        if (!user) return null;
        const updated = { ...user, ...data, updatedAt: new Date() };
        this.users.set(idStr, updated);
        return { ...updated };
      },
      incrementFailedLogin: async (id: string | Types.ObjectId) => {
        const idStr = id.toString();
        const user = this.users.get(idStr);
        if (user) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          user.updatedAt = new Date();
          this.users.set(idStr, user);
        }
      },
      resetFailedLogin: async (id: string | Types.ObjectId) => {
        const idStr = id.toString();
        const user = this.users.get(idStr);
        if (user) {
          user.failedLoginAttempts = 0;
          user.lockedUntil = null;
          user.updatedAt = new Date();
          this.users.set(idStr, user);
        }
      },
      lock: async (id: string | Types.ObjectId, until: Date) => {
        const idStr = id.toString();
        const user = this.users.get(idStr);
        if (user) {
          user.lockedUntil = until;
          user.updatedAt = new Date();
          this.users.set(idStr, user);
        }
      },
      findByPasswordResetToken: async (tokenHash: string) => {
        for (const user of this.users.values()) {
          if (
            user.passwordResetToken === tokenHash &&
            user.passwordResetExpires &&
            new Date() < new Date(user.passwordResetExpires) &&
            !user.deletedAt
          ) {
            return { ...user };
          }
        }
        return null;
      },
    };
  }

  // --- Workspaces ---
  createWorkspaceRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findById: async (id: string | Types.ObjectId) => {
        const ws = this.workspaces.get(id.toString());
        return ws && !ws.deletedAt ? { ...ws } : null;
      },
      findByIds: async (ids: string[]) => {
        const result: any[] = [];
        for (const id of ids) {
          const ws = this.workspaces.get(id.toString());
          if (ws && !ws.deletedAt) {
            result.push({ ...ws });
          }
        }
        return result;
      },
      findBySlug: async (slug: string) => {
        for (const ws of this.workspaces.values()) {
          if (ws.slug === slug && !ws.deletedAt) {
            return { ...ws };
          }
        }
        return null;
      },
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.workspaces.set(id.toString(), record);
        return { ...record };
      },
    };
  }

  // --- Memberships ---
  createMembershipRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findByUserAndWorkspace: async (userId: any, workspaceId: any) => {
        const uId = userId.toString();
        const wId = workspaceId.toString();
        for (const mem of this.memberships.values()) {
          if (mem.userId.toString() === uId && mem.workspaceId.toString() === wId && !mem.deletedAt) {
            return { ...mem };
          }
        }
        return null;
      },
      findByWorkspace: async (workspaceId: any) => {
        const wId = workspaceId.toString();
        const result: any[] = [];
        for (const mem of this.memberships.values()) {
          if (mem.workspaceId.toString() === wId && !mem.deletedAt) {
            result.push({ ...mem });
          }
        }
        return result;
      },
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memberships.set(id.toString(), record);
        return { ...record };
      },
    };
  }

  // --- Roles ---
  createRoleRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findByName: async (name: string, workspaceId: string | Types.ObjectId) => {
        const wId = workspaceId.toString();
        for (const role of this.roles.values()) {
          if (role.name === name && role.workspaceId.toString() === wId && !role.deletedAt) {
            return { ...role };
          }
        }
        return null;
      },
      findById: async (id: any, workspaceId?: string | Types.ObjectId) => {
        const role = this.roles.get(id.toString());
        if (!role || role.deletedAt) return null;
        if (workspaceId && role.workspaceId.toString() !== workspaceId.toString()) return null;
        return { ...role };
      },
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.roles.set(id.toString(), record);
        return { ...record };
      },
      updateById: async (id: any, data: any, workspaceId?: any) => {
        const role = this.roles.get(id.toString());
        if (!role) return null;
        if (workspaceId && role.workspaceId.toString() !== workspaceId.toString()) return null;
        const updated = { ...role, ...data, updatedAt: new Date() };
        this.roles.set(id.toString(), updated);
        return { ...updated };
      },
    };
  }

  // --- Permissions ---
  createPermissionRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findByKey: async (key: string, workspaceId: string | Types.ObjectId) => {
        const wId = workspaceId.toString();
        for (const perm of this.permissions.values()) {
          if (perm.key === key && perm.workspaceId.toString() === wId && !perm.deletedAt) {
            return { ...perm };
          }
        }
        return null;
      },
      findById: async (id: any, workspaceId?: string | Types.ObjectId) => {
        const perm = this.permissions.get(id.toString());
        if (!perm || perm.deletedAt) return null;
        if (workspaceId && perm.workspaceId.toString() !== workspaceId.toString()) return null;
        return { ...perm };
      },
      findByWorkspace: async (workspaceId: string | Types.ObjectId) => {
        const wId = workspaceId.toString();
        const result: any[] = [];
        for (const perm of this.permissions.values()) {
          if (perm.workspaceId.toString() === wId && !perm.deletedAt) {
            result.push({ ...perm });
          }
        }
        return result;
      },
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.permissions.set(id.toString(), record);
        return { ...record };
      },
    };
  }

  // --- Sessions ---
  createSessionRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      create: async (data: any) => {
        const id = data._id || new Types.ObjectId();
        const record = {
          revokedAt: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          _id: id,
        };
        this.sessions.set(id.toString(), record);
        return { ...record };
      },
      revoke: async (tokenHash: string) => {
        for (const session of this.sessions.values()) {
          if (session.tokenHash === tokenHash || session.refreshTokenHash === tokenHash) {
            session.revokedAt = new Date();
            this.sessions.set(session._id.toString(), session);
          }
        }
      },
      revokeAllForUser: async (userId: string | Types.ObjectId) => {
        const uId = userId.toString();
        for (const session of this.sessions.values()) {
          if (session.userId.toString() === uId) {
            session.revokedAt = new Date();
            session.deletedAt = new Date();
            this.sessions.set(session._id.toString(), session);
          }
        }
      },
      findByRefreshTokenHash: async (hash: string) => {
        for (const session of this.sessions.values()) {
          if (session.refreshTokenHash === hash && !session.revokedAt && !session.deletedAt) {
            return { ...session };
          }
        }
        return null;
      },
      findByTokenHash: async (tokenHash: string) => {
        for (const session of this.sessions.values()) {
          if (session.tokenHash === tokenHash && !session.revokedAt && !session.deletedAt) {
            return { ...session };
          }
        }
        return null;
      },
      markUsed: async (tokenHash: string) => {
        for (const session of this.sessions.values()) {
          if (session.tokenHash === tokenHash || session.refreshTokenHash === tokenHash) {
            session.lastUsedAt = new Date();
            this.sessions.set(session._id.toString(), session);
          }
        }
      },
      findByUser: async (userId: string | Types.ObjectId) => {
        const uId = userId.toString();
        const result: any[] = [];
        for (const session of this.sessions.values()) {
          if (session.userId.toString() === uId && !session.revokedAt && !session.deletedAt) {
            result.push({ ...session });
          }
        }
        return result;
      },
    };
  }

  private paginateRecords(
    records: any[],
    pagination: { limit?: number; cursor?: string } = {}
  ) {
    const sorted = [...records].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return b._id.toString().localeCompare(a._id.toString());
    });

    const rawLimit = pagination.limit !== undefined ? Number(pagination.limit) : 50;
    const boundedLimit = Math.min(Math.max(1, rawLimit), 100);

    let filtered = sorted;
    if (pagination.cursor) {
      const cursorIndex = sorted.findIndex(
        (r) => r._id.toString() === pagination.cursor
      );
      if (cursorIndex !== -1) {
        filtered = sorted.slice(cursorIndex + 1);
      } else {
        filtered = [];
      }
    }

    const hasMore = filtered.length > boundedLimit;
    const items = hasMore ? filtered.slice(0, boundedLimit) : filtered;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

    return { items, nextCursor, hasMore };
  }

  // --- Companies ---
  createCompanyRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findById: async (id: string, workspaceId: string) => {
        const c = this.companies.get(id);
        if (!c || c.deletedAt || c.workspaceId.toString() !== workspaceId) return null;
        return { ...c };
      },
      findByWorkspace: async (
        workspaceId: string,
        pagination: { limit?: number; cursor?: string } = {},
        filters: any = {}
      ) => {
        let records = Array.from(this.companies.values()).filter(
          (c) => c.workspaceId.toString() === workspaceId && !c.deletedAt
        );
        if (filters.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.domain?.toLowerCase().includes(q) ||
              c.industry?.toLowerCase().includes(q)
          );
        }
        if (filters.tier) {
          records = records.filter((c) => c.tier === filters.tier);
        }
        if (filters.verificationStatus) {
          records = records.filter((c) => c.verificationStatus === filters.verificationStatus);
        }
        if (typeof filters.hiringActivity === "boolean") {
          records = records.filter((c) => c.activelyHiring === filters.hiringActivity);
        }
        return this.paginateRecords(records, pagination);
      },
      exportAll: async (workspaceId: string, filters: any = {}) => {
        let records = Array.from(this.companies.values()).filter(
          (c) => c.workspaceId.toString() === workspaceId && !c.deletedAt
        );
        if (filters.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.domain?.toLowerCase().includes(q) ||
              c.industry?.toLowerCase().includes(q)
          );
        }
        if (filters.tier) {
          records = records.filter((c) => c.tier === filters.tier);
        }
        return records;
      },
      getMetrics: async (workspaceId: string) => {
        const records = Array.from(this.companies.values()).filter(
          (c) => c.workspaceId.toString() === workspaceId && !c.deletedAt
        );
        const activelyHiring = records.filter((c) => c.activelyHiring).length;
        const byTier = {
          TIER_1: records.filter((c) => c.tier === "TIER_1").length,
          TIER_2: records.filter((c) => c.tier === "TIER_2").length,
          TIER_3: records.filter((c) => c.tier === "TIER_3").length,
        };
        return { total: records.length, activelyHiring, byTier };
      },
      getIndustryBreakdown: async (workspaceId: string) => {
        const records = Array.from(this.companies.values()).filter(
          (c) => c.workspaceId.toString() === workspaceId && !c.deletedAt
        );
        const map = new Map<string, number>();
        records.forEach((c) => {
          const ind = c.industry || "Technology";
          map.set(ind, (map.get(ind) || 0) + 1);
        });
        return Array.from(map.entries()).map(([industry, count]) => ({ industry, count }));
      },
      getDailyTrend: async (_workspaceId: string) => [],
      findByDomain: async (domain: string, workspaceId: string) => {
        for (const c of this.companies.values()) {
          if (
            c.domain.toLowerCase() === domain.toLowerCase() &&
            c.workspaceId.toString() === workspaceId &&
            !c.deletedAt
          ) {
            return { ...c };
          }
        }
        return null;
      },
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          workspaceId: new Types.ObjectId(data.workspaceId),
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.companies.set(id.toString(), record);
        return { ...record };
      },
      updateById: async (id: string, data: any, workspaceId: string) => {
        const c = this.companies.get(id);
        if (!c || c.deletedAt || c.workspaceId.toString() !== workspaceId) return null;
        const updated = { ...c, ...data, updatedAt: new Date() };
        this.companies.set(id, updated);
        return { ...updated };
      },
      softDelete: async (id: string, workspaceId: string) => {
        const c = this.companies.get(id);
        if (!c || c.deletedAt || c.workspaceId.toString() !== workspaceId) return null;
        c.deletedAt = new Date();
        this.companies.set(id, c);
        return { ...c };
      },
    };
  }

  // --- Recruiters ---
  createRecruiterRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findById: async (id: string, workspaceId: string) => {
        const r = this.recruiters.get(id);
        if (!r || r.deletedAt || r.workspaceId.toString() !== workspaceId) return null;
        return { ...r };
      },
      findByWorkspace: async (
        workspaceId: string,
        pagination: { limit?: number; cursor?: string } = {},
        filters: any = {}
      ) => {
        let records = Array.from(this.recruiters.values()).filter(
          (r) => r.workspaceId.toString() === workspaceId && !r.deletedAt
        );
        if (filters.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(
            (r) =>
              r.fullName?.toLowerCase().includes(q) ||
              r.email?.toLowerCase().includes(q) ||
              r.company?.toLowerCase().includes(q)
          );
        }
        if (filters.verificationStatus) {
          records = records.filter((r) => r.verificationStatus === filters.verificationStatus);
        }
        if (filters.companyId) {
          records = records.filter((r) => r.companyId?.toString() === filters.companyId);
        }
        return this.paginateRecords(records, pagination);
      },
      findByCompany: async (companyId: string, workspaceId: string) => {
        const result: any[] = [];
        for (const r of this.recruiters.values()) {
          if (
            r.companyId?.toString() === companyId &&
            r.workspaceId.toString() === workspaceId &&
            !r.deletedAt
          ) {
            result.push({ ...r });
          }
        }
        return result;
      },
      exportAll: async (workspaceId: string, filters: any = {}) => {
        let records = Array.from(this.recruiters.values()).filter(
          (r) => r.workspaceId.toString() === workspaceId && !r.deletedAt
        );
        if (filters.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(
            (r) =>
              r.fullName?.toLowerCase().includes(q) ||
              r.email?.toLowerCase().includes(q) ||
              r.company?.toLowerCase().includes(q)
          );
        }
        if (filters.verificationStatus) {
          records = records.filter((r) => r.verificationStatus === filters.verificationStatus);
        }
        return records;
      },
      getMetrics: async (workspaceId: string) => {
        const records = Array.from(this.recruiters.values()).filter(
          (r) => r.workspaceId.toString() === workspaceId && !r.deletedAt
        );
        const verified = records.filter((r) => r.verificationStatus === "VERIFIED").length;
        const pending = records.filter((r) => r.verificationStatus === "PENDING").length;
        const invalid = records.filter((r) => r.verificationStatus === "INVALID").length;
        const verificationRate = records.length > 0 ? (verified / records.length) * 100 : 0;
        return { total: records.length, verified, pending, invalid, verificationRate };
      },
      getDailyTrend: async (_workspaceId: string) => [],
      findByEmail: async (email: string, workspaceId: string) => {
        for (const r of this.recruiters.values()) {
          if (
            r.email?.toLowerCase() === email.toLowerCase() &&
            r.workspaceId.toString() === workspaceId &&
            !r.deletedAt
          ) {
            return { ...r };
          }
        }
        return null;
      },
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          workspaceId: new Types.ObjectId(data.workspaceId),
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.recruiters.set(id.toString(), record);
        return { ...record };
      },
      updateById: async (id: string, data: any, workspaceId: string) => {
        const r = this.recruiters.get(id);
        if (!r || r.deletedAt || r.workspaceId.toString() !== workspaceId) return null;
        const updated = { ...r, ...data, updatedAt: new Date() };
        this.recruiters.set(id, updated);
        return { ...updated };
      },
      softDelete: async (id: string, workspaceId: string) => {
        const r = this.recruiters.get(id);
        if (!r || r.deletedAt || r.workspaceId.toString() !== workspaceId) return null;
        r.deletedAt = new Date();
        this.recruiters.set(id, r);
        return { ...r };
      },
    };
  }

  // --- Jobs ---
  createJobRepo() {
    return {
      withTransaction: async <R>(fn: (session: any) => Promise<R>): Promise<R> => fn({} as any),
      findById: async (id: string, workspaceId: string) => {
        const j = this.jobs.get(id);
        if (!j || j.deletedAt || j.workspaceId.toString() !== workspaceId) return null;
        return { ...j };
      },
      findByWorkspace: async (
        workspaceId: string,
        pagination: { limit?: number; cursor?: string } = {},
        filters: any = {}
      ) => {
        let records = Array.from(this.jobs.values()).filter(
          (j) => j.workspaceId.toString() === workspaceId && !j.deletedAt
        );
        if (filters.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(
            (j) =>
              j.title?.toLowerCase().includes(q) ||
              j.companyName?.toLowerCase().includes(q) ||
              j.location?.toLowerCase().includes(q)
          );
        }
        if (filters.workMode) {
          records = records.filter((j) => j.workMode === filters.workMode);
        }
        if (filters.type) {
          records = records.filter((j) => j.type === filters.type);
        }
        if (typeof filters.isActive === "boolean") {
          records = records.filter((j) => j.isActive === filters.isActive);
        }
        return this.paginateRecords(records, pagination);
      },
      findByCompany: async (companyId: string, workspaceId: string) => {
        const result: any[] = [];
        for (const j of this.jobs.values()) {
          if (
            j.companyId?.toString() === companyId &&
            j.workspaceId.toString() === workspaceId &&
            !j.deletedAt
          ) {
            result.push({ ...j });
          }
        }
        return result;
      },
      exportAll: async (workspaceId: string, filters: any = {}) => {
        let records = Array.from(this.jobs.values()).filter(
          (j) => j.workspaceId.toString() === workspaceId && !j.deletedAt
        );
        if (filters.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(
            (j) =>
              j.title?.toLowerCase().includes(q) ||
              j.companyName?.toLowerCase().includes(q)
          );
        }
        return records;
      },
      getMetrics: async (workspaceId: string) => {
        const records = Array.from(this.jobs.values()).filter(
          (j) => j.workspaceId.toString() === workspaceId && !j.deletedAt
        );
        const active = records.filter((j) => j.isActive !== false).length;
        const byWorkMode = {
          remote: records.filter((j) => j.workMode === "remote").length,
          hybrid: records.filter((j) => j.workMode === "hybrid").length,
          on_site: records.filter((j) => j.workMode === "on_site").length,
        };
        return { total: records.length, active, byWorkMode };
      },
      getSkillBreakdown: async (workspaceId: string) => {
        const records = Array.from(this.jobs.values()).filter(
          (j) => j.workspaceId.toString() === workspaceId && !j.deletedAt
        );
        const map = new Map<string, number>();
        records.forEach((j) => {
          (j.skills || []).forEach((s: string) => {
            map.set(s, (map.get(s) || 0) + 1);
          });
        });
        return Array.from(map.entries()).map(([skill, count]) => ({ skill, count }));
      },
      getDailyTrend: async (_workspaceId: string) => [],
      create: async (data: any) => {
        const id = new Types.ObjectId();
        const record = {
          _id: id,
          ...data,
          workspaceId: new Types.ObjectId(data.workspaceId),
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.jobs.set(id.toString(), record);
        return { ...record };
      },
      updateById: async (id: string, data: any, workspaceId: string) => {
        const j = this.jobs.get(id);
        if (!j || j.deletedAt || j.workspaceId.toString() !== workspaceId) return null;
        const updated = { ...j, ...data, updatedAt: new Date() };
        this.jobs.set(id, updated);
        return { ...updated };
      },
      softDelete: async (id: string, workspaceId: string) => {
        const j = this.jobs.get(id);
        if (!j || j.deletedAt || j.workspaceId.toString() !== workspaceId) return null;
        j.deletedAt = new Date();
        this.jobs.set(id, j);
        return { ...j };
      },
    };
  }
}
