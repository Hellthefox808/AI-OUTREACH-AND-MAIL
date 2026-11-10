/**
 * Job posting model.
 *
 * Evidence-backed job intelligence with duplicate detection and expiry.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  type JobType,
  JOB_TYPES,
  type WorkMode,
  WORK_MODES,
} from '@career-intelligence/shared';

export { JOB_TYPES, type JobType, WORK_MODES, type WorkMode };

export class JobPosting extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId!: Types.ObjectId | null;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, default: null })
  description!: string | null;

  @Prop({ type: String, enum: JOB_TYPES, required: true })
  type!: JobType;

  @Prop({ type: String, enum: WORK_MODES, required: true })
  workMode!: WorkMode;

  @Prop({ type: String, default: null })
  location!: string | null;

  @Prop({ type: [String], default: [] })
  requiredSkills!: string[];

  @Prop({ type: String, default: null })
  experienceRequirement!: string | null;

  @Prop({ type: Number, default: null })
  salaryMin!: number | null;

  @Prop({ type: Number, default: null })
  salaryMax!: number | null;

  @Prop({ type: String, default: null })
  salaryCurrency!: string | null;

  @Prop({ type: String, required: true })
  applicationUrl!: string;

  @Prop({ type: String, default: null })
  sourceUrl!: string | null;

  @Prop({ type: Date, default: null })
  openedAt!: Date | null;

  @Prop({ type: Date, default: null })
  closesAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastObservedAt!: Date | null;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false })
  isDuplicate!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'JobPosting', default: null })
  duplicateOf!: Types.ObjectId | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);

JobPostingSchema.index(
  { workspaceId: 1, applicationUrl: 1 },
  { unique: true, partialFilterExpression: { applicationUrl: { $type: "string" } } }
);
JobPostingSchema.index({ workspaceId: 1, createdAt: -1 });
JobPostingSchema.index({ workspaceId: 1, companyId: 1 });
JobPostingSchema.index({ workspaceId: 1, isActive: 1 });
JobPostingSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);

export type JobPostingDocument = JobPosting & Document;
