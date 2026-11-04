/**
 * Unit tests for repository workspace-scoping logic.
 * Tests the query-filter construction without a live database.
 */

import { Types } from "mongoose";
import { describe, it, expect } from "vitest";
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
});
