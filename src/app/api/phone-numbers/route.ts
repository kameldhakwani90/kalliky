import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { number, telnyxId, businessId } = await request.json();

    // Validation des données
    if (!number || !telnyxId || !businessId) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const newNumber = await prisma.phoneNumber.create({
      data: {
        number,
        telnyxId,
        businessId
      }
    });

    return NextResponse.json(newNumber, { status: 201 });

  } catch (error) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { error: 'Erreur de base de données' },
      { status: 500 }
    );
  }
}