import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer un client avec son historique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erreur GET customer:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Calculer le statut en fonction du nombre de commandes
    if (body.orderCount !== undefined) {
      if (body.orderCount >= 10) {
        body.status = 'VIP';
      } else if (body.orderCount >= 3) {
        body.status = 'REGULAR';
      } else {
        body.status = 'NEW';
      }
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: body
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erreur PUT customer:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}