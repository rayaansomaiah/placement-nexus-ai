import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../../models/User';
import College from '../../models/College';
import mongoose from 'mongoose';

const router: Router = express.Router();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['Student', 'College', 'Recruiter']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, college, company } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      let collegeId: mongoose.Types.ObjectId | undefined;
      
      if (role === 'Student') {
        if (!college || !mongoose.Types.ObjectId.isValid(college as string)) {
          return res.status(400).json({ msg: 'A valid College ID is required for students' });
        }
        collegeId = new mongoose.Types.ObjectId(college as string);
      }

      user = new User({
        name,
        email,
        password,
        role,
        college: collegeId,
        company: role === 'Recruiter' ? company : undefined,
      });

      await user.save();
      
      if (role === 'College') {
        const newCollege = new College({ name: name });
        await newCollege.save();
        user.college = newCollege._id;
        await user.save();
      }

      const payload = {
        user: { id: user.id, role: user.role, },
      };

      const secret = process.env.JWT_SECRET || 'your_default_secret';
      jwt.sign(
        payload,
        secret,
        { expiresIn: '10h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password');

      if (!user || !user.password) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };
      
      const secret = process.env.JWT_SECRET || 'your_default_secret';
      jwt.sign(
        payload,
        secret,
        { expiresIn: '10h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router; 