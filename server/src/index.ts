import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

import connectDB from './config/db';
import authRoutes from './routes/api/auth';
import studentRoutes from './routes/api/student';
import recruiterRoutes from './routes/api/recruiter';
import collegeRoutes from './routes/api/college';

dotenv.config();

// Connect to MongoDB
connectDB();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ------------------------
// Define API routes first
// ------------------------
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/college', collegeRoutes);

// ------------------------
// Serve frontend static build (React)
// ------------------------
// NOTE: In production, React build should be at dist/client (copied by Dockerfile)
app.use(express.static(path.join(__dirname, 'client')));

// SPA fallback for React Router (must come AFTER API routes)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
