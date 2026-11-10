/**
 * Company repository.
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";
import { Company, CompanyDocument } from "../models/company.model";
import { BaseRepository } from "./base.repository";

export interface CompanyFilterOptions {
  search?: string;
  tier?: string;
  verificationStatus?: string;
  hiringActivity?: boolean;
}

@Injectable()
export class CompanyRepository extends BaseRepository<CompanyDocument> {
  constructor(@InjectModel(Company.name) model: Model<CompanyDocument>) {
    super(model);
  }

  private buildQueryFilter(
    workspaceId: string | Types.ObjectId,
    filters?: CompanyFilterOptions
  ) {
    const filter: Record<string, unknown> = {
      ...this.workspaceFilter(workspaceId),
    };

    if (filters?.tier) {
      filter.tier = filters.tier;
    }
    if (filters?.verificationStatus) {
      filter.verificationStatus = filters.verificationStatus;
    }
    if (filters?.hiringActivity !== undefined) {
      filter.hiringActivity = filters.hiringActivity;
    }
    if (filters?.search && filters.search.trim()) {
      const regex = new RegExp(filters.search.trim(), "i");
      filter.$or = [
        { displayName: regex },
        { legalName: regex },
        { domain: regex },
      ];
    }

    return filter;
  }

  async findByDomain(domain: string, workspaceId: string | Types.ObjectId, session?: ClientSession) {
    const query = this.model.findOne({
      ...this.workspaceFilter(workspaceId),
      domain,
    });
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

  async findByWorkspace(
    workspaceId: string | Types.ObjectId,
    pagination: PaginationInput = {},
    filters?: CompanyFilterOptions,
    session?: ClientSession
  ): Promise<PaginatedResult<CompanyDocument>> {
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
    filters?: CompanyFilterOptions,
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

  async create(data: Partial<CompanyDocument>, options?: { session?: ClientSession }) {
    if (options?.session) {
      const docs = await this.model.create([data], { session: options.session });
      return docs[0];
    }
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<CompanyDocument>,
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

    const [tierCounts, totalCount, activeHiringCount] = await Promise.all([
      this.model.aggregate([
        { $match: { workspaceId: wsId, deletedAt: null } },
        { $group: { _id: "$tier", count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({ workspaceId: wsId, deletedAt: null }),
      this.model.countDocuments({
        workspaceId: wsId,
        deletedAt: null,
        hiringActivity: true,
      }),
    ]);

    const tiers = { TIER_1: 0, TIER_2: 0, TIER_3: 0, UNASSIGNED: 0 };
    for (const item of tierCounts) {
      if (item._id && item._id in tiers) {
        (tiers as any)[item._id] = item.count;
      } else {
        tiers.UNASSIGNED += item.count;
      }
    }

    return {
      total: totalCount,
      activeHiring: activeHiringCount,
      byTier: tiers,
    };
  }

  async getIndustryBreakdown(
    workspaceId: string | Types.ObjectId,
    limit: number = 8
  ) {
    const wsId =
      typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : workspaceId;

    return this.model.aggregate([
      { $match: { workspaceId: wsId, deletedAt: null } },
      { $unwind: "$industries" },
      { $group: { _id: "$industries", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { industry: "$_id", count: 1, _id: 0 } },
    ]);
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
