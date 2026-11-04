/**
 * Permission repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Permission, PermissionDocument } from "../models/permission.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class PermissionRepository extends BaseRepository<PermissionDocument> {
  constructor(@InjectModel(Permission.name) model: Model<PermissionDocument>) {
    super(model);
  }

  async findByKey(
    key: string,
    workspaceId: string | Types.ObjectId,
  ): Promise<PermissionDocument | null> {
    return this.model
      .findOne({ key, workspaceId, deletedAt: null })
      .exec();
  }

  async findById(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
  ): Promise<PermissionDocument | null> {
    return this.model
      .findOne({ _id: id, workspaceId, deletedAt: null })
      .exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
  ): Promise<PermissionDocument[]> {
    return this.model.find({ workspaceId, deletedAt: null }).exec();
  }

  async create(data: Partial<PermissionDocument>) {
    return this.model.create(data);
  }
}
