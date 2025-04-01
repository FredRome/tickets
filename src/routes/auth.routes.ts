import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Register user
router.post('/register', AuthController.registerValidation, AuthController.register);

// Login user
router.post('/login', AuthController.loginValidation, AuthController.login);

// Get current user profile
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;