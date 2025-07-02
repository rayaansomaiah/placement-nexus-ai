import express, { Router, Request, Response } from 'express';
import { protect, authorize } from '../../middleware/auth';
import Job from '../../models/Job';
import User from '../../models/User';
import College from '../../models/College';
import Application from '../../models/Application';

const router: Router = express.Router();

// @route   GET api/college/jobs/pending
// @desc    Get all jobs pending approval for the college
// @access  Private (College)
router.get('/jobs/pending', protect, authorize('College'), async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        // Find jobs submitted to the user's college that are pending
        const jobs = await Job.find({ college: user.college, status: 'Pending' }).populate('recruiter', 'name company');
        res.json(jobs);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/college/jobs/:id/status
// @desc    Approve or reject a job
// @access  Private (College)
router.put('/jobs/:id/status', protect, authorize('College'), async (req: Request, res: Response) => {
    const { status } = req.body;

    if (status !== 'Approved' && status !== 'Rejected') {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }
        
        // TODO: Add check to ensure the job belongs to the college officer's college

        job.status = status;
        await job.save();
        res.json(job);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/college/all
// @desc    Get all colleges
// @access  Public
router.get('/all', async (req: Request, res: Response) => {
    try {
        const colleges = await College.find().select('name');
        res.json(colleges);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/college/
// @desc    Get all colleges
// @access  Public (or Private if you want to restrict it)
router.get('/', async (req: Request, res: Response) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    res.json(colleges);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/college/jobs
// @desc    Create a job posting as a college
// @access  Private (College)
router.post('/jobs', protect, authorize('College'), async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id);
        const { title, description, location } = req.body;

        const newJob = new Job({
            title,
            description,
            location,
            recruiter: user?._id, // The college user is the recruiter in this case
            company: user?.company || 'College Placement Cell', // Use user's company or default
            college: user?.college,
            status: 'Approved' // College postings are auto-approved
        });

        const job = await newJob.save();
        res.json(job);
    } catch (err: any) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/college/stats
// @desc    Get dashboard stats for a college
// @access  Private (College)
router.get('/stats', protect, authorize('College'), async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id);
        const collegeId = user?.college;

        if(!collegeId) {
            return res.status(404).json({ msg: 'College not found for this user.' });
        }

        const totalStudents = await User.countDocuments({ college: collegeId, role: 'Student' });
        const placedStudents = await Application.countDocuments({ status: 'Hired', 'job.college': collegeId }); // This requires joining, simplifying for now
        const pendingApprovals = await Job.countDocuments({ college: collegeId, status: 'Pending' });
        const activeJobs = await Job.countDocuments({ college: collegeId, status: 'Approved' });

        res.json({
            totalStudents,
            placedStudents: 0, // Placeholder, a more complex query is needed
            pendingApprovals,
            activeJobs
        });
    } catch(err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/college/jobs/all
// @desc    Get all jobs for the college (approved, pending, etc.)
// @access  Private (College)
router.get('/jobs/all', protect, authorize('College'), async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id);
        const jobs = await Job.find({ college: user?.college }).populate('recruiter', 'name company').sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/college/students
// @desc    Get all students for the college
// @access  Private (College)
router.get('/students', protect, authorize('College'), async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id);
        const students = await User.find({ college: user?.college, role: 'Student' }).select('-password');
        res.json(students);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/college/recruiters
// @desc    Get all unique recruiters who have posted to the college
// @access  Private (College)
router.get('/recruiters', protect, authorize('College'), async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id);
        const jobs = await Job.find({ college: user?.college }).distinct('recruiter');
        const recruiters = await User.find({ '_id': { $in: jobs } }).select('name company email');
        res.json(recruiters);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add college-specific routes here later

export default router; 