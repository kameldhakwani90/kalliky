import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { telnyxAutoPurchase } from '@/lib/telnyx';
import { prisma } from '@/lib/prisma';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// POST - Achat automatique d'un numéro pour une boutique
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, storeId, countryCode } = body;

    if (!businessId || !storeId || !countryCode) {
      return NextResponse.json({ 
        error: 'businessId, storeId et countryCode requis' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur possède ce business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: session.user.id,
      },
    });

    if (!business) {
      return NextResponse.json({ 
        error: 'Business non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier qu'il n'y a pas déjà un numéro actif
    const existingNumber = await prisma.phoneNumber.findFirst({
      where: {
        businessId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (existingNumber) {
      return NextResponse.json({ 
        error: 'Un numéro est déjà attribué à ce business',
        phoneNumber: existingNumber.number,
      }, { status: 409 });
    }

    // Lancer l'achat automatique
    const phoneNumber = await telnyxAutoPurchase.purchaseNumberForStore(
      businessId,
      storeId,
      countryCode
    );

    return NextResponse.json({
      success: true,
      phoneNumber,
      message: `Numéro ${phoneNumber} acheté et configuré avec succès`,
    });

  } catch (error) {
    console.error('Error auto-purchasing number:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur lors de l\'achat automatique' 
    }, { status: 500 });
  }
}

// GET - Vérifier le statut d'achat pour un business
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ 
        error: 'businessId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: session.user.id,
      },
    });

    if (!business) {
      return NextResponse.json({ 
        error: 'Business non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Récupérer tous les numéros de ce business
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      phoneNumbers,
      activeNumber: phoneNumbers.find(p => p.status === 'ACTIVE'),
      totalCost: phoneNumbers
        .filter(p => p.status === 'ACTIVE')
        .reduce((sum, p) => sum + p.monthlyPrice, 0),
    });

  } catch (error) {
    console.error('Error checking purchase status:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification du statut' 
    }, { status: 500 });
  }
}