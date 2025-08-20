import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les clients SaaS (utilisateurs avec rôle CLIENT)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');

    const where: any = {
      role: 'CLIENT'
    };

    // Recherche par nom, email, etc.
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businesses: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const clients = await prisma.user.findMany({
      where,
      include: {
        businesses: {
          include: {
            stores: {
              include: {
                subscription: true
              }
            },
            orders: true,
            _count: {
              select: { stores: true, orders: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transformer les données pour correspondre à l'interface frontend
    const transformedClients = clients.map(client => {
      const business = client.businesses[0]; // Premier business du client
      const subscription = business?.subscription;
      const totalRevenue = business?.orders.reduce((sum: number, order: any) => sum + order.total, 0) || 0;
      
      return {
        id: client.id,
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email,
        phone: client.phone,
        company: business?.name || 'Aucune entreprise',
        plan: subscription?.plan || 'STARTER',
        period: subscription?.period || 'MONTHLY',
        paymentType: subscription?.paymentType || 'STRIPE_AUTO',
        status: subscription?.status || 'inactive',
        isActive: subscription?.isActive || false,
        subscriptionStart: subscription?.currentPeriodStart?.toISOString().split('T')[0] || '',
        subscriptionEnd: subscription?.currentPeriodEnd?.toISOString().split('T')[0] || '',
        nextBillingDate: subscription?.nextBillingDate?.toISOString().split('T')[0] || '',
        autoRenew: subscription?.autoRenew || false,
        totalRevenue,
        storesCount: business?._count.stores || 0,
        lastLogin: client.updatedAt.toISOString().split('T')[0],
        stripeCustomerId: subscription?.stripeCustomerId || client.stripeCustomerId,
        createdAt: client.createdAt.toISOString().split('T')[0]
      };
    });

    // Filtrer par plan si spécifié
    let filteredClients = transformedClients;
    if (plan && plan !== 'all') {
      filteredClients = filteredClients.filter(client => client.plan === plan);
    }

    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      filteredClients = filteredClients.filter(client => client.status === status);
    }

    return NextResponse.json(filteredClients);

  } catch (error) {
    console.error('Erreur GET admin clients:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau client SaaS
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      plan = 'STARTER',
      period = 'MONTHLY',
      paymentType = 'MANUAL', // Par défaut manuel pour les comptes test
      isActive = true,
      autoRenew = false
    } = body;

    if (!firstName || !lastName || !email || !company) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur et le business en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email,
          password: 'temp_password_123', // Mot de passe temporaire
          firstName,
          lastName,
          phone,
          role: 'CLIENT'
        }
      });

      // Créer le business
      const business = await tx.business.create({
        data: {
          name: company,
          type: 'PRODUCTS',
          ownerId: user.id
        }
      });

      // Calculer les dates d'abonnement
      const startDate = new Date();
      const endDate = new Date();
      const nextBilling = new Date();
      
      if (period === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }

      // Créer l'abonnement
      const subscription = await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: plan as any,
          period: period as any,
          paymentType: paymentType as any,
          status: paymentType === 'MANUAL' ? 'active' : 'trial',
          isActive,
          autoRenew,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          nextBillingDate: paymentType === 'STRIPE_AUTO' ? nextBilling : null,
          notes: paymentType === 'MANUAL' ? 'Compte test créé manuellement par admin' : null
        }
      });

      return { user, business, subscription };
    });

    // Envoyer l'email de bienvenue en arrière-plan
    const tempPassword = 'temp_password_123'; // Le même que dans la création
    try {
      await emailService.sendWelcomeEmail({
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        email: result.user.email,
        company: result.business.name,
        plan: result.subscription.plan,
        tempPassword
      });
      console.log('✅ Email de bienvenue envoyé à:', result.user.email);
    } catch (emailError) {
      // Ne pas faire échouer la création du client si l'email échoue
      console.error('⚠️ Erreur envoi email (client créé quand même):', emailError);
    }

    return NextResponse.json({
      message: 'Client créé avec succès',
      client: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phone: result.user.phone,
        company: result.business.name,
        plan: result.subscription.plan,
        status: result.subscription.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST admin client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du client' },
      { status: 500 }
    );
  }
}