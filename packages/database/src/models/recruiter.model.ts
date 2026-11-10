/**
 * Recruiter model.
 *
 * Public professional recruitment contact information. Guessed/inferred
 * addresses are never labelled as verified.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  type VerificationStatus,
  VERIFICATION_STATUSES,
} from '@career-intelligence/shared';

export class Recruiter extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId!: Types.ObjectId | null;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: null })
  designation!: string | null;

  @Prop({ type: String, default: null })
  department!: string | null;

  @Prop({ type: String, default: null })
  email!: string | null;

  @Prop({
    type: String,
    enum: VERIFICATION_STATUSES,
    default: 'UNVERIFIED',
    index: true,
  })
  verificationStatus!: VerificationStatus;

  @Prop({ type: String, default: null })
  profileUrl!: string | null;

  @Prop({ type: String, default: null })
  sourceUrl!: string | null;

  @Prop({ type: String, default: null })
  discoveryMethod!: string | null;

  @Prop({ type: Number, default: null })
  confidence!: number | null;

  @Prop({ type: String, default: null })
  contactRelevance!: string | null;

  @Prop({ type: Date, default: null })
  lastResearchedAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastVerifiedAt!: Date | null;

  @Prop({ type: String, default: null })
  notes!: string | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const RecruiterSchema = SchemaFactory.createForClass(Recruiter);

RecruiterSchema.index(
  { workspaceId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);
RecruiterSchema.index({ workspaceId: 1, createdAt: -1 });
RecruiterSchema.index({ workspaceId: 1, companyId: 1 });
RecruiterSchema.index({ workspaceId: 1, verificationStatus: 1 });
// Compound ESR indexes for keyset cursor pagination & filtered queries
RecruiterSchema.index({ workspaceId: 1, deletedAt: 1, _id: -1 });
RecruiterSchema.index({ workspaceId: 1, companyId: 1, deletedAt: 1, _id: -1 });
RecruiterSchema.index({ workspaceId: 1, verificationStatus: 1, deletedAt: 1, _id: -1 });
RecruiterSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type RecruiterDocument = Recruiter & Document;
