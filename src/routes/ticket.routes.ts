import express from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = express.Router();

// All ticket routes require authentication
router.use(authenticate);

// Get all tickets (with filtering)
router.get(
  '/',
  TicketController.getTicketsValidation,
  TicketController.getTickets
);

// Get ticket by ID
router.get('/:id', TicketController.getTicketById);

// Create new ticket
router.post(
  '/',
  TicketController.createTicketValidation,
  TicketController.createTicket
);

// Update ticket
router.put(
  '/:id',
  TicketController.updateTicketValidation,
  TicketController.updateTicket
);

// Add comment to ticket
router.post(
  '/:id/comments',
  TicketController.addCommentValidation,
  TicketController.addComment
);

// Assign ticket to agent (Admin and Agent only)
router.put(
  '/:id/assign',
  authorizeRoles('admin', 'agent'),
  TicketController.assignTicketValidation,
  TicketController.assignTicket
);

// Move ticket to another queue (Admin and Agent only)
router.put(
  '/:id/queue',
  authorizeRoles('admin', 'agent'),
  TicketController.moveTicketQueueValidation,
  TicketController.moveTicketQueue
);

export default router;