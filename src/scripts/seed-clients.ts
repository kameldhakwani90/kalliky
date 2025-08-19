import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ajout de clients SaaS de test...');

  // Client 1 - Restaurant
  const client1Password = await bcrypt.hash('client1234', 10);
  
  const client1 = await prisma.user.upsert({
    where: { email: 'jean.dupont@bistrot.fr' },
    update: {},
    create: {
      email: 'jean.dupont@bistrot.fr',
      password: client1Password,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33 1 23 45 67 89',
      role: 'CLIENT'
    }
  });

  console.log('✅ Client 1 créé:', client1.email);

  // Business du client 1
  const business1 = await prisma.business.upsert({
    where: { id: 'business-bistrot-1' },
    update: {},
    create: {
      id: 'business-bistrot-1',
      name: 'Le Bistrot Parisien',
      type: 'PRODUCTS',
      ownerId: client1.id
    }
  });

  // Abonnement du client 1
  await prisma.subscription.upsert({
    where: { businessId: business1.id },
    update: {},
    create: {
      businessId: business1.id,
      plan: 'PRO',
      status: 'active',
      currentPeriodStart: new Date('2024-01-15'),
      currentPeriodEnd: new Date('2025-01-15')
    }
  });

  // Stores du client 1
  const store1 = await prisma.store.upsert({
    where: { id: 'store-bistrot-1' },
    update: {},
    create: {
      id: 'store-bistrot-1',
      name: 'Le Bistrot Parisien - République',
      address: '12 Place de la République, 75011 Paris',
      phone: '01 23 45 67 89',
      businessId: business1.id,
      currency: 'EUR',
      taxRate: 10,
      status: 'active'
    }
  });

  const store2 = await prisma.store.upsert({
    where: { id: 'store-bistrot-2' },
    update: {},
    create: {
      id: 'store-bistrot-2',
      name: 'Le Bistrot Parisien - Bastille',
      address: '8 Rue de la Bastille, 75012 Paris',
      phone: '01 23 45 67 90',
      businessId: business1.id,
      currency: 'EUR',
      taxRate: 10,
      status: 'active'
    }
  });

  // Client fictif pour commandes
  const customer1 = await prisma.customer.upsert({
    where: {
      phone_businessId: {
        phone: '0612345678',
        businessId: business1.id
      }
    },
    update: {},
    create: {
      phone: '0612345678',
      firstName: 'Alice',
      lastName: 'Martin',
      businessId: business1.id,
      status: 'REGULAR',
      totalSpent: 250.50,
      orderCount: 5
    }
  });

  // Quelques commandes pour générer du revenu
  for (let i = 1; i <= 5; i++) {
    await prisma.order.create({
      data: {
        orderNumber: `#200${i}`,
        customerId: customer1.id,
        storeId: i <= 3 ? store1.id : store2.id,
        businessId: business1.id,
        items: [
          {
            id: `item-${i}`,
            name: 'Plat du jour',
            quantity: 1,
            basePrice: 18.50,
            customizations: [],
            finalPrice: 18.50
          }
        ],
        subtotal: 18.50,
        tax: 1.85,
        taxRate: 10,
        total: 20.35,
        status: 'DELIVERED'
      }
    });
  }

  console.log('✅ Business 1 et commandes créés');

  // Client 2 - Pizzeria
  const client2Password = await bcrypt.hash('pizza2024', 10);
  
  const client2 = await prisma.user.upsert({
    where: { email: 'marie.rossi@pizzabella.fr' },
    update: {},
    create: {
      email: 'marie.rossi@pizzabella.fr',
      password: client2Password,
      firstName: 'Marie',
      lastName: 'Rossi',
      phone: '+33 6 12 34 56 78',
      role: 'CLIENT'
    }
  });

  console.log('✅ Client 2 créé:', client2.email);

  // Business du client 2
  const business2 = await prisma.business.upsert({
    where: { id: 'business-pizza-1' },
    update: {},
    create: {
      id: 'business-pizza-1',
      name: 'Pizzeria Bella',
      type: 'PRODUCTS',
      ownerId: client2.id
    }
  });

  // Abonnement du client 2
  await prisma.subscription.upsert({
    where: { businessId: business2.id },
    update: {},
    create: {
      businessId: business2.id,
      plan: 'STARTER',
      status: 'active',
      currentPeriodStart: new Date('2024-03-01'),
      currentPeriodEnd: new Date('2025-03-01')
    }
  });

  // Store du client 2
  const store3 = await prisma.store.upsert({
    where: { id: 'store-pizza-1' },
    update: {},
    create: {
      id: 'store-pizza-1',
      name: 'Pizzeria Bella',
      address: '15 Rue de la Roquette, 75011 Paris',
      phone: '01 98 76 54 32',
      businessId: business2.id,
      currency: 'EUR',
      taxRate: 5.5,
      status: 'active'
    }
  });

  // Client fictif pour pizzeria
  const customer2 = await prisma.customer.upsert({
    where: {
      phone_businessId: {
        phone: '0687654321',
        businessId: business2.id
      }
    },
    update: {},
    create: {
      phone: '0687654321',
      firstName: 'Paul',
      lastName: 'Durand',
      businessId: business2.id,
      status: 'NEW',
      totalSpent: 89.50,
      orderCount: 3
    }
  });

  // Quelques commandes pour la pizzeria
  for (let i = 1; i <= 3; i++) {
    await prisma.order.create({
      data: {
        orderNumber: `#300${i}`,
        customerId: customer2.id,
        storeId: store3.id,
        businessId: business2.id,
        items: [
          {
            id: `pizza-${i}`,
            name: 'Pizza Margherita',
            quantity: 1,
            basePrice: 14.00,
            customizations: [],
            finalPrice: 14.00
          }
        ],
        subtotal: 14.00,
        tax: 0.77,
        taxRate: 5.5,
        total: 14.77,
        status: 'DELIVERED'
      }
    });
  }

  console.log('✅ Business 2 et commandes créés');

  console.log('🎉 Clients SaaS ajoutés avec succès !');
  console.log('');
  console.log('Clients créés :');
  console.log('📧 Client 1: jean.dupont@bistrot.fr / client1234');
  console.log('   - Entreprise: Le Bistrot Parisien');
  console.log('   - Plan: PRO');
  console.log('   - 2 points de vente');
  console.log('   - 5 commandes (101.75€ de revenus)');
  console.log('');
  console.log('📧 Client 2: marie.rossi@pizzabella.fr / pizza2024');
  console.log('   - Entreprise: Pizzeria Bella');
  console.log('   - Plan: STARTER');
  console.log('   - 1 point de vente');
  console.log('   - 3 commandes (44.31€ de revenus)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });