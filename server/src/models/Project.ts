import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  description: string;
  tech: string[];
  link?: string;
}

const ProjectSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  tech: [{ type: String }],
  link: { type: String },
});

const Project = mongoose.model<IProject>('Project', ProjectSchema);

export default Project; 