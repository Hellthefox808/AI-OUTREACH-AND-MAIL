/**
 * Recruiters service.
 *
 * Implements workspace-scoped recruiter discovery and contact persistence.
 */

import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import {
  RecruiterRepository,
  type RecruiterDocument,
  type RecruiterFilterOptions,
} from "@career-intelligence/database";
import { NotFoundError } from "@career-intelligence/shared";

@Injectable()
export class RecruitersService {
  constructor(private readonly recruiters: RecruiterRepository) {}

  async list(
    workspaceId: string,
    pagination: { limit?: number; cursor?: string } = {},
    filters?: RecruiterFilterOptions
  ) {
    return this.recruiters.findByWorkspace(workspaceId, pagination, filters);
  }

  async export(
    workspaceId: string,
    filters?: RecruiterFilterOptions,
    format: "json" | "csv" = "json"
  ) {
    const records = await this.recruiters.exportAll(workspaceId, filters);
    if (format === "csv") {
      const headers = [
        "_id",
        "name",
        "email",
        "designation",
        "department",
        "verificationStatus",
        "createdAt",
      ];
      const rows = records.map((r: any) =>
        [
          r._id,
          `"${(r.name || "").replace(/"/g, '""')}"`,
          r.email || "",
          `"${(r.designation || "").replace(/"/g, '""')}"`,
          `"${(r.department || "").replace(/"/g, '""')}"`,
          r.verificationStatus || "",
          r.createdAt ? new Date(r.createdAt).toISOString() : "",
        ].join(",")
      );
      return [headers.join(","), ...rows].join("\n");
    }
    return records;
  }

  async getById(id: string, workspaceId: string) {
    const recruiter = await this.recruiters.findById(id, workspaceId);
    if (!recruiter) {
      throw new NotFoundError("Recruiter", id);
    }
    return recruiter;
  }

  async findByCompany(companyId: string, workspaceId: string) {
    return this.recruiters.findByCompany(companyId, workspaceId);
  }

  async create(data: Partial<RecruiterDocument>, workspaceId: string) {
    return this.recruiters.create({
      ...data,
      workspaceId: new Types.ObjectId(workspaceId),
    });
  }

  async update(id: string, data: Partial<RecruiterDocument>, workspaceId: string) {
    const updated = await this.recruiters.updateById(id, data, workspaceId);
    if (!updated) {
      throw new NotFoundError("Recruiter", id);
    }
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.recruiters.softDelete(id, workspaceId);
    if (!deleted) {
      throw new NotFoundError("Recruiter", id);
    }
    return { deleted: true };
  }
}
