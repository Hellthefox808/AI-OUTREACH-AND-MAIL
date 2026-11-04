/**
 * Base workspace-scoped repository.
 *
 * All concrete repositories enforce `workspaceId` on every query so that
 * tenant isolation is guaranteed at the data-access layer.
 */

import { Model, Types } from "mongoose";

export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  protected workspaceFilter(workspaceId: string | Types.ObjectId) {
    return {
      workspaceId,
      deletedAt: null,
    };
  }

  protected idFilter(id: string | Types.ObjectId) {
    return { _id: id, deletedAt: null };
  }
}
