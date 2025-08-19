import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function expandPizzaMarioCatalog() {
  try {
    console.log('🍕 Expansion du catalogue Pizza Mario...');
    
    // Trouver le store Pizza Mario
    const store = await prisma.store.findFirst({
      where: { name: 'Pizza Mario' }
    });

    if (!store) {
      console.log('❌ Store Pizza Mario non trouvé');
      return;
    }

    console.log(`🏪 Store trouvé: ${store.id}`);

    // Ajouter plus de produits
    const additionalProducts = [
      // Plus de Pizzas
      {
        name: 'Pizza Quattro Formaggi',
        description: 'Mozzarella, gorgonzola, parmesan, chèvre',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Regina',
        description: 'Tomate, mozzarella, jambon, champignons',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Diavola',
        description: 'Tomate, mozzarella, salami piquant, piments',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Végétarienne',
        description: 'Tomate, mozzarella, courgettes, aubergines, poivrons, oignons',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Prosciutto',
        description: 'Tomate, mozzarella, jambon de Parme, roquette',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Calzone',
        description: 'Pizza fermée: tomate, mozzarella, jambon, champignons',
        category: 'Pizzas'
      },
      {
        name: 'Pizza Marinara',
        description: 'Tomate, ail, origan, huile d\'olive (sans fromage)',
        category: 'Pizzas'
      },
      
      // Entrées
      {
        name: 'Bruschetta Tomate',
        description: 'Pain grillé, tomates fraîches, basilic, huile d\'olive',
        category: 'Entrées'
      },
      {
        name: 'Antipasti Mixte',
        description: 'Charcuterie italienne, fromages, olives, légumes marinés',
        category: 'Entrées'
      },
      {
        name: 'Salade César',
        description: 'Salade verte, poulet, parmesan, croûtons, sauce César',
        category: 'Entrées'
      },
      {
        name: 'Carpaccio de Bœuf',
        description: 'Fines lamelles de bœuf, roquette, parmesan, huile d\'olive',
        category: 'Entrées'
      },
      {
        name: 'Mozzarella di Bufala',
        description: 'Mozzarella de bufflonne, tomates cerises, basilic',
        category: 'Entrées'
      },
      
      // Plus de Boissons
      {
        name: 'Orangina 33cl',
        description: 'Canette d\'Orangina',
        category: 'Boissons'
      },
      {
        name: 'Eau Minérale 50cl',
        description: 'Bouteille d\'eau minérale',
        category: 'Boissons'
      },
      {
        name: 'Bière Peroni 33cl',
        description: 'Bière italienne Peroni',
        category: 'Boissons'
      },
      {
        name: 'Vin Rouge (verre)',
        description: 'Verre de vin rouge italien',
        category: 'Boissons'
      },
      {
        name: 'Vin Blanc (verre)',
        description: 'Verre de vin blanc italien',
        category: 'Boissons'
      },
      {
        name: 'Café Espresso',
        description: 'Café espresso italien',
        category: 'Boissons'
      },
      {
        name: 'Cappuccino',
        description: 'Café cappuccino avec mousse de lait',
        category: 'Boissons'
      },
      {
        name: 'San Pellegrino Limonata',
        description: 'Limonade italienne San Pellegrino',
        category: 'Boissons'
      },
      
      // Plus de Desserts
      {
        name: 'Panna Cotta',
        description: 'Crème italienne aux fruits rouges',
        category: 'Desserts'
      },
      {
        name: 'Gelato Vanille',
        description: 'Glace artisanale à la vanille',
        category: 'Desserts'
      },
      {
        name: 'Gelato Chocolat',
        description: 'Glace artisanale au chocolat',
        category: 'Desserts'
      },
      {
        name: 'Gelato Pistache',
        description: 'Glace artisanale à la pistache',
        category: 'Desserts'
      },
      {
        name: 'Cannoli Siciliens',
        description: 'Pâtisseries siciliennes à la ricotta (2 pièces)',
        category: 'Desserts'
      },
      {
        name: 'Affogato al Caffè',
        description: 'Glace vanille noyée dans un espresso chaud',
        category: 'Desserts'
      }
    ];

    // Créer tous les produits
    for (const productData of additionalProducts) {
      await prisma.product.create({
        data: {
          ...productData,
          storeId: store.id,
          status: 'ACTIVE'
        }
      });
    }

    console.log(`✅ ${additionalProducts.length} produits ajoutés`);

    // Compter le total de produits
    const totalProducts = await prisma.product.count({
      where: { storeId: store.id }
    });

    console.log(`📊 Total produits dans le catalogue: ${totalProducts}`);

    // Ajouter quelques commandes supplémentaires pour plus d'activité
    console.log('📦 Ajout de commandes supplémentaires...');

    const business = await prisma.business.findFirst({
      where: { stores: { some: { id: store.id } } }
    });

    const customers = await prisma.customer.findMany({
      where: { businessId: business?.id }
    });

    if (customers.length > 0) {
      // Quelques commandes supplémentaires
      await prisma.order.create({
        data: {
          orderNumber: 'PM0003',
          customerId: customers[0].id,
          storeId: store.id,
          businessId: business!.id,
          items: [
            { name: 'Pizza Diavola', quantity: 1, price: 14.50 },
            { name: 'Bière Peroni 33cl', quantity: 1, price: 3.50 },
            { name: 'Gelato Pistache', quantity: 1, price: 4.50 }
          ],
          subtotal: 22.50,
          tax: 4.50,
          taxRate: 20.0,
          total: 27.00,
          status: 'PREPARING',
          paymentStatus: 'PAID'
        }
      });

      await prisma.order.create({
        data: {
          orderNumber: 'PM0004',
          customerId: customers[1].id,
          storeId: store.id,
          businessId: business!.id,
          items: [
            { name: 'Pizza Quattro Formaggi', quantity: 1, price: 15.00 },
            { name: 'Antipasti Mixte', quantity: 1, price: 12.00 },
            { name: 'Vin Rouge (verre)', quantity: 2, price: 4.00 },
            { name: 'Cannoli Siciliens', quantity: 1, price: 6.00 }
          ],
          subtotal: 41.00,
          tax: 8.20,
          taxRate: 20.0,
          total: 49.20,
          status: 'CONFIRMED',
          paymentStatus: 'PAID'
        }
      });

      console.log('✅ Commandes supplémentaires ajoutées');
    }

    console.log('🎉 Expansion du catalogue terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

expandPizzaMarioCatalog();