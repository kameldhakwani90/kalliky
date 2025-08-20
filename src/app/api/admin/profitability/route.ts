import { NextRequest, NextResponse } from 'next/server';
import { ProfitabilityService } from '@/lib/profitability-service';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Vérification admin
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
      return NextResponse.json({ error: 'Accès superadmin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_month';
    const businessId = searchParams.get('businessId');

    if (businessId) {
      // Profitabilité d'un business spécifique
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const businessProfitability = await ProfitabilityService.calculateBusinessProfitability(
        businessId,
        startOfMonth,
        endOfMonth
      );

      if (!businessProfitability) {
        return NextResponse.json({ error: 'Business non trouvé ou pas de données' }, { status: 404 });
      }

      return NextResponse.json(businessProfitability);
    }

    // Profitabilité globale selon la période
    let profitabilityData;
    
    switch (period) {
      case 'current_month':
        profitabilityData = await ProfitabilityService.getCurrentMonthProfitability();
        break;
        
      case 'trends':
        const trends = await ProfitabilityService.getProfitabilityTrends();
        return NextResponse.json(trends);
        
      case 'at_risk':
        const atRisk = await ProfitabilityService.getBusinessesAtRisk();
        return NextResponse.json(atRisk);
        
      default:
        profitabilityData = await ProfitabilityService.getCurrentMonthProfitability();
    }

    return NextResponse.json(profitabilityData);

  } catch (error) {
    console.error('❌ Erreur API profitability:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Calculer la profitabilité pour une période personnalisée
export async function POST(request: NextRequest) {
  try {
    // Vérification admin
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
      return NextResponse.json({ error: 'Accès superadmin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, businessIds } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate et endDate requis' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (businessIds && Array.isArray(businessIds)) {
      // Calculer pour des business spécifiques
      const results = [];
      
      for (const businessId of businessIds) {
        const profitability = await ProfitabilityService.calculateBusinessProfitability(
          businessId,
          start,
          end
        );
        
        if (profitability) {
          results.push(profitability);
        }
      }

      return NextResponse.json({
        results,
        period: { start, end },
        totalBusinesses: results.length
      });
      
    } else {
      // Calculer pour tous les business
      const globalProfitability = await ProfitabilityService.calculateGlobalProfitability(start, end);
      
      return NextResponse.json({
        ...globalProfitability,
        period: { start, end }
      });
    }

  } catch (error) {
    console.error('❌ Erreur POST profitability:', error);
    return NextResponse.json(
      { error: 'Erreur calcul profitabilité' },
      { status: 500 }
    );
  }
}