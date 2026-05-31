import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClient extends Document {
  name: string;
  tradeName?: string;
  constitution: 'Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited' | 'Public Limited' | 'Trust' | 'Individual';
  pan: string;
  gstType: 'Regular' | 'Composition' | 'Unregistered' | 'None';
  filingFrequency: 'Monthly' | 'Quarterly' | 'None';
  assignedTo?: Types.ObjectId; // User references
  tags: string[];
  status: 'active' | 'inactive';
  grade: 'A' | 'B' | 'C' | 'D';
  clientType: 'Corporate' | 'Retail' | 'HNW' | 'SME' | 'Others';
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      index: true
    },
    tradeName: { 
      type: String, 
      trim: true 
    },
    constitution: {
      type: String,
      required: true,
      enum: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Individual'],
      default: 'Individual'
    },
    pan: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function(v: string) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid Permanent Account Number (PAN)!`
      }
    },
    gstType: {
      type: String,
      enum: ['Regular', 'Composition', 'Unregistered', 'None'],
      default: 'None'
    },
    filingFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'None'],
      default: 'None'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    tags: [{ 
      type: String, 
      trim: true 
    }],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      default: 'B',
      index: true
    },
    clientType: {
      type: String,
      enum: ['Corporate', 'Retail', 'HNW', 'SME', 'Others'],
      default: 'SME',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ClientSchema.index({ name: 'text', pan: 'text' });
ClientSchema.index({ status: 1 });

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
