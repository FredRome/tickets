import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { TicketService } from '../services/ticket.service';

const ticketService = new TicketService();

export class TicketController {
  /**
   * @route   POST /api/tickets
   * @desc    Create a new ticket
   * @access  Private
   */
  static createTicketValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('queue').optional().isMongoId(),
    body('tags').optional().isArray()
  ];

  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Use the authenticated user ID as the customer
      if (!req.user?._id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const { title, description, priority, queue, tags } = req.body;
      
      const ticket = await ticketService.createTicket({
        title,
        description,
        priority,
        customer: req.user._id.toString(),
        queue,
        tags
      });
      
      res.status(201).json(ticket);
    } catch (error: any) {
      console.error('Create ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   GET /api/tickets
   * @desc    Get all tickets with filtering
   * @access  Private
   */
  static getTicketsValidation = [
    query('status').optional(),
    query('priority').optional(),
    query('queue').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ];

  static async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Apply user role-based filtering
      const filters: any = {
        ...req.query
      };

      // If user is a customer, they can only see their own tickets
      if (req.user?.role === 'customer') {
        filters.customer = req.user._id;
      }

      const result = await ticketService.getTickets(filters);
      res.json(result);
    } catch (error: any) {
      console.error('Get tickets error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   GET /api/tickets/:id
   * @desc    Get ticket by ID
   * @access  Private
   */
  static async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      
      // Check if user has access to this ticket
      if (
        req.user?.role === 'customer' && 
        ticket.customer && typeof ticket.customer === 'object' &&
        ticket.customer._id && req.user._id &&
        ticket.customer._id.toString() !== req.user._id.toString()
      ) {
        res.status(403).json({ message: 'Not authorized to access this ticket' });
        return;
      }
      
      res.json(ticket);
    } catch (error: any) {
      console.error('Get ticket error:', error);
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * @route   PUT /api/tickets/:id
   * @desc    Update ticket
   * @access  Private
   */
  static updateTicketValidation = [
    body('title').optional(),
    body('description').optional(),
    body('status').optional().isIn(['new', 'open', 'pending', 'resolved', 'closed']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('tags').optional().isArray()
  ];

  static async updateTicket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Get the existing ticket to verify permissions
      const existingTicket = await ticketService.getTicketById(req.params.id);
      
      // Customers can only update their own tickets and only some fields
      if (req.user?.role === 'customer') {
        if (
          existingTicket.customer && 
          typeof existingTicket.customer === 'object' &&
          existingTicket.customer._id && 
          req.user._id &&
          existingTicket.customer._id.toString() !== req.user._id.toString()
        ) {
          res.status(403).json({ message: 'Not authorized to update this ticket' });
          return;
        }
        
        // Customers can only update certain fields
        const allowedUpdates = ['title', 'description'];
        const requestedUpdates = Object.keys(req.body);
        
        const hasDisallowedUpdates = requestedUpdates.some(
          update => !allowedUpdates.includes(update)
        );
        
        if (hasDisallowedUpdates) {
          res.status(403).json({ 
            message: 'Customers can only update title and description' 
          });
          return;
        }
      }

      const ticket = await ticketService.updateTicket(req.params.id, req.body);
      res.json(ticket);
    } catch (error: any) {
      console.error('Update ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   POST /api/tickets/:id/comments
   * @desc    Add comment to a ticket
   * @access  Private
   */
  static addCommentValidation = [
    body('content').notEmpty().withMessage('Comment content is required'),
    body('isInternal').optional().isBoolean()
  ];

  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user?._id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      // Customers can't create internal comments
      if (req.user.role === 'customer' && req.body.isInternal) {
        res.status(403).json({ message: 'Customers cannot create internal comments' });
        return;
      }

      // Verify the ticket exists and user has access
      const ticket = await ticketService.getTicketById(req.params.id);
      
      if (
        req.user.role === 'customer' && 
        ticket.customer && 
        typeof ticket.customer === 'object' &&
        ticket.customer._id && 
        req.user._id &&
        ticket.customer._id.toString() !== req.user._id.toString()
      ) {
        res.status(403).json({ message: 'Not authorized to comment on this ticket' });
        return;
      }

      const { content, isInternal } = req.body;
      const updatedTicket = await ticketService.addComment(req.params.id, {
        content,
        author: req.user._id.toString(),
        isInternal
      });
      
      res.json(updatedTicket);
    } catch (error: any) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   PUT /api/tickets/:id/assign
   * @desc    Assign ticket to an agent
   * @access  Private (Admin, Agent)
   */
  static assignTicketValidation = [
    body('assigneeId').notEmpty().withMessage('Assignee ID is required').isMongoId()
  ];

  static async assignTicket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { assigneeId } = req.body;
      const ticket = await ticketService.assignTicket(req.params.id, assigneeId);
      
      res.json(ticket);
    } catch (error: any) {
      console.error('Assign ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @route   PUT /api/tickets/:id/queue
   * @desc    Move ticket to another queue
   * @access  Private (Admin, Agent)
   */
  static moveTicketQueueValidation = [
    body('queueId').notEmpty().withMessage('Queue ID is required').isMongoId()
  ];

  static async moveTicketQueue(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { queueId } = req.body;
      const ticket = await ticketService.moveToQueue(req.params.id, queueId);
      
      res.json(ticket);
    } catch (error: any) {
      console.error('Move ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}