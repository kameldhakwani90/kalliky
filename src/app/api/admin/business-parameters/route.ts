import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET - Récupérer tous les paramètres business
export async function GET(request: NextRequest) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    // Récupérer tous les business avec leurs paramètres
    const businesses = await prisma.business.findMany({
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            stores: true,
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Pour l'instant, nous simulons les paramètres business
    // Dans une version future, on pourrait créer une table BusinessParameters
    const parameters: Record<string, any[]> = {};
    
    // Simuler quelques paramètres existants pour démo
    businesses.slice(0, 2).forEach(business => {
      parameters[business.id] = [
        {
          id: `param_${business.id}_1`,
          businessId: business.id,
          key: 'trial_calls_limit',
          value: '10',
          type: 'number',
          description: 'Nombre maximum d\'appels en période d\'essai',
          category: 'trial',
          isEditable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    });

    const defaultParameters = [
      {
        id: 'default_1',
        businessId: '',
        key: 'trial_calls_limit',
        value: '10',
        type: 'number',
        description: 'Nombre maximum d\'appels en période d\'essai',
        category: 'trial',
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'default_2',
        businessId: '',
        key: 'trial_duration_days',
        value: '15',
        type: 'number',
        description: 'Durée de la période d\'essai en jours',
        category: 'trial',
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      businesses,
      parameters,
      defaultParameters
    });

  } catch (error) {
    console.error('❌ Erreur GET business parameters:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour un paramètre business
export async function POST(request: NextRequest) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { businessId, key, value, type, description, category } = body;

    // Validation
    if (!businessId || !key || !value) {
      return NextResponse.json(
        { error: 'businessId, key et value requis' },
        { status: 400 }
      );
    }

    // Vérifier que le business existe
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business non trouvé' },
        { status: 404 }
      );
    }

    // Pour l'instant, nous utilisons les settings existants pour stocker les paramètres business
    // La clé sera au format "business_{businessId}_{key}"
    const settingKey = `business_${businessId}_${key}`;
    
    await prisma.settings.upsert({
      where: { key: settingKey },
      update: { 
        value,
        description: description || `Paramètre ${key} pour ${business.name}`
      },
      create: {
        key: settingKey,
        value,
        description: description || `Paramètre ${key} pour ${business.name}`
      }
    });

    console.log(`✅ Paramètre business sauvé: ${settingKey} = ${value}`);

    return NextResponse.json({
      success: true,
      parameter: {
        businessId,
        key,
        value,
        type: type || 'string',
        description,
        category: category || 'general'
      }
    });

  } catch (error) {
    console.error('❌ Erreur POST business parameter:', error);
    return NextResponse.json(
      { error: 'Erreur sauvegarde paramètre' },
      { status: 500 }
    );
  }
}