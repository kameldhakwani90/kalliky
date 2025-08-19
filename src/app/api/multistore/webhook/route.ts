import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SimpleStoreQueueManager } from '@/lib/queue/SimpleStoreQueueManager';
import { Phase1CacheManager } from '@/lib/cache/Phase1CacheManager';
import { WebhookRouter } from '@/lib/routing/WebhookRouter';

const prisma = new PrismaClient();

// Configuration pour le queue manager
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
};

// Configuration pour le cache manager
const cacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultTTL: 3600 // 1 hour
};

// Instances globales (en production, utiliser un singleton pattern)
let queueManager: SimpleStoreQueueManager;
let cacheManager: Phase1CacheManager;
let webhookRouter: WebhookRouter;

// Initialisation lazy
function getInstances() {
  if (!queueManager) {
    queueManager = new SimpleStoreQueueManager(queueConfig);
    cacheManager = new Phase1CacheManager(cacheConfig);
    webhookRouter = new WebhookRouter(prisma, queueManager);
  }
  return { queueManager, cacheManager, webhookRouter };
}

export async function POST(request: NextRequest) {
  try {
    const { webhookRouter } = getInstances();
    
    // Parse le payload webhook
    const payload = await request.json();
    
    // Valider le payload
    if (!payload.from || !payload.to) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to' },
        { status: 400 }
      );
    }

    // Router le webhook vers le bon business/store
    const routeResult = await webhookRouter.routeWebhook({
      from: payload.from,
      to: payload.to,
      body: payload.body,
      timestamp: payload.timestamp || new Date().toISOString(),
      type: payload.type || 'call',
      metadata: payload.metadata
    });

    // Gérer le résultat du routage
    if (!routeResult.success) {
      return await handleRoutingFailure(routeResult);
    }

    // Succès - retourner les informations de routage
    return NextResponse.json({
      success: true,
      message: 'Webhook routed successfully',
      storeId: routeResult.storeId,
      businessId: routeResult.businessId,
      action: routeResult.action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    );
  }
}

async function handleRoutingFailure(routeResult: any): Promise<NextResponse> {
  const { action, error, storeId, businessId } = routeResult;

  switch (action) {
    case 'log_unknown_number':
      // Log le numéro inconnu pour investigation
      console.warn('Unknown phone number:', routeResult);
      return NextResponse.json({
        success: false,
        error: 'Phone number not registered',
        action: 'number_not_found'
      }, { status: 404 });

    case 'send_service_unavailable':
      // Le service est indisponible
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable',
        action: 'service_unavailable',
        storeId,
        businessId
      }, { status: 503 });

    case 'send_busy_message':
      // Capacité dépassée
      return NextResponse.json({
        success: false,
        error: 'All operators are busy, please try again later',
        action: 'capacity_exceeded',
        storeId,
        businessId
      }, { status: 503 });

    case 'initialize_queue_and_retry':
      // Tenter d'initialiser la queue et réessayer
      try {
        await initializeStoreQueueIfNeeded(storeId);
        return NextResponse.json({
          success: false,
          error: 'Queue initialized, please retry',
          action: 'retry_after_init',
          storeId,
          businessId
        }, { status: 503 });
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Failed to initialize queue',
          action: 'init_failed',
          storeId,
          businessId
        }, { status: 500 });
      }

    default:
      return NextResponse.json({
        success: false,
        error: error || 'Unknown routing error',
        action: action || 'unknown_error',
        storeId,
        businessId
      }, { status: 500 });
  }
}

async function initializeStoreQueueIfNeeded(storeId: string): Promise<void> {
  if (!storeId) return;

  const { queueManager } = getInstances();
  
  // Récupérer les informations du store
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      subscription: true
    }
  });

  if (!store || !store.subscription) {
    throw new Error('Store or subscription not found');
  }

  // Déterminer les quotas basés sur le plan
  const quota = getQuotaByPlan(store.subscription.plan);
  
  // Initialiser la queue
  await queueManager.initializeStoreQueue(storeId, quota);
}

function getQuotaByPlan(plan: string): { maxConcurrentCalls: number; maxQueueSize: number; plan: 'STARTER' | 'PRO' | 'BUSINESS' } {
  switch (plan) {
    case 'PRO':
      return {
        maxConcurrentCalls: 3,
        maxQueueSize: 20,
        plan: 'PRO'
      };
    case 'BUSINESS':
      return {
        maxConcurrentCalls: 5,
        maxQueueSize: 50,
        plan: 'BUSINESS'
      };
    case 'STARTER':
    default:
      return {
        maxConcurrentCalls: 1,
        maxQueueSize: 10,
        plan: 'STARTER'
      };
  }
}

// Endpoint pour obtenir le statut d'un store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId parameter is required' },
        { status: 400 }
      );
    }

    const { queueManager } = getInstances();
    
    // Obtenir le statut du store
    const status = await queueManager.getStoreStatus(storeId);
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting store status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get store status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint pour configurer les règles de redirection d'un store
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const body = await request.json();

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId parameter is required' },
        { status: 400 }
      );
    }

    if (!body.redirectionRules || !Array.isArray(body.redirectionRules)) {
      return NextResponse.json(
        { error: 'redirectionRules array is required' },
        { status: 400 }
      );
    }

    const { queueManager } = getInstances();
    
    // Configurer les règles de redirection
    await queueManager.setRedirectionRules(storeId, body.redirectionRules);
    
    return NextResponse.json({
      success: true,
      message: 'Redirection rules updated successfully',
      storeId,
      rulesCount: body.redirectionRules.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating redirection rules:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update redirection rules',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}