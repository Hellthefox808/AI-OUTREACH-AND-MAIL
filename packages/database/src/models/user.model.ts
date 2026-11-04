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
  @Prop({ required: true, index: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Workspace' }], default: [] })
  workspaceIds!: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: null })
  lastSignedInAt!: Date | null;

  @Prop({ default: false })
  mfaEnabled!: boolean;

  @Prop({ default: null })
  mfaSecret!: string | null;

  @Prop({ default: null })
  passwordResetToken!: string | null;

  @Prop({ default: null })
  passwordResetExpires!: Date | null;

  @Prop({ default: 0 })
  failedLoginAttempts!: number;

  @Prop({ default: null })
  lockedUntil!: Date | null;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type UserDocument = User & Document;
