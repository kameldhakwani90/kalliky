import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// GET - Récupérer les échanges d'un client
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id } = await params;
    
    // Vérifier que le client appartient à l'utilisateur
    const customer = await prisma.customer.findFirst({
      where: { 
        id,
        business: { ownerId: decoded.userId }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Récupérer les échanges
    const exchanges = await prisma.customerExchange.findMany({
      where: { customerId: id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      exchanges: exchanges.map(exchange => ({
        id: exchange.id,
        type: exchange.type,
        description: exchange.description,
        content: exchange.content,
        metadata: exchange.metadata,
        createdAt: exchange.createdAt,
        updatedAt: exchange.updatedAt,
        store: exchange.store,
        order: exchange.order
      }))
    });

  } catch (error) {
    console.error('Error fetching customer exchanges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un nouvel échange
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id } = await params;
    const { storeId, type, description, content, metadata, orderId } = await request.json();
    
    // Vérifier que le client appartient à l'utilisateur
    const customer = await prisma.customer.findFirst({
      where: { 
        id,
        business: { ownerId: decoded.userId }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

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

    // Vérifier la commande si fournie
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerId: id,
          storeId
        }
      });

      if (!order) {
        return NextResponse.json({ error: 'Commande non trouvée ou non liée à ce client' }, { status: 404 });
      }
    }

    // Créer l'échange
    const exchange = await prisma.customerExchange.create({
      data: {
        customerId: id,
        storeId,
        type,
        description,
        content,
        metadata,
        orderId
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true
          }
        }
      }
    });

    // Mettre à jour la date de dernière interaction du client
    await prisma.customer.update({
      where: { id },
      data: { lastSeen: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      exchange: {
        id: exchange.id,
        type: exchange.type,
        description: exchange.description,
        content: exchange.content,
        metadata: exchange.metadata,
        createdAt: exchange.createdAt,
        store: exchange.store,
        order: exchange.order
      }
    });

  } catch (error) {
    console.error('Error creating customer exchange:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}

// PUT - Mettre à jour un échange
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id } = await params;
    const { exchangeId, description, content, metadata } = await request.json();
    
    // Vérifier que l'échange appartient au client et à l'utilisateur
    const exchange = await prisma.customerExchange.findFirst({
      where: { 
        id: exchangeId,
        customerId: id,
        customer: {
          business: { ownerId: decoded.userId }
        }
      }
    });

    if (!exchange) {
      return NextResponse.json({ error: 'Échange non trouvé' }, { status: 404 });
    }

    // Mettre à jour l'échange
    const updatedExchange = await prisma.customerExchange.update({
      where: { id: exchangeId },
      data: {
        description,
        content,
        metadata,
        updatedAt: new Date()
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      exchange: {
        id: updatedExchange.id,
        type: updatedExchange.type,
        description: updatedExchange.description,
        content: updatedExchange.content,
        metadata: updatedExchange.metadata,
        updatedAt: updatedExchange.updatedAt,
        store: updatedExchange.store,
        order: updatedExchange.order
      }
    });

  } catch (error) {
    console.error('Error updating customer exchange:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}