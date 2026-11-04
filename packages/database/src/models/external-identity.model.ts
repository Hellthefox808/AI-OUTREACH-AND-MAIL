/**
 * External identity model.
 *
 * Links a local User to an external OIDC provider identity (Google, Microsoft,
 * etc.). Application authentication and mailbox authorization remain separate;
 * this model only records the provider subject for sign-in linking.
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export class ExternalIdentity extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Workspace", index: true })
  workspaceId!: Types.ObjectId | null;

  @Prop({ required: true })
  provider!: string;

  @Prop({ required: true, index: true })
  subject!: string;

  @Prop({ default: null })
  email!: string | null;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const ExternalIdentitySchema = SchemaFactory.createForClass(ExternalIdentity);

ExternalIdentitySchema.index({ provider: 1, subject: 1 }, { unique: true });
ExternalIdentitySchema.index({ deletedAt: 1 }, { partialFilterExpression: { deletedAt: { $exists: true } } });

export type ExternalIdentityDocument = ExternalIdentity & Document;
