/**
 * Recruiter repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";
import { Recruiter, RecruiterDocument } from "../models/recruiter.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class RecruiterRepository extends BaseRepository<RecruiterDocument> {
  constructor(@InjectModel(Recruiter.name) model: Model<RecruiterDocument>) {
    super(model);
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    pagination: PaginationInput = {},
    session?: ClientSession
  ): Promise<PaginatedResult<RecruiterDocument>> {
    return this.paginate(
      this.workspaceFilter(workspaceId),
      pagination,
      "_id",
      -1,
      session
    );
  }

  async findByEmail(email: string, workspaceId: string | Types.ObjectId, session?: ClientSession) {
    const query = this.model.findOne({
      ...this.workspaceFilter(workspaceId),
      email,
    });
    if (session) query.session(session);
    return query.exec();
  }

  async findByCompany(
    companyId: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
    limit?: number,
    session?: ClientSession
  ) {
    const boundedLimit = Math.min(Math.max(limit || 20, 1), 100);
    const cId =
      typeof companyId === "string" && Types.ObjectId.isValid(companyId)
        ? new Types.ObjectId(companyId)
        : companyId;
    const query = this.model
      .find({
        ...this.workspaceFilter(workspaceId),
        companyId: cId,
      })
      .sort({ _id: -1 })
      .limit(boundedLimit);
    if (session) query.session(session);
    return query.exec();
  }

  async findById(id: string | Types.ObjectId, workspaceId: string | Types.ObjectId, session?: ClientSession) {
    const query = this.model.findOne({
      ...this.idFilter(id),
      ...this.workspaceFilter(workspaceId),
    });
    if (session) query.session(session);
    return query.exec();
  }

  async create(data: Partial<RecruiterDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<RecruiterDocument>,
    workspaceId: string | Types.ObjectId,
    options?: { session?: ClientSession }
  ) {
    const query = this.model
      .findOneAndUpdate({ ...this.idFilter(id), ...this.workspaceFilter(workspaceId) }, data, {
        new: true,
      });
    if (options?.session) {
      query.session(options.session);
    }
    return query.exec();
  }

  async softDelete(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
    options?: { session?: ClientSession }
  ) {
    const query = this.model
      .findOneAndUpdate(
        { ...this.idFilter(id), ...this.workspaceFilter(workspaceId) },
        { deletedAt: new Date() },
        { new: true }
      );
    if (options?.session) {
      query.session(options.session);
    }
    return query.exec();
  }
}
