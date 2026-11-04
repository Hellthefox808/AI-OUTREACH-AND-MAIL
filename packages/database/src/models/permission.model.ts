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

  @Prop({ required: true, index: true, unique: true })
  key!: string;

  @Prop({ default: null })
  description!: string | null;

  @Prop({ default: false })
  isSystem!: boolean;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type PermissionDocument = Permission & Document;
