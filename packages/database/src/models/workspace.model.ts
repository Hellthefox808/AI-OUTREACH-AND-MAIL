/**
 * Workspace model.
 *
 * Workspace-scoped data ownership boundary. All operational data carries
 * workspaceId so isolation is enforced in queries and indexes.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class Workspace extends Document {
  @Prop({ type: String, required: true, index: true, unique: true })
  slug!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: null })
  description!: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

WorkspaceSchema.index({ slug: 1 }, { unique: true });
WorkspaceSchema.index({ ownerId: 1 });
WorkspaceSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type WorkspaceDocument = Workspace & Document;
