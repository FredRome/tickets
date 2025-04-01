import express from 'express';
import { QueueController } from '../controllers/queue.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = express.Router();

// All queue routes require authentication
router.use(authenticate);

// Get all queues
router.get('/', QueueController.getAllQueues);

// Get queue by ID
router.get('/:id', QueueController.getQueueById);

// Create new queue (Admin only)
router.post(
  '/',
  authorizeRoles('admin'),
  QueueController.createQueueValidation,
  QueueController.createQueue
);

// Update queue (Admin only)
router.put(
  '/:id',
  authorizeRoles('admin'),
  QueueController.updateQueueValidation,
  QueueController.updateQueue
);

// Delete queue (Admin only)
router.delete(
  '/:id',
  authorizeRoles('admin'),
  QueueController.deleteQueue
);

export default router;