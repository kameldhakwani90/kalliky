import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupCompletePizzaMario() {
  try {
    console.log('🍕 Configuration complète Pizza Mario - Démarrage...');
    
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    // 1. NETTOYAGE COMPLET
    console.log('🧹 Nettoyage complet de la base...');
    await prisma.$executeRaw`TRUNCATE TABLE "CustomerExchange", "ActivityLog", "ProductBehaviorData", "UpsellSuggestion", "ProductVariation", "CompositionOption", "CompositionStep", "NotificationTemplate", "Customer", "Order", "Product", "Store", "Business" RESTART IDENTITY CASCADE;`;

    // 2. CRÉATION BUSINESS ET STORE
    console.log('🏢 Création du Business Pizza Mario...');
    const business = await prisma.business.create({
      data: {
        name: 'Pizza Mario',
        description: 'Pizzeria italienne authentique',
        type: 'PRODUCTS',
        ownerId: user.id
      }
    });

    const store = await prisma.store.create({
      data: {
        name: 'Pizza Mario',
        address: '123 Rue de la Pizza, 75001 Paris, France',
        businessId: business.id,
        isActive: true,
        hasProducts: true,
        hasReservations: false,
        hasConsultations: false,
        productsConfig: {
          categories: ['Pizzas', 'Entrées', 'Boissons', 'Desserts'],
          currency: 'EUR',
          taxRate: 20,
          deliveryEnabled: true,
          takeawayEnabled: true,
          onlineOrderEnabled: true,
          paymentMethods: ['CARD', 'CASH', 'ONLINE'],
          deliveryZones: [
            { name: 'Zone 1 (0-2km)', maxDistance: 2, deliveryFee: 2.50 },
            { name: 'Zone 2 (2-5km)', maxDistance: 5, deliveryFee: 4.00 }
          ]
        }
      }
    });

    // 3. CLIENTS RÉALISTES
    console.log('👥 Création des clients...');
    const customers = [
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@email.com',
        phone: '0612345678',
        businessId: business.id,
        status: 'REGULAR',
        totalSpent: 156.80,
        orderCount: 12,
        firstSeen: new Date('2024-01-15'),
        lastSeen: new Date('2024-08-10')
      },
      {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@email.com',
        phone: '0698765432',
        businessId: business.id,
        status: 'VIP',
        totalSpent: 289.50,
        orderCount: 18,
        firstSeen: new Date('2023-11-20'),
        lastSeen: new Date('2024-08-15')
      },
      {
        firstName: 'Pierre',
        lastName: 'Dubois',
        email: 'pierre.dubois@email.com',
        phone: '0611223344',
        businessId: business.id,
        status: 'NEW',
        totalSpent: 23.50,
        orderCount: 1,
        firstSeen: new Date('2024-08-18'),
        lastSeen: new Date('2024-08-18')
      },
      {
        firstName: 'Sophie',
        lastName: 'Leroy',
        email: 'sophie.leroy@email.com',
        phone: '0655443322',
        businessId: business.id,
        status: 'REGULAR',
        totalSpent: 98.20,
        orderCount: 7,
        firstSeen: new Date('2024-03-10'),
        lastSeen: new Date('2024-08-12')
      },
      {
        firstName: 'Antoine',
        lastName: 'Moreau',
        email: 'antoine.moreau@email.com',
        phone: '0677889900',
        businessId: business.id,
        status: 'REGULAR',
        totalSpent: 134.70,
        orderCount: 9,
        firstSeen: new Date('2024-02-05'),
        lastSeen: new Date('2024-08-16')
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = await prisma.customer.create({
        data: customerData
      });
      createdCustomers.push(customer);
    }

    // 4. PRODUITS AVEC VARIATIONS ET COMPOSITIONS COMPLÈTES
    console.log('🍕 Création des produits avec variations et compositions...');

    // PIZZAS AVEC VARIATIONS DE TAILLE
    const pizzaProducts = [
      {
        name: 'Pizza Margherita',
        description: 'La classique pizza italienne avec tomate, mozzarella et basilic frais',
        category: 'Pizzas',
        hasComposition: true,
        originalComposition: 'base tomate, mozzarella, basilic frais, huile d\'olive',
        variations: [
          { name: 'Petite (26cm)', type: 'SIZE', value: 'S', prices: { 'dine-in': 10.50, 'takeaway': 9.50, 'delivery': 11.50, 'pickup': 9.50 }, isDefault: false },
          { name: 'Moyenne (30cm)', type: 'SIZE', value: 'M', prices: { 'dine-in': 13.50, 'takeaway': 12.50, 'delivery': 14.50, 'pickup': 12.50 }, isDefault: true },
          { name: 'Grande (34cm)', type: 'SIZE', value: 'L', prices: { 'dine-in': 16.50, 'takeaway': 15.50, 'delivery': 17.50, 'pickup': 15.50 }, isDefault: false }
        ],
        compositionSteps: [
          {
            title: 'Base',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 1,
            options: [
              { name: 'Base Tomate', price: 0, isDefault: true },
              { name: 'Base Crème', price: 1.00, isDefault: false },
              { name: 'Base Blanche', price: 0.50, isDefault: false }
            ]
          },
          {
            title: 'Fromage',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 2,
            options: [
              { name: 'Mozzarella', price: 0, isDefault: true },
              { name: 'Mozzarella de Bufflonne', price: 2.50, isDefault: false }
            ]
          },
          {
            title: 'Herbes et épices',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 3,
            options: [
              { name: 'Basilic frais', price: 0, isDefault: true },
              { name: 'Origan', price: 0, isDefault: false },
              { name: 'Ail', price: 0.50, isDefault: false }
            ]
          },
          {
            title: 'Suppléments',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 4,
            options: [
              { name: 'Oeuf', price: 1.50, isDefault: false },
              { name: 'Olives noires', price: 1.00, isDefault: false },
              { name: 'Tomates cerises', price: 1.50, isDefault: false }
            ]
          }
        ]
      },
      {
        name: 'Pizza Pepperoni',
        description: 'Pizza américaine avec pepperoni épicé et mozzarella',
        category: 'Pizzas',
        hasComposition: true,
        originalComposition: 'base tomate, mozzarella, pepperoni',
        variations: [
          { name: 'Petite (26cm)', type: 'SIZE', value: 'S', prices: { 'dine-in': 12.50, 'takeaway': 11.50, 'delivery': 13.50, 'pickup': 11.50 }, isDefault: false },
          { name: 'Moyenne (30cm)', type: 'SIZE', value: 'M', prices: { 'dine-in': 15.50, 'takeaway': 14.50, 'delivery': 16.50, 'pickup': 14.50 }, isDefault: true },
          { name: 'Grande (34cm)', type: 'SIZE', value: 'L', prices: { 'dine-in': 18.50, 'takeaway': 17.50, 'delivery': 19.50, 'pickup': 17.50 }, isDefault: false }
        ],
        compositionSteps: [
          {
            title: 'Base',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 1,
            options: [
              { name: 'Base Tomate', price: 0, isDefault: true },
              { name: 'Base Barbecue', price: 1.00, isDefault: false }
            ]
          },
          {
            title: 'Charcuterie',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 2,
            options: [
              { name: 'Pepperoni', price: 0, isDefault: true },
              { name: 'Pepperoni Épicé', price: 1.00, isDefault: false }
            ]
          },
          {
            title: 'Fromage',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 3,
            options: [
              { name: 'Mozzarella', price: 0, isDefault: true },
              { name: 'Mélange 3 fromages', price: 2.00, isDefault: false }
            ]
          }
        ]
      },
      {
        name: 'Pizza Quattro Stagioni',
        description: 'Pizza aux quatre saisons: jambon, champignons, artichauts, olives',
        category: 'Pizzas',
        hasComposition: true,
        originalComposition: 'base tomate, mozzarella, jambon, champignons, artichauts, olives',
        variations: [
          { name: 'Petite (26cm)', type: 'SIZE', value: 'S', prices: { 'dine-in': 14.50, 'takeaway': 13.50, 'delivery': 15.50, 'pickup': 13.50 }, isDefault: false },
          { name: 'Moyenne (30cm)', type: 'SIZE', value: 'M', prices: { 'dine-in': 17.50, 'takeaway': 16.50, 'delivery': 18.50, 'pickup': 16.50 }, isDefault: true },
          { name: 'Grande (34cm)', type: 'SIZE', value: 'L', prices: { 'dine-in': 20.50, 'takeaway': 19.50, 'delivery': 21.50, 'pickup': 19.50 }, isDefault: false }
        ]
      }
    ];

    // ENTRÉES
    const entreeProducts = [
      {
        name: 'Bruschetta Tomate',
        description: 'Pain grillé garni de tomates fraîches, basilic et huile d\'olive',
        category: 'Entrées',
        hasComposition: true,
        originalComposition: 'pain, tomates fraîches, basilic, huile d\'olive, ail',
        variations: [
          { name: 'Portion standard', type: 'SIZE', value: 'STANDARD', prices: { 'dine-in': 6.50, 'takeaway': 6.00, 'delivery': 7.00, 'pickup': 6.00 }, isDefault: true }
        ],
        compositionSteps: [
          {
            title: 'Type de pain',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 1,
            options: [
              { name: 'Pain de campagne', price: 0, isDefault: true },
              { name: 'Pain complet', price: 0.50, isDefault: false }
            ]
          },
          {
            title: 'Garniture supplémentaire',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 2,
            options: [
              { name: 'Mozzarella', price: 2.00, isDefault: false },
              { name: 'Jambon de Parme', price: 3.50, isDefault: false },
              { name: 'Roquette', price: 1.00, isDefault: false }
            ]
          }
        ]
      }
    ];

    // BOISSONS
    const drinkProducts = [
      {
        name: 'Coca-Cola',
        description: 'Boisson gazeuse Coca-Cola',
        category: 'Boissons',
        hasComposition: false,
        variations: [
          { name: '33cl', type: 'SIZE', value: 'S', prices: { 'dine-in': 2.50, 'takeaway': 2.00, 'delivery': 2.50, 'pickup': 2.00 }, isDefault: true },
          { name: '50cl', type: 'SIZE', value: 'L', prices: { 'dine-in': 3.50, 'takeaway': 3.00, 'delivery': 3.50, 'pickup': 3.00 }, isDefault: false }
        ]
      },
      {
        name: 'Bière Peroni',
        description: 'Bière italienne Peroni',
        category: 'Boissons',
        hasComposition: false,
        variations: [
          { name: '33cl', type: 'SIZE', value: 'STANDARD', prices: { 'dine-in': 4.50, 'takeaway': 4.00, 'delivery': 4.50, 'pickup': 4.00 }, isDefault: true }
        ]
      }
    ];

    // DESSERTS
    const dessertProducts = [
      {
        name: 'Tiramisu',
        description: 'Dessert italien traditionnel au café et mascarpone',
        category: 'Desserts',
        hasComposition: true,
        originalComposition: 'mascarpone, café, biscuits, cacao',
        variations: [
          { name: 'Portion individuelle', type: 'SIZE', value: 'INDIVIDUAL', prices: { 'dine-in': 6.50, 'takeaway': 6.00, 'delivery': 7.00, 'pickup': 6.00 }, isDefault: true },
          { name: 'Grande portion', type: 'SIZE', value: 'LARGE', prices: { 'dine-in': 9.50, 'takeaway': 9.00, 'delivery': 10.00, 'pickup': 9.00 }, isDefault: false }
        ],
        compositionSteps: [
          {
            title: 'Variante',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 1,
            options: [
              { name: 'Classique', price: 0, isDefault: true },
              { name: 'Aux fruits rouges', price: 1.50, isDefault: false },
              { name: 'Au chocolat', price: 1.00, isDefault: false }
            ]
          }
        ]
      }
    ];

    const allProducts = [...pizzaProducts, ...entreeProducts, ...drinkProducts, ...dessertProducts];

    // Créer les produits avec leurs variations et compositions
    for (const productData of allProducts) {
      const { variations, compositionSteps, ...productInfo } = productData;
      
      const product = await prisma.product.create({
        data: {
          ...productInfo,
          storeId: store.id,
          status: 'ACTIVE',
          popularity: Math.floor(Math.random() * 100),
          profitMargin: 0.65 // 65% de marge
        }
      });

      // Créer les variations de prix
      if (variations) {
        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i];
          await prisma.productVariation.create({
            data: {
              productId: product.id,
              name: variation.name,
              type: variation.type as any,
              value: variation.value,
              prices: variation.prices,
              isDefault: variation.isDefault,
              order: i
            }
          });
        }
      }

      // Créer les étapes de composition
      if (compositionSteps) {
        for (const step of compositionSteps) {
          const { options, ...stepInfo } = step;
          
          const createdStep = await prisma.compositionStep.create({
            data: {
              ...stepInfo,
              productId: product.id
            }
          });

          // Créer les options de chaque étape
          if (options) {
            for (let j = 0; j < options.length; j++) {
              const option = options[j];
              await prisma.compositionOption.create({
                data: {
                  stepId: createdStep.id,
                  name: option.name,
                  prices: { base: option.price },
                  order: j
                }
              });
            }
          }
        }
      }
    }

    console.log(`✅ ${allProducts.length} produits créés avec variations et compositions`);

    // 5. HISTORIQUE COMPLET DES COMMANDES
    console.log('📦 Génération de l\'historique des commandes...');
    
    const orderHistory = [
      {
        orderNumber: 'PM0001',
        customerId: createdCustomers[0].id,
        items: [
          { 
            productName: 'Pizza Margherita', 
            variation: 'Moyenne (30cm)',
            quantity: 1, 
            unitPrice: 13.50,
            customizations: ['Base Tomate', 'Mozzarella', 'Basilic frais']
          },
          { 
            productName: 'Coca-Cola', 
            variation: '33cl',
            quantity: 2, 
            unitPrice: 2.50 
          }
        ],
        subtotal: 18.50,
        tax: 3.70,
        taxRate: 20.0,
        total: 22.20,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        notes: 'Livraison rapide demandée',
        createdAt: new Date('2024-08-15T19:30:00Z')
      },
      {
        orderNumber: 'PM0002',
        customerId: createdCustomers[1].id,
        items: [
          { 
            productName: 'Pizza Quattro Stagioni', 
            variation: 'Grande (34cm)',
            quantity: 1, 
            unitPrice: 20.50 
          },
          { 
            productName: 'Tiramisu', 
            variation: 'Portion individuelle',
            quantity: 2, 
            unitPrice: 6.50,
            customizations: ['Classique']
          },
          { 
            productName: 'Bière Peroni', 
            variation: '33cl',
            quantity: 1, 
            unitPrice: 4.50 
          }
        ],
        subtotal: 38.00,
        tax: 7.60,
        taxRate: 20.0,
        total: 45.60,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        createdAt: new Date('2024-08-16T20:15:00Z')
      },
      {
        orderNumber: 'PM0003',
        customerId: createdCustomers[2].id,
        items: [
          { 
            productName: 'Pizza Pepperoni', 
            variation: 'Petite (26cm)',
            quantity: 1, 
            unitPrice: 12.50 
          },
          { 
            productName: 'Bruschetta Tomate', 
            variation: 'Portion standard',
            quantity: 1, 
            unitPrice: 6.50,
            customizations: ['Pain de campagne']
          }
        ],
        subtotal: 19.00,
        tax: 3.80,
        taxRate: 20.0,
        total: 22.80,
        status: 'PREPARING',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        createdAt: new Date('2024-08-18T18:45:00Z')
      }
    ];

    for (const orderData of orderHistory) {
      await prisma.order.create({
        data: {
          orderNumber: orderData.orderNumber,
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
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          createdAt: orderData.createdAt
        }
      });
    }

    console.log(`✅ ${orderHistory.length} commandes historiques créées`);

    // 6. ÉCHANGES CLIENTS (ACTIVITÉS)
    console.log('💬 Création des échanges clients...');
    
    const customerExchanges = [
      {
        customerId: createdCustomers[0].id,
        storeId: store.id,
        type: 'VISIT',
        description: 'Commande Pizza Margherita + boissons',
        content: {
          orderItems: ['Pizza Margherita M', 'Coca-Cola 33cl x2'],
          deliveryType: 'DELIVERY',
          duration: '35 minutes'
        },
        createdAt: new Date('2024-08-15T19:30:00Z')
      },
      {
        customerId: createdCustomers[1].id,
        storeId: store.id,
        type: 'CALL',
        description: 'Appel pour modification de commande',
        content: {
          reason: 'Changement d\'adresse de livraison',
          duration: '3 minutes',
          resolution: 'Adresse mise à jour'
        },
        createdAt: new Date('2024-08-16T20:00:00Z')
      },
      {
        customerId: createdCustomers[0].id,
        storeId: store.id,
        type: 'COMPLAINT',
        description: 'Retour positif sur la qualité',
        content: {
          rating: 5,
          comment: 'Pizza excellente, livraison rapide!',
          category: 'QUALITY'
        },
        createdAt: new Date('2024-08-15T21:00:00Z')
      }
    ];

    for (const exchange of customerExchanges) {
      await prisma.customerExchange.create({
        data: exchange
      });
    }

    // 7. LOGS D'ACTIVITÉS POUR LA PAGE ACTIVITÉ
    console.log('📊 Génération des logs d\'activité...');
    
    const activityLogs = [
      {
        storeId: store.id,
        type: 'ORDER',
        entityId: 'PM0001',
        title: 'Nouvelle commande',
        description: 'Nouvelle commande #PM0001 de Jean Dupont',
        amount: 22.20,
        metadata: {
          customerName: 'Jean Dupont',
          customerId: createdCustomers[0].id,
          paymentMethod: 'CARD'
        },
        createdAt: new Date('2024-08-15T19:30:00Z')
      },
      {
        storeId: store.id,
        type: 'ORDER',
        entityId: 'PM0001',
        title: 'Commande en préparation',
        description: 'Commande #PM0001 en préparation',
        metadata: {
          customerName: 'Jean Dupont',
          customerId: createdCustomers[0].id,
          oldStatus: 'PENDING',
          newStatus: 'PREPARING'
        },
        createdAt: new Date('2024-08-15T19:35:00Z')
      },
      {
        storeId: store.id,
        type: 'ORDER',
        entityId: 'PM0001',
        title: 'Commande livrée',
        description: 'Commande #PM0001 livrée',
        metadata: {
          customerName: 'Jean Dupont',
          customerId: createdCustomers[0].id,
          oldStatus: 'PREPARING',
          newStatus: 'DELIVERED',
          deliveryTime: '25 minutes'
        },
        createdAt: new Date('2024-08-15T20:05:00Z')
      },
      {
        storeId: store.id,
        type: 'VISIT',
        entityId: createdCustomers[2].id,
        title: 'Nouveau client',
        description: 'Nouveau client Pierre Dubois',
        metadata: {
          customerName: 'Pierre Dubois',
          customerId: createdCustomers[2].id,
          source: 'ONLINE'
        },
        createdAt: new Date('2024-08-18T18:40:00Z')
      },
      {
        storeId: store.id,
        type: 'ORDER',
        entityId: 'PM0003',
        title: 'Première commande',
        description: 'Première commande de Pierre Dubois',
        amount: 22.80,
        metadata: {
          customerName: 'Pierre Dubois',
          customerId: createdCustomers[2].id,
          isFirstOrder: true
        },
        createdAt: new Date('2024-08-18T18:45:00Z')
      }
    ];

    for (const log of activityLogs) {
      await prisma.activityLog.create({
        data: log
      });
    }

    // 8. TEMPLATES DE NOTIFICATIONS
    console.log('📧 Configuration des templates de notification...');
    
    const notificationTemplates = [
      {
        storeId: store.id,
        actionType: 'EMAIL',
        activityType: 'ORDER',
        name: 'Confirmation de commande',
        subject: 'Confirmation de votre commande Pizza Mario',
        body: `Bonjour {{customerName}},

Merci pour votre commande chez Pizza Mario !

📋 Détails de votre commande #{{orderNumber}} :
{{#each items}}
- {{name}} {{#if variation}}({{variation}}){{/if}} x{{quantity}} = {{price}}€
{{/each}}

💰 Total : {{total}}€
📅 Commande passée le : {{orderDate}}
🕐 Temps de préparation estimé : {{estimatedTime}}

{{#if deliveryAddress}}
🚚 Livraison à : {{deliveryAddress}}
{{else}}
🏪 À récupérer en magasin
{{/if}}

Merci de votre confiance !
L'équipe Pizza Mario`,
        isDefault: true
      },
      {
        storeId: store.id,
        actionType: 'SMS',
        activityType: 'ORDER',
        name: 'Commande prête',
        subject: null,
        body: 'Pizza Mario: Votre commande #{{orderNumber}} est prête ! {{#if isDelivery}}Notre livreur arrive dans 10min{{else}}Vous pouvez venir la récupérer{{/if}}. Merci !',
        isDefault: true
      },
      {
        storeId: store.id,
        actionType: 'EMAIL',
        activityType: 'ORDER',
        name: 'Commande livrée',
        subject: 'Votre commande Pizza Mario a été livrée',
        body: `Bonjour {{customerName}},

Votre commande #{{orderNumber}} vient d'être livrée !

J'espère que vous vous régalerez avec nos pizzas italiennes.

⭐ Donnez-nous votre avis :
Êtes-vous satisfait(e) de votre commande ? Votre retour nous aide à nous améliorer.

À bientôt chez Pizza Mario !`,
        isDefault: true
      },
      {
        storeId: store.id,
        actionType: 'EMAIL',
        activityType: 'ORDER',
        name: 'Bienvenue nouveau client',
        subject: 'Bienvenue chez Pizza Mario !',
        body: `Bienvenue {{customerName}} !

Merci d'avoir choisi Pizza Mario pour votre première commande.

🍕 Découvrez notre carte :
- Pizzas artisanales italiennes
- Entrées fraîches et authentiques  
- Desserts faits maison
- Boissons italiennes

💝 Offre spéciale première commande :
Prochaine fois, bénéficiez de -15% avec le code BIENVENUE15

À très bientôt !
L'équipe Pizza Mario`,
        isDefault: true
      }
    ];

    for (const template of notificationTemplates) {
      await prisma.notificationTemplate.create({
        data: template
      });
    }

    // 9. DONNÉES COMPORTEMENTALES CLIENTS
    console.log('🧠 Génération des données comportementales...');
    
    const behaviorData = [
      {
        productId: allProducts[0].name, // Pizza Margherita
        customerId: createdCustomers[0].id,
        viewCount: 5,
        purchaseCount: 3,
        rejectionCount: 0,
        averageRating: 4.8,
        preferredTime: 'evening',
        seasonalPreference: 0.7
      },
      {
        productId: allProducts[1].name, // Pizza Pepperoni  
        customerId: createdCustomers[1].id,
        viewCount: 3,
        purchaseCount: 2,
        rejectionCount: 1,
        averageRating: 4.2,
        preferredTime: 'weekend',
        seasonalPreference: 0.6
      }
    ];

    // 10. SUGGESTIONS D'UPSELL
    console.log('💡 Configuration des suggestions d\'upsell...');
    
    // Les suggestions seront créées après avoir les vrais IDs des produits
    // Pour l'instant on les skip car on aurait besoin des IDs réels des produits

    console.log('🎉 Configuration complète Pizza Mario terminée !');
    console.log(`🏪 Store ID: ${store.id}`);
    console.log(`📊 Produits: ${allProducts.length} avec variations et compositions`);
    console.log(`👥 Clients: ${createdCustomers.length} avec historique`);
    console.log(`📦 Commandes: ${orderHistory.length} avec détails complets`);
    console.log(`💬 Échanges clients: ${customerExchanges.length}`);
    console.log(`📊 Logs d'activité: ${activityLogs.length}`);
    console.log(`📧 Templates: ${notificationTemplates.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupCompletePizzaMario();