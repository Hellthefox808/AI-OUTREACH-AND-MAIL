/**
 * Membership repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Membership, MembershipDocument } from "../models/membership.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class MembershipRepository extends BaseRepository<MembershipDocument> {
  constructor(
    @InjectModel(Membership.name) model: Model<MembershipDocument>,
  ) {
    super(model);
  }

  async findByUserId(
    userId: string | Types.ObjectId,
  ): Promise<MembershipDocument[]> {
    return this.model.find({ userId, deletedAt: null }).exec();
  }

  async findByUserAndWorkspace(
    userId: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
  ): Promise<MembershipDocument | null> {
    return this.model
      .findOne({ userId, workspaceId, deletedAt: null })
      .exec();
  }

  async create(data: Partial<MembershipDocument>) {
    return this.model.create(data);
  }
}
