import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { isActive } = await request.json();
    const { id } = await params;

    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: {
        id: id,
        business: {
          ownerId: decoded.userId
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
    }

    // Mettre à jour le statut
    await prisma.store.update({
      where: { id: id },
      data: { isActive }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Toggle store status error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}