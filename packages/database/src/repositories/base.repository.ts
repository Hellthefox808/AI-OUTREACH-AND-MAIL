/**
 * Base workspace-scoped repository.
 *
 * All concrete repositories enforce `workspaceId` on every query so that
 * tenant isolation is guaranteed at the data-access layer.
 */

import { Model, Types, FilterQuery, ClientSession } from "mongoose";
import { PaginationInput, PaginatedResult } from "@career-intelligence/shared";

export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  protected workspaceFilter(workspaceId: string | Types.ObjectId) {
    const wsId =
      typeof workspaceId === "string" && Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : workspaceId;
    return {
      workspaceId: wsId,
      deletedAt: null,
    };
  }

  protected idFilter(id: string | Types.ObjectId) {
    const docId =
      typeof id === "string" && Types.ObjectId.isValid(id)
        ? new Types.ObjectId(id)
        : id;
    return { _id: docId, deletedAt: null };
  }

  protected async paginate(
    baseFilter: FilterQuery<T>,
    pagination: PaginationInput = {},
    sortField: string = "_id",
    sortOrder: 1 | -1 = -1,
    session?: ClientSession
  ): Promise<PaginatedResult<T>> {
    const rawLimit = pagination.limit !== undefined ? pagination.limit : 20;
    const limit = Math.min(Math.max(rawLimit, 1), 100);
    const filter: FilterQuery<T> = { ...baseFilter };

    if (pagination.cursor && Types.ObjectId.isValid(pagination.cursor)) {
      const cursorOid = new Types.ObjectId(pagination.cursor);
      (filter as any)[sortField] =
        sortOrder === -1 ? { $lt: cursorOid } : { $gt: cursorOid };
    }

    const query = this.model
      .find(filter)
      .sort({ [sortField]: sortOrder } as any)
      .limit(limit + 1);

    if (session) {
      query.session(session);
    }

    const docs = await query.exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem && (lastItem as any)._id
        ? (lastItem as any)._id.toString()
        : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Executes an operation inside a MongoDB transaction session.
   * Automatically handles transaction lifecycle (commit on success, abort on failure)
   * and guarantees deterministic session closure in all scenarios.
   */
  async withTransaction<R>(
    operation: (session: ClientSession) => Promise<R>
  ): Promise<R> {
    let session: ClientSession | null = null;
    try {
      session = await this.model.db.startSession();
      let result!: R;
      await session.withTransaction(async () => {
        result = await operation(session!);
      });
      return result;
    } catch (err: any) {
      const isStandaloneUnsupported =
        err?.message?.includes("replica set member") ||
        err?.code === 20 ||
        err?.message?.includes("Transaction numbers are only allowed");
      if (isStandaloneUnsupported) {
        return await operation(undefined as any);
      }
      throw err;
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch {
          // Ignore session cleanup errors
        }
      }
    }
  }
}
