/**
 * Permission repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
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
    session?: ClientSession,
  ): Promise<PermissionDocument | null> {
    const query = this.model.findOne({ key, workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findById(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<PermissionDocument | null> {
    const query = this.model.findOne({ _id: id, workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<PermissionDocument[]> {
    const query = this.model.find({ workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async create(data: Partial<PermissionDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }
}
