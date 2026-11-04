/**
 * Company repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Company, CompanyDocument } from "../models/company.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class CompanyRepository extends BaseRepository<CompanyDocument> {
  constructor(@InjectModel(Company.name) model: Model<CompanyDocument>) {
    super(model);
  }

  async findByDomain(domain: string, workspaceId: string | Types.ObjectId) {
    return this.model.findOne({
      ...this.workspaceFilter(workspaceId),
      domain,
    }).exec();
  }

  async findById(id: string | Types.ObjectId, workspaceId: string | Types.ObjectId) {
    return this.model.findOne({
      ...this.idFilter(id),
      ...this.workspaceFilter(workspaceId),
    }).exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    { limit, cursor }: { limit?: number; cursor?: string }
  ) {
    const filter: Record<string, unknown> = { ...this.workspaceFilter(workspaceId) };
    if (cursor) {
      try {
        filter._id = { $lt: new Types.ObjectId(cursor) };
      } catch {
        // Invalid cursor — ignore and return first page.
      }
    }
    let query = this.model.find(filter).sort({ createdAt: -1 });
    if (limit) {
      query = query.limit(limit);
    }
    return query.exec();
  }

  async create(data: Partial<CompanyDocument>) {
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<CompanyDocument>,
    workspaceId: string | Types.ObjectId
  ) {
    return this.model
      .findOneAndUpdate({ ...this.idFilter(id), ...this.workspaceFilter(workspaceId) }, data, {
        new: true,
      })
      .exec();
  }

  async softDelete(id: string | Types.ObjectId, workspaceId: string | Types.ObjectId) {
    return this.model
      .findOneAndUpdate(
        { ...this.idFilter(id), ...this.workspaceFilter(workspaceId) },
        { deletedAt: new Date() }
      )
      .exec();
  }
}
