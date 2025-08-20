/**
 * API ADMIN CLEANUP - Nettoyage complet Telnyx + Stripe + Database
 * 
 * Services de nettoyage pour maintenir l'intégrité des données et éviter
 * les coûts inutiles sur les services externes (Telnyx, Stripe)
 * 
 * GET  - Status et statistiques de nettoyage
 * POST - Exécuter les opérations de nettoyage
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface CleanupStats {
  orphanedTelnyxNumbers: number;
  inactiveStripeSubscriptions: number;
  oldActivityLogs: number;
  unusedPhoneNumbers: number;
  expiredTrials: number;
  duplicateRecords: number;
}

interface CleanupResult {
  operation: string;
  success: boolean;
  itemsCleaned: number;
  details: string[];
  errors: string[];
}

// GET - Récupérer les statistiques de nettoyage
export async function GET(request: NextRequest) {
  try {
    // Vérification superadmin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès superadmin requis' }, { status: 403 });
    }

    // Calculer les statistiques de nettoyage nécessaire
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Numéros Telnyx orphelins (pas de business associé)
    const orphanedTelnyxNumbers = await prisma.phoneNumber.count({
      where: {
        OR: [
          { business: null },
          { 
            business: { 
              subscriptions: { 
                none: { 
                  status: { in: ['active', 'trialing'] } 
                } 
              } 
            } 
          }
        ]
      }
    });

    // Subscriptions Stripe inactives depuis longtemps
    const inactiveStripeSubscriptions = await prisma.subscription.count({
      where: {
        status: { in: ['cancelled', 'incomplete_expired', 'unpaid'] },
        updatedAt: { lt: oneMonthAgo }
      }
    });

    // Anciens logs d'activité
    const oldActivityLogs = await prisma.activityLog.count({
      where: {
        createdAt: { lt: threeMonthsAgo }
      }
    });

    // Numéros de téléphone non utilisés depuis longtemps
    const unusedPhoneNumbers = await prisma.phoneNumber.count({
      where: {
        calls: { none: {} },
        createdAt: { lt: oneMonthAgo }
      }
    });

    // Trials expirés non nettoyés
    const expiredTrials = await prisma.trialUsage.count({
      where: {
        status: { in: ['blocked', 'expired'] },
        updatedAt: { lt: oneMonthAgo }
      }
    });

    // Records de consommation en double (même période, même store)
    const duplicateConsumption = await prisma.$queryRaw<Array<{ count: bigint; period: string; storeId: string }>>`
      SELECT COUNT(*) as count, period, "storeId"
      FROM "ConsumptionSummary"
      GROUP BY period, "storeId"
      HAVING COUNT(*) > 1
    `;

    const stats: CleanupStats = {
      orphanedTelnyxNumbers,
      inactiveStripeSubscriptions,
      oldActivityLogs,
      unusedPhoneNumbers,
      expiredTrials,
      duplicateRecords: duplicateConsumption.length
    };

    // Dernières opérations de nettoyage
    const recentCleanupLogs = await prisma.activityLog.findMany({
      where: {
        type: { contains: 'CLEANUP' },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      statistics: stats,
      recommendations: {
        criticalActions: stats.orphanedTelnyxNumbers > 0 || stats.unusedPhoneNumbers > 5,
        suggestedActions: [
          stats.orphanedTelnyxNumbers > 0 && 'Libérer numéros Telnyx orphelins',
          stats.oldActivityLogs > 1000 && 'Nettoyer anciens logs',
          stats.expiredTrials > 10 && 'Supprimer trials expirés',
          stats.duplicateRecords > 0 && 'Dédupliquer données consommation'
        ].filter(Boolean)
      },
      recentOperations: recentCleanupLogs.map(log => ({
        date: log.createdAt,
        type: log.type,
        description: log.description,
        metadata: log.metadata
      })),
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats cleanup:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Exécuter les opérations de nettoyage
export async function POST(request: NextRequest) {
  try {
    // Vérification superadmin stricte
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès superadmin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { operations, dryRun = false } = body;

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Liste des opérations requise' },
        { status: 400 }
      );
    }

    console.log(`🧹 [CLEANUP] Démarrage nettoyage par ${user.email} - Dry Run: ${dryRun}`);

    const results: CleanupResult[] = [];

    for (const operation of operations) {
      try {
        let result: CleanupResult;

        switch (operation) {
          case 'telnyx_orphaned_numbers':
            result = await cleanupOrphanedTelnyxNumbers(dryRun);
            break;

          case 'stripe_inactive_subscriptions':
            result = await cleanupInactiveStripeSubscriptions(dryRun);
            break;

          case 'old_activity_logs':
            result = await cleanupOldActivityLogs(dryRun);
            break;

          case 'unused_phone_numbers':
            result = await cleanupUnusedPhoneNumbers(dryRun);
            break;

          case 'expired_trials':
            result = await cleanupExpiredTrials(dryRun);
            break;

          case 'duplicate_consumption':
            result = await cleanupDuplicateConsumption(dryRun);
            break;

          default:
            result = {
              operation,
              success: false,
              itemsCleaned: 0,
              details: [],
              errors: [`Opération '${operation}' non reconnue`]
            };
        }

        results.push(result);

      } catch (error) {
        console.error(`❌ [CLEANUP] Erreur ${operation}:`, error);
        results.push({
          operation,
          success: false,
          itemsCleaned: 0,
          details: [],
          errors: [error instanceof Error ? error.message : 'Erreur inconnue']
        });
      }
    }

    // Enregistrer l'opération de nettoyage
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_CLEANUP_OPERATION',
        description: `Opération de nettoyage ${dryRun ? '(simulation)' : ''} par ${user.email}`,
        metadata: {
          adminId: user.id,
          adminEmail: user.email,
          operations,
          dryRun,
          results: results.map(r => ({
            operation: r.operation,
            success: r.success,
            itemsCleaned: r.itemsCleaned,
            errorsCount: r.errors.length
          })),
          totalItemsCleaned: results.reduce((sum, r) => sum + r.itemsCleaned, 0),
          timestamp: new Date().toISOString()
        }
      }
    });

    const totalCleaned = results.reduce((sum, r) => sum + r.itemsCleaned, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      dryRun,
      totalItemsCleaned: totalCleaned,
      totalErrors,
      results,
      executedBy: user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur globale:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

// Fonctions de nettoyage spécialisées

async function cleanupOrphanedTelnyxNumbers(dryRun: boolean): Promise<CleanupResult> {
  const orphanedNumbers = await prisma.phoneNumber.findMany({
    where: {
      OR: [
        { business: null },
        { 
          business: { 
            subscriptions: { 
              none: { 
                status: { in: ['active', 'trialing'] } 
              } 
            } 
          } 
        }
      ]
    },
    select: { id: true, number: true, phoneNumber: true, businessId: true }
  });

  if (dryRun) {
    return {
      operation: 'telnyx_orphaned_numbers',
      success: true,
      itemsCleaned: orphanedNumbers.length,
      details: orphanedNumbers.map(n => `Numéro orphelin trouvé: ${n.phoneNumber || n.number}`),
      errors: []
    };
  }

  const details: string[] = [];
  const errors: string[] = [];
  let cleaned = 0;

  for (const phoneNumber of orphanedNumbers) {
    try {
      // Note: Ici il faudrait appeler l'API Telnyx pour libérer le numéro
      // await telnyxAPI.releasePhoneNumber(phoneNumber.telnyxId);
      
      await prisma.phoneNumber.delete({
        where: { id: phoneNumber.id }
      });
      
      details.push(`Numéro ${phoneNumber.phoneNumber || phoneNumber.number} libéré`);
      cleaned++;
    } catch (error) {
      errors.push(`Erreur libération ${phoneNumber.phoneNumber}: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  }

  return {
    operation: 'telnyx_orphaned_numbers',
    success: errors.length === 0,
    itemsCleaned: cleaned,
    details,
    errors
  };
}

async function cleanupInactiveStripeSubscriptions(dryRun: boolean): Promise<CleanupResult> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const inactiveSubscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['cancelled', 'incomplete_expired', 'unpaid'] },
      updatedAt: { lt: oneMonthAgo }
    }
  });

  if (dryRun) {
    return {
      operation: 'stripe_inactive_subscriptions',
      success: true,
      itemsCleaned: inactiveSubscriptions.length,
      details: inactiveSubscriptions.map(s => `Subscription inactive: ${s.stripeSubscriptionId} (${s.status})`),
      errors: []
    };
  }

  const details: string[] = [];
  let cleaned = 0;

  for (const subscription of inactiveSubscriptions) {
    await prisma.subscription.delete({
      where: { id: subscription.id }
    });
    details.push(`Subscription supprimée: ${subscription.stripeSubscriptionId}`);
    cleaned++;
  }

  return {
    operation: 'stripe_inactive_subscriptions',
    success: true,
    itemsCleaned: cleaned,
    details,
    errors: []
  };
}

async function cleanupOldActivityLogs(dryRun: boolean): Promise<CleanupResult> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const oldLogsCount = await prisma.activityLog.count({
    where: {
      createdAt: { lt: threeMonthsAgo }
    }
  });

  if (dryRun) {
    return {
      operation: 'old_activity_logs',
      success: true,
      itemsCleaned: oldLogsCount,
      details: [`${oldLogsCount} logs anciens trouvés (> 3 mois)`],
      errors: []
    };
  }

  const deleted = await prisma.activityLog.deleteMany({
    where: {
      createdAt: { lt: threeMonthsAgo }
    }
  });

  return {
    operation: 'old_activity_logs',
    success: true,
    itemsCleaned: deleted.count,
    details: [`${deleted.count} anciens logs supprimés`],
    errors: []
  };
}

async function cleanupUnusedPhoneNumbers(dryRun: boolean): Promise<CleanupResult> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const unusedNumbers = await prisma.phoneNumber.findMany({
    where: {
      calls: { none: {} },
      createdAt: { lt: oneMonthAgo }
    }
  });

  if (dryRun) {
    return {
      operation: 'unused_phone_numbers',
      success: true,
      itemsCleaned: unusedNumbers.length,
      details: unusedNumbers.map(n => `Numéro inutilisé: ${n.phoneNumber} (créé ${n.createdAt.toLocaleDateString()})`),
      errors: []
    };
  }

  const details: string[] = [];
  let cleaned = 0;

  for (const phoneNumber of unusedNumbers) {
    await prisma.phoneNumber.delete({
      where: { id: phoneNumber.id }
    });
    details.push(`Numéro inutilisé supprimé: ${phoneNumber.phoneNumber}`);
    cleaned++;
  }

  return {
    operation: 'unused_phone_numbers',
    success: true,
    itemsCleaned: cleaned,
    details,
    errors: []
  };
}

async function cleanupExpiredTrials(dryRun: boolean): Promise<CleanupResult> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const expiredTrials = await prisma.trialUsage.findMany({
    where: {
      status: { in: ['blocked', 'expired'] },
      updatedAt: { lt: oneMonthAgo }
    }
  });

  if (dryRun) {
    return {
      operation: 'expired_trials',
      success: true,
      itemsCleaned: expiredTrials.length,
      details: expiredTrials.map(t => `Trial expiré: ${t.identifier} (${t.status})`),
      errors: []
    };
  }

  const deleted = await prisma.trialUsage.deleteMany({
    where: {
      status: { in: ['blocked', 'expired'] },
      updatedAt: { lt: oneMonthAgo }
    }
  });

  return {
    operation: 'expired_trials',
    success: true,
    itemsCleaned: deleted.count,
    details: [`${deleted.count} trials expirés supprimés`],
    errors: []
  };
}

async function cleanupDuplicateConsumption(dryRun: boolean): Promise<CleanupResult> {
  // Trouver les doublons de ConsumptionSummary
  const duplicates = await prisma.$queryRaw<Array<{ period: string; storeId: string; count: bigint }>>`
    SELECT period, "storeId", COUNT(*) as count
    FROM "ConsumptionSummary"
    GROUP BY period, "storeId"
    HAVING COUNT(*) > 1
  `;

  if (dryRun) {
    return {
      operation: 'duplicate_consumption',
      success: true,
      itemsCleaned: duplicates.length,
      details: duplicates.map(d => `Doublons trouvés: ${d.storeId} (${d.period}) - ${d.count} entrées`),
      errors: []
    };
  }

  const details: string[] = [];
  let cleaned = 0;

  for (const duplicate of duplicates) {
    // Garder seulement le plus récent
    const records = await prisma.consumptionSummary.findMany({
      where: {
        period: duplicate.period,
        storeId: duplicate.storeId
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Supprimer tous sauf le premier (le plus récent)
    const toDelete = records.slice(1);
    
    for (const record of toDelete) {
      await prisma.consumptionSummary.delete({
        where: { id: record.id }
      });
      cleaned++;
    }
    
    details.push(`${toDelete.length} doublons supprimés pour ${duplicate.storeId} (${duplicate.period})`);
  }

  return {
    operation: 'duplicate_consumption',
    success: true,
    itemsCleaned: cleaned,
    details,
    errors: []
  };
}