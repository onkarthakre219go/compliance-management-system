import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId?: Types.ObjectId; // Target user for in-app notification
  title?: string;
  message?: string;
  type?: 'task_assigned' | 'deadline_approaching' | 'payment_received' | 'overdue_invoice' | 'system';
  read?: boolean;

  eventType?: string;
  channels?: string[];
  to?: string[];
  payload?: any;
  templateId?: string;
  dedupeKey?: string;
  status?: 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'dead';
  attempts?: number;
  lastError?: string;
  providerMetadata?: any;
  sendAt?: Date;
  sentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['task_assigned', 'deadline_approaching', 'payment_received', 'overdue_invoice', 'system'],
      default: 'system',
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    eventType: {
      type: String,
      index: true,
    },
    channels: [{ type: String }],
    to: [{ type: String }],
    payload: { type: Schema.Types.Mixed },
    templateId: { type: String },
    dedupeKey: { type: String, index: true },
    status: {
      type: String,
      enum: ['pending', 'queued', 'sending', 'sent', 'failed', 'dead'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    providerMetadata: { type: Schema.Types.Mixed },
    sendAt: { type: Date, index: true },
    sentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ status: 1, sendAt: 1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
