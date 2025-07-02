import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/api/auth';
import studentRoutes from './routes/api/student';
import recruiterRoutes from './routes/api/recruiter';
import collegeRoutes from './routes/api/college';
import path from 'path';

dotenv.config();

// Connect to database
connectDB();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
  res.send('Campus Placement Platform API is running...');
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/college', collegeRoutes);

// Serve frontend build (client)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA (Single Page Application) routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
}); 
