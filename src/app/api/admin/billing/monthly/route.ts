// ============================================================================
// API ADMIN MONTHLY BILLING - Facturation mensuelle automatique Telnyx
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { telnyxTracking } from '@/lib/telnyx-tracking';

// POST - Déclencher la facturation mensuelle des numéros Telnyx
export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que c'est un super admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { month } = await request.json();
    const billingMonth = month || new Date().toISOString().substring(0, 7);

    console.log(`🔄 Déclenchement facturation mensuelle: ${billingMonth}`);

    // Déclencher la facturation automatique
    await telnyxTracking.billMonthlyNumbers(billingMonth);

    return NextResponse.json({ 
      success: true, 
      billingMonth,
      message: 'Facturation mensuelle déclenchée avec succès'
    });

  } catch (error) {
    console.error('Error triggering monthly billing:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la facturation',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// GET - Obtenir le statut de la facturation mensuelle
export async function GET(request: NextRequest) {
  try {
    // Vérifier authentification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que c'est un super admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);

    // Compter les numéros actifs
    const totalActiveNumbers = await prisma.phoneNumber.count({
      where: { status: 'ACTIVE' }
    });

    // Compter les numéros déjà facturés ce mois
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const billedNumbers = await prisma.telnyxUsage.count({
      where: {
        usageType: 'NUMBER_MONTHLY',
        billingDate: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Calculer le coût total prévu
    const expectedCost = await prisma.phoneNumber.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { monthlyPrice: true }
    });

    // Coût réel facturé ce mois
    const actualCost = await prisma.telnyxUsage.aggregate({
      where: {
        usageType: 'NUMBER_MONTHLY',
        billingDate: {
          gte: startDate,
          lt: endDate
        }
      },
      _sum: { cost: true }
    });

    return NextResponse.json({
      month,
      totalActiveNumbers,
      billedNumbers,
      pendingNumbers: totalActiveNumbers - billedNumbers,
      expectedCost: expectedCost._sum.monthlyPrice || 0,
      actualCost: actualCost._sum.cost || 0,
      billingComplete: billedNumbers >= totalActiveNumbers,
      billingProgress: totalActiveNumbers > 0 
        ? Math.round((billedNumbers / totalActiveNumbers) * 100)
        : 100
    });

  } catch (error) {
    console.error('Error fetching billing status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}