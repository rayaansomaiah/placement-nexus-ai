import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  company: string;
  recruiter: Schema.Types.ObjectId | string;
  college: Schema.Types.ObjectId | string;
  location?: string;
  salary?: string;
  deadline?: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  college: { type: Schema.Types.ObjectId, ref: 'College', required: true },
  location: { type: String },
  salary: { type: String },
  deadline: { type: Date },
  status: { type: String, required: true, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

const Job = mongoose.model<IJob>('Job', JobSchema);

export default Job; 