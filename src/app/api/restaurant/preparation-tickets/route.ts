import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// GET - Récupérer les tickets de préparation
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    // Construire la requête
    let whereClause: any = {
      store: {
        business: { ownerId: decoded.userId }
      }
    };

    if (storeId) {
      // Vérifier que le store appartient à l'utilisateur
      const store = await prisma.store.findFirst({
        where: { 
          id: storeId,
          business: { ownerId: decoded.userId }
        }
      });

      if (!store) {
        return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
      }

      whereClause.storeId = storeId;
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    // Récupérer les tickets
    const tickets = await prisma.preparationTicket.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      skip: offset,
      take: limit
    });

    // Compter le total
    const total = await prisma.preparationTicket.count({ where: whereClause });

    return NextResponse.json({
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        orderId: ticket.orderId,
        orderNumber: ticket.order.orderNumber,
        status: ticket.status,
        priority: ticket.priority,
        items: ticket.items,
        notes: ticket.notes,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        completedAt: ticket.completedAt,
        customer: {
          id: ticket.order.customer.id,
          name: `${ticket.order.customer.firstName || ''} ${ticket.order.customer.lastName || ''}`.trim() || 'Client Anonyme',
          phone: ticket.order.customer.phone
        },
        store: ticket.store,
        orderTotal: ticket.order.total
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching preparation tickets:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un ticket de préparation pour une commande
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { orderId, priority = 'NORMAL', notes } = await request.json();
    
    // Vérifier que la commande appartient à l'utilisateur
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        business: { ownerId: decoded.userId }
      },
      include: {
        customer: true,
        store: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Vérifier qu'il n'y a pas déjà un ticket pour cette commande
    const existingTicket = await prisma.preparationTicket.findUnique({
      where: { orderId }
    });

    if (existingTicket) {
      return NextResponse.json({ error: 'Un ticket existe déjà pour cette commande' }, { status: 400 });
    }

    // Générer le numéro de ticket
    const ticketCount = await prisma.preparationTicket.count({
      where: { storeId: order.storeId }
    });
    const ticketNumber = `T${(ticketCount + 1).toString().padStart(3, '0')}`;

    // Préparer les items pour le ticket (format cuisine)
    const preparationItems = Array.isArray(order.items) 
      ? order.items.map((item: any) => ({
          name: item.name || 'Produit',
          quantity: item.quantity || 1,
          specifications: item.specifications || [],
          notes: item.notes || ''
        }))
      : [];

    // Créer le ticket
    const ticket = await prisma.preparationTicket.create({
      data: {
        ticketNumber,
        orderId,
        storeId: order.storeId,
        items: preparationItems,
        priority,
        notes,
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        orderId: ticket.orderId,
        orderNumber: ticket.order.orderNumber,
        status: ticket.status,
        priority: ticket.priority,
        items: ticket.items,
        notes: ticket.notes,
        createdAt: ticket.createdAt,
        customer: {
          id: ticket.order.customer.id,
          name: `${ticket.order.customer.firstName || ''} ${ticket.order.customer.lastName || ''}`.trim() || 'Client Anonyme',
          phone: ticket.order.customer.phone
        },
        store: ticket.store,
        orderTotal: ticket.order.total
      }
    });

  } catch (error) {
    console.error('Error creating preparation ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}