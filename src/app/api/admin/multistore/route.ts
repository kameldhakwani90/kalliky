import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SimpleStoreQueueManager } from '@/lib/queue/SimpleStoreQueueManager';
import { Phase1CacheManager } from '@/lib/cache/Phase1CacheManager';
import { WebhookRouter } from '@/lib/routing/WebhookRouter';
import { MultiStoreManager } from '@/services/MultiStoreManager';

const prisma = new PrismaClient();

// Configuration
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

const cacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultTTL: 3600
};

// Instances globales
let multiStoreManager: MultiStoreManager;

function getMultiStoreManager() {
  if (!multiStoreManager) {
    const queueManager = new SimpleStoreQueueManager(queueConfig);
    const cacheManager = new Phase1CacheManager(cacheConfig);
    const webhookRouter = new WebhookRouter(prisma, queueManager);
    
    multiStoreManager = new MultiStoreManager(
      prisma,
      queueManager,
      cacheManager,
      webhookRouter
    );
  }
  return multiStoreManager;
}

// GET - Obtenir le statut du système multi-boutiques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const storeId = searchParams.get('storeId');
    const date = searchParams.get('date');

    const manager = getMultiStoreManager();

    switch (action) {
      case 'status':
        if (storeId) {
          const status = await manager.getStoreStatus(storeId);
          return NextResponse.json({ success: true, status });
        } else {
          const allStatuses = await manager.getAllStoresStatus();
          return NextResponse.json({ success: true, stores: allStatuses });
        }

      case 'metrics':
        const metrics = await manager.getMetrics(storeId || undefined, date || undefined);
        return NextResponse.json({ success: true, metrics });

      case 'report':
        const report = await manager.generateDailyReport(date || undefined);
        return NextResponse.json({ success: true, report });

      default:
        // Status général par défaut
        const generalStatus = await manager.getAllStoresStatus();
        return NextResponse.json({
          success: true,
          system: {
            timestamp: new Date().toISOString(),
            totalStores: generalStatus.length,
            activeStores: generalStatus.filter(s => s.initialized).length,
            version: '1.0.0-phase1'
          },
          stores: generalStatus
        });
    }

  } catch (error) {
    console.error('Error in multistore admin GET:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get multistore information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Initialiser ou configurer des stores
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, storeId, config } = body;

    const manager = getMultiStoreManager();

    switch (action) {
      case 'initialize_store':
        if (!storeId) {
          return NextResponse.json(
            { success: false, error: 'storeId is required' },
            { status: 400 }
          );
        }

        const initialized = await manager.initializeStore(storeId);
        return NextResponse.json({
          success: initialized,
          message: initialized 
            ? `Store ${storeId} initialized successfully`
            : `Failed to initialize store ${storeId}`,
          storeId
        });

      case 'initialize_all':
        const result = await manager.initializeAllActiveStores();
        return NextResponse.json({
          success: true,
          message: 'Bulk initialization completed',
          result
        });

      case 'update_config':
        if (!storeId || !config) {
          return NextResponse.json(
            { success: false, error: 'storeId and config are required' },
            { status: 400 }
          );
        }

        const updated = await manager.updateStoreConfiguration(storeId, config);
        return NextResponse.json({
          success: updated,
          message: updated 
            ? `Store ${storeId} configuration updated`
            : `Failed to update store ${storeId} configuration`,
          storeId
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in multistore admin POST:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to execute action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour la configuration d'un store
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const body = await request.json();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'storeId parameter is required' },
        { status: 400 }
      );
    }

    const manager = getMultiStoreManager();
    const updated = await manager.updateStoreConfiguration(storeId, body);

    return NextResponse.json({
      success: updated,
      message: updated 
        ? 'Store configuration updated successfully'
        : 'Failed to update store configuration',
      storeId,
      updatedFields: Object.keys(body)
    });

  } catch (error) {
    console.error('Error in multistore admin PUT:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update store configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Désactiver un store
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'storeId parameter is required' },
        { status: 400 }
      );
    }

    const manager = getMultiStoreManager();
    const deactivated = await manager.deactivateStore(storeId);

    return NextResponse.json({
      success: deactivated,
      message: deactivated 
        ? 'Store deactivated successfully'
        : 'Failed to deactivate store',
      storeId
    });

  } catch (error) {
    console.error('Error in multistore admin DELETE:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to deactivate store',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}