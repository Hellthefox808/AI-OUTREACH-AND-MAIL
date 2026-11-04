/**
 * Session model.
 *
 * Tracks authenticated sessions for workspace-scoped users. Refresh tokens
 * are encrypted at rest via envelope encryption (see security package) and
 * never logged or exposed to the frontend/extension.
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export class Session extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Workspace", required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, index: true, unique: true })
  tokenHash!: string;

  @Prop({ default: null })
  refreshTokenHash!: string | null;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: null })
  revokedAt!: Date | null;

  @Prop({ default: null })
  lastUsedAt!: Date | null;

  @Prop({ default: null })
  ipAddress!: string | null;

  @Prop({ default: null })
  userAgent!: string | null;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1, revokedAt: 1 });
SessionSchema.index({ workspaceId: 1, revokedAt: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type SessionDocument = Session & Document;
