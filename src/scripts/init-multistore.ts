#!/usr/bin/env tsx

/**
 * Script d'initialisation du système multi-boutiques Kalliky AI Phase 1
 * 
 * Ce script configure automatiquement:
 * - Les queues Redis pour chaque store actif
 * - Le cache partitionné par store
 * - Les règles de redirection par défaut
 * - Les métriques de base
 */

import { PrismaClient } from '@prisma/client';
import { SimpleStoreQueueManager } from '../lib/queue/SimpleStoreQueueManager';
import { Phase1CacheManager } from '../lib/cache/Phase1CacheManager';
import { WebhookRouter } from '../lib/routing/WebhookRouter';
import { MultiStoreManager } from '../services/MultiStoreManager';

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

async function main() {
  console.log('🚀 Initialisation du système multi-boutiques Kalliky AI Phase 1\n');

  try {
    // 1. Initialiser les managers
    console.log('📊 Initialisation des managers...');
    const queueManager = new SimpleStoreQueueManager(queueConfig);
    const cacheManager = new Phase1CacheManager(cacheConfig);
    const webhookRouter = new WebhookRouter(prisma, queueManager);
    const multiStoreManager = new MultiStoreManager(
      prisma,
      queueManager,
      cacheManager,
      webhookRouter
    );

    // 2. Récupérer tous les stores actifs
    console.log('🏪 Récupération des stores actifs...');
    const activeStores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        business: {
          select: {
            id: true,
            name: true
          }
        },
        subscription: {
          select: {
            plan: true,
            status: true
          }
        }
      }
    });

    console.log(`   Trouvé ${activeStores.length} stores actifs\n`);

    // 3. Initialiser chaque store
    console.log('⚙️  Initialisation des stores...');
    let successCount = 0;
    let failureCount = 0;

    for (const store of activeStores) {
      try {
        console.log(`   • ${store.business.name} - ${store.name}`);
        
        // Initialiser le store
        const success = await multiStoreManager.initializeStore(store.id);
        
        if (success) {
          console.log(`     ✅ Initialisé (Plan: ${store.subscription?.plan || 'STARTER'})`);
          successCount++;
          
          // Configurer les règles de redirection par défaut
          await setupDefaultRedirectionRules(multiStoreManager, store.id);
          
          // Initialiser les métriques
          await initializeStoreMetrics(store.id);
          
        } else {
          console.log(`     ❌ Échec de l'initialisation`);
          failureCount++;
        }
      } catch (error) {
        console.log(`     ❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        failureCount++;
      }
    }

    console.log('\n📈 Résumé de l\'initialisation:');
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Échecs: ${failureCount}`);
    console.log(`   📊 Total: ${activeStores.length}`);

    // 4. Précharger le cache du router
    console.log('\n🔄 Préchargement du cache webhook router...');
    await webhookRouter.warmupCache();
    console.log('   ✅ Cache préchargé');

    // 5. Test de connectivité
    console.log('\n🧪 Test de connectivité...');
    await testConnectivity(multiStoreManager);

    // 6. Afficher les informations de démarrage
    console.log('\n📋 Informations système:');
    console.log(`   🗄️  Base de données: Connectée`);
    console.log(`   🔴 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
    console.log(`   🏪 Stores actifs: ${successCount}/${activeStores.length}`);
    console.log(`   🚀 Système: Prêt\n`);

    console.log('✨ Initialisation terminée avec succès!');
    console.log('📝 Le système multi-boutiques est maintenant opérationnel.');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function setupDefaultRedirectionRules(manager: MultiStoreManager, storeId: string) {
  const defaultRules = [
    {
      condition: "intent === 'ORDER' && totalAmount > 100",
      action: 'REDIRECT_MANAGER',
      value: 'manager'
    },
    {
      condition: "intent === 'RESERVATION' && groupSize > 8",
      action: 'REDIRECT_SERVICE',
      value: 'events'
    },
    {
      condition: "intent === 'COMPLAINT'",
      action: 'QUEUE_PRIORITY',
      value: '1'
    },
    {
      condition: "customer.status === 'VIP'",
      action: 'QUEUE_PRIORITY',
      value: '2'
    }
  ];

  await manager.updateStoreConfiguration(storeId, {
    redirectionRules: defaultRules
  });
}

async function initializeStoreMetrics(storeId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await prisma.storeMetrics.upsert({
      where: {
        storeId_date: {
          storeId: storeId,
          date: today
        }
      },
      update: {},
      create: {
        storeId: storeId,
        date: today,
        totalCalls: 0,
        maxConcurrentCalls: 1
      }
    });
  } catch (error) {
    console.warn(`   ⚠️  Impossible d'initialiser les métriques pour ${storeId}:`, error);
  }
}

async function testConnectivity(manager: MultiStoreManager) {
  try {
    const statuses = await manager.getAllStoresStatus();
    const initializedCount = statuses.filter(s => s.initialized).length;
    
    console.log(`   ✅ ${initializedCount} stores connectés et opérationnels`);
    
    if (initializedCount === 0) {
      console.warn('   ⚠️  Aucun store n\'est opérationnel!');
    }
  } catch (error) {
    console.error('   ❌ Erreur de connectivité:', error);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt en cours...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt forcé...');
  await prisma.$disconnect();
  process.exit(0);
});

// Lancement du script
if (require.main === module) {
  main().catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}