import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const DEFAULT_BUSINESS_PARAMETERS = [
  {
    key: 'trial_calls_limit',
    value: '10',
    type: 'number',
    description: 'Nombre maximum d\'appels en période d\'essai',
    category: 'trial'
  },
  {
    key: 'trial_duration_days',
    value: '15',
    type: 'number',
    description: 'Durée de la période d\'essai en jours',
    category: 'trial'
  },
  {
    key: 'warning_calls_threshold',
    value: '8',
    type: 'number',
    description: 'Seuil d\'appels pour déclencher l\'email d\'avertissement',
    category: 'trial'
  },
  {
    key: 'warning_days_threshold',
    value: '3',
    type: 'number',
    description: 'Seuil de jours restants pour déclencher l\'avertissement',
    category: 'trial'
  },
  {
    key: 'deletion_delay_days',
    value: '5',
    type: 'number',
    description: 'Délai avant suppression définitive après blocage',
    category: 'trial'
  },
  {
    key: 'auto_telnyx_blocking',
    value: 'true',
    type: 'boolean',
    description: 'Bloquer automatiquement les numéros Telnyx en fin de trial',
    category: 'communication'
  },
  {
    key: 'billing_currency',
    value: 'EUR',
    type: 'string',
    description: 'Devise par défaut pour la facturation',
    category: 'billing'
  },
  {
    key: 'ai_model_default',
    value: 'gpt-4',
    type: 'string',
    description: 'Modèle IA par défaut pour les nouveaux restaurants',
    category: 'features'
  }
];

// POST - Réinitialiser les paramètres d'un business aux valeurs par défaut
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requis' },
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

    // Supprimer tous les paramètres existants pour ce business
    await prisma.settings.deleteMany({
      where: {
        key: {
          startsWith: `business_${businessId}_`
        }
      }
    });

    // Créer les paramètres par défaut
    const createdParameters = [];
    for (const param of DEFAULT_BUSINESS_PARAMETERS) {
      const settingKey = `business_${businessId}_${param.key}`;
      
      const created = await prisma.settings.create({
        data: {
          key: settingKey,
          value: param.value,
          description: `${param.description} (${business.name})`
        }
      });

      createdParameters.push({
        id: created.id,
        businessId,
        key: param.key,
        value: param.value,
        type: param.type,
        description: param.description,
        category: param.category,
        isEditable: true,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      });
    }

    console.log(`✅ Paramètres réinitialisés pour business ${businessId}: ${createdParameters.length} paramètres`);

    return NextResponse.json({
      success: true,
      businessId,
      parameters: createdParameters,
      message: `${createdParameters.length} paramètres réinitialisés`
    });

  } catch (error) {
    console.error('❌ Erreur reset business parameters:', error);
    return NextResponse.json(
      { error: 'Erreur réinitialisation paramètres' },
      { status: 500 }
    );
  }
}