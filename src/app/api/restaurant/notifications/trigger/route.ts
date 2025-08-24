import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';

// POST - Déclencher des notifications pour une activité
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const body = await request.json();
    const { 
      storeId, 
      businessId, 
      activityType, 
      activityId, 
      activityData 
    } = body;

    if (!storeId || !businessId || !activityType || !activityData) {
      return NextResponse.json({ 
        error: 'storeId, businessId, activityType et activityData requis' 
      }, { status: 400 });
    }

    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: storeId,
        business: { ownerId: decoded.userId }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé ou non autorisé' }, { status: 403 });
    }

    // Générer un activityId si pas fourni
    const finalActivityId = activityId || `${activityType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Déclencher les notifications via le service
    await notificationService.triggerNotifications({
      storeId,
      businessId,
      activityType,
      activityId: finalActivityId,
      data: activityData,
      priority: activityData.priority || 'NORMAL'
    });

    return NextResponse.json({ 
      success: true,
      message: 'Notifications déclenchées avec succès'
    });

  } catch (error) {
    console.error('Erreur déclenchement notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Endpoint de test pour déclencher des notifications de démo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ORDER';

    const demoData = {
      storeId: 'demo-store',
      businessId: 'demo-business',
      activityType: type,
      activityId: `demo-${type.toLowerCase()}-${Date.now()}`,
      activityData: getDemoActivityData(type)
    };

    await notificationService.triggerNotifications({
      storeId: demoData.storeId,
      businessId: demoData.businessId,
      activityType: demoData.activityType as any,
      activityId: demoData.activityId,
      data: demoData.activityData
    });

    return NextResponse.json({ 
      success: true,
      message: `Notification démo ${type} déclenchée`,
      data: demoData
    });

  } catch (error) {
    console.error('Erreur notification démo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function getDemoActivityData(type: string) {
  const baseData = {
    clientName: 'Sophie Martin',
    businessName: 'Les Coutumes',
    date: new Date().toISOString(),
    clientType: 'fidele'
  };

  switch (type) {
    case 'ORDER':
      return {
        ...baseData,
        orderId: 'CMD-001',
        total: 25.50,
        items: [
          { name: 'Pain Tradition', quantity: 2, price: 2.40 },
          { name: 'Croissant', quantity: 4, price: 4.40 }
        ]
      };

    case 'SERVICE':
      return {
        ...baseData,
        serviceId: 'SERV-001',
        serviceName: 'Consultation Nutrition',
        total: 125.00,
        duration: 60,
        startTime: new Date(Date.now() + 3600000).toISOString() // Dans 1h
      };

    case 'CONSULTATION':
      return {
        ...baseData,
        consultationId: 'CONS-001',
        serviceName: 'Consultation Juridique',
        total: 150.00,
        transcript: 'Question légale importante...',
        analysis: { score: 85, urgency: 'normal' }
      };

    case 'SIGNALEMENT':
      return {
        ...baseData,
        signalementId: 'SIGN-001',
        problemType: 'produit_defectueux',
        urgency: 'eleve',
        title: 'Pain moisi livré',
        description: 'Traces de moisissures sur le pain tradition',
        priority: 'HIGH'
      };

    default:
      return baseData;
  }
}