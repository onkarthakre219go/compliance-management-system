import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistItem {
  itemText: string;
  isMandatory: boolean;
}

export interface IComplianceTemplate extends Document {
  title: string;
  description?: string;
  category: 'GST' | 'Income Tax' | 'Corporate Law' | 'Audit' | 'MSME' | 'FEMA' | 'Other';
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'One-Time';
  checklistItems: IChecklistItem[];
  averageMinutesToComplete?: number;
  applicableClientTypes: ('Pvt Ltd' | 'Public Ltd' | 'LLP' | 'OPC' | 'Partnership' | 'Proprietorship')[];
  dueDateRule: {
    ruleType: 'DayOfMonth' | 'DaysAfterMonthEnd' | 'DaysAfterQuarterEnd' | 'DaysAfterYearEnd' | 'SpecificDate';
    daysOffset?: number;
    specificDate?: Date;
  };
  reminderRules: {
    daysBefore?: number[];
    channel?: 'Email' | 'Sms' | 'App' | 'Email & App';
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema({
  itemText: { type: String, required: true, trim: true },
  isMandatory: { type: Boolean, default: true }
}, { _id: false });

const DueDateRuleSchema = new Schema({
  ruleType: {
    type: String,
    enum: ['DayOfMonth', 'DaysAfterMonthEnd', 'DaysAfterQuarterEnd', 'DaysAfterYearEnd', 'SpecificDate'],
    required: true,
    default: 'DayOfMonth'
  },
  daysOffset: { type: Number, default: 0 },
  specificDate: { type: Date }
}, { _id: false });

const ReminderRulesSchema = new Schema({
  daysBefore: { type: [Number], default: [5, 2, 1] },
  channel: {
    type: String,
    enum: ['Email', 'Sms', 'App', 'Email & App'],
    default: 'Email & App'
  }
}, { _id: false });

const ComplianceTemplateSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
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
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'One-Time'],
      required: true
    },
    checklistItems: [ChecklistItemSchema],
    averageMinutesToComplete: {
      type: Number,
      default: 30
    },
    applicableClientTypes: {
      type: [String],
      enum: ['Pvt Ltd', 'Public Ltd', 'LLP', 'OPC', 'Partnership', 'Proprietorship'],
      default: []
    },
    dueDateRule: {
      type: DueDateRuleSchema,
      required: true,
      default: { ruleType: 'DayOfMonth', daysOffset: 15 }
    },
    reminderRules: {
      type: ReminderRulesSchema,
      required: true,
      default: { daysBefore: [5, 2, 1], channel: 'Email & App' }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ComplianceTemplateSchema.index({ category: 1 });

export default mongoose.models.ComplianceTemplate || mongoose.model<IComplianceTemplate>('ComplianceTemplate', ComplianceTemplateSchema);
