/**
 * WEBHOOK CRON - Suppression automatique des comptes trial
 * 
 * Endpoint public protégé par token secret pour l'exécution automatique
 * du processus de suppression des comptes trial par des services externes
 * (Vercel Cron, cron-job.org, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrialDeletionCronService } from '@/lib/cron/trial-deletion-cron';
import { prisma } from '@/lib/prisma';

// POST - Exécuter le cron job de suppression via webhook
export async function POST(request: NextRequest) {
  try {
    // Vérification du token de sécurité
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('❌ [WEBHOOK] CRON_SECRET manquant dans les variables d\'environnement');
      return NextResponse.json(
        { error: 'Configuration serveur incomplète' },
        { status: 500 }
      );
    }

    // Vérifier le token Bearer
    const expectedAuth = `Bearer ${cronSecret}`;
    if (!authHeader || authHeader !== expectedAuth) {
      console.error('❌ [WEBHOOK] Token CRON non autorisé');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres optionnels
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'process_deletions';
    const source = searchParams.get('source') || 'unknown';

    console.log(`🤖 [WEBHOOK] Exécution CRON suppression - Action: ${action}, Source: ${source}`);

    let result;
    let logType = 'CRON_WEBHOOK_EXECUTION';

    switch (action) {
      case 'process_deletions':
        // Exécution principale du processus de suppression
        result = await TrialDeletionCronService.processScheduledDeletions();
        
        // Enregistrer les statistiques d'exécution
        await prisma.activityLog.create({
          data: {
            type: logType,
            description: `Exécution automatique du cron de suppression via webhook (${source})`,
            metadata: {
              source,
              action,
              result: {
                deletedBusinesses: result.deletedBusinesses,
                errorsCount: result.errors.length,
                totalProcessed: result.details.length
              },
              executionTime: new Date().toISOString(),
              details: result.details.map(d => ({
                businessId: d.businessId,
                businessName: d.businessName,
                reason: d.reason
              }))
            }
          }
        });

        console.log(`✅ [WEBHOOK] Suppression terminée: ${result.deletedBusinesses} comptes supprimés`);
        break;

      case 'cleanup':
        // Nettoyage des anciennes données
        await TrialDeletionCronService.cleanupOldData();
        result = {
          action: 'cleanup',
          message: 'Nettoyage des anciennes données effectué',
          timestamp: new Date().toISOString()
        };
        
        await prisma.activityLog.create({
          data: {
            type: 'CRON_CLEANUP_EXECUTION',
            description: `Nettoyage automatique des données via webhook (${source})`,
            metadata: { source, action, timestamp: new Date().toISOString() }
          }
        });
        break;

      case 'health_check':
        // Vérification de santé du système
        const stats = await TrialDeletionCronService.getStatistics();
        result = {
          action: 'health_check',
          status: 'healthy',
          statistics: stats,
          timestamp: new Date().toISOString(),
          nextScheduledRun: 'daily'
        };
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Action non supportée',
            supportedActions: ['process_deletions', 'cleanup', 'health_check']
          },
          { status: 400 }
        );
    }

    // Réponse de succès
    const response = {
      success: true,
      action,
      source,
      result,
      timestamp: new Date().toISOString(),
      nextScheduledRun: action === 'process_deletions' ? '24 heures' : null
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erreur exécution cron suppression:', error);

    // Enregistrer l'erreur
    try {
      await prisma.activityLog.create({
        data: {
          type: 'CRON_WEBHOOK_ERROR',
          description: `Erreur lors de l'exécution du webhook cron de suppression`,
          metadata: {
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.error('❌ [WEBHOOK] Erreur enregistrement log:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'exécution du processus',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET - Status et informations sur le cron job (avec authentification simple)
export async function GET(request: NextRequest) {
  try {
    // Vérification du token de sécurité (plus simple pour GET)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 401 }
      );
    }

    // Récupérer les statistiques actuelles
    const stats = await TrialDeletionCronService.getStatistics();
    
    // Récupérer la dernière exécution
    const lastExecution = await prisma.activityLog.findFirst({
      where: {
        type: { in: ['CRON_WEBHOOK_EXECUTION', 'MANUAL_CRON_EXECUTION'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      status: 'active',
      statistics: stats,
      lastExecution: lastExecution ? {
        date: lastExecution.createdAt,
        type: lastExecution.type,
        result: lastExecution.metadata?.result
      } : null,
      configuration: {
        deletionDelayDays: 5,
        warningEmailDelayDays: 3,
        enabled: true
      },
      webhookInfo: {
        endpoint: '/api/webhooks/cron/trial-deletion',
        method: 'POST',
        authentication: 'Bearer token required',
        supportedActions: ['process_deletions', 'cleanup', 'health_check']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erreur GET status:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}