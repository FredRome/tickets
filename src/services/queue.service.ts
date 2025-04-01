import Queue, { IQueue } from '../models/queue.model';

export class QueueService {
  /**
   * Create a new queue
   */
  async createQueue(queueData: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<IQueue> {
    try {
      // If this queue is set as default, unset any existing default queue
      if (queueData.isDefault) {
        await Queue.updateMany(
          { isDefault: true },
          { $set: { isDefault: false } }
        );
      }

      const queue = new Queue(queueData);
      await queue.save();
      
      return queue;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get all queues
   */
  async getAllQueues(): Promise<IQueue[]> {
    try {
      return await Queue.find().sort({ name: 1 });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get queue by ID
   */
  async getQueueById(queueId: string): Promise<IQueue> {
    try {
      const queue = await Queue.findById(queueId);
      
      if (!queue) {
        throw new Error('Queue not found');
      }
      
      return queue;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Update queue
   */
  async updateQueue(
    queueId: string,
    queueData: {
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ): Promise<IQueue> {
    try {
      // If this queue is being set as default, unset any existing default queue
      if (queueData.isDefault) {
        await Queue.updateMany(
          { isDefault: true },
          { $set: { isDefault: false } }
        );
      }

      const updatedQueue = await Queue.findByIdAndUpdate(
        queueId,
        { $set: queueData },
        { new: true }
      );
      
      if (!updatedQueue) {
        throw new Error('Queue not found');
      }
      
      return updatedQueue;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Delete queue
   */
  async deleteQueue(queueId: string): Promise<{ success: boolean; message: string }> {
    try {
      const queue = await this.getQueueById(queueId);
      
      if (queue.isDefault) {
        throw new Error('Cannot delete the default queue');
      }
      
      await Queue.findByIdAndDelete(queueId);
      
      return { success: true, message: 'Queue deleted successfully' };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get default queue
   */
  async getDefaultQueue(): Promise<IQueue> {
    try {
      const defaultQueue = await Queue.findOne({ isDefault: true });
      
      if (!defaultQueue) {
        throw new Error('No default queue found');
      }
      
      return defaultQueue;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}