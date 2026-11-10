/**
 * Unit tests for repository workspace-scoping logic and transaction lifecycle.
 * Tests query-filter construction, transaction lifecycle, and bounded pagination without a live database.
 */

import { Types } from "mongoose";
import { describe, it, expect, vi } from "vitest";
import { BaseRepository } from "./base.repository";

class TestRepo extends BaseRepository<any> {
  constructor(model: any) {
    super(model);
  }
  workspaceFilter(workspaceId: string | Types.ObjectId) {
    return super.workspaceFilter(workspaceId);
  }
  idFilter(id: string | Types.ObjectId) {
    return super.idFilter(id);
  }
  testPaginate(filter: any, pagination?: any, sortField?: string, sortOrder?: 1 | -1) {
    return super.paginate(filter, pagination, sortField, sortOrder);
  }
}

describe("BaseRepository workspace scoping", () => {
  const model: any = {};
  const repo = new TestRepo(model);

  it("workspaceFilter includes workspaceId and excludes soft-deleted", () => {
    const filter = repo.workspaceFilter("ws-123");
    expect(filter).toEqual({
      workspaceId: "ws-123",
      deletedAt: null,
    });
  });

  it("workspaceFilter accepts ObjectId", () => {
    const oid = new Types.ObjectId();
    const filter = repo.workspaceFilter(oid);
    expect(filter.workspaceId).toEqual(oid);
    expect(filter.deletedAt).toBeNull();
  });

  it("idFilter includes id and excludes soft-deleted", () => {
    const filter = repo.idFilter("abc-123");
    expect(filter).toEqual({
      _id: "abc-123",
      deletedAt: null,
    });
  });

  describe("paginate", () => {
    it("returns items and derives nextCursor when more items exist", async () => {
      const id1 = new Types.ObjectId();
      const id2 = new Types.ObjectId();
      const id3 = new Types.ObjectId();

      const mockQuery = {
        sort: () => mockQuery,
        limit: () => mockQuery,
        exec: async () => [
          { _id: id1, name: "item1" },
          { _id: id2, name: "item2" },
          { _id: id3, name: "item3" },
        ],
      };

      const mockModel = {
        find: () => mockQuery,
      };

      const customRepo = new TestRepo(mockModel as any);
      const result = await customRepo.testPaginate({}, { limit: 2 });

      expect(result.hasMore).toBe(true);
      expect(result.items.length).toBe(2);
      expect(result.nextCursor).toBe(id2.toString());
    });

    it("returns hasMore=false and null nextCursor when results fit within limit", async () => {
      const id1 = new Types.ObjectId();

      const mockQuery = {
        sort: () => mockQuery,
        limit: () => mockQuery,
        exec: async () => [{ _id: id1, name: "item1" }],
      };

      const mockModel = {
        find: () => mockQuery,
      };

      const customRepo = new TestRepo(mockModel as any);
      const result = await customRepo.testPaginate({}, { limit: 5 });

      expect(result.hasMore).toBe(false);
      expect(result.items.length).toBe(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("bounded pagination defaults", () => {
    it("defaults limit to 20 when limit is undefined", async () => {
      let capturedLimit: number = 0;
      const mockQuery = {
        sort: () => mockQuery,
        limit: (n: number) => {
          capturedLimit = n;
          return mockQuery;
        },
        exec: async () => [],
      };
      const mockModel = {
        find: () => mockQuery,
      };
      const customRepo = new TestRepo(mockModel as any);
      await customRepo.testPaginate({});
      expect(capturedLimit).toBe(21); // limit + 1 = 20 + 1
    });

    it("clamps limit between 1 and 100", async () => {
      let capturedLimit: number = 0;
      const mockQuery = {
        sort: () => mockQuery,
        limit: (n: number) => {
          capturedLimit = n;
          return mockQuery;
        },
        exec: async () => [],
      };
      const mockModel = {
        find: () => mockQuery,
      };
      const customRepo = new TestRepo(mockModel as any);

      await customRepo.testPaginate({}, { limit: 500 });
      expect(capturedLimit).toBe(101); // 100 + 1

      await customRepo.testPaginate({}, { limit: -10 });
      expect(capturedLimit).toBe(2); // 1 + 1
    });
  });

  describe("withTransaction", () => {
    it("starts a session, runs operation within transaction, and cleans up session", async () => {
      const mockSession = {
        withTransaction: vi.fn(async (callback: () => Promise<any>) => callback()),
        endSession: vi.fn(),
      };
      const mockDb = {
        startSession: vi.fn().mockResolvedValue(mockSession),
      };
      const mockModel = {
        db: mockDb,
      };

      const customRepo = new TestRepo(mockModel as any);
      const result = await customRepo.withTransaction(async (session) => {
        expect(session).toBe(mockSession);
        return "success";
      });

      expect(mockDb.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
      expect(result).toBe("success");
    });

    it("ends session even if the operation throws an error", async () => {
      const mockSession = {
        withTransaction: vi.fn(async (callback: () => Promise<any>) => callback()),
        endSession: vi.fn(),
      };
      const mockDb = {
        startSession: vi.fn().mockResolvedValue(mockSession),
      };
      const mockModel = {
        db: mockDb,
      };

      const customRepo = new TestRepo(mockModel as any);
      await expect(
        customRepo.withTransaction(async () => {
          throw new Error("Transaction aborted");
        })
      ).rejects.toThrow("Transaction aborted");

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });
  });
});
