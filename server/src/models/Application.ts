import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  student: Schema.Types.ObjectId | string;
  job: Schema.Types.ObjectId | string;
  status: 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Rejected' | 'Offered';
  createdAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Offered'],
    default: 'Applied',
  },
  createdAt: { type: Date, default: Date.now },
});

const Application = mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application; 