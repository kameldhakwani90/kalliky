#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateStores() {
  try {
    console.log('🔄 Nettoyage des boutiques en doublon...');
    
    // Trouver l'utilisateur medkamel
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    // Trouver tous ses business avec leurs boutiques
    const businesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      include: {
        stores: {
          include: {
            products: true,
            subscriptions: true,
            activityLogs: true,
            phoneNumbers: true
          }
        }
      }
    });

    console.log(`📋 Businesses trouvés: ${businesses.length}`);
    
    for (const business of businesses) {
      console.log(`\n🏢 Business: ${business.name} (${business.stores.length} boutiques)`);
      
      if (business.stores.length > 1) {
        // Garder seulement la boutique la plus récente (Pizzeria Kamel)
        const sortedStores = business.stores.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const storeToKeep = sortedStores[0];
        const storesToDelete = sortedStores.slice(1);
        
        console.log(`✅ Garder: ${storeToKeep.name} (créée le ${storeToKeep.createdAt})`);
        
        for (const store of storesToDelete) {
          console.log(`🗑️  Supprimer: ${store.name} (créée le ${store.createdAt})`);
          
          // Supprimer les relations d'abord
          await prisma.activityLog.deleteMany({
            where: { storeId: store.id }
          });
          
          await prisma.product.deleteMany({
            where: { storeId: store.id }
          });
          
          await prisma.subscription.deleteMany({
            where: { storeId: store.id }
          });
          
          await prisma.phoneNumber.deleteMany({
            where: { businessId: business.id }
          });
          
          // Supprimer la boutique
          await prisma.store.delete({
            where: { id: store.id }
          });
          
          console.log(`   ✅ Boutique ${store.name} supprimée`);
        }
      } else {
        console.log(`   ℹ️  Une seule boutique: ${business.stores[0]?.name || 'Aucune'}`);
      }
    }
    
    // Vérifier les business sans boutiques et les supprimer
    const emptyBusinesses = await prisma.business.findMany({
      where: { 
        ownerId: user.id,
        stores: { none: {} }
      }
    });
    
    if (emptyBusinesses.length > 0) {
      console.log(`\n🗑️  Suppression de ${emptyBusinesses.length} business vides...`);
      
      for (const business of emptyBusinesses) {
        await prisma.business.delete({
          where: { id: business.id }
        });
        console.log(`   ✅ Business vide "${business.name}" supprimé`);
      }
    }
    
    // Afficher le résultat final
    const finalBusinesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      include: { stores: true }
    });
    
    console.log('\n📊 RÉSULTAT FINAL:');
    finalBusinesses.forEach(business => {
      console.log(`🏢 ${business.name}: ${business.stores.length} boutique(s)`);
      business.stores.forEach(store => {
        console.log(`   📍 ${store.name} - ${store.address}`);
      });
    });
    
    console.log('\n✅ Nettoyage terminé!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanupDuplicateStores();