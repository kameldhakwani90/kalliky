import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_BASE_URL = 'https://api.telnyx.com/v2';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// POST - Créer un numéro virtuel Telnyx
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, businessId, country = 'FR' } = await request.json();

    if (!storeId || !businessId) {
      return NextResponse.json({ error: 'storeId et businessId requis' }, { status: 400 });
    }

    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          id: businessId,
          ownerId: session.user.id
        }
      },
      include: {
        business: {
          include: {
            phoneNumbers: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé ou non autorisé' }, { status: 404 });
    }

    // Vérifier si un numéro existe déjà
    if (store.business.phoneNumbers.length > 0) {
      return NextResponse.json({ error: 'Un numéro existe déjà pour cette boutique' }, { status: 400 });
    }

    // 1. Rechercher les numéros disponibles
    const searchResponse = await fetch(`${TELNYX_BASE_URL}/available_phone_numbers?filter[country_code]=${country}&filter[features][]=voice&filter[limit]=5`, {
      headers: {
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error('Erreur lors de la recherche de numéros disponibles');
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.data || searchData.data.length === 0) {
      return NextResponse.json({ error: 'Aucun numéro disponible' }, { status: 404 });
    }

    // 2. Réserver le premier numéro disponible
    const selectedNumber = searchData.data[0];
    
    const reserveResponse = await fetch(`${TELNYX_BASE_URL}/phone_number_orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_numbers: [{ phone_number: selectedNumber.phone_number }],
        connection_id: process.env.TELNYX_CONNECTION_ID, // À configurer
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID // À configurer
      })
    });

    if (!reserveResponse.ok) {
      throw new Error('Erreur lors de la réservation du numéro');
    }

    const reserveData = await reserveResponse.json();

    // 3. Sauvegarder en base de données
    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        number: selectedNumber.phone_number,
        telnyxId: reserveData.data.id,
        businessId: businessId,
        isActive: true,
        isPrimary: true
      }
    });

    // 4. Mettre à jour les settings du store
    const currentSettings = store.settings as any || {};
    const updatedSettings = {
      ...currentSettings,
      telnyxConfigured: true,
      telnyxNumber: selectedNumber.phone_number,
      telnyxOrderId: reserveData.data.id
    };

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: updatedSettings
      }
    });

    return NextResponse.json({
      success: true,
      phoneNumber: selectedNumber.phone_number,
      telnyxId: reserveData.data.id,
      orderId: reserveData.data.id
    });

  } catch (error: any) {
    console.error('Error creating Telnyx phone number:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur lors de la création du numéro' 
    }, { status: 500 });
  }
}

// GET - Récupérer les numéros Telnyx d'un business
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId requis' }, { status: 400 });
    }

    // Récupérer les numéros du business
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        business: {
          id: businessId,
          ownerId: session.user.id
        }
      }
    });

    return NextResponse.json({ phoneNumbers });

  } catch (error: any) {
    console.error('Error fetching phone numbers:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des numéros' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un numéro Telnyx
export async function DELETE(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumberId } = await request.json();

    if (!phoneNumberId) {
      return NextResponse.json({ error: 'phoneNumberId requis' }, { status: 400 });
    }

    // Vérifier que le numéro appartient à l'utilisateur
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Numéro non trouvé ou non autorisé' }, { status: 404 });
    }

    // 1. Libérer le numéro chez Telnyx
    if (phoneNumber.telnyxId) {
      await fetch(`${TELNYX_BASE_URL}/phone_numbers/${phoneNumber.telnyxId}/actions/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // 2. Supprimer de la base de données
    await prisma.phoneNumber.delete({
      where: { id: phoneNumberId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du numéro' 
    }, { status: 500 });
  }
}