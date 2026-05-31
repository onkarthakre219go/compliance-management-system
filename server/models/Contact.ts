import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContact extends Document {
  clientId: Types.ObjectId;
  name: string;
  designation?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  alternatePhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    alternatePhone: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ContactSchema.index({ clientId: 1, isPrimary: -1 });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
