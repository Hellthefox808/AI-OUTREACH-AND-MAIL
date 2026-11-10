/**
 * Session repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";
import { Session, SessionDocument } from "../models/session.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class SessionRepository extends BaseRepository<SessionDocument> {
  constructor(@InjectModel(Session.name) model: Model<SessionDocument>) {
    super(model);
  }

  async findByTokenHash(tokenHash: string, session?: ClientSession) {
    const query = this.model.findOne({ tokenHash, revokedAt: null, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findByRefreshTokenHash(refreshTokenHash: string, session?: ClientSession) {
    const query = this.model.findOne({ refreshTokenHash, revokedAt: null, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findByUser(
    userId: string | Types.ObjectId,
    workspaceId?: string | Types.ObjectId,
    limit?: number,
    session?: ClientSession
  ) {
    const boundedLimit = Math.min(Math.max(limit || 20, 1), 100);
    const filter: Record<string, unknown> = { userId, revokedAt: null, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    const query = this.model
      .find(filter)
      .sort({ _id: -1 })
      .limit(boundedLimit);
    if (session) query.session(session);
    return query.exec();
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    pagination: PaginationInput = {},
    session?: ClientSession
  ): Promise<PaginatedResult<SessionDocument>> {
    const limit = Math.min(Math.max(pagination.limit || 20, 1), 100);
    return this.paginate(
      this.workspaceFilter(workspaceId),
      { ...pagination, limit },
      "_id",
      -1,
      session
    );
  }

  async create(data: Partial<SessionDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async revoke(tokenHash: string, options?: { session?: ClientSession }) {
    const query = this.model.findOneAndUpdate(
      {
        $or: [{ tokenHash }, { refreshTokenHash: tokenHash }],
        revokedAt: null,
      },
      { revokedAt: new Date() }
    );
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async revokeAllForUser(userId: string | Types.ObjectId, options?: { session?: ClientSession }) {
    const query = this.model.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    if (options?.session) query.session(options.session);
    return query.exec();
  }

  async markUsed(tokenHash: string, options?: { session?: ClientSession }) {
    const query = this.model.findOneAndUpdate(
      {
        $or: [{ tokenHash }, { refreshTokenHash: tokenHash }],
        revokedAt: null,
      },
      { lastUsedAt: new Date() }
    );
    if (options?.session) query.session(options.session);
    return query.exec();
  }
}
