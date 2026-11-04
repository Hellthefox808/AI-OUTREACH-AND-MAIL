/**
 * Role model.
 *
 * Named RBAC roles within a workspace. Permissions are assigned to roles;
 * users inherit permissions through workspace memberships.
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export class Role extends Document {
  @Prop({ type: Types.ObjectId, ref: "Workspace", required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ default: null })
  description!: string | null;

  @Prop({ type: [Types.ObjectId], ref: "Permission", default: [] })
  permissionIds!: Types.ObjectId[];

  @Prop({ default: false })
  isSystem!: boolean;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
RoleSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type RoleDocument = Role & Document;
