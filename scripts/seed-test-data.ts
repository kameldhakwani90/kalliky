import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Début du seeding des données de test...');

  try {
    // 1. Trouver l'utilisateur medkamel.dhakwani
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur medkamel.dhakwani@gmail.com non trouvé');
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);

    // 2. Trouver son business
    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      include: { stores: true }
    });

    if (!business) {
      console.log('❌ Aucun business trouvé pour cet utilisateur');
      return;
    }

    console.log(`✅ Business trouvé: ${business.name}`);

    // 3. Trouver ou créer un store restaurant
    let store = business.stores.find(s => s.name.toLowerCase().includes('restaurant') || s.name.toLowerCase().includes('gourmet'));
    
    if (!store) {
      // Créer un store restaurant de test
      store = await prisma.store.create({
        data: {
          name: 'Restaurant Le Gourmet Test',
          address: '123 Rue de la Gastronomie, 75001 Paris',
          businessId: business.id,
          isActive: true,
          settings: JSON.stringify({
            serviceType: 'products',
            isConfigured: true
          })
        }
      });
      console.log(`✅ Store restaurant créé: ${store.name}`);
    } else {
      console.log(`✅ Store restaurant trouvé: ${store.name}`);
    }

    // 4. Créer des clients de test
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { 
          phone_businessId: { 
            phone: '0612345678', 
            businessId: business.id 
          } 
        },
        update: {},
        create: {
          phone: '0612345678',
          firstName: 'Sophie',
          lastName: 'Dubois',
          email: 'sophie.dubois@email.com',
          status: 'REGULAR',
          businessId: business.id,
          totalSpent: 120.50,
          orderCount: 5,
          lastSeen: new Date()
        }
      }),
      prisma.customer.upsert({
        where: { 
          phone_businessId: { 
            phone: '0687654321', 
            businessId: business.id 
          } 
        },
        update: {},
        create: {
          phone: '0687654321',
          firstName: 'Pierre',
          lastName: 'Martin',
          email: 'pierre.martin@email.com',
          status: 'VIP',
          businessId: business.id,
          totalSpent: 850.75,
          orderCount: 15,
          lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // il y a 2 jours
        }
      }),
      prisma.customer.upsert({
        where: { 
          phone_businessId: { 
            phone: '0123456789', 
            businessId: business.id 
          } 
        },
        update: {},
        create: {
          phone: '0123456789',
          firstName: 'Marie',
          lastName: 'Leroy',
          email: 'marie.leroy@email.com',
          status: 'NEW',
          businessId: business.id,
          totalSpent: 45.20,
          orderCount: 2,
          lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // il y a 5 jours
        }
      }),
      prisma.customer.upsert({
        where: { 
          phone_businessId: { 
            phone: '0698765432', 
            businessId: business.id 
          } 
        },
        update: {},
        create: {
          phone: '0698765432',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          status: 'REGULAR',
          businessId: business.id,
          totalSpent: 180.90,
          orderCount: 8,
          lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000) // il y a 1 jour
        }
      })
    ]);

    console.log(`✅ ${customers.length} clients créés/mis à jour`);

    // 5. Créer des commandes réalistes
    const orders = [];
    
    // Commandes pour Sophie (client régulier)
    for (let i = 0; i < 3; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `CMD${Date.now() + i}`,
          customerId: customers[0].id,
          storeId: store.id,
          businessId: business.id,
          items: JSON.stringify([
            { name: 'Salade César', quantity: 1, price: 14.50 },
            { name: 'Saumon grillé', quantity: 1, price: 22.00 },
            { name: 'Tiramisu', quantity: 1, price: 7.50 }
          ]),
          subtotal: 44.00,
          tax: 4.40,
          taxRate: 10,
          total: 48.40,
          status: i === 0 ? 'PENDING' : 'DELIVERED',
          paymentStatus: 'PAID',
          paymentMethod: 'Carte bancaire',
          notes: i === 0 ? 'Sans oignons dans la salade' : null,
          createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
        }
      });
      orders.push(order);
    }

    // Commandes pour Pierre (VIP)
    for (let i = 0; i < 4; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `CMD${Date.now() + 100 + i}`,
          customerId: customers[1].id,
          storeId: store.id,
          businessId: business.id,
          items: JSON.stringify([
            { name: 'Menu Dégustation 5 services', quantity: 2, price: 89.00 },
            { name: 'Bouteille Chablis 2020', quantity: 1, price: 45.00 },
            { name: 'Café gourmand', quantity: 2, price: 12.00 }
          ]),
          subtotal: 235.00,
          tax: 23.50,
          taxRate: 10,
          total: 258.50,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          paymentMethod: 'Carte bancaire',
          notes: 'Table en terrasse demandée',
          createdAt: new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000)
        }
      });
      orders.push(order);
    }

    // Commandes pour Marie (nouveau client)
    const order = await prisma.order.create({
      data: {
        orderNumber: `CMD${Date.now() + 200}`,
        customerId: customers[2].id,
        storeId: store.id,
        businessId: business.id,
        items: JSON.stringify([
          { name: 'Burger du Chef', quantity: 1, price: 16.50 },
          { name: 'Frites maison', quantity: 1, price: 5.50 },
          { name: 'Coca-Cola', quantity: 1, price: 3.50 }
        ]),
        subtotal: 25.50,
        tax: 2.55,
        taxRate: 10,
        total: 28.05,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'Espèces',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }
    });
    orders.push(order);

    console.log(`✅ ${orders.length} commandes créées`);

    // 6. Créer des échanges clients (CustomerExchange)
    const exchanges = await Promise.all([
      prisma.customerExchange.create({
        data: {
          customerId: customers[0].id,
          storeId: store.id,
          type: 'CALL',
          description: 'Demande de modification de réservation',
          content: JSON.stringify({
            transcript: 'Bonjour, je souhaiterais modifier ma réservation de demain soir pour la reporter à samedi.',
            duration: '2:45'
          }),
          metadata: JSON.stringify({ callType: 'incoming', resolved: true }),
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // il y a 3 heures
        }
      }),
      prisma.customerExchange.create({
        data: {
          customerId: customers[1].id,
          storeId: store.id,
          type: 'ORDER',
          description: 'Commande spéciale menu dégustation',
          content: JSON.stringify({
            orderDetails: 'Menu dégustation avec adaptations végétariennes',
            specialRequests: ['Sans gluten', 'Allergie aux noix']
          }),
          orderId: orders[4].id, // Lier à une commande de Pierre
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.customerExchange.create({
        data: {
          customerId: customers[2].id,
          storeId: store.id,
          type: 'COMPLAINT',
          description: 'Réclamation sur la qualité du burger',
          content: JSON.stringify({
            complaint: 'Le burger était froid à la livraison',
            resolution: 'Remboursement partiel de 50% effectué'
          }),
          metadata: JSON.stringify({ severity: 'low', resolved: true }),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.customerExchange.create({
        data: {
          customerId: customers[3].id,
          storeId: store.id,
          type: 'INFORMATION',
          description: 'Demande d\'informations sur les allergènes',
          content: JSON.stringify({
            question: 'Quels plats sont sans gluten sur votre carte ?',
            response: 'Liste des plats sans gluten fournie'
          }),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log(`✅ ${exchanges.length} échanges clients créés`);

    // 7. Créer des logs d'activité
    const activityLogs = await Promise.all([
      prisma.activityLog.create({
        data: {
          storeId: store.id,
          customerId: customers[0].id,
          type: 'ORDER',
          entityId: orders[0].orderNumber,
          title: `Commande ${orders[0].orderNumber}`,
          description: 'Nouvelle commande passée',
          amount: orders[0].total,
          metadata: JSON.stringify({ paymentMethod: 'Carte bancaire', items: 3 })
        }
      }),
      prisma.activityLog.create({
        data: {
          storeId: store.id,
          customerId: customers[1].id,
          type: 'CALL',
          entityId: 'CALL-001',
          title: 'Appel téléphonique',
          description: 'Réservation pour 4 personnes',
          metadata: JSON.stringify({ duration: '5:30', type: 'reservation' }),
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      }),
      prisma.activityLog.create({
        data: {
          storeId: store.id,
          customerId: customers[2].id,
          type: 'COMPLAINT',
          entityId: 'COMP-001',
          title: 'Réclamation client',
          description: 'Problème de qualité résolu',
          metadata: JSON.stringify({ resolved: true, compensation: '50% remboursement' }),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log(`✅ ${activityLogs.length} logs d'activité créés`);

    // 8. Créer des tickets de préparation
    const preparationTickets = await Promise.all([
      prisma.preparationTicket.create({
        data: {
          ticketNumber: 'T001',
          orderId: orders[0].id,
          storeId: store.id,
          items: JSON.stringify([
            { name: 'Salade César', quantity: 1, notes: 'Sans oignons' },
            { name: 'Saumon grillé', quantity: 1, notes: 'Cuisson à point' }
          ]),
          status: 'PENDING',
          priority: 'NORMAL',
          notes: 'Client attend sur place'
        }
      }),
      prisma.preparationTicket.create({
        data: {
          ticketNumber: 'T002',
          orderId: orders[4].id,
          storeId: store.id,
          items: JSON.stringify([
            { name: 'Menu Dégustation', quantity: 2, notes: 'Version végétarienne, sans gluten' }
          ]),
          status: 'PREPARING',
          priority: 'HIGH',
          notes: 'Client VIP - service prioritaire'
        }
      })
    ]);

    console.log(`✅ ${preparationTickets.length} tickets de préparation créés`);

    console.log('🎉 Seeding terminé avec succès !');
    console.log(`📊 Résumé:`);
    console.log(`   - ${customers.length} clients`);
    console.log(`   - ${orders.length} commandes`);
    console.log(`   - ${exchanges.length} échanges`);
    console.log(`   - ${activityLogs.length} logs d'activité`);
    console.log(`   - ${preparationTickets.length} tickets de préparation`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();