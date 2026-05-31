import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Trainee';
  phone?: string;
  designation?: string;
  active: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      index: true
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      index: true
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    fullName: { 
      type: String, 
      required: true,
      trim: true
    },
    role: { 
      type: String, 
      enum: ['Admin', 'Manager', 'Employee', 'Trainee'], 
      default: 'Employee',
      index: true
    },
    phone: { 
      type: String, 
      trim: true 
    },
    designation: { 
      type: String 
    },
    active: { 
      type: Boolean, 
      default: true 
    },
    refreshToken: {
      type: String
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ email: 1 });

const UserModel: Model<IUser> = (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser>;
export default UserModel;
