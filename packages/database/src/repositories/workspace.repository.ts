/**
 * Workspace repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Workspace, WorkspaceDocument } from "../models/workspace.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class WorkspaceRepository extends BaseRepository<WorkspaceDocument> {
  constructor(@InjectModel(Workspace.name) model: Model<WorkspaceDocument>) {
    super(model);
  }

  async findBySlug(slug: string) {
    return this.model.findOne({ slug, deletedAt: null }).exec();
  }

  async findById(id: string | Types.ObjectId) {
    return this.model.findOne(this.idFilter(id)).exec();
  }

  async create(data: Partial<WorkspaceDocument>) {
    return this.model.create(data);
  }

  async updateById(id: string | Types.ObjectId, data: Partial<WorkspaceDocument>) {
    return this.model.findOneAndUpdate(this.idFilter(id), data, { new: true }).exec();
  }

  async softDelete(id: string | Types.ObjectId) {
    return this.model.findOneAndUpdate(this.idFilter(id), { deletedAt: new Date() }).exec();
  }
}
