import Ticket, { ITicket, IComment } from '../models/ticket.model';
import { QueueService } from './queue.service';
import mongoose from 'mongoose';

export class TicketService {
  private queueService: QueueService;

  constructor() {
    this.queueService = new QueueService();
  }

  /**
   * Create a new ticket
   */
  async createTicket(ticketData: {
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    customer: string;
    queue?: string;
    tags?: string[];
  }): Promise<ITicket> {
    try {
      // If queue is not specified, use the default queue
      if (!ticketData.queue) {
        try {
          const defaultQueue = await this.queueService.getDefaultQueue();
          if (defaultQueue && defaultQueue._id) {
            ticketData.queue = defaultQueue._id.toString();
          }
        } catch (error) {
          // If no default queue exists, create a general queue and set it as default
          const generalQueue = await this.queueService.createQueue({
            name: 'General',
            description: 'Default queue for all tickets',
            isDefault: true
          });
          if (generalQueue && generalQueue._id) {
            ticketData.queue = generalQueue._id.toString();
          }
        }
      }

      const ticket = new Ticket({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority || 'medium',
        customer: ticketData.customer,
        queue: ticketData.queue,
        tags: ticketData.tags || []
      });

      await ticket.save();
      
      if (ticket && ticket._id) {
        return await this.getTicketById(ticket._id.toString());
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get all tickets with filtering and pagination
   */
  async getTickets(filters: {
    status?: string | string[];
    priority?: string | string[];
    queue?: string;
    assignee?: string;
    customer?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ tickets: ITicket[]; total: number; page: number; pages: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      // Filter by status
      if (filters.status) {
        query.status = Array.isArray(filters.status)
          ? { $in: filters.status }
          : filters.status;
      }

      // Filter by priority
      if (filters.priority) {
        query.priority = Array.isArray(filters.priority)
          ? { $in: filters.priority }
          : filters.priority;
      }

      // Filter by queue
      if (filters.queue) {
        query.queue = filters.queue;
      }

      // Filter by assignee
      if (filters.assignee) {
        query.assignee = filters.assignee;
      }

      // Filter by customer
      if (filters.customer) {
        query.customer = filters.customer;
      }

      // Search by title or description
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Get total count
      const total = await Ticket.countDocuments(query);

      // Get tickets with pagination
      const tickets = await Ticket.find(query)
        .populate('customer', 'name email')
        .populate('assignee', 'name email')
        .populate('queue', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        tickets,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<ITicket> {
    try {
      const ticket = await Ticket.findById(ticketId)
        .populate('customer', 'name email')
        .populate('assignee', 'name email')
        .populate('queue', 'name')
        .populate('comments.author', 'name email');

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      return ticket;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: string, ticketData: Partial<ITicket>): Promise<ITicket> {
    try {
      // Don't allow updating comments through this method
      if (ticketData.comments) {
        delete ticketData.comments;
      }

      // Handle status transitions
      if (ticketData.status) {
        const currentTicket = await Ticket.findById(ticketId);
        if (!currentTicket) {
          throw new Error('Ticket not found');
        }

        // Set resolved timestamp when status changes to resolved
        if (ticketData.status === 'resolved' && currentTicket.status !== 'resolved') {
          ticketData.resolvedAt = new Date();
        }

        // Set closed timestamp when status changes to closed
        if (ticketData.status === 'closed' && currentTicket.status !== 'closed') {
          ticketData.closedAt = new Date();
        }
      }

      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $set: ticketData },
        { new: true }
      )
        .populate('customer', 'name email')
        .populate('assignee', 'name email')
        .populate('queue', 'name')
        .populate('comments.author', 'name email');

      if (!updatedTicket) {
        throw new Error('Ticket not found');
      }

      return updatedTicket;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(
    ticketId: string,
    comment: {
      content: string;
      author: string;
      isInternal?: boolean;
    }
  ): Promise<ITicket> {
    try {
      const commentData: IComment = {
        content: comment.content,
        author: new mongoose.Types.ObjectId(comment.author),
        isInternal: comment.isInternal || false,
        createdAt: new Date()
      };

      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $push: { comments: commentData } },
        { new: true }
      )
        .populate('customer', 'name email')
        .populate('assignee', 'name email')
        .populate('queue', 'name')
        .populate('comments.author', 'name email');

      if (!updatedTicket) {
        throw new Error('Ticket not found');
      }

      return updatedTicket;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Assign ticket to an agent
   */
  async assignTicket(
    ticketId: string,
    assigneeId: string
  ): Promise<ITicket> {
    try {
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { 
          $set: { 
            assignee: assigneeId,
            // If the ticket is new, update status to open when assigned
            status: { $cond: [{ $eq: ["$status", "new"] }, "open", "$status"] }
          } 
        },
        { new: true }
      )
        .populate('customer', 'name email')
        .populate('assignee', 'name email')
        .populate('queue', 'name')
        .populate('comments.author', 'name email');

      if (!updatedTicket) {
        throw new Error('Ticket not found');
      }

      return updatedTicket;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Move ticket to another queue
   */
  async moveToQueue(
    ticketId: string,
    queueId: string
  ): Promise<ITicket> {
    try {
      // Verify queue exists
      await this.queueService.getQueueById(queueId);

      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $set: { queue: queueId } },
        { new: true }
      )
        .populate('customer', 'name email')
        .populate('assignee', 'name email')
        .populate('queue', 'name')
        .populate('comments.author', 'name email');

      if (!updatedTicket) {
        throw new Error('Ticket not found');
      }

      return updatedTicket;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}