/**
 * User repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";
import { User, UserDocument } from "../models/user.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model);
  }

  async findByEmail(email: string, workspaceId?: string | Types.ObjectId, session?: ClientSession) {
    const filter: Record<string, unknown> = { email, deletedAt: null };
    if (workspaceId) {
      const wsId =
        typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
          ? new Types.ObjectId(workspaceId)
          : workspaceId;
      filter.workspaceIds = wsId;
    }
    const query = this.model.findOne(filter);
    if (session) query.session(session);
    return query.exec();
  }

  async findById(id: string | Types.ObjectId, workspaceId?: string | Types.ObjectId, session?: ClientSession) {
    const filter: Record<string, unknown> = this.idFilter(id);
    if (workspaceId) {
      const wsId =
        typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
          ? new Types.ObjectId(workspaceId)
          : workspaceId;
      filter.workspaceIds = wsId;
    }
    const query = this.model.findOne(filter);
    if (session) query.session(session);
    return query.exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    pagination: PaginationInput = {},
    session?: ClientSession
  ): Promise<PaginatedResult<UserDocument>> {
    const wsId =
      typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : workspaceId;
    return this.paginate(
      { workspaceIds: wsId as any, deletedAt: null },
      pagination,
      "_id",
      -1,
      session
    );
  }

  async create(data: Partial<UserDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<UserDocument>,
    workspaceId?: string | Types.ObjectId,
    options?: { session?: ClientSession }
  ) {
    const filter: Record<string, unknown> = this.idFilter(id);
    if (workspaceId) {
      const wsId =
        typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
          ? new Types.ObjectId(workspaceId)
          : workspaceId;
      filter.workspaceIds = wsId;
    }
    const query = this.model.findOneAndUpdate(filter, data, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async softDelete(
    id: string | Types.ObjectId,
    workspaceId?: string | Types.ObjectId,
    options?: { session?: ClientSession }
  ) {
    const filter: Record<string, unknown> = this.idFilter(id);
    if (workspaceId) {
      const wsId =
        typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
          ? new Types.ObjectId(workspaceId)
          : workspaceId;
      filter.workspaceIds = wsId;
    }
    const query = this.model.findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async incrementFailedLogin(id: string | Types.ObjectId, options?: { session?: ClientSession }) {
    const query = this.model.findByIdAndUpdate(id, { $inc: { failedLoginAttempts: 1 } }, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async resetFailedLogin(id: string | Types.ObjectId, options?: { session?: ClientSession }) {
    const query = this.model.findByIdAndUpdate(id, { failedLoginAttempts: 0, lockedUntil: null }, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async lock(id: string | Types.ObjectId, until: Date, options?: { session?: ClientSession }) {
    const query = this.model.findByIdAndUpdate(id, { lockedUntil: until }, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async findByPasswordResetToken(tokenHash: string, session?: ClientSession) {
    const query = this.model.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
      deletedAt: null,
    });
    if (session) query.session(session);
    return query.exec();
  }

  async clearPasswordReset(id: string | Types.ObjectId, options?: { session?: ClientSession }) {
    const query = this.model.findByIdAndUpdate(id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    }, { new: true });
    if (options?.session) query.session(options.session);
    return query.exec();
  }
}
