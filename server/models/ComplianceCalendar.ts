import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComplianceCalendar extends Document {
  templateId?: Types.ObjectId;
  title: string;
  description?: string;
  category: 'GST' | 'Income Tax' | 'Corporate Law' | 'Audit' | 'MSME' | 'FEMA' | 'Other';
  dueDate: Date;
  extDueDate?: Date;
  penaltyAmountMultiplier?: number;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'One-Time';
  status: 'Upcoming' | 'Extended' | 'Completed' | 'Missed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceCalendarSchema: Schema = new Schema(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceTemplate',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['GST', 'Income Tax', 'Corporate Law', 'Audit', 'MSME', 'FEMA', 'Other'],
      required: true,
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    extDueDate: {
      type: Date
    },
    penaltyAmountMultiplier: {
      type: Number,
      default: 0
    },
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'One-Time'],
      required: true
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Extended', 'Completed', 'Missed'],
      default: 'Upcoming',
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ComplianceCalendarSchema.index({ dueDate: 1, category: 1 });

export default mongoose.models.ComplianceCalendar || mongoose.model<IComplianceCalendar>('ComplianceCalendar', ComplianceCalendarSchema);
