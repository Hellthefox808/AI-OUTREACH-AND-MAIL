/**
 * Companies service.
 *
 * Implements workspace-scoped company CRUD and intelligence persistence.
 */

import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import {
  CompanyRepository,
  type CompanyDocument,
} from "@career-intelligence/database";
import { NotFoundError } from "@career-intelligence/shared";

@Injectable()
export class CompaniesService {
  constructor(private readonly companies: CompanyRepository) {}

  async list(
    workspaceId: string,
    pagination: { limit?: number; cursor?: string } = {}
  ) {
    return this.companies.findByWorkspace(workspaceId, pagination);
  }

  async getById(id: string, workspaceId: string) {
    const company = await this.companies.findById(id, workspaceId);
    if (!company) {
      throw new NotFoundError("Company", id);
    }
    return company;
  }

  async getByDomain(domain: string, workspaceId: string) {
    return this.companies.findByDomain(domain, workspaceId);
  }

  async create(data: Partial<CompanyDocument>, workspaceId: string) {
    return this.companies.create({
      ...data,
      workspaceId: new Types.ObjectId(workspaceId),
    });
  }

  async update(id: string, data: Partial<CompanyDocument>, workspaceId: string) {
    const updated = await this.companies.updateById(id, data, workspaceId);
    if (!updated) {
      throw new NotFoundError("Company", id);
    }
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.companies.softDelete(id, workspaceId);
    if (!deleted) {
      throw new NotFoundError("Company", id);
    }
    return { deleted: true };
  }
}
