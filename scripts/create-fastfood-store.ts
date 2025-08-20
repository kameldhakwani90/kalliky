#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createFastFoodStore() {
  console.log('🍔 Création de la boutique Fast Food pour medkamel.dhakwani...');

  try {
    // Trouver l'utilisateur medkamel.dhakwani
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.error('❌ Utilisateur medkamel.dhakwani@gmail.com non trouvé');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.firstName} ${user.lastName}`);

    // Trouver ou créer le business
    let business = await prisma.business.findFirst({
      where: { ownerId: user.id }
    });

    if (!business) {
      console.log('📊 Création du business...');
      business = await prisma.business.create({
        data: {
          name: 'Fast Food Empire',
          description: 'Chaîne de restauration rapide',
          type: 'PRODUCTS',
          ownerId: user.id
        }
      });
      console.log(`✅ Business créé: ${business.name}`);
    } else {
      console.log(`✅ Business existant trouvé: ${business.name}`);
    }

    // Créer la boutique Fast Food
    console.log('🏪 Création de la boutique Burger Express...');
    
    const store = await prisma.store.create({
      data: {
        name: 'Burger Express',
        address: '123 Avenue de la République, 75011 Paris',
        city: 'Paris',
        country: 'FR',
        businessId: business.id,
        businessCategory: 'RESTAURANT',
        isActive: true,
        hasProducts: true,
        hasReservations: false,
        hasConsultations: false,
        settings: JSON.stringify({
          currency: 'EUR',
          taxRates: [
            { id: 'tva_normal', name: 'TVA Normal', rate: 10, isDefault: true },
            { id: 'tva_reduite', name: 'TVA Réduite', rate: 5.5, isDefault: false }
          ],
          schedule: {
            monday: { open: '11:00', close: '23:00', isOpen: true },
            tuesday: { open: '11:00', close: '23:00', isOpen: true },
            wednesday: { open: '11:00', close: '23:00', isOpen: true },
            thursday: { open: '11:00', close: '23:00', isOpen: true },
            friday: { open: '11:00', close: '00:00', isOpen: true },
            saturday: { open: '11:00', close: '00:00', isOpen: true },
            sunday: { open: '12:00', close: '23:00', isOpen: true }
          },
          notifications: {
            enabled: true,
            email: 'burgerexpress@kalliky.ai',
            whatsapp: '+33612345678'
          },
          telnyxConfigured: false, // Sera configuré plus tard
          isConfigured: true,
          
          // Configuration IA
          aiAgent: {
            enabled: true,
            personality: 'enthusiastic',
            voice: 'nova',
            language: 'fr',
            voiceSpeed: 1.0,
            greeting: 'Bonjour et bienvenue chez Burger Express ! Que puis-je vous servir aujourd\'hui ?',
            goodbye: 'Merci pour votre commande ! Votre repas sera prêt dans 15-20 minutes. À très bientôt !',
            waitingMessage: 'Un instant, je consulte notre menu du jour...',
            confirmationMessage: 'Super ! J\'ai bien noté votre commande. Désirez-vous ajouter une boisson ou un dessert ?',
            upselling: {
              enabled: true,
              strategy: 'balanced',
              threshold: 10,
              suggestions: [
                'Voulez-vous transformer votre burger en menu avec frites et boisson ?',
                'Nos cookies maison sont délicieux, ça vous tente ?',
                'Une boisson fraîche avec votre commande ?'
              ]
            }
          },
          
          // Paramètres métier Fast Food
          businessParams: {
            deliveryRadius: 3,
            minimumOrder: 10,
            deliveryFee: 2.50,
            freeDeliveryThreshold: 20,
            preparationTime: 15,
            acceptsDelivery: true,
            acceptsPickup: true
          },
          
          // Options métier activées
          businessOptions: {
            suggestDrinks: true,
            suggestDesserts: true,
            askSpiceLevel: true,
            handleAllergies: true,
            offerPaymentOnDelivery: false
          },
          
          // Spécifications personnalisées
          customSpecifications: [
            {
              id: 'spec_1',
              title: 'Menu du jour',
              content: 'Menu complet Burger + Frites + Boisson = 12€ toute la journée !'
            },
            {
              id: 'spec_2',
              title: 'Livraison offerte',
              content: 'Livraison gratuite ce weekend dès 20€ de commande'
            },
            {
              id: 'spec_3',
              title: 'Options sans gluten',
              content: 'Tous nos burgers sont disponibles avec pain sans gluten sur demande'
            }
          ]
        })
      }
    });

    console.log(`✅ Boutique créée avec succès !`);
    console.log(`   ID: ${store.id}`);
    console.log(`   Nom: ${store.name}`);
    console.log(`   Adresse: ${store.address}`);
    console.log(`   Type: ${store.businessCategory}`);

    // Ajouter quelques produits de base
    console.log('🍔 Ajout des produits au catalogue...');

    const products = [
      { name: 'Burger Classic', description: 'Steak haché, salade, tomate, oignon, sauce maison', price: 8.50, category: 'Burgers' },
      { name: 'Burger Bacon', description: 'Double steak, bacon croustillant, cheddar, sauce BBQ', price: 10.50, category: 'Burgers' },
      { name: 'Burger Végétarien', description: 'Galette de légumes, avocat, salade, tomate', price: 9.00, category: 'Burgers' },
      { name: 'Frites Maison', description: 'Frites fraîches coupées main', price: 3.50, category: 'Accompagnements' },
      { name: 'Nuggets x6', description: 'Nuggets de poulet avec sauce au choix', price: 5.00, category: 'Accompagnements' },
      { name: 'Coca-Cola', description: '33cl', price: 2.50, category: 'Boissons' },
      { name: 'Sprite', description: '33cl', price: 2.50, category: 'Boissons' },
      { name: 'Eau Minérale', description: '50cl', price: 2.00, category: 'Boissons' },
      { name: 'Sundae Chocolat', description: 'Glace vanille avec sauce chocolat', price: 3.00, category: 'Desserts' },
      { name: 'Cookie', description: 'Cookie aux pépites de chocolat', price: 2.00, category: 'Desserts' }
    ];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await prisma.product.create({
        data: {
          storeId: store.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          status: 'ACTIVE',
          order: i,
          available: true
        }
      });
    }

    console.log(`✅ ${products.length} produits ajoutés au catalogue`);

    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('\n📋 Récapitulatif :');
    console.log('   - Boutique : Burger Express');
    console.log('   - Type : Restaurant / Fast Food');
    console.log('   - Horaires : Lun-Jeu 11h-23h, Ven-Sam 11h-00h, Dim 12h-23h');
    console.log('   - TVA : 10% (normal) et 5.5% (réduite)');
    console.log('   - Livraison : 3km max, minimum 10€, frais 2.50€ (gratuit >20€)');
    console.log('   - IA : Voix Nova, personnalité enthousiaste');
    console.log('   - Catalogue : 10 produits (burgers, accompagnements, boissons, desserts)');
    console.log('\n⚠️  Note : Le numéro Telnyx sera configuré plus tard');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
createFastFoodStore()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur script:', error);
    process.exit(1);
  });