/**
 * Permission model.
 *
 * Fine-grained permissions checked by the RbacGuard. Default-deny means an
 * operation requires an explicit matching permission on the user's roles.
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export class Permission extends Document {
  @Prop({ type: Types.ObjectId, ref: "Workspace", required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  key!: string;

  @Prop({ type: String, default: null })
  description!: string | null;

  @Prop({ type: Boolean, default: false })
  isSystem!: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ workspaceId: 1, key: 1 }, { unique: true });
PermissionSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type PermissionDocument = Permission & Document;
