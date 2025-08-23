#!/usr/bin/env tsx

/**
 * Script pour créer un salon de beauté de test
 * Utilisation: npx tsx scripts/create-beauty-salon-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBeautySalonTest() {
  try {
    console.log('🔄 Création d\'un salon de beauté de test...');

    // Trouver un business existant ou en créer un
    const existingBusiness = await prisma.business.findFirst();
    
    if (!existingBusiness) {
      console.log('❌ Aucun business existant trouvé');
      return;
    }

    // Créer un store salon de beauté
    const beautySalon = await prisma.store.create({
      data: {
        name: 'Salon Élégance',
        address: '123 Avenue de la Beauté, Paris',
        city: 'Paris',
        country: 'FR',
        businessId: existingBusiness.id,
        businessCategory: 'BEAUTY',
        hasProducts: true,
        hasReservations: true,
        hasConsultations: false,
        isActive: true
      }
    });

    // Mettre à jour le business type
    await prisma.business.update({
      where: { id: existingBusiness.id },
      data: {
        type: 'RESERVATIONS'
      }
    });

    console.log('✅ Salon de beauté créé:', {
      id: beautySalon.id,
      name: beautySalon.name,
      category: beautySalon.businessCategory
    });

    console.log(`\n🔗 URL de test: http://localhost:9002/app/manage/${beautySalon.id}/services`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createBeautySalonTest();