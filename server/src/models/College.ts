import mongoose, { Schema, Document } from 'mongoose';

export interface ICollege extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
}

const CollegeSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const College = mongoose.model<ICollege>('College', CollegeSchema);

export default College; 