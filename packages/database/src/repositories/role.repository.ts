/**
 * Role repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Role, RoleDocument } from "../models/role.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class RoleRepository extends BaseRepository<RoleDocument> {
  constructor(@InjectModel(Role.name) model: Model<RoleDocument>) {
    super(model);
  }

  async findByName(
    name: string,
    workspaceId: string | Types.ObjectId,
  ): Promise<RoleDocument | null> {
    return this.model
      .findOne({ name, workspaceId, deletedAt: null })
      .exec();
  }

  async findById(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
  ): Promise<RoleDocument | null> {
    return this.model
      .findOne({ _id: id, workspaceId, deletedAt: null })
      .exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
  ): Promise<RoleDocument[]> {
    return this.model.find({ workspaceId, deletedAt: null }).exec();
  }

  async create(data: Partial<RoleDocument>) {
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<RoleDocument>,
    workspaceId: string | Types.ObjectId,
  ) {
    return this.model
      .findOneAndUpdate(
        { ...this.idFilter(id), ...this.workspaceFilter(workspaceId) },
        data,
        { new: true },
      )
      .exec();
  }
}
