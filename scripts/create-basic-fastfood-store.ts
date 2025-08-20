#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBasicFastFoodStore() {
  console.log('🍔 Création de la boutique Fast Food basique pour medkamel.dhakwani...');

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
          name: 'Mon Business',
          description: 'Business principal',
          type: 'PRODUCTS',
          ownerId: user.id
        }
      });
      console.log(`✅ Business créé: ${business.name}`);
    } else {
      console.log(`✅ Business existant trouvé: ${business.name}`);
    }

    // Créer la boutique avec les infos de base seulement (comme dans le popup)
    console.log('🏪 Création de la boutique...');
    
    const store = await prisma.store.create({
      data: {
        // Étape 1 : Infos de base
        name: 'Burger Express',
        address: '123 Avenue de la République, 75011 Paris',
        country: 'FR',
        businessId: business.id,
        businessCategory: 'RESTAURANT', // Type d'activité sélectionné
        
        // Valeurs par défaut
        isActive: true,
        hasProducts: true,
        hasReservations: false,
        hasConsultations: false,
        
        // Settings avec juste les infos de base
        settings: JSON.stringify({
          // Étape 2 : Horaires
          schedule: {
            monday: { open: '11:00', close: '23:00', isOpen: true },
            tuesday: { open: '11:00', close: '23:00', isOpen: true },
            wednesday: { open: '11:00', close: '23:00', isOpen: true },
            thursday: { open: '11:00', close: '23:00', isOpen: true },
            friday: { open: '11:00', close: '00:00', isOpen: true },
            saturday: { open: '11:00', close: '00:00', isOpen: true },
            sunday: { open: '12:00', close: '23:00', isOpen: true }
          },
          
          // Étape 3 : TVA et devise
          currency: 'EUR',
          taxRates: [
            { id: 'tva_normal', name: 'TVA Normal', rate: 10, isDefault: true }
          ],
          
          // Valeurs par défaut minimales
          telnyxConfigured: false, // Numéro virtuel à configurer plus tard
          isConfigured: true,
          notifications: { enabled: false }
        })
      }
    });

    console.log(`\n✅ Boutique créée avec succès !`);
    console.log(`\n📋 Informations de base :`);
    console.log(`   ID: ${store.id}`);
    console.log(`   Nom: ${store.name}`);
    console.log(`   Type: ${store.businessCategory}`);
    console.log(`   Adresse: ${store.address}`);
    console.log(`   Pays: ${store.country}`);
    console.log(`   Devise: EUR`);
    console.log(`   TVA: 10%`);
    console.log(`   Horaires: Configurés`);
    console.log(`\n⚠️  À configurer dans l'interface :`);
    console.log(`   - Numéro de téléphone virtuel`);
    console.log(`   - Catalogue produits`);
    console.log(`   - Configuration IA`);
    console.log(`   - Paramètres métier (livraison, etc.)`);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
createBasicFastFoodStore()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur script:', error);
    process.exit(1);
  });