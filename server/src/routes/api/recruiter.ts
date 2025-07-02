import express, { Router, Request, Response } from 'express';
import { protect, authorize } from '../../middleware/auth';
import Job from '../../models/Job';
import { check, validationResult } from 'express-validator';
import Application from '../../models/Application';

const router: Router = express.Router();

// @route   GET api/recruiter/jobs
// @desc    Get all jobs posted by the recruiter
// @access  Private (Recruiter)
router.get('/jobs', protect, authorize('Recruiter'), async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ recruiter: (req as any).user.id })
      .populate('college', 'name')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/recruiter/jobs
// @desc    Post a new job
// @access  Private (Recruiter)
router.post(
  '/jobs',
  protect,
  authorize('Recruiter'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('college', 'College ID is required').isMongoId(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, college, location, salary, deadline } = req.body;
      const user = (req as any).user;

      const newJob = new Job({
        title,
        description,
        college,
        location,
        salary,
        deadline,
        company: user.company, // Get company from recruiter's profile
        recruiter: user.id,
        status: 'Pending', // Default status
      });

      const job = await newJob.save();
      res.json(job);
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/recruiter/jobs/:id/applications
// @desc    Get all applications for a specific job
// @access  Private (Recruiter)
router.get('/jobs/:id/applications', protect, authorize('Recruiter'), async (req: Request, res: Response) => {
  try {
    // First, verify the recruiter owns the job
    const job = await Job.findById(req.params.id);
    if (!job || job.recruiter.toString() !== (req as any).user.id) {
      return res.status(404).json({ msg: 'Job not found or you are not authorized' });
    }

    const applications = await Application.find({ job: req.params.id })
      .populate('student', ['name', 'email', 'branch', 'cgpa', 'skills']) // Populate with student details
      .sort({ createdAt: -1 });
      
    res.json(applications);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/recruiter/jobs/:id
// @desc    Update a job
// @access  Private (Recruiter)
router.put(
  '/jobs/:id',
  protect,
  authorize('Recruiter'),
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ msg: 'Job not found' });
      }

      // Ensure the recruiter owns the job
      if (job.recruiter.toString() !== (req as any).user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      job = await Job.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      res.json(job);
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/recruiter/candidates
// @desc    Get all unique candidates who applied to recruiter's jobs
// @access  Private (Recruiter)
router.get('/candidates', protect, authorize('Recruiter'), async (req: Request, res: Response) => {
    try {
        // Find all jobs for the recruiter
        const jobs = await Job.find({ recruiter: (req as any).user.id });
        const jobIds = jobs.map(job => job._id);

        // Find all applications for those jobs
        const applications = await Application.find({ job: { $in: jobIds } }).populate('student', '-password');
        
        // Get unique students from the applications
        const studentMap = new Map();
        applications.forEach(app => {
            // Check if student object exists and has an _id
            if (app.student && (app.student as any)._id) {
                 studentMap.set((app.student as any)._id.toString(), app.student);
            }
        });
        const uniqueStudents = Array.from(studentMap.values());

        res.json(uniqueStudents);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add recruiter-specific routes here later

export default router; 