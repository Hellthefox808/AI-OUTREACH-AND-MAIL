/**
 * Audit event model.
 *
 * Append-only record of sensitive platform actions. Never modified or deleted
 * after creation; used for security review and incident investigation.
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export class AuditEvent extends Document {
  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ required: true })
  outcome!: "success" | "failure";

  @Prop({ type: Types.ObjectId, ref: "User", index: true })
  userId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "Workspace", index: true })
  workspaceId!: Types.ObjectId | null;

  @Prop({ required: true })
  requestId!: string;

  @Prop({ required: true })
  correlationId!: string;

  @Prop({ default: null })
  targetType!: string | null;

  @Prop({ default: null })
  targetId!: string | null;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ default: null })
  ipAddress!: string | null;

  @Prop({ default: null })
  userAgent!: string | null;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

import mongoose from "mongoose";

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

AuditEventSchema.index({ userId: 1, createdAt: -1 });
AuditEventSchema.index({ workspaceId: 1, action: 1, createdAt: -1 });
AuditEventSchema.index({ action: 1, outcome: 1, createdAt: -1 });
AuditEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

export type AuditEventDocument = AuditEvent & Document;
