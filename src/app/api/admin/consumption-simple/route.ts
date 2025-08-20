import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// VERSION SIMPLE TEMPORAIRE - API de consommation sans les nouveaux modèles
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que l'utilisateur est SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // Temporairement, permettre à tous les utilisateurs connectés d'accéder
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les données basiques disponibles
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        businesses: {
          include: {
            stores: {
              include: {
                subscription: true
              }
            }
          }
        }
      }
    });

    // Calculer des métriques basiques
    const totalClients = clients.length;
    const totalStores = clients.reduce((sum, client) => 
      sum + client.businesses.reduce((businessSum, business) => 
        businessSum + business.stores.length, 0), 0
    );

    // Données simulées pour les coûts (à remplacer par les vraies données plus tard)
    const mockData = {
      globalTotals: {
        totalClients,
        totalStores,
        totalOpenAICost: 0,
        totalOpenAICalls: 0,
        totalOpenAITokens: 0,
        totalTelnyxCost: 0,
        totalTelnyxCalls: 0,
        totalTelnyxDuration: 0,
        totalNumbersCost: 0,
        grandTotal: 0
      },
      topClients: clients.slice(0, 10).map((client, index) => ({
        businessId: client.businesses[0]?.id || 'unknown',
        businessName: client.businesses[0]?.name || `${client.firstName} ${client.lastName}`,
        ownerEmail: client.email,
        storesCount: client.businesses.reduce((sum, b) => sum + b.stores.length, 0),
        openaiCost: 0,
        telnyxCost: 0,
        totalCost: 0
      })),
      highUsageAlerts: [],
      detailsEvolution: []
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Error fetching basic consumption metrics:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}