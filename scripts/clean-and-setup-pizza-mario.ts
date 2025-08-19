import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndSetupPizzaMario() {
  try {
    console.log('🧹 Nettoyage des données du client medkamel.dhakwani...');
    
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' },
      include: {
        businesses: {
          include: {
            stores: {
              include: {
                products: true,
                universalServices: true,
                serviceResources: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log(`📧 Utilisateur trouvé: ${user.email}`);

    // Supprimer toutes les données existantes
    for (const business of user.businesses) {
      console.log(`🏢 Nettoyage business: ${business.name}`);
      
      for (const store of business.stores) {
        console.log(`🏪 Nettoyage store: ${store.name}`);
        
        // Supprimer dans l'ordre pour éviter les contraintes FK
        try {
          await prisma.serviceResourceAssignment.deleteMany({ 
            where: { serviceResource: { storeId: store.id } } 
          });
        } catch (e) { console.log('⚠️ ServiceResourceAssignment non trouvé'); }
        
        try {
          await prisma.serviceResource.deleteMany({ where: { storeId: store.id } });
        } catch (e) { console.log('⚠️ ServiceResource non trouvé'); }
        
        try {
          await prisma.serviceVariant.deleteMany({ 
            where: { service: { storeId: store.id } } 
          });
        } catch (e) { console.log('⚠️ ServiceVariant non trouvé'); }
        
        try {
          await prisma.universalService.deleteMany({ where: { storeId: store.id } });
        } catch (e) { console.log('⚠️ UniversalService non trouvé'); }
        
        try {
          await prisma.product.deleteMany({ where: { storeId: store.id } });
        } catch (e) { console.log('⚠️ Product non trouvé'); }
      }
      
      // Supprimer tous les stores
      await prisma.store.deleteMany({ where: { businessId: business.id } });
      
      // Supprimer toutes les données liées au business
      await prisma.customer.deleteMany({ where: { businessId: business.id } });
      await prisma.order.deleteMany({ where: { businessId: business.id } });
      await prisma.invoice.deleteMany({ where: { businessId: business.id } });
      await prisma.call.deleteMany({ where: { businessId: business.id } });
      await prisma.report.deleteMany({ where: { businessId: business.id } });
      await prisma.subscription.deleteMany({ where: { businessId: business.id } });
      await prisma.phoneNumber.deleteMany({ where: { businessId: business.id } });
      await prisma.notificationConfig.deleteMany({ where: { businessId: business.id } });
      await prisma.aIConversationSession.deleteMany({ where: { businessId: business.id } });
    }

    // Supprimer tous les business
    await prisma.business.deleteMany({ where: { ownerId: user.id } });

    console.log('✅ Nettoyage terminé');

    // Créer Pizza Mario avec catalogue complet
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

    console.log('🍕 Création du catalogue produits...');

    // Créer les produits - Pizzas
    const pizzas = [
      {
        name: 'Pizza Margherita',
        description: 'Tomate, mozzarella, basilic frais',
        category: 'Pizzas',
        status: 'PUBLISHED'
      },
      {
        name: 'Pizza Pepperoni',
        description: 'Tomate, mozzarella, pepperoni',
        price: 14.00,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Quattro Stagioni',
        description: 'Tomate, mozzarella, jambon, champignons, artichauts, olives',
        price: 16.50,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Quattro Formaggi',
        description: 'Mozzarella, gorgonzola, parmesan, chèvre',
        price: 15.00,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Regina',
        description: 'Tomate, mozzarella, jambon, champignons',
        price: 13.50,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Diavola',
        description: 'Tomate, mozzarella, salami piquant, piments',
        price: 14.50,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Végétarienne',
        description: 'Tomate, mozzarella, courgettes, aubergines, poivrons, oignons',
        price: 13.00,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Prosciutto',
        description: 'Tomate, mozzarella, jambon de Parme, roquette',
        price: 17.00,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Calzone',
        description: 'Pizza fermée: tomate, mozzarella, jambon, champignons',
        price: 15.50,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      },
      {
        name: 'Pizza Marinara',
        description: 'Tomate, ail, origan, huile d\'olive (sans fromage)',
        price: 10.00,
        category: 'Pizzas',
        isAvailable: true,
        image: null
      }
    ];

    // Créer les produits - Entrées
    const entrees = [
      {
        name: 'Bruschetta Tomate',
        description: 'Pain grillé, tomates fraîches, basilic, huile d\'olive',
        price: 6.50,
        category: 'Entrées',
        isAvailable: true,
        image: null
      },
      {
        name: 'Antipasti Mixte',
        description: 'Charcuterie italienne, fromages, olives, légumes marinés',
        price: 12.00,
        category: 'Entrées',
        isAvailable: true,
        image: null
      },
      {
        name: 'Salade César',
        description: 'Salade verte, poulet, parmesan, croûtons, sauce César',
        price: 9.50,
        category: 'Entrées',
        isAvailable: true,
        image: null
      },
      {
        name: 'Carpaccio de Bœuf',
        description: 'Fines lamelles de bœuf, roquette, parmesan, huile d\'olive',
        price: 11.00,
        category: 'Entrées',
        isAvailable: true,
        image: null
      }
    ];

    // Créer les produits - Boissons
    const boissons = [
      {
        name: 'Coca-Cola 33cl',
        description: 'Canette de Coca-Cola',
        price: 2.50,
        category: 'Boissons',
        isAvailable: true,
        image: null
      },
      {
        name: 'Orangina 33cl',
        description: 'Canette d\'Orangina',
        price: 2.50,
        category: 'Boissons',
        isAvailable: true,
        image: null
      },
      {
        name: 'Eau Minérale 50cl',
        description: 'Bouteille d\'eau minérale',
        price: 2.00,
        category: 'Boissons',
        isAvailable: true,
        image: null
      },
      {
        name: 'Bière Peroni 33cl',
        description: 'Bière italienne Peroni',
        price: 3.50,
        category: 'Boissons',
        isAvailable: true,
        image: null
      },
      {
        name: 'Vin Rouge (verre)',
        description: 'Verre de vin rouge italien',
        price: 4.00,
        category: 'Boissons',
        isAvailable: true,
        image: null
      },
      {
        name: 'Vin Blanc (verre)',
        description: 'Verre de vin blanc italien',
        price: 4.00,
        category: 'Boissons',
        isAvailable: true,
        image: null
      },
      {
        name: 'Café Espresso',
        description: 'Café espresso italien',
        price: 2.00,
        category: 'Boissons',
        isAvailable: true,
        image: null
      }
    ];

    // Créer les produits - Desserts
    const desserts = [
      {
        name: 'Tiramisu',
        description: 'Dessert italien traditionnel au café et mascarpone',
        price: 5.50,
        category: 'Desserts',
        isAvailable: true,
        image: null
      },
      {
        name: 'Panna Cotta',
        description: 'Crème italienne aux fruits rouges',
        price: 4.50,
        category: 'Desserts',
        isAvailable: true,
        image: null
      },
      {
        name: 'Gelato Vanille',
        description: 'Glace artisanale à la vanille',
        price: 4.00,
        category: 'Desserts',
        isAvailable: true,
        image: null
      },
      {
        name: 'Gelato Chocolat',
        description: 'Glace artisanale au chocolat',
        price: 4.00,
        category: 'Desserts',
        isAvailable: true,
        image: null
      },
      {
        name: 'Cannoli Siciliens',
        description: 'Pâtisseries siciliennes à la ricotta (2 pièces)',
        price: 6.00,
        category: 'Desserts',
        isAvailable: true,
        image: null
      }
    ];

    // Insérer tous les produits
    const allProducts = [...pizzas, ...entrees, ...boissons, ...desserts];
    
    for (const productData of allProducts) {
      await prisma.product.create({
        data: {
          ...productData,
          storeId: store.id
        }
      });
    }

    console.log(`✅ ${allProducts.length} produits créés`);

    // Créer des clients et commandes d'exemple
    console.log('👥 Création des clients...');

    const customers = [
      {
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '06 12 34 56 78'
      },
      {
        name: 'Marie Martin',
        email: 'marie.martin@email.com',
        phone: '06 98 76 54 32'
      },
      {
        name: 'Pierre Dubois',
        email: 'pierre.dubois@email.com',
        phone: '06 11 22 33 44'
      },
      {
        name: 'Sophie Leroy',
        email: 'sophie.leroy@email.com',
        phone: '06 55 44 33 22'
      },
      {
        name: 'Antoine Moreau',
        email: 'antoine.moreau@email.com',
        phone: '06 77 88 99 00'
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = await prisma.customer.create({
        data: {
          ...customerData,
          businessId: business.id
        }
      });
      createdCustomers.push(customer);
    }

    console.log(`✅ ${createdCustomers.length} clients créés`);

    // Créer des commandes d'exemple
    console.log('📦 Création des commandes d\'exemple...');

    const orders = [
      {
        customerId: createdCustomers[0].id,
        items: [
          { productName: 'Pizza Margherita', quantity: 2, price: 12.50 },
          { productName: 'Coca-Cola 33cl', quantity: 2, price: 2.50 }
        ],
        subtotal: 30.00,
        tax: 6.00,
        taxRate: 20.0,
        total: 36.00,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: createdCustomers[1].id,
        items: [
          { productName: 'Pizza Quattro Stagioni', quantity: 1, price: 16.50 },
          { productName: 'Tiramisu', quantity: 1, price: 5.50 },
          { productName: 'Bière Peroni 33cl', quantity: 1, price: 3.50 }
        ],
        subtotal: 25.50,
        tax: 5.10,
        taxRate: 20.0,
        total: 30.60,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: createdCustomers[2].id,
        items: [
          { productName: 'Pizza Pepperoni', quantity: 1, price: 14.00 },
          { productName: 'Salade César', quantity: 1, price: 9.50 },
          { productName: 'Eau Minérale 50cl', quantity: 1, price: 2.00 }
        ],
        subtotal: 25.50,
        tax: 5.10,
        taxRate: 20.0,
        total: 30.60,
        status: 'IN_PREPARATION',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        customerId: createdCustomers[3].id,
        items: [
          { productName: 'Pizza Végétarienne', quantity: 1, price: 13.00 },
          { productName: 'Orangina 33cl', quantity: 1, price: 2.50 }
        ],
        subtotal: 15.50,
        tax: 3.10,
        taxRate: 20.0,
        total: 18.60,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        customerId: createdCustomers[4].id,
        items: [
          { productName: 'Pizza Prosciutto', quantity: 1, price: 17.00 },
          { productName: 'Antipasti Mixte', quantity: 1, price: 12.00 },
          { productName: 'Vin Rouge (verre)', quantity: 2, price: 4.00 },
          { productName: 'Panna Cotta', quantity: 1, price: 4.50 }
        ],
        subtotal: 41.50,
        tax: 8.30,
        taxRate: 20.0,
        total: 49.80,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    let orderNumber = 1;
    for (const orderData of orders) {
      await prisma.order.create({
        data: {
          orderNumber: `PM${String(orderNumber).padStart(4, '0')}`,
          customerId: orderData.customerId,
          storeId: store.id,
          businessId: business.id,
          items: orderData.items,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          taxRate: orderData.taxRate,
          total: orderData.total,
          status: orderData.status as any,
          paymentStatus: orderData.paymentStatus as any,
          createdAt: orderData.createdAt
        }
      });
      orderNumber++;
    }

    console.log(`✅ ${orders.length} commandes créées`);

    console.log('🎉 Configuration Pizza Mario terminée !');
    console.log(`🏪 Store ID: ${store.id}`);
    console.log(`📊 Produits: ${allProducts.length}`);
    console.log(`📦 Commandes: ${orders.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndSetupPizzaMario();