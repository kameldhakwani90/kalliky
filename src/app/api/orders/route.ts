import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withCSRFProtection } from '@/lib/csrf';

const prisma = new PrismaClient();

// GET - Récupérer les commandes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const storeId = searchParams.get('storeId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (storeId) where.storeId = storeId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        store: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Erreur GET orders:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle commande (avec protection CSRF)
export const POST = withCSRFProtection(async function(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerPhone,
      storeId,
      businessId,
      items,
      subtotal,
      tax,
      taxRate,
      total,
      notes
    } = body;

    if (!customerPhone || !storeId || !businessId || !items) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Trouver ou créer le client
    let customer = await prisma.customer.findFirst({
      where: {
        phone: customerPhone,
        businessId
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone: customerPhone,
          businessId,
          status: 'NEW'
        }
      });
    }

    // Créer la commande
    const orderCount = await prisma.order.count({
      where: { businessId }
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `#${1000 + orderCount + 1}`,
        customerId: customer.id,
        storeId,
        businessId,
        items,
        subtotal,
        tax,
        taxRate,
        total,
        notes,
        status: 'PENDING'
      },
      include: {
        customer: true,
        store: true
      }
    });

    // Mettre à jour les stats du client
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        orderCount: { increment: 1 },
        totalSpent: { increment: total },
        lastSeen: new Date(),
        avgBasket: {
          set: (customer.totalSpent + total) / (customer.orderCount + 1)
        },
        status: customer.orderCount >= 9 ? 'VIP' : 
                customer.orderCount >= 2 ? 'REGULAR' : 'NEW'
      }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Erreur POST order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
});