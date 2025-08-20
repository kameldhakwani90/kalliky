import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { initializeDefaultSettings } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création des données de test...');

  // Initialiser les settings par défaut
  await initializeDefaultSettings();

  // Créer un admin (ou le récupérer s'il existe)
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@kalliky.com' }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@kalliky.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'Kalliky',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('👤 Admin créé:', admin.email);
  } else {
    console.log('👤 Admin existant trouvé:', admin.email);
  }

  // Créer des clients de test
  const clients = [
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@restaurant1.com',
      phone: '+33 1 23 45 67 89',
      company: 'Restaurant Le Gourmet',
      plan: 'STARTER',
      period: 'MONTHLY',
      paymentType: 'MANUAL',
      isActive: true
    },
    {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie@bistro.com',
      phone: '+33 1 98 76 54 32',
      company: 'Bistro Marie',
      plan: 'PRO',
      period: 'YEARLY',
      paymentType: 'MANUAL',
      isActive: false
    },
    {
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre@pizza.com',
      phone: '+33 1 11 22 33 44',
      company: 'Pizza Express',
      plan: 'BUSINESS',
      period: 'MONTHLY',
      paymentType: 'STRIPE_AUTO',
      isActive: true
    }
  ];

  for (const clientData of clients) {
    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email: clientData.email }
    });

    if (!user) {
      // Créer l'utilisateur
      user = await prisma.user.create({
        data: {
          email: clientData.email,
          password: await bcrypt.hash('password123', 10),
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phone: clientData.phone,
          role: 'CLIENT'
        }
      });
    }

    // Créer le business
    const business = await prisma.business.create({
      data: {
        name: clientData.company,
        type: 'PRODUCTS',
        ownerId: user.id
      }
    });

    // Calculer les dates d'abonnement
    const startDate = new Date();
    const endDate = new Date();
    
    if (clientData.period === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Créer l'abonnement
    const subscription = await prisma.subscription.create({
      data: {
        businessId: business.id,
        plan: clientData.plan as any,
        period: clientData.period as any,
        paymentType: clientData.paymentType as any,
        status: clientData.isActive ? 'active' : 'inactive',
        isActive: clientData.isActive,
        autoRenew: clientData.paymentType === 'STRIPE_AUTO',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        nextBillingDate: clientData.paymentType === 'STRIPE_AUTO' ? endDate : null,
        notes: `Compte ${clientData.paymentType === 'MANUAL' ? 'manuel' : 'Stripe'} créé par seed`
      }
    });

    // Créer quelques stores pour chaque client
    for (let i = 1; i <= Math.floor(Math.random() * 3) + 1; i++) {
      await prisma.store.create({
        data: {
          name: `${clientData.company} - Point ${i}`,
          address: `${i} Rue Example, 75001 Paris`,
          city: 'Paris',
          businessId: business.id,
          hasProducts: true,
          hasReservations: Math.random() > 0.5,
          hasConsultations: Math.random() > 0.7
        }
      });
    }

    // Créer quelques factures pour chaque client
    const planPrices = {
      'STARTER': 129,
      'PRO': 329,
      'BUSINESS': 800
    };
    
    const basePrice = planPrices[clientData.plan as keyof typeof planPrices];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Créer 3-5 factures des mois précédents
    const invoiceCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < invoiceCount; i++) {
      const invoiceDate = new Date(currentYear, currentMonth - i - 1, 1);
      const invoiceNumber = `INV-${currentYear}-${String(currentMonth - i).padStart(3, '0')}-${user.id.slice(-4)}`;
      
      await prisma.invoice.upsert({
        where: { invoiceNumber },
        update: {},
        create: {
          invoiceNumber,
          businessId: business.id,
          amount: basePrice,
          status: 'paid',
          dueDate: new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 1),
          paidAt: new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 15),
          createdAt: invoiceDate
        }
      });
    }

    console.log(`✅ Client créé: ${clientData.firstName} ${clientData.lastName} (${clientData.company}) avec ${invoiceCount} factures`);
  }

  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });