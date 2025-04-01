import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { QueueService } from '../services/queue.service';

const queueService = new QueueService();

export class QueueController {
  /**
   * @route   POST /api/queues
   * @desc    Create a new queue
   * @access  Private (Admin)
   */
  static createQueueValidation = [
    body('name').notEmpty().withMessage('Queue name is required'),
    body('description').optional()
  ];

  static async createQueue(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, isDefault } = req.body;
      const queue = await queueService.createQueue({ name, description, isDefault });
      
      res.status(201).json(queue);
    } catch (error: any) {
      console.error('Create queue error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   GET /api/queues
   * @desc    Get all queues
   * @access  Private
   */
  static async getAllQueues(req: Request, res: Response): Promise<void> {
    try {
      const queues = await queueService.getAllQueues();
      res.json(queues);
    } catch (error: any) {
      console.error('Get queues error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   GET /api/queues/:id
   * @desc    Get queue by ID
   * @access  Private
   */
  static async getQueueById(req: Request, res: Response): Promise<void> {
    try {
      const queue = await queueService.getQueueById(req.params.id);
      res.json(queue);
    } catch (error: any) {
      console.error('Get queue error:', error);
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * @route   PUT /api/queues/:id
   * @desc    Update queue
   * @access  Private (Admin)
   */
  static updateQueueValidation = [
    body('name').optional(),
    body('description').optional(),
    body('isDefault').optional().isBoolean()
  ];

  static async updateQueue(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, isDefault } = req.body;
      const queue = await queueService.updateQueue(req.params.id, { 
        name, 
        description, 
        isDefault 
      });
      
      res.json(queue);
    } catch (error: any) {
      console.error('Update queue error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   DELETE /api/queues/:id
   * @desc    Delete queue
   * @access  Private (Admin)
   */
  static async deleteQueue(req: Request, res: Response): Promise<void> {
    try {
      const result = await queueService.deleteQueue(req.params.id);
      res.json(result);
    } catch (error: any) {
      console.error('Delete queue error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}