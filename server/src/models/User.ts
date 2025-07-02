import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'Student' | 'College' | 'Recruiter';
  college?: mongoose.Types.ObjectId; // Ref to College model
  company?: string; // For recruiters
  createdAt: Date;

  // Student-specific fields
  branch?: string;
  cgpa?: number;
  skills?: string[];
  resume?: string; // URL to resume
  projects?: (Schema.Types.ObjectId | string)[];
  savedJobs?: (Schema.Types.ObjectId | string)[];
  
  // Method to compare passwords
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['Student', 'College', 'Recruiter'] },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  company: { type: String },
  createdAt: { type: Date, default: Date.now },

  // Student-specific fields
  branch: { type: String },
  cgpa: { type: Number },
  skills: [{ type: String }],
  resume: { type: String },
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User; 