/**
 * Recruiter model.
 *
 * Public professional recruitment contact information. Guessed/inferred
 * addresses are never labelled as verified.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class Recruiter extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId!: Types.ObjectId | null;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: null })
  designation!: string | null;

  @Prop({ default: null })
  department!: string | null;

  @Prop({ default: null, index: true })
  email!: string | null;

  @Prop({
    enum: [
      'PUBLISHED',
      'INFERRED',
      'SYNTAX_VALID',
      'DOMAIN_VALID',
      'MX_AVAILABLE',
      'PROVIDER_CHECKED',
      'VERIFIED',
      'UNVERIFIED',
      'RISKY',
      'CATCH_ALL',
      'INVALID',
      'SUPPRESSED',
    ],
    default: 'UNVERIFIED',
    index: true,
  })
  verificationStatus!:
    | 'PUBLISHED'
    | 'INFERRED'
    | 'SYNTAX_VALID'
    | 'DOMAIN_VALID'
    | 'MX_AVAILABLE'
    | 'PROVIDER_CHECKED'
    | 'VERIFIED'
    | 'UNVERIFIED'
    | 'RISKY'
    | 'CATCH_ALL'
    | 'INVALID'
    | 'SUPPRESSED';

  @Prop({ default: null })
  profileUrl!: string | null;

  @Prop({ default: null })
  sourceUrl!: string | null;

  @Prop({ default: null })
  discoveryMethod!: string | null;

  @Prop({ default: null })
  confidence!: number | null;

  @Prop({ default: null })
  contactRelevance!: string | null;

  @Prop({ default: null })
  lastResearchedAt!: Date | null;

  @Prop({ default: null })
  lastVerifiedAt!: Date | null;

  @Prop({ default: null })
  notes!: string | null;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const RecruiterSchema = SchemaFactory.createForClass(Recruiter);

RecruiterSchema.index(
  { workspaceId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true } } }
);
RecruiterSchema.index({ workspaceId: 1, companyId: 1 });
RecruiterSchema.index({ workspaceId: 1, verificationStatus: 1 });
RecruiterSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type RecruiterDocument = Recruiter & Document;
