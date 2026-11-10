/**
 * Jobs service.
 *
 * Implements workspace-scoped job posting intelligence and CRUD.
 */

import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import {
  JobRepository,
  type JobPostingDocument,
} from "@career-intelligence/database";
import { NotFoundError } from "@career-intelligence/shared";

@Injectable()
export class JobsService {
  constructor(private readonly jobs: JobRepository) {}

  async list(
    workspaceId: string,
    pagination: { limit?: number; cursor?: string } = {}
  ) {
    return this.jobs.findByWorkspace(workspaceId, pagination);
  }

  async getById(id: string, workspaceId: string) {
    const job = await this.jobs.findById(id, workspaceId);
    if (!job) {
      throw new NotFoundError("Job", id);
    }
    return job;
  }

  async findByCompany(companyId: string, workspaceId: string) {
    return this.jobs.findByCompany(companyId, workspaceId);
  }

  async create(data: Partial<JobPostingDocument>, workspaceId: string) {
    return this.jobs.create({
      ...data,
      workspaceId: new Types.ObjectId(workspaceId),
    });
  }

  async update(id: string, data: Partial<JobPostingDocument>, workspaceId: string) {
    const updated = await this.jobs.updateById(id, data, workspaceId);
    if (!updated) {
      throw new NotFoundError("Job", id);
    }
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.jobs.softDelete(id, workspaceId);
    if (!deleted) {
      throw new NotFoundError("Job", id);
    }
    return { deleted: true };
  }
}
