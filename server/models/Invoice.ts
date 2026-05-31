import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  amount: number;
  gstRate: number; // e.g. 18 for 18%
  sacCode?: string;
  feeType?: 'Government' | 'Professional' | 'Other';
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientId: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 18, min: 0 },
  sacCode: { type: String, default: '9982' },
  feeType: {
    type: String,
    enum: ['Government', 'Professional', 'Other'],
    default: 'Professional'
  }
}, { _id: false });

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    items: {
      type: [InvoiceItemSchema],
      required: true,
      validate: [
        {
          validator: (val: any[]) => val.length > 0,
          message: 'An invoice must contain at least one line item.'
        }
      ]
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Void'],
      default: 'Draft',
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
InvoiceSchema.index({ clientId: 1, status: 1 });
InvoiceSchema.index({ issueDate: 1, dueDate: 1 });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
