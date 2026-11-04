/**
 * User repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../models/user.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model);
  }

  async findByEmail(email: string, workspaceId?: string | Types.ObjectId) {
    const filter: Record<string, unknown> = { email, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    return this.model.findOne(filter).exec();
  }

  async findById(id: string | Types.ObjectId, workspaceId?: string | Types.ObjectId) {
    const filter: Record<string, unknown> = this.idFilter(id);
    if (workspaceId) filter.workspaceId = workspaceId;
    return this.model.findOne(filter).exec();
  }

  async findByWorkspace(workspaceId: string | Types.ObjectId) {
    return this.model.find(this.workspaceFilter(workspaceId)).exec();
  }

  async create(data: Partial<UserDocument>) {
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<UserDocument>,
    workspaceId?: string | Types.ObjectId
  ) {
    const filter: Record<string, unknown> = this.idFilter(id);
    if (workspaceId) filter.workspaceId = workspaceId;
    return this.model.findOneAndUpdate(filter, data, { new: true }).exec();
  }

  async softDelete(id: string | Types.ObjectId, workspaceId?: string | Types.ObjectId) {
    const filter: Record<string, unknown> = this.idFilter(id);
    if (workspaceId) filter.workspaceId = workspaceId;
    return this.model.findOneAndUpdate(filter, { deletedAt: new Date() }).exec();
  }

  async incrementFailedLogin(id: string | Types.ObjectId) {
    return this.model.findByIdAndUpdate(id, { $inc: { failedLoginAttempts: 1 } }).exec();
  }

  async resetFailedLogin(id: string | Types.ObjectId) {
    return this.model
      .findByIdAndUpdate(id, { failedLoginAttempts: 0, lockedUntil: null })
      .exec();
  }

  async lock(id: string | Types.ObjectId, until: Date) {
    return this.model.findByIdAndUpdate(id, { lockedUntil: until }).exec();
  }

  async findByPasswordResetToken(tokenHash: string) {
    return this.model
      .findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
        deletedAt: null,
      })
      .exec();
  }

  async clearPasswordReset(id: string | Types.ObjectId) {
    return this.model.findByIdAndUpdate(id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    }).exec();
  }
}
