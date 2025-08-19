import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer tous les clients d'un business
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requis' },
        { status: 400 }
      );
    }

    const where: any = { businessId };

    // Recherche par téléphone ou nom
    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { lastSeen: 'desc' }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Erreur GET customers:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      phone,
      firstName,
      lastName,
      email,
      businessId
    } = body;

    if (!phone || !businessId) {
      return NextResponse.json(
        { error: 'Téléphone et businessId requis' },
        { status: 400 }
      );
    }

    // Vérifier si le client existe déjà pour ce business
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        phone_businessId: {
          phone,
          businessId
        }
      }
    });

    if (existingCustomer) {
      return NextResponse.json(existingCustomer);
    }

    const customer = await prisma.customer.create({
      data: {
        phone,
        firstName,
        lastName,
        email,
        businessId,
        status: 'NEW'
      }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Erreur POST customer:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}