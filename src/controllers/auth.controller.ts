import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  static registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ];

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, email, password, role } = req.body;
      const result = await userService.register({ name, email, password, role });
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   POST /api/auth/login
   * @desc    Authenticate user & get token
   * @access  Public
   */
  static loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ];

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;
      const result = await userService.login(email, password);
      
      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ message: error.message });
    }
  }

  /**
   * @route   GET /api/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?._id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      const user = await userService.getUserById(req.user._id.toString());
      res.json(user);
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}