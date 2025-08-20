import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDemoData() {
  try {
    console.log('🧹 Nettoyage des données de démonstration...');
    
    // Trouver l'utilisateur principal pour préserver son compte
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur principal non trouvé');
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);

    // Supprimer toutes les données de démo mais préserver l'utilisateur principal
    console.log('🗑️ Suppression des activités de démo...');
    const deletedActivities = await prisma.activityLog.deleteMany({
      where: {
        OR: [
          { title: { contains: 'Première commande' } },
          { title: { contains: 'Pierre Dubois' } },
          { description: { contains: 'Première commande de Pierre Dubois' } },
          { metadata: { path: ['customerName'], equals: 'Pierre Dubois' } }
        ]
      }
    });
    console.log(`✅ ${deletedActivities.count} activités de démo supprimées`);

    console.log('🗑️ Suppression des commandes de démo...');
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        customer: {
          OR: [
            { firstName: 'Pierre', lastName: 'Dubois' },
            { email: { contains: 'pierre.dubois' } }
          ]
        }
      }
    });
    console.log(`✅ ${deletedOrders.count} commandes de démo supprimées`);

    console.log('🗑️ Suppression des clients de démo...');
    const deletedCustomers = await prisma.customer.deleteMany({
      where: {
        OR: [
          { firstName: 'Pierre', lastName: 'Dubois' },
          { email: { contains: 'pierre.dubois' } },
          { phone: { contains: '+33 1 12 34 56 78' } }
        ]
      }
    });
    console.log(`✅ ${deletedCustomers.count} clients de démo supprimés`);

    console.log('🗑️ Suppression des échanges clients de démo...');
    const deletedExchanges = await prisma.customerExchange.deleteMany({
      where: {
        customer: {
          OR: [
            { firstName: 'Pierre', lastName: 'Dubois' },
            { email: { contains: 'pierre.dubois' } }
          ]
        }
      }
    });
    console.log(`✅ ${deletedExchanges.count} échanges de démo supprimés`);

    // Supprimer les produits de démo Pizza Mario uniquement
    console.log('🗑️ Suppression des produits de démo Pizza Mario...');
    const stores = await prisma.store.findMany({
      where: { 
        business: { ownerId: user.id },
        name: 'Pizza Mario'
      }
    });

    for (const store of stores) {
      const deletedProducts = await prisma.product.deleteMany({
        where: { storeId: store.id }
      });
      console.log(`✅ ${deletedProducts.count} produits de démo supprimés pour ${store.name}`);
    }

    // Vérifier s'il y a des businesses de démo à nettoyer (autres que les vrais)
    const demoBusiness = await prisma.business.findMany({
      where: {
        ownerId: user.id,
        name: 'Pizza Mario' // Nom de business de démo
      }
    });

    for (const business of demoBusiness) {
      // Ne pas supprimer le business si c'est le seul, juste nettoyer ses données
      console.log(`🏢 Nettoyage du business: ${business.name}`);
      
      // Mettre à jour le nom pour indiquer que c'est vide
      await prisma.business.update({
        where: { id: business.id },
        data: { 
          name: 'Mon Restaurant', 
          description: 'Description de mon restaurant' 
        }
      });

      // Mettre à jour le store associé
      await prisma.store.updateMany({
        where: { businessId: business.id },
        data: { 
          name: 'Mon Restaurant',
          address: 'Adresse de mon restaurant'
        }
      });
    }

    console.log('🎉 Nettoyage terminé! Base de données prête pour de vraies données.');
    console.log('');
    console.log('📝 Pour créer de vraies activités, utilisez :');
    console.log('- Les appels téléphoniques Telnyx (créent automatiquement des activités)');
    console.log('- Les commandes via l\'API /api/restaurant/orders');
    console.log('- Les consultations via l\'API /api/restaurant/consultations');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDemoData();