/**
 * Membership model.
 *
 * Links users to workspaces with a role. Enforces workspace boundaries.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const MEMBERSHIP_ROLES = ['admin', 'member', 'viewer'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export class Membership extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: MEMBERSHIP_ROLES, default: 'member' })
  role!: MembershipRole;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

MembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
MembershipSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type MembershipDocument = Membership & Document;
