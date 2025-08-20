import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les types métiers actifs pour la sélection client
export async function GET() {
  try {
    const categories = await prisma.businessCategoryConfig.findMany({
      where: { isActive: true },
      select: {
        category: true,
        displayName: true,
        defaultParams: true,
        availableOptions: true
      },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json(categories);

  } catch (error) {
    console.error('❌ Erreur GET business-categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}