/**
 * Job posting model.
 *
 * Evidence-backed job intelligence with duplicate detection and expiry.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const JOB_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'graduate',
  'temporary',
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const WORK_MODES = ['remote', 'hybrid', 'on_site'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export class JobPosting extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId!: Types.ObjectId | null;

  @Prop({ required: true })
  title!: string;

  @Prop({ default: null })
  description!: string | null;

  @Prop({ enum: JOB_TYPES, required: true })
  type!: JobType;

  @Prop({ enum: WORK_MODES, required: true })
  workMode!: WorkMode;

  @Prop({ default: null })
  location!: string | null;

  @Prop({ type: [String], default: [] })
  requiredSkills!: string[];

  @Prop({ default: null })
  experienceRequirement!: string | null;

  @Prop({ default: null })
  salaryMin!: number | null;

  @Prop({ default: null })
  salaryMax!: number | null;

  @Prop({ default: null })
  salaryCurrency!: string | null;

  @Prop({ required: true })
  applicationUrl!: string;

  @Prop({ default: null })
  sourceUrl!: string | null;

  @Prop({ default: null })
  openedAt!: Date | null;

  @Prop({ default: null })
  closesAt!: Date | null;

  @Prop({ default: null })
  lastObservedAt!: Date | null;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDuplicate!: boolean;

  @Prop({ default: null })
  duplicateOf!: Types.ObjectId | null;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;

  @Prop({ default: null })
  deletedAt!: Date | null;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);

JobPostingSchema.index({ workspaceId: 1, companyId: 1 });
JobPostingSchema.index({ workspaceId: 1, isActive: 1 });
JobPostingSchema.index({ workspaceId: 1, type: 1, workMode: 1 });
JobPostingSchema.index(
  { applicationUrl: 1 },
  { unique: true, partialFilterExpression: { applicationUrl: { $exists: true } } }
);
JobPostingSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type JobPostingDocument = JobPosting & Document;
