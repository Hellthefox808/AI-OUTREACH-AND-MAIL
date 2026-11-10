/**
 * Unit tests for RecruitersService.
 * Validates recruiter retrieval, company relationship lookups, CSV formatting, and CRUD error handling.
 */

import { RecruitersService } from "./recruiters.service";
import { NotFoundError } from "@career-intelligence/shared";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

describe("RecruitersService", () => {
  let service: RecruitersService;
  let mockRecruiterRepo: {
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
    mockRecruiterRepo = {
      findByWorkspace: vi.fn(),
      exportAll: vi.fn(),
      findById: vi.fn(),
      findByCompany: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      softDelete: vi.fn(),
    };

    service = new RecruitersService(mockRecruiterRepo as any);
  });

  describe("list", () => {
    it("should query repository with workspaceId, pagination, and filters", async () => {
      const mockResult = {
        items: [{ _id: "r1", name: "Jane Recruiter" }],
        nextCursor: null,
        hasMore: false,
      };
      mockRecruiterRepo.findByWorkspace.mockResolvedValue(mockResult);

      const res = await service.list(wsId, { limit: 20 }, { verificationStatus: "VERIFIED" });
      expect(mockRecruiterRepo.findByWorkspace).toHaveBeenCalledWith(
        wsId,
        { limit: 20 },
        { verificationStatus: "VERIFIED" }
      );
      expect(res).toBe(mockResult);
    });
  });

  describe("export", () => {
    it("should return JSON records when format is json", async () => {
      const mockRecords = [{ _id: "r1", name: "Jane", email: "jane@company.com" }];
      mockRecruiterRepo.exportAll.mockResolvedValue(mockRecords);

      const res = await service.export(wsId, undefined, "json");
      expect(res).toBe(mockRecords);
    });

    it("should format records into CSV string with recruiter headers when format is csv", async () => {
      const mockRecords = [
        {
          _id: "r1",
          name: 'Jane "Lead" Doe',
          email: "jane@company.com",
          designation: "Head of Talent",
          department: "Engineering Recruiting",
          verificationStatus: "VERIFIED",
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
        },
      ];
      mockRecruiterRepo.exportAll.mockResolvedValue(mockRecords);

      const csv = await service.export(wsId, undefined, "csv");
      expect(typeof csv).toBe("string");
      expect(csv).toContain("_id,name,email,designation,department,verificationStatus,createdAt");
      expect(csv).toContain('"Jane ""Lead"" Doe"');
      expect(csv).toContain("jane@company.com");
      expect(csv).toContain('"Head of Talent"');
      expect(csv).toContain("2026-02-01T00:00:00.000Z");
    });
  });

  describe("getById", () => {
    it("should return recruiter when found", async () => {
      const mockRecruiter = { _id: "r1", name: "Jane" };
      mockRecruiterRepo.findById.mockResolvedValue(mockRecruiter);

      const result = await service.getById("r1", wsId);
      expect(result).toBe(mockRecruiter);
    });

    it("should throw NotFoundError when recruiter does not exist", async () => {
      mockRecruiterRepo.findById.mockResolvedValue(null);

      await expect(service.getById("r99", wsId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("findByCompany", () => {
    it("should query recruiters by companyId within workspace", async () => {
      const mockList = [{ _id: "r1", companyId: "c1" }];
      mockRecruiterRepo.findByCompany.mockResolvedValue(mockList);

      const result = await service.findByCompany("c1", wsId);
      expect(mockRecruiterRepo.findByCompany).toHaveBeenCalledWith("c1", wsId);
      expect(result).toBe(mockList);
    });
  });

  describe("create", () => {
    it("should create recruiter with workspace ObjectId", async () => {
      const data = { name: "Jane", email: "jane@test.com" };
      mockRecruiterRepo.create.mockResolvedValue({ _id: "r1", ...data });

      const result = await service.create(data as any, wsId);
      expect(mockRecruiterRepo.create).toHaveBeenCalledWith({
        ...data,
        workspaceId: expect.any(Types.ObjectId),
      });
      expect(result?._id).toBe("r1");
    });
  });

  describe("update", () => {
    it("should update recruiter and return document", async () => {
      const updated = { _id: "r1", designation: "Staff Recruiter" };
      mockRecruiterRepo.updateById.mockResolvedValue(updated);

      const res = await service.update("r1", { designation: "Staff Recruiter" }, wsId);
      expect(res).toBe(updated);
    });

    it("should throw NotFoundError if recruiter to update not found", async () => {
      mockRecruiterRepo.updateById.mockResolvedValue(null);

      await expect(
        service.update("r99", { designation: "Staff Recruiter" }, wsId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("should soft delete recruiter and return { deleted: true }", async () => {
      mockRecruiterRepo.softDelete.mockResolvedValue(true);

      const res = await service.delete("r1", wsId);
      expect(res).toEqual({ deleted: true });
    });

    it("should throw NotFoundError if delete target not found", async () => {
      mockRecruiterRepo.softDelete.mockResolvedValue(false);

      await expect(service.delete("r99", wsId)).rejects.toThrow(NotFoundError);
    });
  });
});
