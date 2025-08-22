#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupMedkamelAsClient() {
  try {
    console.log('🔄 Configuration de medkamel.dhakwani comme CLIENT...');

    // 1. Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur medkamel.dhakwani@gmail.com non trouvé!');
      
      // Créer l'utilisateur s'il n'existe pas
      console.log('📝 Création de l\'utilisateur...');
      const hashedPassword = await bcrypt.hash('Test@1942', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'medkamel.dhakwani@gmail.com',
          password: hashedPassword,
          firstName: 'Mohamed Kamel',
          lastName: 'Dhakwani',
          role: 'CLIENT',
          language: 'fr'
        }
      });
      
      console.log('✅ Utilisateur créé avec succès');
      
      // Créer un business et une boutique
      await createBusinessAndStore(newUser.id);
      
    } else {
      console.log('✅ Utilisateur trouvé:', user.email);
      
      // 2. Changer le rôle en CLIENT
      if (user.role !== 'CLIENT') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'CLIENT' }
        });
        console.log('✅ Rôle changé de', user.role, '→ CLIENT');
      } else {
        console.log('ℹ️  Rôle déjà CLIENT');
      }

      // 3. Vérifier s'il a déjà un business
      const existingBusiness = await prisma.business.findFirst({
        where: { ownerId: user.id },
        include: { stores: true }
      });

      if (existingBusiness && existingBusiness.stores.length > 0) {
        console.log('ℹ️  Business et boutique existent déjà:');
        console.log('   - Business:', existingBusiness.name);
        console.log('   - Boutiques:', existingBusiness.stores.map(s => s.name).join(', '));
      } else {
        // Créer un business et une boutique
        await createBusinessAndStore(user.id);
      }
    }

    console.log('\n✅ Configuration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBusinessAndStore(userId: string) {
  console.log('📝 Création du business et de la boutique...');
  
  // Créer le business
  const business = await prisma.business.create({
    data: {
      ownerId: userId,
      name: 'Restaurant Test Kamel',
      description: 'Restaurant pizzeria pour tests',
      type: 'PRODUCTS' // PRODUCTS pour restaurant avec commandes
    }
  });
  
  console.log('✅ Business créé:', business.name);

  // Créer la boutique
  const store = await prisma.store.create({
    data: {
      businessId: business.id,
      name: 'Pizzeria Kamel',
      address: '123 Rue de Test, Paris',
      city: 'Paris',
      country: 'FR',
      isActive: true,
      hasProducts: true,
      hasReservations: false,
      hasConsultations: false,
      businessCategory: 'RESTAURANT', // Important ! Lie la boutique à la config RESTAURANT
      settings: {
        aiAgent: {
          enabled: true,
          name: 'Assistant IA Pizzeria',
          personality: 'Professionnel et amical pour prendre les commandes de pizzas',
          voice: 'alloy',
          language: 'fr'
        },
        businessHours: {
          monday: { open: '11:00', close: '23:00', enabled: true },
          tuesday: { open: '11:00', close: '23:00', enabled: true },
          wednesday: { open: '11:00', close: '23:00', enabled: true },
          thursday: { open: '11:00', close: '23:00', enabled: true },
          friday: { open: '11:00', close: '23:00', enabled: true },
          saturday: { open: '11:00', close: '23:00', enabled: true },
          sunday: { open: '11:00', close: '23:00', enabled: true }
        },
        isConfigured: true,
        deliveryRadius: 5,
        minimumOrder: 15,
        deliveryFee: 3
      }
    }
  });
  
  console.log('✅ Boutique créée:', store.name);

  // Créer une subscription trial
  const subscription = await prisma.subscription.create({
    data: {
      businessId: business.id,
      storeId: store.id,
      plan: 'TRIAL',
      status: 'ACTIVE',
      startDate: new Date(),
      currentPeriodStart: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
      monthlyPrice: 0
    }
  });
  
  console.log('✅ Subscription TRIAL créée (14 jours, 100 appels)');

  // Créer quelques produits de base
  const products = [
    { name: 'Pizza Margherita', category: 'Pizzas', price: 1200 },
    { name: 'Pizza 4 Fromages', category: 'Pizzas', price: 1400 },
    { name: 'Pizza Royale', category: 'Pizzas', price: 1500 },
    { name: 'Coca-Cola', category: 'Boissons', price: 300 },
    { name: 'Eau minérale', category: 'Boissons', price: 200 },
    { name: 'Tiramisu', category: 'Desserts', price: 600 }
  ];

  for (const prod of products) {
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: prod.name,
        category: prod.category,
        description: `Délicieux ${prod.name}`,
        status: 'ACTIVE',
        sourceType: 'MANUAL'
      }
    });

    // Créer une variation avec le prix
    await prisma.productVariation.create({
      data: {
        productId: product.id,
        name: 'Standard',
        type: 'CUSTOM',
        prices: { 'dine-in': prod.price, 'delivery': prod.price },
        isDefault: true,
        isVisible: true,
        order: 0
      }
    });
  }
  
  console.log('✅ 6 produits créés avec variations');
}

// Exécuter le script
setupMedkamelAsClient();