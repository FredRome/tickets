import User, { IUser } from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthResponse {
  user: Partial<IUser>;
  token: string;
}

export class UserService {
  /**
   * Register a new user
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'agent' | 'customer';
  }): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'customer'
      });

      await user.save();

      // Create and return JWT token
      if (user && user._id) {
        const token = this.generateToken(user._id.toString());
        
        const userResponse = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };

        return { user: userResponse, token };
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      // Create and return JWT token
      if (user && user._id) {
        const token = this.generateToken(user._id.toString());
        
        const userResponse = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };

        return { user: userResponse, token };
      } else {
        throw new Error('User data is invalid');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Partial<IUser>> {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: Partial<IUser>): Promise<Partial<IUser>> {
    try {
      // Don't allow updating role through this method for security
      if (userData.role) {
        delete userData.role;
      }

      // If updating password, hash it
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: userData },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const expiresIn = process.env.JWT_EXPIRATION || '7d';
    
    // Use a different approach to handle the JWT type issues
    const options = { expiresIn };
    return jwt.sign({ id: userId }, secret, options as jwt.SignOptions);
  }
}