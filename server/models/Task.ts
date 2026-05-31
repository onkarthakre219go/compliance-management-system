import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  clientId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  templateId?: Types.ObjectId;
  status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: Date;
  actualCompletionDate?: Date;
  notes?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
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
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceTemplate',
      index: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Under Review', 'Completed', 'On Hold'],
      default: 'Pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    actualCompletionDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    },
      attachments: [{
        filename: { type: String, required: true },
        url: { type: String },
        mimeType: { type: String },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
      }],
      comments: [{
        authorId: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now }
      }]
  },
  {
    timestamps: true
  }
);

// Compound indexes
TaskSchema.index({ clientId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
