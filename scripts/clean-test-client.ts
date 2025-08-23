#!/usr/bin/env tsx

/**
 * Script pour supprimer complètement un client test
 * Utilisation: npx tsx scripts/clean-test-client.ts
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
      },
      include: {
        businesses: {
          include: {
            stores: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log(`📊 Utilisateur trouvé: ${user.email}`);
    console.log(`📊 Nombre de businesses: ${user.businesses.length}`);

    for (const business of user.businesses) {
      console.log(`\n🏢 Business: ${business.name} (${business.id})`);
      console.log(`📊 Nombre de stores: ${business.stores.length}`);

      for (const store of business.stores) {
        console.log(`\n🏪 Store: ${store.name} (${store.id})`);
        
        // Supprimer les données liées au store
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
        
        // Supprimer les service bookings et leurs relations
        const serviceBookings = await prisma.serviceBooking.findMany({
          where: { storeId: store.id },
          include: { assignments: true }
        });
        
        for (const booking of serviceBookings) {
          await prisma.variantResourceAssignment.deleteMany({
            where: { id: { in: booking.assignments.map(a => a.id) } }
          });
        }
        await prisma.serviceBooking.deleteMany({ where: { storeId: store.id } });
        
        // Supprimer les service resources et leurs relations
        const serviceResources = await prisma.serviceResource.findMany({
          where: { storeId: store.id }
        });
        await prisma.variantResourceAssignment.deleteMany({
          where: { resourceId: { in: serviceResources.map(r => r.id) } }
        });
        await prisma.serviceResource.deleteMany({ where: { storeId: store.id } });
        
        // Supprimer les service types
        await prisma.serviceType.deleteMany({ where: { storeId: store.id } });
        
        // Les employés ne sont pas directement liés aux stores dans ce schéma
        // Ils sont probablement liés via les businesses
        
        // Supprimer les produits et leurs relations
        const products = await prisma.product.findMany({
          where: { storeId: store.id }
        });
        
        for (const product of products) {
          await prisma.compositionOption.deleteMany({
            where: { step: { productId: product.id } }
          });
          await prisma.compositionStep.deleteMany({ where: { productId: product.id } });
          await prisma.productVariation.deleteMany({ where: { productId: product.id } });
          await prisma.productTag.deleteMany({ where: { productId: product.id } });
        }
        await prisma.product.deleteMany({ where: { storeId: store.id } });
        
        // Supprimer les commandes
        const orders = await prisma.order.findMany({
          where: { storeId: store.id }
        });
        
        for (const order of orders) {
          await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        }
        await prisma.order.deleteMany({ where: { storeId: store.id } });
        
        // Supprimer les réservations
        await prisma.reservation.deleteMany({ where: { storeId: store.id } });
        
        // Supprimer les consultations
        await prisma.consultation.deleteMany({ where: { storeId: store.id } });
        
        // Supprimer les logs
        await prisma.callLog.deleteMany({ where: { storeId: store.id } });
        await prisma.activityLog.deleteMany({ where: { storeId: store.id } });
        await prisma.customerExchange.deleteMany({ where: { storeId: store.id } });
        
        console.log(`   ✅ Données du store supprimées`);
      }
      
      // Supprimer les stores
      await prisma.store.deleteMany({ where: { businessId: business.id } });
      
      // Supprimer les données du business
      await prisma.aiConversationSession.deleteMany({ where: { businessId: business.id } });
      await prisma.call.deleteMany({ where: { businessId: business.id } });
      await prisma.invoice.deleteMany({ where: { businessId: business.id } });
      await prisma.subscription.deleteMany({ where: { businessId: business.id } });
      await prisma.phoneNumber.deleteMany({ where: { businessId: business.id } });
      
      // Supprimer les customers et leurs relations
      const customers = await prisma.customer.findMany({
        where: { businessId: business.id }
      });
      
      for (const customer of customers) {
        await prisma.aiConversationSession.deleteMany({ where: { customerId: customer.id } });
        await prisma.call.deleteMany({ where: { customerId: customer.id } });
        await prisma.order.deleteMany({ where: { customerId: customer.id } });
        await prisma.reservation.deleteMany({ where: { customerId: customer.id } });
        await prisma.consultation.deleteMany({ where: { customerId: customer.id } });
      }
      await prisma.customer.deleteMany({ where: { businessId: business.id } });
      
      console.log(`   ✅ Business ${business.name} supprimé`);
    }
    
    // Supprimer les businesses
    await prisma.business.deleteMany({ where: { ownerId: user.id } });
    
    // Supprimer l'utilisateur
    await prisma.user.delete({ where: { id: user.id } });
    
    console.log(`\n🎉 Client test ${user.email} complètement supprimé !`);
    console.log(`📊 Résumé:`);
    console.log(`   - ${user.businesses.length} business(es) supprimé(es)`);
    console.log(`   - ${user.businesses.reduce((total, b) => total + b.stores.length, 0)} store(s) supprimé(es)`);
    console.log(`   - 1 utilisateur supprimé`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanTestClient();