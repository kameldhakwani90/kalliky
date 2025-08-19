// ============================================================================
// RATE LIMITER - Protection APIs contre abuse et attaques DDoS
// ============================================================================

import { redisService } from './redis';
import { NextRequest } from 'next/server';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class RateLimiter {
  
  /**
   * Vérifie si une clé respecte le rate limit
   */
  static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number = 60000 // 1 minute par défaut
  ): Promise<RateLimitResult> {
    try {
      await redisService.connect();
      
      const now = Date.now();
      const windowStart = now - windowMs;
      const redisKey = `rate_limit:${key}`;
      
      // Nettoyer les entrées expirées et compter les requêtes actuelles
      await redisService.client.zRemRangeByScore(redisKey, 0, windowStart);
      const current = await redisService.client.zCard(redisKey);
      
      if (current >= limit) {
        // Rate limit dépassé
        const oldestEntry = await redisService.client.zRange(redisKey, 0, 0, { withScores: true });
        const resetTime = oldestEntry.length > 0 
          ? new Date(Number(oldestEntry[0].score) + windowMs)
          : new Date(now + windowMs);
          
        return {
          success: false,
          limit,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime.getTime() - now) / 1000)
        };
      }
      
      // Ajouter la requête actuelle
      await redisService.client.zAdd(redisKey, { score: now, value: `${now}-${Math.random()}` });
      await redisService.client.expire(redisKey, Math.ceil(windowMs / 1000));
      
      return {
        success: true,
        limit,
        remaining: limit - current - 1,
        resetTime: new Date(now + windowMs)
      };
      
    } catch (error) {
      console.error('Rate limiter error:', error);
      // En cas d'erreur Redis, on laisse passer pour éviter de bloquer le service
      return {
        success: true,
        limit,
        remaining: limit,
        resetTime: new Date(Date.now() + windowMs)
      };
    }
  }
  
  /**
   * Rate limiting par IP
   */
  static async checkIPRateLimit(
    request: NextRequest,
    limit: number,
    windowMs: number = 60000
  ): Promise<RateLimitResult> {
    const ip = this.getClientIP(request);
    return this.checkRateLimit(`ip:${ip}`, limit, windowMs);
  }
  
  /**
   * Rate limiting par utilisateur
   */
  static async checkUserRateLimit(
    userId: string,
    limit: number,
    windowMs: number = 60000
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(`user:${userId}`, limit, windowMs);
  }
  
  /**
   * Rate limiting par endpoint
   */
  static async checkEndpointRateLimit(
    request: NextRequest,
    endpoint: string,
    limit: number,
    windowMs: number = 60000
  ): Promise<RateLimitResult> {
    const ip = this.getClientIP(request);
    return this.checkRateLimit(`endpoint:${endpoint}:${ip}`, limit, windowMs);
  }
  
  /**
   * Récupère l'IP du client
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = request.ip;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP.trim();
    }
    
    return ip || '127.0.0.1';
  }
}

// ============================================================================
// PRESETS RATE LIMITING PER ENDPOINT
// ============================================================================

export const RateLimitPresets = {
  // Authentification
  LOGIN: { limit: 5, window: 60000 }, // 5 tentatives/min
  REGISTER: { limit: 3, window: 300000 }, // 3 inscriptions/5min
  
  // APIs critiques
  PASSWORD_RESET: { limit: 3, window: 600000 }, // 3/10min
  
  // Webhooks
  WEBHOOK_STRIPE: { limit: 100, window: 60000 }, // 100/min
  WEBHOOK_TELNYX: { limit: 200, window: 60000 }, // 200/min
  
  // IA
  AI_ANALYSIS: { limit: 20, window: 60000 }, // 20/min
  AI_MENU_UPLOAD: { limit: 5, window: 300000 }, // 5/5min
  
  // APIs générales
  API_DEFAULT: { limit: 100, window: 60000 }, // 100/min
  API_HEAVY: { limit: 10, window: 60000 }, // 10/min pour APIs lourdes
} as const;

// ============================================================================
// MIDDLEWARE RATE LIMITING
// ============================================================================

export async function rateLimitMiddleware(
  request: NextRequest,
  preset: keyof typeof RateLimitPresets,
  customKey?: string
): Promise<{ success: boolean; headers: Record<string, string> }> {
  
  const config = RateLimitPresets[preset];
  const key = customKey || `${preset}:${RateLimiter.getClientIP(request)}`;
  
  const result = await RateLimiter.checkRateLimit(key, config.limit, config.window);
  
  const headers = {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toISOString(),
  };
  
  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return { success: result.success, headers };
}

// ============================================================================
// HELPERS SPÉCIALISÉS
// ============================================================================

/**
 * Rate limiting pour les actions sensibles (par user + IP)
 */
export async function sensitiveActionRateLimit(
  request: NextRequest,
  userId: string,
  action: string,
  limit: number = 5,
  windowMs: number = 300000 // 5 minutes
): Promise<RateLimitResult> {
  const ip = RateLimiter.getClientIP(request);
  const key = `sensitive:${action}:${userId}:${ip}`;
  return RateLimiter.checkRateLimit(key, limit, windowMs);
}

/**
 * Rate limiting pour les uploads de fichiers
 */
export async function fileUploadRateLimit(
  request: NextRequest,
  userId: string,
  fileType: string = 'general'
): Promise<RateLimitResult> {
  const key = `upload:${fileType}:${userId}`;
  return RateLimiter.checkRateLimit(key, 10, 600000); // 10 uploads/10min
}

/**
 * Nettoyage périodique des clés expirées
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    await redisService.connect();
    
    const pattern = 'rate_limit:*';
    const keys = await redisService.client.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await redisService.client.ttl(key);
      if (ttl <= 0) {
        await redisService.client.del(key);
        cleaned++;
      }
    }
    
    console.log(`🧹 Nettoyé ${cleaned} rate limits expirés sur ${keys.length}`);
    
  } catch (error) {
    console.error('Erreur nettoyage rate limits:', error);
  }
}