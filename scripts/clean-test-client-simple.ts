#!/usr/bin/env tsx

/**
 * Script simplifié pour supprimer complètement un client test
 * Utilisation: npx tsx scripts/clean-test-client-simple.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestClient() {
  try {
    console.log('🔄 Nettoyage complet du client test...');

    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: {
        email: 'medkamel.dhakwani@gmail.com'
      }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log(`📊 Utilisateur trouvé: ${user.email} (${user.id})`);

    // Trouver tous les businesses de cet utilisateur
    const businesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      include: { stores: true }
    });

    console.log(`📊 Nombre de businesses: ${businesses.length}`);

    for (const business of businesses) {
      console.log(`\n🏢 Business: ${business.name} (${business.id})`);
      console.log(`📊 Nombre de stores: ${business.stores.length}`);

      // Supprimer toutes les données liées aux stores de ce business
      for (const store of business.stores) {
        console.log(`🏪 Nettoyage store: ${store.name} (${store.id})`);
        
        try {
          // Supprimer dans l'ordre des dépendances
          await prisma.preparationTicket.deleteMany({ where: { storeId: store.id } });
          await prisma.componentUsageStats.deleteMany({ where: { storeId: store.id } });
          await prisma.component.deleteMany({ where: { storeId: store.id } });
          await prisma.componentCategory.deleteMany({ where: { storeId: store.id } });
          await prisma.universalService.deleteMany({ where: { storeId: store.id } });
          await prisma.serviceCriteria.deleteMany({ where: { storeId: store.id } });
          await prisma.weatherRecommendation.deleteMany({ where: { storeId: store.id } });
          await prisma.intelligentAIConfig.deleteMany({ where: { storeId: store.id } });
          await prisma.notificationConfig.deleteMany({ where: { storeId: store.id } });
          await prisma.notificationTemplate.deleteMany({ where: { storeId: store.id } });
          await prisma.menuUploadSession.deleteMany({ where: { storeId: store.id } });
          await prisma.storeMetrics.deleteMany({ where: { storeId: store.id } });
          await prisma.usageTracking.deleteMany({ where: { storeId: store.id } });
          await prisma.consumptionSummary.deleteMany({ where: { storeId: store.id } });
          await prisma.openAIUsage.deleteMany({ where: { storeId: store.id } });
          await prisma.telnyxUsage.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Données techniques supprimées`);
        } catch (error) {
          console.log(`   ⚠️ Erreur données techniques: ${error}`);
        }
        
        try {
          // Supprimer les service bookings et leurs relations
          const serviceBookingIds = await prisma.serviceBooking.findMany({
            where: { storeId: store.id },
            select: { id: true }
          });
          
          if (serviceBookingIds.length > 0) {
            await prisma.variantResourceAssignment.deleteMany({
              where: { variantId: { in: serviceBookingIds.map(b => b.id) } }
            });
          }
          
          await prisma.serviceBooking.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Service bookings supprimés`);
        } catch (error) {
          console.log(`   ⚠️ Erreur service bookings: ${error}`);
        }
        
        try {
          // Supprimer les service resources et leurs relations
          const resourceIds = await prisma.serviceResource.findMany({
            where: { storeId: store.id },
            select: { id: true }
          });
          
          if (resourceIds.length > 0) {
            await prisma.variantResourceAssignment.deleteMany({
              where: { resourceId: { in: resourceIds.map(r => r.id) } }
            });
          }
          
          await prisma.serviceResource.deleteMany({ where: { storeId: store.id } });
          await prisma.serviceType.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Service resources supprimés`);
        } catch (error) {
          console.log(`   ⚠️ Erreur service resources: ${error}`);
        }
        
        try {
          // Supprimer les produits et leurs relations
          const productIds = await prisma.product.findMany({
            where: { storeId: store.id },
            select: { id: true }
          });
          
          if (productIds.length > 0) {
            // Supprimer les composition options d'abord
            await prisma.compositionOption.deleteMany({
              where: { step: { productId: { in: productIds.map(p => p.id) } } }
            });
            
            await prisma.compositionStep.deleteMany({ 
              where: { productId: { in: productIds.map(p => p.id) } } 
            });
            await prisma.productVariation.deleteMany({ 
              where: { productId: { in: productIds.map(p => p.id) } } 
            });
            await prisma.productTag.deleteMany({ 
              where: { productId: { in: productIds.map(p => p.id) } } 
            });
          }
          
          await prisma.product.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Produits supprimés`);
        } catch (error) {
          console.log(`   ⚠️ Erreur produits: ${error}`);
        }
        
        try {
          // Supprimer les commandes
          const orderIds = await prisma.order.findMany({
            where: { storeId: store.id },
            select: { id: true }
          });
          
          if (orderIds.length > 0) {
            await prisma.orderItem.deleteMany({ 
              where: { orderId: { in: orderIds.map(o => o.id) } } 
            });
          }
          
          await prisma.order.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Commandes supprimées`);
        } catch (error) {
          console.log(`   ⚠️ Erreur commandes: ${error}`);
        }
        
        try {
          // Supprimer les réservations et consultations
          await prisma.reservation.deleteMany({ where: { storeId: store.id } });
          await prisma.consultation.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Réservations/consultations supprimées`);
        } catch (error) {
          console.log(`   ⚠️ Erreur réservations: ${error}`);
        }
        
        try {
          // Supprimer les logs
          await prisma.callLog.deleteMany({ where: { storeId: store.id } });
          await prisma.activityLog.deleteMany({ where: { storeId: store.id } });
          await prisma.customerExchange.deleteMany({ where: { storeId: store.id } });
          
          console.log(`   ✅ Logs supprimés`);
        } catch (error) {
          console.log(`   ⚠️ Erreur logs: ${error}`);
        }
      }
      
      // Supprimer les stores
      await prisma.store.deleteMany({ where: { businessId: business.id } });
      console.log(`   ✅ Stores supprimés`);
      
      try {
        // Supprimer les données du business
        await prisma.aiConversationSession.deleteMany({ where: { businessId: business.id } });
        await prisma.call.deleteMany({ where: { businessId: business.id } });
        await prisma.invoice.deleteMany({ where: { businessId: business.id } });
        await prisma.subscription.deleteMany({ where: { businessId: business.id } });
        await prisma.phoneNumber.deleteMany({ where: { businessId: business.id } });
        await prisma.customer.deleteMany({ where: { businessId: business.id } });
        
        console.log(`   ✅ Données business supprimées`);
      } catch (error) {
        console.log(`   ⚠️ Erreur données business: ${error}`);
      }
      
      console.log(`   ✅ Business ${business.name} nettoyé`);
    }
    
    // Supprimer les businesses
    await prisma.business.deleteMany({ where: { ownerId: user.id } });
    console.log(`✅ Businesses supprimés`);
    
    // Supprimer l'utilisateur
    await prisma.user.delete({ where: { id: user.id } });
    
    console.log(`\n🎉 Client test ${user.email} complètement supprimé !`);
    console.log(`📊 Résumé:`);
    console.log(`   - ${businesses.length} business(es) supprimé(es)`);
    console.log(`   - ${businesses.reduce((total, b) => total + b.stores.length, 0)} store(s) supprimé(es)`);
    console.log(`   - 1 utilisateur supprimé`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanTestClient();