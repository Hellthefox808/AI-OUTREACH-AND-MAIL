/**
 * Job repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { JobPosting, JobPostingDocument } from "../models/job-posting.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class JobRepository extends BaseRepository<JobPostingDocument> {
  constructor(@InjectModel(JobPosting.name) model: Model<JobPostingDocument>) {
    super(model);
  }

  async findByApplicationUrl(applicationUrl: string) {
    return this.model.findOne({ applicationUrl, deletedAt: null }).exec();
  }

  async findByCompany(
    companyId: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId
  ) {
    return this.model.find({
      ...this.workspaceFilter(workspaceId),
      companyId,
    }).exec();
  }

  async findById(id: string | Types.ObjectId, workspaceId: string | Types.ObjectId) {
    return this.model.findOne({
      ...this.idFilter(id),
      ...this.workspaceFilter(workspaceId),
    }).exec();
  }

  async create(data: Partial<JobPostingDocument>) {
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<JobPostingDocument>,
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
