/**
 * Unit tests for JobsService.
 * Validates job posting intelligence retrieval, CSV serialization, company association, and error handling.
 */

import { JobsService } from "./jobs.service";
import { NotFoundError } from "@career-intelligence/shared";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

describe("JobsService", () => {
  let service: JobsService;
  let mockJobRepo: {
    findByWorkspace: ReturnType<typeof vi.fn>;
    exportAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByCompany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateById: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
  };

  const wsId = "672f9a12bcf86cd799439011";

  beforeEach(() => {
    mockJobRepo = {
      findByWorkspace: vi.fn(),
      exportAll: vi.fn(),
      findById: vi.fn(),
      findByCompany: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      softDelete: vi.fn(),
    };

    service = new JobsService(mockJobRepo as any);
  });

  describe("list", () => {
    it("should query repository with workspaceId, pagination, and filters", async () => {
      const mockResult = {
        items: [{ _id: "j1", title: "Principal Distributed Engineer" }],
        nextCursor: null,
        hasMore: false,
      };
      mockJobRepo.findByWorkspace.mockResolvedValue(mockResult);

      const res = await service.list(wsId, { limit: 15 }, { workMode: "remote" });
      expect(mockJobRepo.findByWorkspace).toHaveBeenCalledWith(
        wsId,
        { limit: 15 },
        { workMode: "remote" }
      );
      expect(res).toBe(mockResult);
    });
  });

  describe("export", () => {
    it("should return JSON records when format is json", async () => {
      const mockRecords = [{ _id: "j1", title: "Staff Engineer" }];
      mockJobRepo.exportAll.mockResolvedValue(mockRecords);

      const res = await service.export(wsId, undefined, "json");
      expect(res).toBe(mockRecords);
    });

    it("should format records into CSV string with job headers when format is csv", async () => {
      const mockRecords = [
        {
          _id: "j1",
          title: 'Senior "AI" Engineer',
          type: "full_time",
          workMode: "remote",
          location: "San Francisco, CA",
          applicationUrl: "https://example.com/apply/1",
          isActive: true,
          createdAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ];
      mockJobRepo.exportAll.mockResolvedValue(mockRecords);

      const csv = await service.export(wsId, undefined, "csv");
      expect(typeof csv).toBe("string");
      expect(csv).toContain("_id,title,type,workMode,location,applicationUrl,isActive,createdAt");
      expect(csv).toContain('"Senior ""AI"" Engineer"');
      expect(csv).toContain("full_time");
      expect(csv).toContain("remote");
      expect(csv).toContain("true");
      expect(csv).toContain("2026-03-01T00:00:00.000Z");
    });
  });

  describe("getById", () => {
    it("should return job when found", async () => {
      const mockJob = { _id: "j1", title: "Lead Architect" };
      mockJobRepo.findById.mockResolvedValue(mockJob);

      const result = await service.getById("j1", wsId);
      expect(result).toBe(mockJob);
    });

    it("should throw NotFoundError when job does not exist", async () => {
      mockJobRepo.findById.mockResolvedValue(null);

      await expect(service.getById("j99", wsId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("findByCompany", () => {
    it("should query jobs by companyId within workspace", async () => {
      const mockList = [{ _id: "j1", companyId: "c1" }];
      mockJobRepo.findByCompany.mockResolvedValue(mockList);

      const result = await service.findByCompany("c1", wsId);
      expect(mockJobRepo.findByCompany).toHaveBeenCalledWith("c1", wsId);
      expect(result).toBe(mockList);
    });
  });

  describe("create", () => {
    it("should create job posting with workspace ObjectId", async () => {
      const data = {
        title: "Staff SRE",
        type: "full_time",
        workMode: "remote",
        applicationUrl: "https://stripe.com/apply",
      };
      mockJobRepo.create.mockResolvedValue({ _id: "j1", ...data });

      const result = await service.create(data as any, wsId);
      expect(mockJobRepo.create).toHaveBeenCalledWith({
        ...data,
        workspaceId: expect.any(Types.ObjectId),
      });
      expect(result?._id).toBe("j1");
    });
  });

  describe("update", () => {
    it("should update job posting and return document", async () => {
      const updated = { _id: "j1", title: "Principal SRE" };
      mockJobRepo.updateById.mockResolvedValue(updated);

      const res = await service.update("j1", { title: "Principal SRE" }, wsId);
      expect(res).toBe(updated);
    });

    it("should throw NotFoundError if job to update does not exist", async () => {
      mockJobRepo.updateById.mockResolvedValue(null);

      await expect(
        service.update("j99", { title: "Principal SRE" }, wsId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("should soft delete job and return { deleted: true }", async () => {
      mockJobRepo.softDelete.mockResolvedValue(true);

      const res = await service.delete("j1", wsId);
      expect(res).toEqual({ deleted: true });
    });

    it("should throw NotFoundError if job to delete is not found", async () => {
      mockJobRepo.softDelete.mockResolvedValue(false);

      await expect(service.delete("j99", wsId)).rejects.toThrow(NotFoundError);
    });
  });
});
