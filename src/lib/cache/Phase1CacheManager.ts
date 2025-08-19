import Redis from 'ioredis';

interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultTTL: number;
}

export class Phase1CacheManager {
  private redis: Redis;
  private defaultTTL: number;

  constructor(config: CacheConfig) {
    this.redis = new Redis(config.redis);
    this.defaultTTL = config.defaultTTL;
  }

  // Store-specific cache operations with automatic namespacing
  async setStoreData(storeId: string, key: string, value: any, ttl?: number): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, key);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl || this.defaultTTL) {
      await this.redis.setex(namespacedKey, ttl || this.defaultTTL, stringValue);
    } else {
      await this.redis.set(namespacedKey, stringValue);
    }
  }

  async getStoreData<T = any>(storeId: string, key: string): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(storeId, key);
    const value = await this.redis.get(namespacedKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  async deleteStoreData(storeId: string, key: string): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, key);
    await this.redis.del(namespacedKey);
  }

  async hasStoreData(storeId: string, key: string): Promise<boolean> {
    const namespacedKey = this.getNamespacedKey(storeId, key);
    return (await this.redis.exists(namespacedKey)) === 1;
  }

  // Store-specific hash operations
  async setStoreHash(storeId: string, hashKey: string, field: string, value: any): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, hashKey);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.hset(namespacedKey, field, stringValue);
  }

  async getStoreHash<T = any>(storeId: string, hashKey: string, field: string): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(storeId, hashKey);
    const value = await this.redis.hget(namespacedKey, field);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  async getAllStoreHash<T = any>(storeId: string, hashKey: string): Promise<Record<string, T>> {
    const namespacedKey = this.getNamespacedKey(storeId, hashKey);
    const hash = await this.redis.hgetall(namespacedKey);
    
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value as T;
      }
    }
    
    return result;
  }

  async deleteStoreHash(storeId: string, hashKey: string, field: string): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, hashKey);
    await this.redis.hdel(namespacedKey, field);
  }

  // Store-specific list operations
  async pushToStoreList(storeId: string, listKey: string, ...values: any[]): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, listKey);
    const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    await this.redis.lpush(namespacedKey, ...stringValues);
  }

  async popFromStoreList<T = any>(storeId: string, listKey: string): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(storeId, listKey);
    const value = await this.redis.rpop(namespacedKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  async getStoreListLength(storeId: string, listKey: string): Promise<number> {
    const namespacedKey = this.getNamespacedKey(storeId, listKey);
    return await this.redis.llen(namespacedKey);
  }

  async getStoreListRange<T = any>(storeId: string, listKey: string, start: number, stop: number): Promise<T[]> {
    const namespacedKey = this.getNamespacedKey(storeId, listKey);
    const values = await this.redis.lrange(namespacedKey, start, stop);
    
    return values.map(value => {
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    });
  }

  // Store-specific set operations
  async addToStoreSet(storeId: string, setKey: string, ...values: any[]): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, setKey);
    const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    await this.redis.sadd(namespacedKey, ...stringValues);
  }

  async removeFromStoreSet(storeId: string, setKey: string, ...values: any[]): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, setKey);
    const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    await this.redis.srem(namespacedKey, ...stringValues);
  }

  async isInStoreSet(storeId: string, setKey: string, value: any): Promise<boolean> {
    const namespacedKey = this.getNamespacedKey(storeId, setKey);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return (await this.redis.sismember(namespacedKey, stringValue)) === 1;
  }

  async getStoreSetMembers<T = any>(storeId: string, setKey: string): Promise<T[]> {
    const namespacedKey = this.getNamespacedKey(storeId, setKey);
    const values = await this.redis.smembers(namespacedKey);
    
    return values.map(value => {
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    });
  }

  // Customer-specific cache (with store isolation)
  async setCustomerData(storeId: string, customerId: string, key: string, value: any, ttl?: number): Promise<void> {
    await this.setStoreData(storeId, `customer:${customerId}:${key}`, value, ttl);
  }

  async getCustomerData<T = any>(storeId: string, customerId: string, key: string): Promise<T | null> {
    return await this.getStoreData<T>(storeId, `customer:${customerId}:${key}`);
  }

  async deleteCustomerData(storeId: string, customerId: string, key: string): Promise<void> {
    await this.deleteStoreData(storeId, `customer:${customerId}:${key}`);
  }

  // Order-specific cache (with store isolation)
  async setOrderData(storeId: string, orderId: string, key: string, value: any, ttl?: number): Promise<void> {
    await this.setStoreData(storeId, `order:${orderId}:${key}`, value, ttl);
  }

  async getOrderData<T = any>(storeId: string, orderId: string, key: string): Promise<T | null> {
    return await this.getStoreData<T>(storeId, `order:${orderId}:${key}`);
  }

  async deleteOrderData(storeId: string, orderId: string, key: string): Promise<void> {
    await this.deleteStoreData(storeId, `order:${orderId}:${key}`);
  }

  // Session management (with store isolation)
  async setSession(storeId: string, sessionId: string, sessionData: any, ttl?: number): Promise<void> {
    await this.setStoreData(storeId, `session:${sessionId}`, sessionData, ttl || 3600); // 1 hour default
  }

  async getSession<T = any>(storeId: string, sessionId: string): Promise<T | null> {
    return await this.getStoreData<T>(storeId, `session:${sessionId}`);
  }

  async deleteSession(storeId: string, sessionId: string): Promise<void> {
    await this.deleteStoreData(storeId, `session:${sessionId}`);
  }

  async refreshSession(storeId: string, sessionId: string, ttl: number = 3600): Promise<void> {
    const namespacedKey = this.getNamespacedKey(storeId, `session:${sessionId}`);
    await this.redis.expire(namespacedKey, ttl);
  }

  // Product recommendations cache (with store isolation)
  async setProductRecommendations(storeId: string, customerId: string, recommendations: any[], ttl?: number): Promise<void> {
    await this.setCustomerData(storeId, customerId, 'recommendations', recommendations, ttl || 1800); // 30 minutes default
  }

  async getProductRecommendations<T = any>(storeId: string, customerId: string): Promise<T[] | null> {
    return await this.getCustomerData<T[]>(storeId, customerId, 'recommendations');
  }

  // Menu cache (with store isolation)
  async setStoreMenu(storeId: string, menu: any, ttl?: number): Promise<void> {
    await this.setStoreData(storeId, 'menu', menu, ttl || 3600); // 1 hour default
  }

  async getStoreMenu<T = any>(storeId: string): Promise<T | null> {
    return await this.getStoreData<T>(storeId, 'menu');
  }

  async invalidateStoreMenu(storeId: string): Promise<void> {
    await this.deleteStoreData(storeId, 'menu');
  }

  // Analytics cache (with store isolation)
  async cacheAnalytics(storeId: string, analyticsType: string, data: any, ttl?: number): Promise<void> {
    await this.setStoreData(storeId, `analytics:${analyticsType}`, data, ttl || 1800); // 30 minutes default
  }

  async getCachedAnalytics<T = any>(storeId: string, analyticsType: string): Promise<T | null> {
    return await this.getStoreData<T>(storeId, `analytics:${analyticsType}`);
  }

  // Store configuration cache
  async setStoreConfig(storeId: string, config: any, ttl?: number): Promise<void> {
    await this.setStoreData(storeId, 'config', config, ttl || 7200); // 2 hours default
  }

  async getStoreConfig<T = any>(storeId: string): Promise<T | null> {
    return await this.getStoreData<T>(storeId, 'config');
  }

  async invalidateStoreConfig(storeId: string): Promise<void> {
    await this.deleteStoreData(storeId, 'config');
  }

  // Utility methods
  private getNamespacedKey(storeId: string, key: string): string {
    return `store:${storeId}:${key}`;
  }

  async getStoreKeys(storeId: string, pattern?: string): Promise<string[]> {
    const searchPattern = pattern 
      ? `store:${storeId}:${pattern}` 
      : `store:${storeId}:*`;
    
    const keys = await this.redis.keys(searchPattern);
    return keys.map(key => key.replace(`store:${storeId}:`, ''));
  }

  async clearStoreCache(storeId: string): Promise<void> {
    const keys = await this.redis.keys(`store:${storeId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getStoreInfo(storeId: string): Promise<any> {
    const keys = await this.getStoreKeys(storeId);
    const info = {
      storeId,
      totalKeys: keys.length,
      keyTypes: {} as Record<string, number>
    };

    for (const key of keys) {
      const type = key.split(':')[0] || 'general';
      info.keyTypes[type] = (info.keyTypes[type] || 0) + 1;
    }

    return info;
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }
}