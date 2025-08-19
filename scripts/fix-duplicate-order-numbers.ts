import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateOrderNumbers() {
  console.log('🔧 Correction des numéros de commande dupliqués...');

  try {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id }
    });

    if (!business) {
      console.log('❌ Business non trouvé');
      return;
    }

    // Trouver la boutique Les Coutumes
    const store = await prisma.store.findUnique({
      where: { id: '0e842ebb-c059-4a31-8e19-a7bbaad7cd0b' }
    });

    if (!store) {
      console.log('❌ Store non trouvé');
      return;
    }

    // Récupérer toutes les commandes de cette boutique
    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📋 ${orders.length} commandes trouvées`);

    // Générer de nouveaux numéros de commande uniques
    let counter = 1001;
    
    for (const order of orders) {
      const newOrderNumber = `CMD${counter}`;
      
      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber: newOrderNumber }
      });
      
      console.log(`✅ Commande ${order.orderNumber} → ${newOrderNumber}`);
      counter++;
    }

    // Mettre à jour les activityLogs qui référencent ces commandes
    const activityLogs = await prisma.activityLog.findMany({
      where: { storeId: store.id, type: 'ORDER' }
    });

    for (const log of activityLogs) {
      // Trouver la commande correspondante
      const order = orders.find(o => o.id === log.entityId || log.entityId.includes(o.id.substring(0, 8)));
      if (order) {
        const newOrderNumber = `CMD${1001 + orders.indexOf(order)}`;
        await prisma.activityLog.update({
          where: { id: log.id },
          data: { 
            entityId: newOrderNumber,
            title: `Commande ${newOrderNumber}`
          }
        });
        console.log(`✅ ActivityLog mis à jour: ${log.entityId} → ${newOrderNumber}`);
      }
    }

    console.log('🎉 Correction terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateOrderNumbers();