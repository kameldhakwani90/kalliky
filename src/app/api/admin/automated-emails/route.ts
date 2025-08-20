/**
 * API ADMIN AUTOMATED EMAILS - Gestion des emails automatiques
 * 
 * GET  - Status des emails automatiques
 * POST - Déclencher manuellement l'envoi des emails
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { TrialUsageService } from '@/lib/trial-usage';

// GET - Récupérer le statut des emails automatiques
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

    // Récupérer les statistiques d'emails
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Emails d'avertissement envoyés aujourd'hui
    const warningEmailsToday = await prisma.trialUsage.count({
      where: {
        warningEmailSent: true,
        warningEmailDate: { gte: today }
      }
    });

    // Emails de blocage envoyés aujourd'hui
    const blockingEmailsToday = await prisma.trialUsage.count({
      where: {
        blockedEmailSent: true,
        blockedEmailDate: { gte: today }
      }
    });

    // Emails d'avertissement de suppression envoyés aujourd'hui
    const deletionWarningEmailsToday = await prisma.trialUsage.count({
      where: {
        deletionWarningEmailSent: true,
        deletionWarningEmailDate: { gte: today }
      }
    });

    // Emails en attente d'être envoyés
    const pendingWarningEmails = await prisma.trialUsage.count({
      where: {
        status: 'active',
        callsUsed: { gte: 8 }, // Seuil d'avertissement
        warningEmailSent: false
      }
    });

    const pendingBlockingEmails = await prisma.trialUsage.count({
      where: {
        callsUsed: { gte: 10 }, // Limite atteinte
        status: 'active',
        blockedEmailSent: false
      }
    });

    // Dernière exécution automatique
    const lastAutomatedRun = await prisma.activityLog.findFirst({
      where: {
        type: 'AUTOMATED_EMAIL_BATCH'
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      emailsSentToday: {
        warning: warningEmailsToday,
        blocking: blockingEmailsToday,
        deletionWarning: deletionWarningEmailsToday,
        total: warningEmailsToday + blockingEmailsToday + deletionWarningEmailsToday
      },
      pendingEmails: {
        warning: pendingWarningEmails,
        blocking: pendingBlockingEmails,
        total: pendingWarningEmails + pendingBlockingEmails
      },
      systemStatus: {
        enabled: true,
        lastRun: lastAutomatedRun?.createdAt || null,
        nextScheduledRun: 'Quotidien à 09:00 UTC'
      },
      configuration: {
        warningThreshold: 8, // Appels
        blockingThreshold: 10, // Appels
        trialDuration: 15 // Jours
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération status emails:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Déclencher manuellement l'envoi des emails automatiques
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

    console.log(`📧 [MANUAL] Déclenchement manuel emails automatiques par ${user.email}`);

    // Exécuter le processus d'emails automatiques
    const result = await TrialUsageService.checkAndSendWarningEmails();
    
    // Enregistrer l'exécution manuelle
    await prisma.activityLog.create({
      data: {
        type: 'MANUAL_EMAIL_TRIGGER',
        description: `Déclenchement manuel des emails automatiques par ${user.email}`,
        metadata: {
          adminId: user.id,
          adminEmail: user.email,
          result: result,
          executionType: 'manual',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      result: result,
      message: 'Processus d\'emails automatiques exécuté avec succès',
      executedBy: user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur déclenchement emails manuels:', error);
    
    // Enregistrer l'erreur
    try {
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        await prisma.activityLog.create({
          data: {
            type: 'EMAIL_TRIGGER_ERROR',
            description: 'Erreur lors du déclenchement manuel des emails automatiques',
            metadata: {
              adminId: decoded.userId,
              error: error instanceof Error ? error.message : 'Erreur inconnue',
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    } catch (logError) {
      console.error('❌ Erreur enregistrement log:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors du déclenchement des emails',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}