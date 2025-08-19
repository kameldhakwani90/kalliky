import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndSeedCorrectData() {
  console.log('🧹 Début du nettoyage et création des bonnes données...');

  try {
    // 1. Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);

    // 2. Trouver le business
    const business = await prisma.business.findFirst({
      where: { ownerId: user.id }
    });

    if (!business) {
      console.log('❌ Business non trouvé');
      return;
    }

    // 3. Trouver la bonne boutique "Les Coutumes"
    const correctStore = await prisma.store.findUnique({
      where: { id: '0e842ebb-c059-4a31-8e19-a7bbaad7cd0b' }
    });

    if (!correctStore) {
      console.log('❌ Store "Les Coutumes" non trouvé');
      return;
    }

    console.log(`✅ Bonne boutique trouvée: ${correctStore.name} à ${correctStore.address}`);

    // 4. Nettoyer les données de test précédentes
    console.log('🧹 Nettoyage des anciennes données...');
    
    // Supprimer les données liées aux mauvaises boutiques
    const wrongStores = await prisma.store.findMany({
      where: {
        businessId: business.id,
        id: { not: correctStore.id },
        name: { contains: 'Test' }
      }
    });

    for (const wrongStore of wrongStores) {
      console.log(`🗑️  Suppression du store incorrect: ${wrongStore.name}`);
      
      // Supprimer les données liées à ce store
      await prisma.preparationTicket.deleteMany({ where: { storeId: wrongStore.id } });
      await prisma.activityLog.deleteMany({ where: { storeId: wrongStore.id } });
      await prisma.customerExchange.deleteMany({ where: { storeId: wrongStore.id } });
      await prisma.order.deleteMany({ where: { storeId: wrongStore.id } });
      await prisma.product.deleteMany({ where: { storeId: wrongStore.id } });
      await prisma.component.deleteMany({ where: { storeId: wrongStore.id } });
      await prisma.componentCategory.deleteMany({ where: { storeId: wrongStore.id } });
      
      // Supprimer le store
      await prisma.store.delete({ where: { id: wrongStore.id } });
    }

    // Nettoyer les anciennes données de test du bon store
    await prisma.preparationTicket.deleteMany({ where: { storeId: correctStore.id } });
    await prisma.activityLog.deleteMany({ where: { storeId: correctStore.id } });
    await prisma.customerExchange.deleteMany({ where: { storeId: correctStore.id } });
    await prisma.order.deleteMany({ where: { storeId: correctStore.id } });
    
    // Supprimer les clients de test
    await prisma.customer.deleteMany({ 
      where: { 
        businessId: business.id,
        OR: [
          { firstName: 'Sophie' },
          { firstName: 'Pierre' },
          { firstName: 'Marie' },
          { firstName: 'Jean' }
        ]
      } 
    });

    console.log('✅ Nettoyage terminé');

    // 5. Créer les produits avec allergènes et tags
    console.log('🍽️ Création des produits avec allergènes...');

    // Vérifier quels produits existent déjà
    const existingProducts = await prisma.product.findMany({
      where: { storeId: correctStore.id }
    });

    console.log(`📋 ${existingProducts.length} produits existants trouvés`);

    // Ajouter des desserts et boissons si ils n'existent pas
    const additionalProducts = [
      // Desserts
      {
        name: 'Tiramisu Maison',
        description: 'Tiramisu traditionnel aux biscuits à la cuillère',
        category: 'Desserts',
        aiKeywords: ['dessert', 'italien', 'café', 'mascarpone'],
        allergens: ['œufs', 'lactose', 'gluten'],
        price: 6.90
      },
      {
        name: 'Moelleux au Chocolat',
        description: 'Moelleux chaud au chocolat noir, cœur coulant',
        category: 'Desserts', 
        aiKeywords: ['chocolat', 'chaud', 'dessert', 'coulant'],
        allergens: ['gluten', 'œufs', 'lactose'],
        price: 7.50
      },
      {
        name: 'Panna Cotta Fruits Rouges',
        description: 'Panna cotta vanille et coulis de fruits rouges',
        category: 'Desserts',
        aiKeywords: ['léger', 'fruité', 'vanille', 'italien'],
        allergens: ['lactose'],
        price: 5.90
      },
      {
        name: 'Fondant au Caramel',
        description: 'Fondant caramel beurre salé et glace vanille',
        category: 'Desserts',
        aiKeywords: ['caramel', 'beurre salé', 'chaud', 'glace'],
        allergens: ['gluten', 'œufs', 'lactose'],
        price: 7.90
      },
      // Boissons
      {
        name: 'Coca-Cola',
        description: 'Coca-Cola 33cl',
        category: 'Boissons',
        aiKeywords: ['soda', 'rafraîchissant', 'cola'],
        allergens: [],
        price: 3.50
      },
      {
        name: 'Sprite',
        description: 'Sprite citron 33cl',
        category: 'Boissons',
        aiKeywords: ['soda', 'citron', 'rafraîchissant'],
        allergens: [],
        price: 3.50
      },
      {
        name: 'Jus d\'Orange Pressé',
        description: 'Jus d\'orange fraîchement pressé',
        category: 'Boissons',
        aiKeywords: ['jus', 'orange', 'frais', 'vitamine'],
        allergens: [],
        price: 4.50
      },
      {
        name: 'Eau Minérale',
        description: 'Eau minérale plate ou pétillante 50cl',
        category: 'Boissons',
        aiKeywords: ['eau', 'minérale', 'hydratation'],
        allergens: [],
        price: 2.50
      },
      {
        name: 'Café Espresso',
        description: 'Café espresso italien',
        category: 'Boissons',
        aiKeywords: ['café', 'espresso', 'chaud', 'italien'],
        allergens: [],
        price: 2.90
      },
      {
        name: 'Thé Vert',
        description: 'Thé vert bio en infusion',
        category: 'Boissons',
        aiKeywords: ['thé', 'vert', 'bio', 'chaud'],
        allergens: [],
        price: 2.90
      }
    ];

    const newProducts = [];
    for (const productData of additionalProducts) {
      const exists = existingProducts.find(p => p.name.toLowerCase().includes(productData.name.toLowerCase()));
      if (!exists) {
        const product = await prisma.product.create({
          data: {
            storeId: correctStore.id,
            name: productData.name,
            description: productData.description,
            category: productData.category,
            status: 'ACTIVE',
            aiKeywords: productData.aiKeywords,
            stock: 100,
            popularity: Math.floor(Math.random() * 10) + 1
          }
        });

        // Ajouter les tags allergènes
        for (const allergen of productData.allergens) {
          await prisma.productTagRelation.create({
            data: {
              productId: product.id,
              tag: `allergène:${allergen}`
            }
          });
        }

        // Ajouter d'autres tags
        for (const keyword of productData.aiKeywords) {
          await prisma.productTagRelation.create({
            data: {
              productId: product.id,
              tag: keyword
            }
          });
        }

        newProducts.push(product);
      }
    }

    console.log(`✅ ${newProducts.length} nouveaux produits créés avec allergènes`);

    // 6. Récupérer tous les produits pour les commandes
    const allProducts = await prisma.product.findMany({
      where: { storeId: correctStore.id },
      include: { tags: true }
    });

    console.log(`📦 ${allProducts.length} produits total disponibles`);

    // 7. Créer des clients réalistes
    console.log('👥 Création des clients...');

    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          phone: '0612345678',
          firstName: 'Marie',
          lastName: 'Dubois',
          email: 'marie.dubois@email.com',
          status: 'VIP',
          businessId: business.id,
          totalSpent: 285.40,
          orderCount: 15,
          lastSeen: new Date()
        }
      }),
      prisma.customer.create({
        data: {
          phone: '0687654321',
          firstName: 'Pierre',
          lastName: 'Lefebvre',
          email: 'pierre.lefebvre@email.com',
          status: 'REGULAR',
          businessId: business.id,
          totalSpent: 156.80,
          orderCount: 8,
          lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }),
      prisma.customer.create({
        data: {
          phone: '0123456789',
          firstName: 'Sophie',
          lastName: 'Martin',
          email: 'sophie.martin@email.com',
          status: 'NEW',
          businessId: business.id,
          totalSpent: 34.80,
          orderCount: 2,
          lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.customer.create({
        data: {
          phone: '0698765432',
          firstName: 'Jean',
          lastName: 'Rousseau',
          email: 'jean.rousseau@entreprise.com',
          status: 'REGULAR',
          businessId: business.id,
          totalSpent: 198.60,
          orderCount: 6,
          lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.customer.create({
        data: {
          phone: '0756789012',
          firstName: 'Camille',
          lastName: 'Durand',
          email: 'camille.durand@etudiant.fr',
          status: 'NEW',
          businessId: business.id,
          totalSpent: 45.30,
          orderCount: 3,
          lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log(`✅ ${customers.length} clients créés`);

    // 8. Créer des commandes variées avec vrais produits
    console.log('📋 Création des commandes avec vrais produits...');

    const orders = [];

    // Fonction helper pour créer une commande
    const createOrder = async (customer, items, daysBefore = 0) => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      return await prisma.order.create({
        data: {
          orderNumber: `CMD${Date.now() + Math.random() * 1000}`,
          customerId: customer.id,
          storeId: correctStore.id,
          businessId: business.id,
          items: JSON.stringify(items),
          subtotal,
          tax,
          taxRate: 10,
          total,
          status: daysBefore === 0 ? 'PENDING' : 'DELIVERED',
          paymentStatus: 'PAID',
          paymentMethod: Math.random() > 0.5 ? 'Carte bancaire' : 'Espèces',
          createdAt: new Date(Date.now() - daysBefore * 24 * 60 * 60 * 1000)
        }
      });
    };

    // Commandes pour Marie (VIP) - commandes complètes
    orders.push(await createOrder(customers[0], [
      { name: 'Plateau Sushi Mix', quantity: 1, price: 18.90 },
      { name: 'Tiramisu Maison', quantity: 1, price: 6.90 },
      { name: 'Thé Vert', quantity: 1, price: 2.90 }
    ], 0));

    orders.push(await createOrder(customers[0], [
      { name: 'Burger Gourmet', quantity: 2, price: 12.90 },
      { name: 'Moelleux au Chocolat', quantity: 2, price: 7.50 },
      { name: 'Coca-Cola', quantity: 2, price: 3.50 }
    ], 2));

    // Commandes pour Pierre (professionnel) - commandes groupées
    orders.push(await createOrder(customers[1], [
      { name: 'Pizza Margherita', quantity: 4, price: 9.90 },
      { name: 'Salade César', quantity: 2, price: 8.90 },
      { name: 'Coca-Cola', quantity: 4, price: 3.50 },
      { name: 'Café Espresso', quantity: 4, price: 2.90 }
    ], 1));

    // Commandes pour Sophie (nouvelle) - découverte
    orders.push(await createOrder(customers[2], [
      { name: 'Poké Bowl', quantity: 1, price: 13.90 },
      { name: 'Jus d\'Orange Pressé', quantity: 1, price: 4.50 }
    ], 3));

    // Commandes pour Jean (bureau)
    orders.push(await createOrder(customers[3], [
      { name: 'Wrap Mexicain', quantity: 1, price: 10.90 },
      { name: 'Panna Cotta Fruits Rouges', quantity: 1, price: 5.90 },
      { name: 'Café Espresso', quantity: 1, price: 2.90 }
    ], 1));

    // Commandes pour Camille (étudiante) - petit budget
    orders.push(await createOrder(customers[4], [
      { name: 'Tacos Trio', quantity: 1, price: 12.90 },
      { name: 'Eau Minérale', quantity: 1, price: 2.50 }
    ], 4));

    console.log(`✅ ${orders.length} commandes créées avec vrais produits`);

    // 9. Créer des échanges détaillés avec redirections
    console.log('💬 Création des échanges clients avec redirections...');

    const exchanges = await Promise.all([
      // Demande allergènes
      prisma.customerExchange.create({
        data: {
          customerId: customers[0].id,
          storeId: correctStore.id,
          type: 'CALL',
          description: 'Demande d\'informations sur les allergènes',
          content: JSON.stringify({
            transcript: "Bonjour, ma fille est allergique aux œufs. Quels desserts pourriez-vous nous proposer ? Elle adore le chocolat mais il faut que ce soit sans œufs.",
            response: "Parfait ! Je vous recommande notre Panna Cotta aux fruits rouges qui ne contient pas d'œufs, seulement du lactose. Et bonne nouvelle, nous avons aussi des options chocolat sans œufs en préparation !",
            duration: "3:45",
            allergiesDiscussed: ["œufs", "lactose"],
            recommendations: ["Panna Cotta Fruits Rouges"]
          }),
          metadata: JSON.stringify({ 
            resolved: true, 
            allergyInfo: true,
            customerSatisfaction: "très satisfait"
          }),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      }),

      // Grosse commande -> redirection manager
      prisma.customerExchange.create({
        data: {
          customerId: customers[1].id,
          storeId: correctStore.id,
          type: 'CALL',
          description: 'Grosse commande entreprise - redirection vers manager',
          content: JSON.stringify({
            transcript: "Bonjour, je suis Pierre Lefebvre de l'entreprise TechCorp. Nous organisons un séminaire demain et nous aurions besoin de commander pour 50 personnes. Nous aurions besoin de plateaux-repas avec des options végétariennes. Pouvez-vous nous aider ?",
            initialResponse: "Bonjour M. Lefebvre, c'est une belle commande ! Pour une commande de cette ampleur, je vais vous mettre en relation avec notre responsable commercial qui pourra vous proposer des tarifs préférentiels et s'assurer que tout soit parfait pour demain.",
            redirectionNote: "Transfert vers Sarah, responsable commercial - commandes entreprises",
            finalOutcome: "Devis personnalisé envoyé avec 15% de remise entreprise"
          }),
          metadata: JSON.stringify({ 
            redirected: true,
            redirectionType: "manager",
            redirectionReason: "Grosse commande - 50 personnes",
            handledBy: "Sarah Dupont - Commercial",
            orderValue: 750.00,
            discountApplied: 15
          }),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }),

      // Demande de réservation -> redirection service réservation
      prisma.customerExchange.create({
        data: {
          customerId: customers[2].id,
          storeId: correctStore.id,
          type: 'CALL',
          description: 'Demande de réservation - redirection service réservation',
          content: JSON.stringify({
            transcript: "Bonsoir, je voudrais réserver une table pour 8 personnes samedi soir vers 20h. C'est pour un anniversaire, est-ce que vous faites quelque chose de spécial ?",
            response: "Bonsoir Sophie ! C'est avec plaisir que nous vous accueillerons pour cet anniversaire. Pour les réservations et l'organisation d'événements spéciaux, je vais vous transférer vers notre service réservation qui pourra s'occuper de tous les détails.",
            transferNote: "Transfert vers service réservation - Marc Lenoir",
            reservationOutcome: "Table réservée + gâteau d'anniversaire offert + décoration de table"
          }),
          metadata: JSON.stringify({ 
            redirected: true,
            redirectionType: "reservation",
            redirectionReason: "Réservation 8 personnes + événement anniversaire",
            handledBy: "Marc Lenoir - Service Réservation",
            eventType: "anniversaire",
            partySize: 8,
            specialRequests: ["gâteau", "décoration"]
          }),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      }),

      // Vente additionnelle réussie
      prisma.customerExchange.create({
        data: {
          customerId: customers[3].id,
          storeId: correctStore.id,
          type: 'CALL',
          description: 'Vente additionnelle dessert réussie',
          content: JSON.stringify({
            transcript: "Je vais prendre un Wrap Mexicain s'il vous plaît.",
            upsellAttempt: "Parfait ! Et pour terminer en beauté, puis-je vous proposer notre spécialité ? Notre Moelleux au Chocolat est vraiment exceptionnel, servi chaud avec une boule de glace vanille.",
            customerResponse: "Ah ça me tente bien ! C'est fait maison ?",
            confirmationSale: "Absolument, tout est fait maison dans notre cuisine. Je vous ajoute le moelleux alors ?",
            finalResponse: "Oui parfait, et un café aussi s'il vous plaît."
          }),
          metadata: JSON.stringify({ 
            upsellSuccess: true,
            additionalItems: ["Moelleux au Chocolat", "Café Espresso"],
            additionalRevenue: 10.40,
            customerSatisfaction: "excellent"
          }),
          createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
        }
      }),

      // Événement spécial -> redirection service événementiel
      prisma.customerExchange.create({
        data: {
          customerId: customers[4].id,
          storeId: correctStore.id,
          type: 'EMAIL',
          description: 'Organisation anniversaire - redirection service événementiel',
          content: JSON.stringify({
            emailSubject: "Organisation anniversaire 30 ans",
            emailContent: "Bonjour, nous organisons les 30 ans de mon copain et nous cherchons un restaurant qui pourrait nous accueillir pour une vingtaine de personnes. Avez-vous des menus de groupe ? Nous aimerions quelque chose de festif avec peut-être de la musique. Merci !",
            responsePreview: "Bonjour Camille, merci pour votre message ! Nous serions ravis de vous accueillir pour cet événement spécial. Je transfère votre demande à notre service événementiel qui vous contactera dans la journée avec des propositions sur mesure.",
            eventCoordinatorNote: "Transfert vers Julie Martin - Coordinatrice événements"
          }),
          metadata: JSON.stringify({ 
            redirected: true,
            redirectionType: "events",
            redirectionReason: "Anniversaire 30 ans - 20 personnes",
            handledBy: "Julie Martin - Coordinatrice Événements",
            eventType: "anniversaire",
            partySize: 20,
            specialRequests: ["menu groupe", "ambiance festive", "musique"]
          }),
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      }),

      // Question produit simple
      prisma.customerExchange.create({
        data: {
          customerId: customers[0].id,
          storeId: correctStore.id,
          type: 'CALL',
          description: 'Question sur composition Poké Bowl',
          content: JSON.stringify({
            transcript: "Bonjour, je voudrais savoir ce qu'il y a exactement dans votre Poké Bowl ? Mon mari est allergique au sésame.",
            response: "Bonjour Marie ! Notre Poké Bowl contient du riz, saumon frais, avocat, concombre, radis, edamame et effectivement des graines de sésame avec une sauce soja-sésame. Pour votre mari, je peux vous proposer de le préparer sans sésame et avec une sauce alternative ?",
            customerDecision: "Oh parfait ! Oui faites-le sans sésame alors, et vous mettez quoi comme sauce à la place ?",
            finalResponse: "Nous avons une délicieuse sauce ponzu aux agrumes ou une sauce teriyaki, les deux sont sans sésame. Que préférez-vous ?"
          }),
          metadata: JSON.stringify({ 
            resolved: true,
            productCustomization: true,
            allergyAccommodation: "sésame",
            alternativeOffered: true
          }),
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log(`✅ ${exchanges.length} échanges créés avec redirections`);

    // 10. Créer des logs d'activité
    const activityLogs = await Promise.all([
      prisma.activityLog.create({
        data: {
          storeId: correctStore.id,
          customerId: customers[0].id,
          type: 'ORDER',
          entityId: orders[0].orderNumber,
          title: `Commande ${orders[0].orderNumber}`,
          description: 'Commande VIP avec questions allergènes',
          amount: orders[0].total,
          metadata: JSON.stringify({ 
            paymentMethod: 'Carte bancaire', 
            items: 3,
            customerType: 'VIP',
            specialNotes: 'Client sensible aux allergènes'
          })
        }
      }),
      prisma.activityLog.create({
        data: {
          storeId: correctStore.id,
          customerId: customers[1].id,
          type: 'CALL',
          entityId: 'CALL-ENTERPRISE-001',
          title: 'Appel commande entreprise',
          description: 'Grosse commande 50 personnes - transfert manager',
          metadata: JSON.stringify({ 
            duration: '8:30', 
            type: 'enterprise',
            redirected: true,
            potentialValue: 750.00
          }),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log(`✅ ${activityLogs.length} logs d'activité créés`);

    console.log('🎉 Seeding complet terminé !');
    console.log(`📊 Résumé pour la boutique "${correctStore.name}":`);
    console.log(`   - ${customers.length} clients avec profils variés`);
    console.log(`   - ${orders.length} commandes avec vrais produits`);
    console.log(`   - ${exchanges.length} échanges détaillés avec redirections`);
    console.log(`   - ${activityLogs.length} logs d'activité`);
    console.log(`   - ${allProducts.length} produits total avec allergènes`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage/seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndSeedCorrectData();