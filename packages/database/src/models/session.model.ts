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

  @Prop({ type: String, required: true, index: true, unique: true })
  tokenHash!: string;

  @Prop({ type: String, default: null })
  refreshTokenHash!: string | null;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastUsedAt!: Date | null;

  @Prop({ type: String, default: null })
  ipAddress!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1, revokedAt: 1 });
SessionSchema.index({ workspaceId: 1, revokedAt: 1 });
SessionSchema.index(
  { refreshTokenHash: 1 },
  { partialFilterExpression: { refreshTokenHash: { $type: "string" } } }
);
SessionSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type SessionDocument = Session & Document;
