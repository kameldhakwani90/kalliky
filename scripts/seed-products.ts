import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🍽️ Début du seeding des produits...');

  try {
    // Trouver l'utilisateur et son store restaurant
    const user = await prisma.user.findUnique({
      where: { email: 'medkamel.dhakwani@gmail.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      include: { stores: true }
    });

    if (!business) {
      console.log('❌ Business non trouvé');
      return;
    }

    const store = business.stores.find(s => s.name.includes('Restaurant'));
    if (!store) {
      console.log('❌ Store restaurant non trouvé');
      return;
    }

    console.log(`✅ Store trouvé: ${store.name}`);

    // Créer des catégories de composants
    const categories = await Promise.all([
      prisma.componentCategory.upsert({
        where: { storeId_name: { storeId: store.id, name: 'Entrées' } },
        update: {},
        create: {
          storeId: store.id,
          name: 'Entrées',
          description: 'Entrées et amuse-bouches',
          color: '#10B981',
          order: 1
        }
      }),
      prisma.componentCategory.upsert({
        where: { storeId_name: { storeId: store.id, name: 'Plats principaux' } },
        update: {},
        create: {
          storeId: store.id,
          name: 'Plats principaux',
          description: 'Plats de résistance',
          color: '#F59E0B',
          order: 2
        }
      }),
      prisma.componentCategory.upsert({
        where: { storeId_name: { storeId: store.id, name: 'Desserts' } },
        update: {},
        create: {
          storeId: store.id,
          name: 'Desserts',
          description: 'Desserts et douceurs',
          color: '#EC4899',
          order: 3
        }
      }),
      prisma.componentCategory.upsert({
        where: { storeId_name: { storeId: store.id, name: 'Boissons' } },
        update: {},
        create: {
          storeId: store.id,
          name: 'Boissons',
          description: 'Boissons chaudes et froides',
          color: '#3B82F6',
          order: 4
        }
      })
    ]);

    console.log(`✅ ${categories.length} catégories créées`);

    // Créer des composants
    const components = await Promise.all([
      // Entrées
      prisma.component.upsert({
        where: { storeId_categoryId_name: { storeId: store.id, categoryId: categories[0].id, name: 'Salade verte' } },
        update: {},
        create: {
          storeId: store.id,
          categoryId: categories[0].id,
          name: 'Salade verte',
          description: 'Salade de mesclun fraîche',
          variations: ['Petite', 'Grande'],
          aliases: ['salade', 'verdure'],
          defaultPrices: JSON.stringify({ base: 8.50 })
        }
      }),
      prisma.component.upsert({
        where: { storeId_categoryId_name: { storeId: store.id, categoryId: categories[0].id, name: 'Foie gras' } },
        update: {},
        create: {
          storeId: store.id,
          categoryId: categories[0].id,
          name: 'Foie gras',
          description: 'Foie gras de canard mi-cuit',
          variations: ['50g', '100g'],
          defaultPrices: JSON.stringify({ base: 24.00 })
        }
      }),
      // Plats principaux
      prisma.component.upsert({
        where: { storeId_categoryId_name: { storeId: store.id, categoryId: categories[1].id, name: 'Saumon' } },
        update: {},
        create: {
          storeId: store.id,
          categoryId: categories[1].id,
          name: 'Saumon',
          description: 'Filet de saumon frais',
          variations: ['Grillé', 'Poché', 'En papillote'],
          aliases: ['saumon', 'poisson'],
          defaultPrices: JSON.stringify({ base: 22.00 })
        }
      }),
      prisma.component.upsert({
        where: { storeId_categoryId_name: { storeId: store.id, categoryId: categories[1].id, name: 'Bœuf' } },
        update: {},
        create: {
          storeId: store.id,
          categoryId: categories[1].id,
          name: 'Bœuf',
          description: 'Pièce de bœuf de qualité',
          variations: ['Entrecôte', 'Filet', 'Bavette'],
          aliases: ['boeuf', 'viande rouge'],
          defaultPrices: JSON.stringify({ base: 26.00 })
        }
      }),
      // Desserts
      prisma.component.upsert({
        where: { storeId_categoryId_name: { storeId: store.id, categoryId: categories[2].id, name: 'Tiramisu' } },
        update: {},
        create: {
          storeId: store.id,
          categoryId: categories[2].id,
          name: 'Tiramisu',
          description: 'Tiramisu maison aux speculoos',
          variations: ['Nature', 'Fruits rouges'],
          defaultPrices: JSON.stringify({ base: 7.50 })
        }
      }),
      prisma.component.upsert({
        where: { storeId_categoryId_name: { storeId: store.id, categoryId: categories[2].id, name: 'Tarte tatin' } },
        update: {},
        create: {
          storeId: store.id,
          categoryId: categories[2].id,
          name: 'Tarte tatin',
          description: 'Tarte tatin aux pommes',
          variations: ['Chaude', 'Tiède'],
          defaultPrices: JSON.stringify({ base: 8.00 })
        }
      })
    ]);

    console.log(`✅ ${components.length} composants créés`);

    // Créer des produits complets
    const productNames = ['Salade César', 'Saumon grillé', 'Burger du Chef', 'Menu Dégustation 5 services', 'Tiramisu maison'];
    const products = [];

    for (const productName of productNames) {
      // Vérifier si le produit existe déjà
      const existingProduct = await prisma.product.findFirst({
        where: { storeId: store.id, name: productName }
      });

      if (!existingProduct) {
        let productData;
        switch (productName) {
          case 'Salade César':
            productData = {
              storeId: store.id,
              name: 'Salade César',
              description: 'Salade César traditionnelle avec parmesan et croûtons',
              category: 'Entrées',
              hasComposition: true,
              status: 'ACTIVE',
              popularity: 8
            };
            break;
          case 'Saumon grillé':
            productData = {
              storeId: store.id,
              name: 'Saumon grillé',
              description: 'Filet de saumon grillé, légumes de saison',
              category: 'Plats principaux',
              hasComposition: true,
              status: 'ACTIVE',
              popularity: 9
            };
            break;
          case 'Burger du Chef':
            productData = {
              storeId: store.id,
              name: 'Burger du Chef',
              description: 'Burger maison 200g, bacon, fromage, frites',
              category: 'Plats principaux',
              hasComposition: true,
              status: 'ACTIVE',
              popularity: 10
            };
            break;
          case 'Menu Dégustation 5 services':
            productData = {
              storeId: store.id,
              name: 'Menu Dégustation 5 services',
              description: 'Menu découverte du chef en 5 services',
              category: 'Menus',
              hasComposition: false,
              status: 'ACTIVE',
              popularity: 7
            };
            break;
          case 'Tiramisu maison':
            productData = {
              storeId: store.id,
              name: 'Tiramisu maison',
              description: 'Tiramisu fait maison aux speculoos',
              category: 'Desserts',
              status: 'ACTIVE',
              popularity: 8
            };
            break;
        }

        if (productData) {
          const product = await prisma.product.create({ data: productData });
          products.push(product);
        }
      } else {
        products.push(existingProduct);
      }
    }

    console.log(`✅ ${products.length} produits créés`);

    console.log('🎉 Seeding des produits terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding des produits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();