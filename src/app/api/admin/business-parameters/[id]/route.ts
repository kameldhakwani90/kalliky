import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// DELETE - Supprimer un paramètre business
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const { id } = await params;

    // Pour l'instant, l'ID correspond à une clé setting de format "business_{businessId}_{key}"
    // Nous devons trouver et supprimer ce setting
    const setting = await prisma.settings.findUnique({
      where: { id }
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Paramètre non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien un paramètre business
    if (!setting.key.startsWith('business_')) {
      return NextResponse.json(
        { error: 'Ce n\'est pas un paramètre business' },
        { status: 400 }
      );
    }

    await prisma.settings.delete({
      where: { id }
    });

    console.log(`✅ Paramètre business supprimé: ${setting.key}`);

    return NextResponse.json({
      success: true,
      deletedParameter: {
        id: setting.id,
        key: setting.key,
        value: setting.value
      }
    });

  } catch (error) {
    console.error('❌ Erreur DELETE business parameter:', error);
    return NextResponse.json(
      { error: 'Erreur suppression paramètre' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un paramètre business
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { value, description } = body;

    if (!value) {
      return NextResponse.json(
        { error: 'value requis' },
        { status: 400 }
      );
    }

    const setting = await prisma.settings.findUnique({
      where: { id }
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Paramètre non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien un paramètre business
    if (!setting.key.startsWith('business_')) {
      return NextResponse.json(
        { error: 'Ce n\'est pas un paramètre business' },
        { status: 400 }
      );
    }

    const updated = await prisma.settings.update({
      where: { id },
      data: {
        value,
        description: description || setting.description
      }
    });

    console.log(`✅ Paramètre business modifié: ${updated.key} = ${updated.value}`);

    return NextResponse.json({
      success: true,
      parameter: {
        id: updated.id,
        key: updated.key,
        value: updated.value,
        description: updated.description,
        updatedAt: updated.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur PUT business parameter:', error);
    return NextResponse.json(
      { error: 'Erreur modification paramètre' },
      { status: 500 }
    );
  }
}