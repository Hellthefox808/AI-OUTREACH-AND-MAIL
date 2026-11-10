/**
 * Recruiter repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";
import { Recruiter, RecruiterDocument } from "../models/recruiter.model";
import { BaseRepository } from "./base.repository";

export interface RecruiterFilterOptions {
  search?: string;
  verificationStatus?: string;
  companyId?: string | Types.ObjectId;
}

@Injectable()
export class RecruiterRepository extends BaseRepository<RecruiterDocument> {
  constructor(@InjectModel(Recruiter.name) model: Model<RecruiterDocument>) {
    super(model);
  }

  private buildQueryFilter(
    workspaceId: string | Types.ObjectId,
    filters?: RecruiterFilterOptions
  ) {
    const filter: Record<string, unknown> = {
      ...this.workspaceFilter(workspaceId),
    };

    if (filters?.verificationStatus) {
      filter.verificationStatus = filters.verificationStatus;
    }
    if (filters?.companyId) {
      filter.companyId =
        typeof filters.companyId === "string" && Types.ObjectId.isValid(filters.companyId)
          ? new Types.ObjectId(filters.companyId)
          : filters.companyId;
    }
    if (filters?.search && filters.search.trim()) {
      const regex = new RegExp(filters.search.trim(), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { designation: regex },
        { department: regex },
      ];
    }

    return filter;
  }

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    pagination: PaginationInput = {},
    filters?: RecruiterFilterOptions,
    session?: ClientSession
  ): Promise<PaginatedResult<RecruiterDocument>> {
    const filter = this.buildQueryFilter(workspaceId, filters);
    return this.paginate(
      filter as any,
      pagination,
      "_id",
      -1,
      session
    );
  }

  async exportAll(
    workspaceId: string | Types.ObjectId,
    filters?: RecruiterFilterOptions,
    limit: number = 1000
  ) {
    const filter = this.buildQueryFilter(workspaceId, filters);
    return this.model
      .find(filter as any)
      .sort({ _id: -1 })
      .limit(limit)
      .lean()
      .exec();
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

  async getMetrics(workspaceId: string | Types.ObjectId) {
    const wsId =
      typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : workspaceId;

    const [statusCounts, totalCount, withEmailCount] = await Promise.all([
      this.model.aggregate([
        { $match: { workspaceId: wsId, deletedAt: null } },
        { $group: { _id: "$verificationStatus", count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({ workspaceId: wsId, deletedAt: null }),
      this.model.countDocuments({
        workspaceId: wsId,
        deletedAt: null,
        email: { $ne: null },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let verifiedCount = 0;

    for (const item of statusCounts) {
      const key = item._id || "UNVERIFIED";
      byStatus[key] = item.count;
      if (key === "VERIFIED") {
        verifiedCount += item.count;
      }
    }

    const verificationRate =
      totalCount > 0
        ? Math.round((verifiedCount / totalCount) * 1000) / 10
        : 0;

    return {
      total: totalCount,
      verified: verifiedCount,
      withEmail: withEmailCount,
      verificationRate,
      byStatus,
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
