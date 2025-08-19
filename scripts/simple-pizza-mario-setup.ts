import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPizzaMario() {
  try {
    console.log('🧹 Nettoyage complet...');
    
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    // Supprimer tout brutalement (truncate)
    await prisma.$executeRaw`TRUNCATE TABLE "Customer", "Order", "Invoice", "Call", "Report", "Subscription", "PhoneNumber", "NotificationConfig", "AIConversationSession", "Product", "UniversalService", "ServiceResource", "Store", "Business" RESTART IDENTITY CASCADE;`;

    console.log('✅ Nettoyage terminé');

    // Créer Pizza Mario
    console.log('🍕 Création de Pizza Mario...');

    const business = await prisma.business.create({
      data: {
        name: 'Pizza Mario',
        ownerId: user.id
      }
    });

    const store = await prisma.store.create({
      data: {
        name: 'Pizza Mario',
        address: '123 Rue de la Pizza, 75001 Paris',
        businessId: business.id,
        isActive: true,
        hasProducts: true,
        hasReservations: false,
        hasConsultations: false,
        productsConfig: {
          categories: ['Pizzas', 'Boissons', 'Desserts', 'Entrées'],
          currency: 'EUR',
          taxRate: 20,
          deliveryEnabled: true,
          takeawayEnabled: true
        }
      }
    });

    // Créer quelques produits simples
    console.log('🍕 Création des produits...');

    const products = [
      {
        name: 'Pizza Margherita',
        description: 'Tomate, mozzarella, basilic frais',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Pepperoni',
        description: 'Tomate, mozzarella, pepperoni',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Quattro Stagioni',
        description: 'Tomate, mozzarella, jambon, champignons, artichauts, olives',
        category: 'Pizzas'
      },
      {
        name: 'Coca-Cola 33cl',
        description: 'Canette de Coca-Cola',
        category: 'Boissons'
      },
      {
        name: 'Tiramisu',
        description: 'Dessert italien traditionnel au café et mascarpone',
        category: 'Desserts'
      }
    ];

    for (const productData of products) {
      await prisma.product.create({
        data: {
          ...productData,
          storeId: store.id,
          status: 'ACTIVE'
        }
      });
    }

    // Créer quelques clients
    console.log('👥 Création des clients...');

    const customers = [
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@email.com',
        phone: '06 12 34 56 78',
        businessId: business.id
      },
      {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@email.com',
        phone: '06 98 76 54 32',
        businessId: business.id
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = await prisma.customer.create({
        data: customerData
      });
      createdCustomers.push(customer);
    }

    // Créer quelques commandes
    console.log('📦 Création des commandes...');

    await prisma.order.create({
      data: {
        orderNumber: 'PM0001',
        customerId: createdCustomers[0].id,
        storeId: store.id,
        businessId: business.id,
        items: [
          { name: 'Pizza Margherita', quantity: 2, price: 12.50 },
          { name: 'Coca-Cola 33cl', quantity: 2, price: 2.50 }
        ],
        subtotal: 30.00,
        tax: 6.00,
        taxRate: 20.0,
        total: 36.00,
        status: 'DELIVERED',
        paymentStatus: 'PAID'
      }
    });

    await prisma.order.create({
      data: {
        orderNumber: 'PM0002',
        customerId: createdCustomers[1].id,
        storeId: store.id,
        businessId: business.id,
        items: [
          { name: 'Pizza Pepperoni', quantity: 1, price: 14.00 },
          { name: 'Tiramisu', quantity: 1, price: 5.50 }
        ],
        subtotal: 19.50,
        tax: 3.90,
        taxRate: 20.0,
        total: 23.40,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });

    console.log('🎉 Configuration Pizza Mario terminée !');
    console.log(`🏪 Store ID: ${store.id}`);
    console.log(`📊 Produits: ${products.length}`);
    console.log(`👥 Clients: ${customers.length}`);
    console.log(`📦 Commandes: 2`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPizzaMario();