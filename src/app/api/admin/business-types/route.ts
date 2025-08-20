import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authService } from '@/services/auth.service';

// GET - Récupérer toutes les configurations métiers
export async function GET(request: NextRequest) {
  try {
    // Vérifier les droits super admin
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const configs = await prisma.businessCategoryConfig.findMany({
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json(configs);

  } catch (error) {
    console.error('❌ Erreur GET business-types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle configuration métier
export async function POST(request: NextRequest) {
  try {
    // Vérifier les droits super admin
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validation des données
    if (!data.category || !data.displayName || !data.systemPrompt) {
      return NextResponse.json({ 
        error: 'Champs obligatoires manquants' 
      }, { status: 400 });
    }

    // Vérifier que la catégorie n'existe pas déjà
    const existing = await prisma.businessCategoryConfig.findUnique({
      where: { category: data.category }
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Cette catégorie existe déjà' 
      }, { status: 400 });
    }

    const newConfig = await prisma.businessCategoryConfig.create({
      data: {
        category: data.category,
        displayName: data.displayName,
        systemPrompt: data.systemPrompt,
        defaultParams: data.defaultParams || {},
        availableOptions: data.availableOptions || [],
        createdBy: user.id,
        lastModifiedBy: user.id
      }
    });

    return NextResponse.json(newConfig, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur POST business-types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}