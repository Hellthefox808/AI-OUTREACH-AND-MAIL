/**
 * Recruiter repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Recruiter, RecruiterDocument } from "../models/recruiter.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class RecruiterRepository extends BaseRepository<RecruiterDocument> {
  constructor(@InjectModel(Recruiter.name) model: Model<RecruiterDocument>) {
    super(model);
  }

  async findByEmail(email: string, workspaceId: string | Types.ObjectId) {
    return this.model.findOne({
      ...this.workspaceFilter(workspaceId),
      email,
    }).exec();
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

  async create(data: Partial<RecruiterDocument>) {
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<RecruiterDocument>,
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
