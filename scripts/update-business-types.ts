#!/usr/bin/env tsx

/**
 * Script pour mettre à jour les types de business des stores existants
 * Utilisation: npx tsx scripts/update-business-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBusinessTypes() {
  try {
    console.log('🔄 Mise à jour des types de business...');

    // Lister tous les stores
    const stores = await prisma.store.findMany({
      include: {
        business: true
      }
    });

    console.log(`📊 ${stores.length} stores trouvés`);

    for (const store of stores) {
      console.log(`\n📝 Store: ${store.name} (${store.id})`);
      console.log(`   - Category actuelle: ${store.businessCategory}`);
      console.log(`   - Business type actuel: ${store.business.type}`);
      
      // Mettre à jour selon les besoins
      // Par exemple, les stores de restaurants
      if (store.name.toLowerCase().includes('restaurant') || 
          store.name.toLowerCase().includes('pizza') ||
          store.name.toLowerCase().includes('food')) {
        
        await prisma.store.update({
          where: { id: store.id },
          data: {
            businessCategory: 'RESTAURANT'
          }
        });
        
        await prisma.business.update({
          where: { id: store.business.id },
          data: {
            type: 'PRODUCTS' // ou 'RESERVATIONS' selon le besoin
          }
        });
        
        console.log(`   ✅ Mis à jour: RESTAURANT + PRODUCTS`);
      }
      // Salons de beauté
      else if (store.name.toLowerCase().includes('salon') || 
               store.name.toLowerCase().includes('beauté') ||
               store.name.toLowerCase().includes('beauty') ||
               store.name.toLowerCase().includes('coiffure')) {
        
        await prisma.store.update({
          where: { id: store.id },
          data: {
            businessCategory: 'BEAUTY'
          }
        });
        
        await prisma.business.update({
          where: { id: store.business.id },
          data: {
            type: 'RESERVATIONS'
          }
        });
        
        console.log(`   ✅ Mis à jour: BEAUTY + RESERVATIONS`);
      }
      // Sinon, mettre par défaut en restaurant
      else {
        await prisma.store.update({
          where: { id: store.id },
          data: {
            businessCategory: 'RESTAURANT'
          }
        });
        
        console.log(`   ✅ Mis à jour par défaut: RESTAURANT`);
      }
    }

    console.log('\n🎉 Mise à jour terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateBusinessTypes();