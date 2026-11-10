/**
 * Role repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
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
    session?: ClientSession,
  ): Promise<RoleDocument | null> {
    const query = this.model.findOne({ name, workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findById(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<RoleDocument | null> {
    const query = this.model.findOne({ _id: id, workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<RoleDocument[]> {
    const query = this.model.find({ workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async create(data: Partial<RoleDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<RoleDocument>,
    workspaceId: string | Types.ObjectId,
    options?: { session?: ClientSession },
  ) {
    const query = this.model.findOneAndUpdate(
      { ...this.idFilter(id), ...this.workspaceFilter(workspaceId) },
      data,
      { new: true },
    );
    if (options?.session) query.session(options.session);
    return query.exec();
  }
}
