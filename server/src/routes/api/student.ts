import express, { Router, Request, Response } from 'express';
import path from 'path';
import { protect, authorize } from '../../middleware/auth';
import User from '../../models/User';
import Job from '../../models/Job';
import Application from '../../models/Application';
import Project from '../../models/Project';

const router: Router = express.Router();

// @route   GET api/student/me
// @desc    Get current student's profile
// @access  Private (Student)
router.get('/me', protect, authorize('Student'), async (req: Request, res: Response) => {
  try {
    // The user object is attached to the request in the 'protect' middleware
    const student = await User.findById((req as any).user.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.json(student);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/student/me
// @desc    Update current student's profile
// @access  Private (Student)
router.put('/me', protect, authorize('Student'), async (req: Request, res: Response) => {
  const { name, branch, cgpa, skills, resume } = req.body;

  // Build profile object based on what's received
  const profileFields: any = {};
  if (name) profileFields.name = name;
  if (branch) profileFields.branch = branch;
  if (cgpa) profileFields.cgpa = cgpa;
  if (resume) profileFields.resume = resume;
  if (skills) {
    // Assuming skills are sent as a comma-separated string from the form
    profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map((skill: string) => skill.trim());
  }

  try {
    const student = await User.findByIdAndUpdate(
      (req as any).user.id,
      { $set: profileFields },
      { new: true, runValidators: true } // 'new: true' returns the updated document
    );

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.json(student);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/jobs
// @desc    Get all approved jobs for the student's college
// @access  Private (Student)
router.get('/jobs', protect, authorize('Student'), async (req: Request, res: Response) => {
  try {
    const student = await User.findById((req as any).user.id).populate('college');
    if (!student || !student.college) {
      return res.status(404).json({ msg: 'Student or student college not found' });
    }
    
    const jobs = await Job.find({ 
      status: 'Approved', 
      college: (student.college as any)._id
    })
    .populate('recruiter', 'name email')
    .populate('college', 'name')
    .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/student/jobs/:id/apply
// @desc    Apply to a job
// @access  Private (Student)
router.post('/jobs/:id/apply', protect, authorize('Student'), async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      job: req.params.id,
      student: (req as any).user.id,
    });

    if (existingApplication) {
      return res.status(400).json({ msg: 'You have already applied to this job' });
    }

    const newApplication = new Application({
      job: req.params.id,
      student: (req as any).user.id,
      status: 'Applied',
    });

    await newApplication.save();

    res.json(newApplication);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/applications
// @desc    Get all applications for the current student
// @access  Private (Student)
router.get('/applications', protect, authorize('Student'), async (req, res) => {
  try {
    const applications = await Application.find({ student: (req as any).user.id })
      .populate({
        path: 'job',
        select: 'title company'
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/student/applications/:id
// @desc    Withdraw an application
// @access  Private (Student)
router.delete('/applications/:id', protect, authorize('Student'), async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        // Make sure student owns the application
        if (application.student.toString() !== (req as any).user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await application.deleteOne();

        res.json({ msg: 'Application withdrawn' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Project Routes ---

// @route   POST api/student/projects
// @desc    Add a new project
// @access  Private (Student)
router.post('/projects', protect, authorize('Student'), async (req, res) => {
  try {
    const { name, description, tech, link } = req.body;
    const newProject = new Project({
      name,
      description,
      tech,
      link,
      user: (req as any).user.id,
    });
    const project = await newProject.save();
    await User.findByIdAndUpdate((req as any).user.id, { $push: { projects: project._id } });
    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/projects
// @desc    Get all of a student's projects
// @access  Private (Student)
router.get('/projects', protect, authorize('Student'), async (req, res) => {
  try {
    const projects = await Project.find({ user: (req as any).user.id });
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/student/projects/:id
// @desc    Delete a project
// @access  Private (Student)
router.delete('/projects/:id', protect, authorize('Student'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.user.toString() !== (req as any).user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await project.deleteOne();
    await User.findByIdAndUpdate((req as any).user.id, { $pull: { projects: req.params.id } });
    res.json({ msg: 'Project removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// --- Saved Jobs Routes ---

// @route   PUT api/student/jobs/:id/save
// @desc    Save a job
// @access  Private (Student)
router.put('/jobs/:id/save', protect, authorize('Student'), async (req, res) => {
  try {
    await User.findByIdAndUpdate((req as any).user.id, { $addToSet: { savedJobs: req.params.id } });
    res.json({ msg: 'Job saved' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router; 