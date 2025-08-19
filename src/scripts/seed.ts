import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Créer un super admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@kalliky.com' },
    update: {},
    create: {
      email: 'admin@kalliky.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Super Admin créé:', superAdmin.email);

  // Créer un utilisateur client test
  const clientPassword = await bcrypt.hash('client123', 10);
  
  const client = await prisma.user.upsert({
    where: { email: 'test@restaurant.com' },
    update: {},
    create: {
      email: 'test@restaurant.com',
      password: clientPassword,
      firstName: 'Restaurant',
      lastName: 'Test',
      role: 'CLIENT'
    }
  });

  console.log('✅ Client créé:', client.email);

  // Créer un business pour le client
  const business = await prisma.business.upsert({
    where: { id: 'business-test-1' },
    update: {},
    create: {
      id: 'business-test-1',
      name: 'Restaurant Test',
      type: 'PRODUCTS',
      ownerId: client.id
    }
  });

  console.log('✅ Business créé:', business.name);

  // Créer un abonnement
  await prisma.subscription.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      plan: 'PRO',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Créer quelques stores de test
  const store1 = await prisma.store.upsert({
    where: { id: 'store-test-1' },
    update: {},
    create: {
      id: 'store-test-1',
      name: 'Le Gourmet Parisien',
      address: '12 Rue de la Paix, 75002 Paris',
      phone: '01 23 45 67 89',
      businessId: business.id,
      currency: 'EUR',
      taxRate: 10,
      status: 'active'
    }
  });

  console.log('✅ Store créé:', store1.name);

  // Créer quelques clients de test
  const customer1 = await prisma.customer.upsert({
    where: {
      phone_businessId: {
        phone: '0612345678',
        businessId: business.id
      }
    },
    update: {},
    create: {
      phone: '0612345678',
      firstName: 'Alice',
      lastName: 'Martin',
      businessId: business.id,
      status: 'REGULAR',
      totalSpent: 150.50,
      orderCount: 3
    }
  });

  console.log('✅ Client créé:', customer1.firstName);

  // Créer quelques commandes de test
  const order1 = await prisma.order.create({
    data: {
      orderNumber: '#1001',
      customerId: customer1.id,
      storeId: store1.id,
      businessId: business.id,
      items: [
        {
          id: 'item-1',
          name: 'Burger Gourmet',
          quantity: 1,
          basePrice: 16.50,
          customizations: [
            { type: 'add', name: 'Bacon', price: 2.00 }
          ],
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

  console.log('✅ Commande créée:', order1.orderNumber);

  console.log('🎉 Seed terminé !');
  console.log('');
  console.log('Comptes de test créés :');
  console.log('📧 Super Admin: admin@kalliky.com / admin123');
  console.log('📧 Client: test@restaurant.com / client123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });