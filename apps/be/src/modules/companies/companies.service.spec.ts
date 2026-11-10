/**
 * Unit tests for CompaniesService.
 * Validates CRUD operations, CSV export serialization, and NotFoundError semantics.
 */

import { CompaniesService } from "./companies.service";
import { NotFoundError } from "@career-intelligence/shared";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

describe("CompaniesService", () => {
  let service: CompaniesService;
  let mockCompanyRepo: {
    findByWorkspace: ReturnType<typeof vi.fn>;
    exportAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByDomain: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateById: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
  };

  const wsId = "672f9a12bcf86cd799439011";

  beforeEach(() => {
    mockCompanyRepo = {
      findByWorkspace: vi.fn(),
      exportAll: vi.fn(),
      findById: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      softDelete: vi.fn(),
    };

    service = new CompaniesService(mockCompanyRepo as any);
  });

  describe("list", () => {
    it("should delegate to repository findByWorkspace with pagination and filters", async () => {
      const mockResult = {
        items: [{ _id: "c1", displayName: "Acme" }],
        nextCursor: null,
        hasMore: false,
      };
      mockCompanyRepo.findByWorkspace.mockResolvedValue(mockResult);

      const res = await service.list(wsId, { limit: 10 }, { tier: "TIER_1" });
      expect(mockCompanyRepo.findByWorkspace).toHaveBeenCalledWith(
        wsId,
        { limit: 10 },
        { tier: "TIER_1" }
      );
      expect(res).toBe(mockResult);
    });
  });

  describe("export", () => {
    it("should return JSON records when format is json", async () => {
      const mockRecords = [{ _id: "c1", displayName: "Acme", domain: "acme.com" }];
      mockCompanyRepo.exportAll.mockResolvedValue(mockRecords);

      const res = await service.export(wsId, undefined, "json");
      expect(res).toBe(mockRecords);
    });

    it("should format records into RFC 4180 CSV string when format is csv", async () => {
      const mockRecords = [
        {
          _id: "c1",
          displayName: 'Acme "Global"',
          legalName: "Acme Corp",
          domain: "acme.com",
          tier: "TIER_1",
          verificationStatus: "VERIFIED",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ];
      mockCompanyRepo.exportAll.mockResolvedValue(mockRecords);

      const csv = await service.export(wsId, undefined, "csv");
      expect(typeof csv).toBe("string");
      expect(csv).toContain("_id,displayName,legalName,domain,tier,verificationStatus,createdAt");
      expect(csv).toContain('"Acme ""Global"""');
      expect(csv).toContain("acme.com");
      expect(csv).toContain("2026-01-01T00:00:00.000Z");
    });
  });

  describe("getById", () => {
    it("should return company if found", async () => {
      const mockDoc = { _id: "c1", displayName: "Acme" };
      mockCompanyRepo.findById.mockResolvedValue(mockDoc);

      const result = await service.getById("c1", wsId);
      expect(result).toBe(mockDoc);
    });

    it("should throw NotFoundError if company does not exist", async () => {
      mockCompanyRepo.findById.mockResolvedValue(null);

      await expect(service.getById("c99", wsId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getByDomain", () => {
    it("should return company by domain lookup", async () => {
      const mockDoc = { _id: "c1", domain: "stripe.com" };
      mockCompanyRepo.findByDomain.mockResolvedValue(mockDoc);

      const result = await service.getByDomain("stripe.com", wsId);
      expect(mockCompanyRepo.findByDomain).toHaveBeenCalledWith("stripe.com", wsId);
      expect(result).toBe(mockDoc);
    });
  });

  describe("create", () => {
    it("should wrap workspaceId in ObjectId and call repository create", async () => {
      const data = { legalName: "Anthropic PBC", displayName: "Anthropic", domain: "anthropic.com" };
      mockCompanyRepo.create.mockResolvedValue({ _id: "c1", ...data });

      const result = await service.create(data as any, wsId);
      expect(mockCompanyRepo.create).toHaveBeenCalledWith({
        ...data,
        workspaceId: expect.any(Types.ObjectId),
      });
      expect(result?._id).toBe("c1");
    });
  });

  describe("update", () => {
    it("should return updated document", async () => {
      const updatedDoc = { _id: "c1", displayName: "Updated Name" };
      mockCompanyRepo.updateById.mockResolvedValue(updatedDoc);

      const res = await service.update("c1", { displayName: "Updated Name" }, wsId);
      expect(res).toBe(updatedDoc);
    });

    it("should throw NotFoundError if record to update does not exist", async () => {
      mockCompanyRepo.updateById.mockResolvedValue(null);

      await expect(
        service.update("c99", { displayName: "Updated Name" }, wsId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("should soft delete company and return { deleted: true }", async () => {
      mockCompanyRepo.softDelete.mockResolvedValue(true);

      const res = await service.delete("c1", wsId);
      expect(res).toEqual({ deleted: true });
    });

    it("should throw NotFoundError if soft delete target not found", async () => {
      mockCompanyRepo.softDelete.mockResolvedValue(false);

      await expect(service.delete("c99", wsId)).rejects.toThrow(NotFoundError);
    });
  });
});
