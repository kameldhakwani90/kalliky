import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// GET - Vérifier le statut de l'utilisateur (première activité, etc.)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        businesses: {
          include: {
            stores: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                country: true,
                businessId: true,
                stripeAccountId: true,
                createdAt: true,
                updatedAt: true,
                isActive: true,
                businessCategory: true,
                settings: true,
                hasProducts: true,
                hasReservations: true,
                hasConsultations: true,
                productsConfig: true,
                reservationsConfig: true,
                consultationsConfig: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur doit créer sa première activité
    const metadata = user.metadata ? 
      (typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata) 
      : {};
    const hasBusinesses = user.businesses.length > 0;
    
    // Vérifier si l'utilisateur a des stores CONFIGURÉS (avec isConfigured = true dans settings)
    let hasConfiguredStores = false;
    for (const business of user.businesses) {
      for (const store of business.stores) {
        const settings = store.settings ? 
          (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) 
          : {};
        if (settings.isConfigured === true) {
          hasConfiguredStores = true;
          break;
        }
      }
      if (hasConfiguredStores) break;
    }
    
    // L'utilisateur doit créer sa première activité s'il a payé mais n'a pas encore de store configuré
    // OU s'il a des businesses mais aucun store configuré (cas normal après inscription)
    const needsFirstActivity = (metadata.needsFirstActivity || (hasBusinesses && !hasConfiguredStores)) && !hasConfiguredStores;

    return NextResponse.json({
      needsFirstActivity,
      paidPlan: metadata.paidPlan || null,
      hasBusinesses,
      businessCount: user.businesses.length,
      totalStores: user.businesses.reduce((total, b) => total + b.stores.length, 0)
    });

  } catch (error: any) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}