import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface ActivityItem {
  id: string;
  type: 'Commande' | 'Réservation' | 'Consultation';
  customer: string;
  customerId: string;
  phone: string;
  date: Date;
  amount: string;
}

// GET - Récupérer les activités d'une boutique
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { storeId } = await params;
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: storeId,
        business: { ownerId: decoded.userId }
      },
      include: {
        business: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date');

    const offset = (page - 1) * limit;

    // Construire les filtres
    const dateFilter = date ? {
      createdAt: {
        gte: new Date(date + 'T00:00:00.000Z'),
        lte: new Date(date + 'T23:59:59.999Z')
      }
    } : {};

    // Récupérer les commandes
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        ...dateFilter,
        OR: search ? [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search } } }
        ] : undefined
      },
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Récupérer les logs d'activité (pour les réservations, consultations, etc.)
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        storeId,
        ...dateFilter,
        OR: search ? [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search } } }
        ] : undefined
      },
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Transformer les données en format uniforme
    const activities: ActivityItem[] = [];

    // Ajouter les commandes
    orders.forEach(order => {
      activities.push({
        id: order.orderNumber,
        type: 'Commande',
        customer: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Client Anonyme',
        customerId: order.customer.id,
        phone: order.customer.phone,
        date: order.createdAt,
        amount: `${order.total.toFixed(2)}€`
      });
    });

    // Ajouter les autres activités
    activityLogs.forEach(log => {
      let type: 'Commande' | 'Réservation' | 'Consultation' = 'Commande';
      
      switch (log.type) {
        case 'RESERVATION':
          type = 'Réservation';
          break;
        case 'CONSULTATION':
          type = 'Consultation';
          break;
        default:
          type = 'Commande';
      }

      activities.push({
        id: log.entityId,
        type,
        customer: log.customer ? `${log.customer.firstName || ''} ${log.customer.lastName || ''}`.trim() || 'Client Anonyme' : 'Client Anonyme',
        customerId: log.customer?.id || '',
        phone: log.customer?.phone || '',
        date: log.createdAt,
        amount: log.amount ? `${log.amount.toFixed(2)}€` : 'N/A'
      });
    });

    // Trier par date (plus récent en premier)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginer le résultat final
    const paginatedActivities = activities.slice(0, limit);

    // Compter le total pour la pagination
    const totalOrders = await prisma.order.count({
      where: {
        storeId: params.storeId,
        ...dateFilter,
        OR: search ? [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search } } }
        ] : undefined
      }
    });

    const totalActivityLogs = await prisma.activityLog.count({
      where: {
        storeId: params.storeId,
        ...dateFilter,
        OR: search ? [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search } } }
        ] : undefined
      }
    });

    const total = totalOrders + totalActivityLogs;

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      store: {
        id: store.id,
        name: store.name,
        address: store.address
      }
    });

  } catch (error) {
    console.error('Error fetching store activities:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle activité (pour les réservations, consultations, etc.)
export async function POST(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { type, customerId, title, description, amount, metadata } = await request.json();
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: params.storeId,
        business: { ownerId: decoded.userId }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    // Générer un entityId selon le type
    let entityId = '';
    switch (type) {
      case 'RESERVATION':
        const reservationCount = await prisma.activityLog.count({
          where: { storeId: params.storeId, type: 'RESERVATION' }
        });
        entityId = `#R${(reservationCount + 1).toString().padStart(3, '0')}`;
        break;
      case 'CONSULTATION':
        const consultationCount = await prisma.activityLog.count({
          where: { storeId: params.storeId, type: 'CONSULTATION' }
        });
        entityId = `#C${(consultationCount + 1).toString().padStart(3, '0')}`;
        break;
      default:
        entityId = `#A${Date.now()}`;
    }

    // Créer l'activité
    const activity = await prisma.activityLog.create({
      data: {
        storeId: params.storeId,
        customerId,
        type,
        entityId,
        title,
        description,
        amount,
        metadata
      },
      include: {
        customer: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      activity: {
        id: activity.entityId,
        type: type === 'RESERVATION' ? 'Réservation' : type === 'CONSULTATION' ? 'Consultation' : 'Commande',
        customer: activity.customer ? `${activity.customer.firstName || ''} ${activity.customer.lastName || ''}`.trim() || 'Client Anonyme' : 'Client Anonyme',
        customerId: activity.customer?.id || '',
        phone: activity.customer?.phone || '',
        date: activity.createdAt,
        amount: activity.amount ? `${activity.amount.toFixed(2)}€` : 'N/A'
      }
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}