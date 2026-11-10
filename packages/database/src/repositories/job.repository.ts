/**
 * Job repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";
import { JobPosting, JobPostingDocument } from "../models/job-posting.model";
import { BaseRepository } from "./base.repository";

@Injectable()
export class JobRepository extends BaseRepository<JobPostingDocument> {
  constructor(@InjectModel(JobPosting.name) model: Model<JobPostingDocument>) {
    super(model);
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    pagination: PaginationInput = {},
    session?: ClientSession
  ): Promise<PaginatedResult<JobPostingDocument>> {
    return this.paginate(
      this.workspaceFilter(workspaceId),
      pagination,
      "_id",
      -1,
      session
    );
  }

  async findByApplicationUrl(applicationUrl: string, workspaceId?: string | Types.ObjectId, session?: ClientSession) {
    const filter: Record<string, unknown> = { applicationUrl, deletedAt: null };
    if (workspaceId) {
      Object.assign(filter, this.workspaceFilter(workspaceId));
    }
    const query = this.model.findOne(filter);
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

  async create(data: Partial<JobPostingDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<JobPostingDocument>,
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

  async getMetrics(workspaceId: string | Types.ObjectId) {
    const wsId =
      typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : workspaceId;

    const [modeCounts, typeCounts, totalCount, activeCount] = await Promise.all([
      this.model.aggregate([
        { $match: { workspaceId: wsId, deletedAt: null } },
        { $group: { _id: "$workMode", count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { workspaceId: wsId, deletedAt: null } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({ workspaceId: wsId, deletedAt: null }),
      this.model.countDocuments({
        workspaceId: wsId,
        deletedAt: null,
        isActive: true,
      }),
    ]);

    const byWorkMode: Record<string, number> = {};
    for (const item of modeCounts) {
      if (item._id) byWorkMode[item._id] = item.count;
    }

    const byJobType: Record<string, number> = {};
    for (const item of typeCounts) {
      if (item._id) byJobType[item._id] = item.count;
    }

    return {
      total: totalCount,
      active: activeCount,
      byWorkMode,
      byJobType,
    };
  }

  async getDailyTrend(workspaceId: string | Types.ObjectId, days: number = 7) {
    const wsId =
      typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : workspaceId;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.model.aggregate([
      {
        $match: {
          workspaceId: wsId,
          deletedAt: null,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
