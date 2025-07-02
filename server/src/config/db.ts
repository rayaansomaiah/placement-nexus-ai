import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use host.docker.internal inside Docker, localhost otherwise
const defaultUri = process.env.NODE_ENV === 'production'
  ? 'mongodb://host.docker.internal:27017/campus-placement-prod'
  : 'mongodb://localhost:27017/campus-placement-prod';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || defaultUri;
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
