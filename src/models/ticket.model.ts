import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IQueue } from './queue.model';

export interface IComment {
  content: string;
  author: mongoose.Types.ObjectId | IUser;
  isInternal: boolean;
  createdAt: Date;
}

export interface ITicket extends Document {
  title: string;
  description: string;
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer: mongoose.Types.ObjectId | IUser;
  assignee?: mongoose.Types.ObjectId | IUser;
  queue: mongoose.Types.ObjectId | IQueue;
  comments: IComment[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

const CommentSchema: Schema = new Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TicketSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'open', 'pending', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  queue: {
    type: Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  comments: [CommentSchema],
  tags: [String],
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

export default mongoose.model<ITicket>('Ticket', TicketSchema);