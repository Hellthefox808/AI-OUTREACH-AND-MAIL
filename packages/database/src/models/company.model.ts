/**
 * Company model.
 *
 * Evidence-backed company intelligence. Tier is evidence-driven and
 * configurable, kept separate from outreach priority.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class Company extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true })
  legalName!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true, index: true, unique: true })
  domain!: string;

  @Prop({ default: null })
  canonicalWebsite!: string | null;

  @Prop({ default: null })
  headquarters!: string | null;

  @Prop({ type: [String], default: [] })
  operatingLocations!: string[];

  @Prop({ default: null })
  country!: string | null;

  @Prop({ default: null })
  state!: string | null;

  @Prop({ default: null })
  city!: string | null;

  @Prop({ type: [String], default: [] })
  industries!: string[];

  @Prop({ type: [String], default: [] })
  subIndustries!: string[];

  @Prop({ type: [String], default: [] })
  technologyCategories!: string[];

  @Prop({ enum: ['TIER_1', 'TIER_2', 'TIER_3'], default: null, index: true })
  tier!: 'TIER_1' | 'TIER_2' | 'TIER_3' | null;

  @Prop({ default: null })
  classificationRationale!: string | null;

  @Prop({ default: null })
  companySize!: string | null;

  @Prop({ default: null })
  careerPage!: string | null;

  @Prop({ default: null })
  officialHiringPage!: string | null;

  @Prop({ default: false })
  hiringActivity!: boolean;

  @Prop({ default: 0 })
  activeJobOpenings!: number;

  @Prop({ default: null })
  parentOrganization!: string | null;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  researchSources!: any[];

  @Prop({ default: null })
  lastResearchedAt!: Date | null;

  @Prop({ default: null })
  dataFreshness!: string | null;

  @Prop({
    enum: ['PUBLISHED', 'VERIFIED', 'UNVERIFIED', 'INVALID'],
    default: 'UNVERIFIED',
    index: true,
  })
  verificationStatus!: 'PUBLISHED' | 'VERIFIED' | 'UNVERIFIED' | 'INVALID';

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

import mongoose from 'mongoose';

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ workspaceId: 1, domain: 1 }, { unique: true });
CompanySchema.index({ workspaceId: 1, tier: 1 });
CompanySchema.index({ workspaceId: 1, verificationStatus: 1 });
CompanySchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type CompanyDocument = Company & Document;
