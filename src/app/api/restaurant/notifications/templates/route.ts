import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer tous les templates de notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const businessId = searchParams.get('businessId');
    const type = searchParams.get('type'); // EMAIL, WHATSAPP, SMS, etc.

    if (!storeId || !businessId) {
      return NextResponse.json({ error: 'storeId et businessId requis' }, { status: 400 });
    }

    const where: any = {
      storeId,
      businessId
    };

    if (type) {
      where.type = type;
    }

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(templates);

  } catch (error) {
    console.error('Erreur API notifications templates GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      storeId, 
      businessId, 
      name, 
      type, 
      subject, 
      content, 
      variables,
      isDefault = false 
    } = body;

    if (!storeId || !businessId || !name || !type || !content) {
      return NextResponse.json({ 
        error: 'storeId, businessId, name, type et content requis' 
      }, { status: 400 });
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        storeId,
        businessId,
        name,
        type,
        subject,
        content,
        variables,
        isDefault
      }
    });

    return NextResponse.json(template);

  } catch (error) {
    console.error('Erreur API notifications templates POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour un template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, subject, content, variables, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        name,
        subject,
        content,
        variables,
        isDefault,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(template);

  } catch (error) {
    console.error('Erreur API notifications templates PUT:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    await prisma.notificationTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur API notifications templates DELETE:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}