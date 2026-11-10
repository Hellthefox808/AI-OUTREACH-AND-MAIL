/**
 * Company model.
 *
 * Evidence-backed company intelligence. Tier is evidence-driven and
 * configurable, kept separate from outreach priority.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import {
  type CompanyVerificationStatus,
  COMPANY_VERIFICATION_STATUSES,
} from '@career-intelligence/shared';

export class Company extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  legalName!: string;

  @Prop({ type: String, required: true })
  displayName!: string;

  @Prop({ type: String, required: true })
  domain!: string;

  @Prop({ type: String, default: null })
  canonicalWebsite!: string | null;

  @Prop({ type: String, default: null })
  headquarters!: string | null;

  @Prop({ type: [String], default: [] })
  operatingLocations!: string[];

  @Prop({ type: String, default: null })
  country!: string | null;

  @Prop({ type: String, default: null })
  state!: string | null;

  @Prop({ type: String, default: null })
  city!: string | null;

  @Prop({ type: [String], default: [] })
  industries!: string[];

  @Prop({ type: [String], default: [] })
  subIndustries!: string[];

  @Prop({ type: [String], default: [] })
  technologyCategories!: string[];

  @Prop({ type: String, enum: ['TIER_1', 'TIER_2', 'TIER_3'], default: null, index: true })
  tier!: 'TIER_1' | 'TIER_2' | 'TIER_3' | null;

  @Prop({ type: String, default: null })
  classificationRationale!: string | null;

  @Prop({ type: String, default: null })
  companySize!: string | null;

  @Prop({ type: String, default: null })
  careerPage!: string | null;

  @Prop({ type: String, default: null })
  officialHiringPage!: string | null;

  @Prop({ type: Boolean, default: false })
  hiringActivity!: boolean;

  @Prop({ type: Number, default: 0 })
  activeJobOpenings!: number;

  @Prop({ type: String, default: null })
  parentOrganization!: string | null;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  researchSources!: any[];

  @Prop({ type: Date, default: null })
  lastResearchedAt!: Date | null;

  @Prop({ type: String, default: null })
  dataFreshness!: string | null;

  @Prop({
    type: String,
    enum: COMPANY_VERIFICATION_STATUSES,
    default: 'UNVERIFIED',
    index: true,
  })
  verificationStatus!: CompanyVerificationStatus;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ workspaceId: 1, domain: 1 }, { unique: true });
CompanySchema.index({ workspaceId: 1, createdAt: -1 });
CompanySchema.index({ workspaceId: 1, tier: 1 });
CompanySchema.index({ workspaceId: 1, verificationStatus: 1 });
// Compound ESR (Equality, Sort, Range) indexes for keyset cursor pagination & filtered queries
CompanySchema.index({ workspaceId: 1, deletedAt: 1, _id: -1 });
CompanySchema.index({ workspaceId: 1, tier: 1, deletedAt: 1, _id: -1 });
CompanySchema.index({ workspaceId: 1, verificationStatus: 1, deletedAt: 1, _id: -1 });
CompanySchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type CompanyDocument = Company & Document;
