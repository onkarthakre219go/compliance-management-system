import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  category: 'Travel' | 'Government Fees' | 'Office Supplies' | 'Tech Subscriptions' | 'Task Expense' | 'Other';
  amount: number;
  spentDate: Date;
  spentBy: Types.ObjectId; // User reference
  taskId?: Types.ObjectId; // Optional task association
  paymentStatus: 'Paid' | 'Reimbursement Pending';
  receiptUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: ['Travel', 'Government Fees', 'Office Supplies', 'Tech Subscriptions', 'Task Expense', 'Other'],
      required: true,
      default: 'Other',
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    spentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    spentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Reimbursement Pending'],
      default: 'Paid'
    },
    receiptUrl: {
      type: String
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ExpenseSchema.index({ spentDate: -1, category: 1 });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
