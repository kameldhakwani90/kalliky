import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const orderNumber = resolvedParams.orderNumber;

    if (!orderNumber) {
      return NextResponse.json({ 
        error: 'orderNumber requis' 
      }, { status: 400 });
    }

    // Récupérer la commande par son numéro
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
            firstName: true,
            lastName: true,
            email: true
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

    if (!order) {
      return NextResponse.json({ 
        error: 'Commande non trouvée' 
      }, { status: 404 });
    }

    // Transformer les données pour le frontend
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      items: order.items, // JSON déjà parsé par Prisma
      subtotal: order.subtotal,
      tax: order.tax,
      taxRate: order.taxRate,
      total: order.total,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customer: order.customer,
      store: order.store
    };

    return NextResponse.json(transformedOrder);

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération de la commande' 
    }, { status: 500 });
  }
}