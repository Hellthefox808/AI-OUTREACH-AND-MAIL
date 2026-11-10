/**
 * User identity model.
 *
 * Application authentication identity (OIDC / sessions). Separate from
 * mailbox authorization (OAuth provider credentials live in the mailbox
 * module and are never stored alongside password-equivalent material here).
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class User extends Document {
  @Prop({ type: String, required: true, index: true, unique: true })
  email!: string;

  @Prop({ type: String, required: true })
  passwordHash!: string;

  @Prop({ type: Boolean, default: false })
  emailVerified!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Workspace' }], default: [] })
  workspaceIds!: Types.ObjectId[];

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  lastSignedInAt!: Date | null;

  @Prop({ type: Boolean, default: false })
  mfaEnabled!: boolean;

  @Prop({ type: String, default: null })
  mfaSecret!: string | null;

  @Prop({ type: String, default: null })
  passwordResetToken!: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpires!: Date | null;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date, default: null })
  lockedUntil!: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ workspaceIds: 1 });
UserSchema.index(
  { passwordResetToken: 1 },
  { partialFilterExpression: { passwordResetToken: { $type: "string" } } }
);
UserSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type UserDocument = User & Document;
