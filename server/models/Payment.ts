import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  invoiceId: Types.ObjectId;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Credit Card';
  transactionId?: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card'],
      required: true,
      default: 'Bank Transfer'
    },
    transactionId: {
      type: String,
      trim: true,
      index: true
    },
    reference: {
      type: String,
      trim: true
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
PaymentSchema.index({ invoiceId: 1, paymentDate: -1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
