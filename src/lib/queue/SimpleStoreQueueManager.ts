import Queue from 'bull';
import Redis from 'ioredis';

interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
}

interface StoreQuota {
  maxConcurrentCalls: number;
  maxQueueSize: number;
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
}

export interface CallIntent {
  type: 'ORDER' | 'COMPLAINT' | 'INFO' | 'RESERVATION';
  confidence: number;
  data: any;
}

export interface RedirectionRule {
  condition: string;
  action: 'REDIRECT_MANAGER' | 'REDIRECT_SERVICE' | 'QUEUE_PRIORITY';
  value?: string;
}

export class SimpleStoreQueueManager {
  private queues: Map<string, Queue.Queue> = new Map();
  private redis: Redis;
  private config: QueueConfig;

  constructor(config: QueueConfig) {
    this.config = config;
    this.redis = new Redis(config.redis);
  }

  async initializeStoreQueue(storeId: string, quota: StoreQuota): Promise<void> {
    const queueName = `kalliky-queue-${storeId}`;
    
    const queue = new Queue(queueName, {
      redis: this.config.redis,
      defaultJobOptions: this.config.defaultJobOptions
    });

    // Configure workers based on subscription plan
    const workerCount = this.getWorkerCount(quota.plan);
    
    queue.process('call-processing', workerCount, async (job) => {
      return this.processCall(storeId, job.data);
    });

    this.queues.set(storeId, queue);
    
    // Store quota in Redis for capacity checking
    await this.redis.hset(`store:${storeId}:config`, {
      maxConcurrentCalls: quota.maxConcurrentCalls,
      maxQueueSize: quota.maxQueueSize,
      plan: quota.plan
    });
  }

  async addCallToQueue(storeId: string, callData: any): Promise<{ success: boolean; reason?: string }> {
    const queue = this.queues.get(storeId);
    if (!queue) {
      return { success: false, reason: 'Store queue not initialized' };
    }

    // Check capacity
    const canAccept = await this.checkCapacity(storeId);
    if (!canAccept) {
      return { success: false, reason: 'Store capacity exceeded' };
    }

    // Detect intent and apply redirection rules
    const intent = await this.detectIntent(callData);
    const redirection = await this.checkRedirectionRules(storeId, intent, callData);

    if (redirection.shouldRedirect) {
      return { success: false, reason: redirection.redirectTo };
    }

    // Add to queue with priority based on intent
    const priority = this.getPriority(intent);
    await queue.add('call-processing', { ...callData, intent }, { priority });

    return { success: true };
  }

  private async processCall(storeId: string, callData: any): Promise<any> {
    // Increment active calls counter
    await this.redis.incr(`store:${storeId}:active_calls`);
    
    try {
      // Process the call based on intent
      const result = await this.handleCallByIntent(storeId, callData);
      
      // Update metrics
      await this.updateMetrics(storeId, callData.intent, 'completed');
      
      return result;
    } catch (error) {
      await this.updateMetrics(storeId, callData.intent, 'failed');
      throw error;
    } finally {
      // Decrement active calls counter
      await this.redis.decr(`store:${storeId}:active_calls`);
    }
  }

  private async detectIntent(callData: any): Promise<CallIntent> {
    // Simple intent detection based on keywords and context
    const text = callData.transcript?.toLowerCase() || '';
    
    if (text.includes('commander') || text.includes('commande') || text.includes('acheter')) {
      return { type: 'ORDER', confidence: 0.8, data: callData };
    }
    
    if (text.includes('réserver') || text.includes('réservation') || text.includes('table')) {
      return { type: 'RESERVATION', confidence: 0.8, data: callData };
    }
    
    if (text.includes('problème') || text.includes('réclamation') || text.includes('insatisfait')) {
      return { type: 'COMPLAINT', confidence: 0.8, data: callData };
    }
    
    return { type: 'INFO', confidence: 0.6, data: callData };
  }

  private async checkRedirectionRules(storeId: string, intent: CallIntent, callData: any): Promise<{ shouldRedirect: boolean; redirectTo?: string }> {
    const rules = await this.getRedirectionRules(storeId);
    
    for (const rule of rules) {
      if (this.evaluateCondition(rule.condition, intent, callData)) {
        return { shouldRedirect: true, redirectTo: rule.value };
      }
    }
    
    return { shouldRedirect: false };
  }

  private evaluateCondition(condition: string, intent: CallIntent, callData: any): boolean {
    // Example conditions:
    // "intent === 'ORDER' && totalAmount > 100"
    // "intent === 'RESERVATION' && groupSize > 8"
    
    try {
      const context = {
        intent: intent.type,
        totalAmount: callData.totalAmount || 0,
        groupSize: callData.groupSize || 1,
        isVIP: callData.customer?.status === 'VIP'
      };
      
      // Simple condition evaluation (in production, use a proper expression evaluator)
      return eval(condition.replace(/\w+/g, (match) => {
        return context.hasOwnProperty(match) ? `context.${match}` : match;
      }));
    } catch {
      return false;
    }
  }

  private async getRedirectionRules(storeId: string): Promise<RedirectionRule[]> {
    const rulesJson = await this.redis.get(`store:${storeId}:redirection_rules`);
    return rulesJson ? JSON.parse(rulesJson) : [];
  }

  private async checkCapacity(storeId: string): Promise<boolean> {
    const config = await this.redis.hgetall(`store:${storeId}:config`);
    const activeCalls = await this.redis.get(`store:${storeId}:active_calls`) || '0';
    const queueSize = await this.getQueueSize(storeId);
    
    return parseInt(activeCalls) < parseInt(config.maxConcurrentCalls) && 
           queueSize < parseInt(config.maxQueueSize);
  }

  private async getQueueSize(storeId: string): Promise<number> {
    const queue = this.queues.get(storeId);
    return queue ? await queue.count() : 0;
  }

  private getWorkerCount(plan: string): number {
    switch (plan) {
      case 'STARTER': return 1;
      case 'PRO': return 2;
      case 'BUSINESS': return 3;
      default: return 1;
    }
  }

  private getPriority(intent: CallIntent): number {
    switch (intent.type) {
      case 'COMPLAINT': return 1; // Highest priority
      case 'ORDER': return 2;
      case 'RESERVATION': return 3;
      case 'INFO': return 4; // Lowest priority
      default: return 5;
    }
  }

  private async handleCallByIntent(storeId: string, callData: any): Promise<any> {
    switch (callData.intent.type) {
      case 'ORDER':
        return this.processOrder(storeId, callData);
      case 'RESERVATION':
        return this.processReservation(storeId, callData);
      case 'COMPLAINT':
        return this.processComplaint(storeId, callData);
      case 'INFO':
        return this.processInformation(storeId, callData);
      default:
        return this.processGeneral(storeId, callData);
    }
  }

  private async processOrder(storeId: string, callData: any): Promise<any> {
    // Order processing logic
    return { type: 'order', processed: true, storeId };
  }

  private async processReservation(storeId: string, callData: any): Promise<any> {
    // Reservation processing logic
    return { type: 'reservation', processed: true, storeId };
  }

  private async processComplaint(storeId: string, callData: any): Promise<any> {
    // Complaint processing logic
    return { type: 'complaint', processed: true, storeId };
  }

  private async processInformation(storeId: string, callData: any): Promise<any> {
    // Information processing logic
    return { type: 'information', processed: true, storeId };
  }

  private async processGeneral(storeId: string, callData: any): Promise<any> {
    // General processing logic
    return { type: 'general', processed: true, storeId };
  }

  private async updateMetrics(storeId: string, intent: string, status: string): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `store:${storeId}:metrics:${timestamp}`;
    
    await this.redis.hincrby(key, `${intent.toLowerCase()}_${status}`, 1);
    await this.redis.hincrby(key, 'total_calls', 1);
    await this.redis.expire(key, 86400 * 30); // Keep for 30 days
  }

  async getStoreMetrics(storeId: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const key = `store:${storeId}:metrics:${targetDate}`;
    
    return await this.redis.hgetall(key);
  }

  async setRedirectionRules(storeId: string, rules: RedirectionRule[]): Promise<void> {
    await this.redis.set(`store:${storeId}:redirection_rules`, JSON.stringify(rules));
  }

  async getStoreStatus(storeId: string): Promise<any> {
    const config = await this.redis.hgetall(`store:${storeId}:config`);
    const activeCalls = await this.redis.get(`store:${storeId}:active_calls`) || '0';
    const queueSize = await this.getQueueSize(storeId);
    const metrics = await this.getStoreMetrics(storeId);
    
    return {
      storeId,
      activeCalls: parseInt(activeCalls),
      queueSize,
      maxConcurrentCalls: parseInt(config.maxConcurrentCalls || '1'),
      maxQueueSize: parseInt(config.maxQueueSize || '10'),
      plan: config.plan,
      metrics
    };
  }

  async cleanup(): Promise<void> {
    for (const [storeId, queue] of this.queues.entries()) {
      await queue.close();
    }
    await this.redis.disconnect();
  }
}