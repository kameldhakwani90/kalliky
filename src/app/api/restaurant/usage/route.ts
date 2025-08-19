import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// POST - Enregistrer une nouvelle commande/usage
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { storeId, orderValue, orderCount = 1 } = await request.json();

    if (!storeId || !orderValue) {
      return NextResponse.json(
        { error: 'storeId et orderValue sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: decoded.userId
        }
      },
      include: {
        subscription: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    const currentPeriod = new Date().toISOString().slice(0, 7); // Format YYYY-MM
    const settings = JSON.parse(store.settings || '{}');
    
    // Calculer la commission selon le plan
    let commissionAmount = 0;
    if (store.subscription?.plan === 'STARTER') {
      commissionAmount = orderValue * 0.10; // 10% pour Starter
    }

    // Créer ou mettre à jour l'usage pour cette période
    const usage = await prisma.usageTracking.upsert({
      where: {
        storeId_period: {
          storeId: storeId,
          period: currentPeriod
        }
      },
      update: {
        orderCount: {
          increment: orderCount
        },
        totalRevenue: {
          increment: orderValue
        },
        commissionAmount: {
          increment: commissionAmount
        }
      },
      create: {
        storeId: storeId,
        period: currentPeriod,
        orderCount: orderCount,
        totalRevenue: orderValue,
        commissionAmount: commissionAmount
      }
    });

    return NextResponse.json({
      success: true,
      usage,
      commissionAmount,
      plan: store.subscription?.plan
    });

  } catch (error: any) {
    console.error('Error tracking usage:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Récupérer l'usage d'une période
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || new Date().toISOString().slice(0, 7);

    // Récupérer l'usage de tous les stores de l'utilisateur pour la période
    const usageData = await prisma.usageTracking.findMany({
      where: {
        period: period,
        store: {
          business: {
            ownerId: decoded.userId
          }
        }
      },
      include: {
        store: {
          include: {
            subscription: true,
            business: true
          }
        }
      }
    });

    return NextResponse.json(usageData);

  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}