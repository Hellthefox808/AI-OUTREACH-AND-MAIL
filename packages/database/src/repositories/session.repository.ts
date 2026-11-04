/**
 * Session repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Session, SessionDocument } from "../models/session.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class SessionRepository extends BaseRepository<SessionDocument> {
  constructor(@InjectModel(Session.name) model: Model<SessionDocument>) {
    super(model);
  }

  async findByTokenHash(tokenHash: string) {
    return this.model.findOne({ tokenHash, revokedAt: null, deletedAt: null }).exec();
  }

  async findByUser(userId: string | Types.ObjectId, workspaceId?: string | Types.ObjectId) {
    const filter: Record<string, unknown> = { userId, revokedAt: null, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    return this.model.find(filter).exec();
  }

  async create(data: Partial<SessionDocument>) {
    return this.model.create(data);
  }

  async revoke(tokenHash: string) {
    return this.model
      .findOneAndUpdate({ tokenHash, revokedAt: null }, { revokedAt: new Date() })
      .exec();
  }

  async revokeAllForUser(userId: string | Types.ObjectId) {
    return this.model.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    ).exec();
  }

  async markUsed(tokenHash: string) {
    return this.model
      .findOneAndUpdate({ tokenHash, revokedAt: null }, { lastUsedAt: new Date() })
      .exec();
  }
}
