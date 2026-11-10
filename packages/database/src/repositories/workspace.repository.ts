/**
 * Workspace repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { Workspace, WorkspaceDocument } from "../models/workspace.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class WorkspaceRepository extends BaseRepository<WorkspaceDocument> {
  constructor(@InjectModel(Workspace.name) model: Model<WorkspaceDocument>) {
    super(model);
  }

  async findBySlug(slug: string, session?: ClientSession) {
    const query = this.model.findOne({ slug, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findById(id: string | Types.ObjectId, session?: ClientSession) {
    const query = this.model.findOne(this.idFilter(id));
    if (session) query.session(session);
    return query.exec();
  }

  async findByIds(ids: (string | Types.ObjectId)[], session?: ClientSession) {
    const objectIds = ids.map((id) => (typeof id === "string" ? new Types.ObjectId(id) : id));
    const query = this.model.find({ _id: { $in: objectIds }, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async create(data: Partial<WorkspaceDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async updateById(id: string | Types.ObjectId, data: Partial<WorkspaceDocument>, options?: { session?: ClientSession }) {
    const query = this.model.findOneAndUpdate(this.idFilter(id), data, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async softDelete(id: string | Types.ObjectId, options?: { session?: ClientSession }) {
    const query = this.model.findOneAndUpdate(this.idFilter(id), { deletedAt: new Date() }, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }
}
