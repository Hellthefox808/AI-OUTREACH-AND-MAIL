/**
 * Membership repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
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
    session?: ClientSession,
  ): Promise<MembershipDocument[]> {
    const query = this.model.find({ userId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async findByUserAndWorkspace(
    userId: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<MembershipDocument | null> {
    const query = this.model.findOne({ userId, workspaceId, deletedAt: null });
    if (session) query.session(session);
    return query.exec();
  }

  async create(data: Partial<MembershipDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }
}
