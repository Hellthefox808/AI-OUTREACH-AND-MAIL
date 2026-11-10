/**
 * Audit event model.
 *
 * Append-only record of sensitive platform actions. Never modified or deleted
 * after creation; used for security review and incident investigation.
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import mongoose from "mongoose";

export class AuditEvent extends Document {
  @Prop({ type: String, required: true, index: true })
  action!: string;

  @Prop({ type: String, required: true })
  outcome!: "success" | "failure";

  @Prop({ type: Types.ObjectId, ref: "User", index: true })
  userId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "Workspace", index: true })
  workspaceId!: Types.ObjectId | null;

  @Prop({ type: String, required: true })
  requestId!: string;

  @Prop({ type: String, required: true })
  correlationId!: string;

  @Prop({ type: String, default: null })
  targetType!: string | null;

  @Prop({ type: String, default: null })
  targetId!: string | null;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ type: String, default: null })
  ipAddress!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

AuditEventSchema.index({ workspaceId: 1, createdAt: -1 });
AuditEventSchema.index({ userId: 1, createdAt: -1 });
AuditEventSchema.index({ action: 1, createdAt: -1 });

export type AuditEventDocument = AuditEvent & Document;
