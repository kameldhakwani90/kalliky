import { prisma } from '../src/lib/prisma';

const storeId = '0e842ebb-c059-4a31-8e19-a7bbaad7cd0b'; // Restaurant test

async function seedProducts() {
  console.log('🍔 Création de 10 produits composés pour Restaurant test...');

  // 1. BURGER GOURMET
  const burger = await prisma.product.create({
    data: {
      storeId,
      name: 'Burger Gourmet',
      description: 'Notre burger signature avec bœuf Angus, fromage affiné et sauce maison',
      category: 'Plats Principaux',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 95,
      variations: {
        create: [
          {
            name: 'Simple (150g)',
            type: 'SIZE',
            value: 'simple',
            prices: { 'dine-in': 12.90, 'takeaway': 12.90, 'delivery': 13.90, 'pickup': 12.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          },
          {
            name: 'Double (300g)',
            type: 'SIZE',
            value: 'double',
            prices: { 'dine-in': 16.90, 'takeaway': 16.90, 'delivery': 17.90, 'pickup': 16.90 },
            isVisible: true,
            isDefault: false,
            order: 1
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Cuisson de la viande',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Saignant', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'À point', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Bien cuit', prices: { 'dine-in': 0 }, order: 2 }
              ]
            }
          },
          {
            title: 'Fromage',
            isRequired: false,
            selectionType: 'SINGLE',
            order: 1,
            options: {
              create: [
                { name: 'Cheddar', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Emmental', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Bleu', prices: { 'dine-in': 1.50 }, order: 2 },
                { name: 'Sans fromage', prices: { 'dine-in': 0 }, order: 3 }
              ]
            }
          },
          {
            title: 'Garnitures supplémentaires',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 2,
            options: {
              create: [
                { name: 'Bacon croustillant', prices: { 'dine-in': 2.00 }, order: 0 },
                { name: 'Œuf au plat', prices: { 'dine-in': 1.50 }, order: 1 },
                { name: 'Oignons caramélisés', prices: { 'dine-in': 1.00 }, order: 2 },
                { name: 'Champignons grillés', prices: { 'dine-in': 1.50 }, order: 3 },
                { name: 'Avocat', prices: { 'dine-in': 2.00 }, order: 4 }
              ]
            }
          },
          {
            title: 'Sauce',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 3,
            options: {
              create: [
                { name: 'Sauce burger maison', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Ketchup', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Mayonnaise', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Sauce BBQ', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Sauce piquante', prices: { 'dine-in': 0 }, order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  // 2. PIZZA MARGHERITA
  const pizza = await prisma.product.create({
    data: {
      storeId,
      name: 'Pizza Margherita',
      description: 'Pizza traditionnelle avec tomate, mozzarella et basilic frais',
      category: 'Pizzas',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 88,
      variations: {
        create: [
          {
            name: 'Petite (26cm)',
            type: 'SIZE',
            value: 'small',
            prices: { 'dine-in': 9.90, 'takeaway': 9.90, 'delivery': 10.90, 'pickup': 9.90 },
            isVisible: true,
            isDefault: false,
            order: 0
          },
          {
            name: 'Moyenne (33cm)',
            type: 'SIZE',
            value: 'medium',
            prices: { 'dine-in': 12.90, 'takeaway': 12.90, 'delivery': 13.90, 'pickup': 12.90 },
            isVisible: true,
            isDefault: true,
            order: 1
          },
          {
            name: 'Grande (40cm)',
            type: 'SIZE',
            value: 'large',
            prices: { 'dine-in': 15.90, 'takeaway': 15.90, 'delivery': 16.90, 'pickup': 15.90 },
            isVisible: true,
            isDefault: false,
            order: 2
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Type de pâte',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Pâte classique', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Pâte fine', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Pâte épaisse', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Bords fourrés fromage', prices: { 'dine-in': 2.50 }, order: 3 }
              ]
            }
          },
          {
            title: 'Suppléments',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Mozzarella extra', prices: { 'dine-in': 2.00 }, order: 0 },
                { name: 'Pepperoni', prices: { 'dine-in': 2.50 }, order: 1 },
                { name: 'Jambon', prices: { 'dine-in': 2.00 }, order: 2 },
                { name: 'Champignons', prices: { 'dine-in': 1.50 }, order: 3 },
                { name: 'Olives', prices: { 'dine-in': 1.50 }, order: 4 },
                { name: 'Anchois', prices: { 'dine-in': 2.00 }, order: 5 }
              ]
            }
          }
        ]
      }
    }
  });

  // 3. SALADE CÉSAR
  const salade = await prisma.product.create({
    data: {
      storeId,
      name: 'Salade César',
      description: 'Salade romaine, poulet grillé, parmesan, croûtons et sauce César',
      category: 'Salades',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 75,
      variations: {
        create: [
          {
            name: 'Petite portion',
            type: 'SIZE',
            value: 'small',
            prices: { 'dine-in': 8.90, 'takeaway': 8.90, 'delivery': 9.90, 'pickup': 8.90 },
            isVisible: true,
            isDefault: false,
            order: 0
          },
          {
            name: 'Grande portion',
            type: 'SIZE',
            value: 'large',
            prices: { 'dine-in': 12.90, 'takeaway': 12.90, 'delivery': 13.90, 'pickup': 12.90 },
            isVisible: true,
            isDefault: true,
            order: 1
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Protéine',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Poulet grillé', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Crevettes', prices: { 'dine-in': 3.00 }, order: 1 },
                { name: 'Saumon fumé', prices: { 'dine-in': 4.00 }, order: 2 },
                { name: 'Tofu grillé', prices: { 'dine-in': 0 }, order: 3 }
              ]
            }
          },
          {
            title: 'Extras',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Œuf poché', prices: { 'dine-in': 1.50 }, order: 0 },
                { name: 'Avocat', prices: { 'dine-in': 2.00 }, order: 1 },
                { name: 'Bacon bits', prices: { 'dine-in': 1.50 }, order: 2 },
                { name: 'Parmesan extra', prices: { 'dine-in': 1.00 }, order: 3 }
              ]
            }
          }
        ]
      }
    }
  });

  // 4. POKE BOWL
  const pokeBowl = await prisma.product.create({
    data: {
      storeId,
      name: 'Poké Bowl',
      description: 'Bowl hawaïen personnalisable avec poisson frais et légumes',
      category: 'Bowls',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 82,
      variations: {
        create: [
          {
            name: 'Regular',
            type: 'SIZE',
            value: 'regular',
            prices: { 'dine-in': 13.90, 'takeaway': 13.90, 'delivery': 14.90, 'pickup': 13.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          },
          {
            name: 'Large',
            type: 'SIZE',
            value: 'large',
            prices: { 'dine-in': 16.90, 'takeaway': 16.90, 'delivery': 17.90, 'pickup': 16.90 },
            isVisible: true,
            isDefault: false,
            order: 1
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Base',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Riz sushi', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Riz complet', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Quinoa', prices: { 'dine-in': 1.00 }, order: 2 },
                { name: 'Salade mixte', prices: { 'dine-in': 0 }, order: 3 }
              ]
            }
          },
          {
            title: 'Protéine (2 choix)',
            isRequired: true,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Saumon', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Thon', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Crevettes', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Poulet teriyaki', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Tofu mariné', prices: { 'dine-in': 0 }, order: 4 }
              ]
            }
          },
          {
            title: 'Légumes (3 choix)',
            isRequired: true,
            selectionType: 'MULTIPLE',
            order: 2,
            options: {
              create: [
                { name: 'Edamame', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Concombre', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Avocat', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Mangue', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Carotte', prices: { 'dine-in': 0 }, order: 4 },
                { name: 'Chou rouge', prices: { 'dine-in': 0 }, order: 5 }
              ]
            }
          },
          {
            title: 'Toppings',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 3,
            options: {
              create: [
                { name: 'Sésame', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Gingembre mariné', prices: { 'dine-in': 0.50 }, order: 1 },
                { name: 'Wasabi', prices: { 'dine-in': 0.50 }, order: 2 },
                { name: 'Algues wakame', prices: { 'dine-in': 1.50 }, order: 3 },
                { name: 'Tempura crunch', prices: { 'dine-in': 1.00 }, order: 4 }
              ]
            }
          },
          {
            title: 'Sauce',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 4,
            options: {
              create: [
                { name: 'Sauce soja sucrée', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Sauce ponzu', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Mayonnaise épicée', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Sauce sésame', prices: { 'dine-in': 0 }, order: 3 }
              ]
            }
          }
        ]
      }
    }
  });

  // 5. WRAP MEXICAIN
  const wrap = await prisma.product.create({
    data: {
      storeId,
      name: 'Wrap Mexicain',
      description: 'Tortilla garnie façon mexicaine avec viande épicée et garnitures fraîches',
      category: 'Wraps & Sandwichs',
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 70,
      variations: {
        create: [
          {
            name: 'Standard',
            type: 'SIZE',
            value: 'standard',
            prices: { 'dine-in': 10.90, 'takeaway': 10.90, 'delivery': 11.90, 'pickup': 10.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Viande',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Bœuf épicé', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Poulet mariné', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Porc effiloché', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Haricots noirs (végé)', prices: { 'dine-in': -1.00 }, order: 3 }
              ]
            }
          },
          {
            title: 'Garnitures',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Guacamole', prices: { 'dine-in': 2.00 }, order: 0 },
                { name: 'Crème fraîche', prices: { 'dine-in': 0.50 }, order: 1 },
                { name: 'Pico de gallo', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Jalapeños', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Fromage râpé', prices: { 'dine-in': 1.00 }, order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  // 6. PASTA CARBONARA
  const pasta = await prisma.product.create({
    data: {
      storeId,
      name: 'Pasta Carbonara',
      description: 'Pâtes fraîches avec sauce crémeuse, lardons et parmesan',
      category: 'Pâtes',
      image: 'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 78,
      variations: {
        create: [
          {
            name: 'Portion normale',
            type: 'SIZE',
            value: 'normal',
            prices: { 'dine-in': 11.90, 'takeaway': 11.90, 'delivery': 12.90, 'pickup': 11.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          },
          {
            name: 'Grande portion',
            type: 'SIZE',
            value: 'large',
            prices: { 'dine-in': 14.90, 'takeaway': 14.90, 'delivery': 15.90, 'pickup': 14.90 },
            isVisible: true,
            isDefault: false,
            order: 1
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Type de pâtes',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Spaghetti', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Penne', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Tagliatelle', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Rigatoni', prices: { 'dine-in': 0 }, order: 3 }
              ]
            }
          },
          {
            title: 'Suppléments',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Parmesan extra', prices: { 'dine-in': 1.00 }, order: 0 },
                { name: 'Truffe', prices: { 'dine-in': 5.00 }, order: 1 },
                { name: 'Champignons', prices: { 'dine-in': 2.00 }, order: 2 },
                { name: 'Épinards', prices: { 'dine-in': 1.50 }, order: 3 }
              ]
            }
          }
        ]
      }
    }
  });

  // 7. TACOS (3 pièces)
  const tacos = await prisma.product.create({
    data: {
      storeId,
      name: 'Tacos Trio',
      description: 'Trois tacos authentiques avec garnitures au choix',
      category: 'Street Food',
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 85,
      variations: {
        create: [
          {
            name: '3 tacos',
            type: 'CUSTOM',
            value: '3',
            prices: { 'dine-in': 12.90, 'takeaway': 12.90, 'delivery': 13.90, 'pickup': 12.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Viande pour les 3 tacos',
            isRequired: true,
            selectionType: 'MULTIPLE',
            order: 0,
            options: {
              create: [
                { name: 'Carnitas (porc)', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Carne asada (bœuf)', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Pollo (poulet)', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Pescado (poisson)', prices: { 'dine-in': 1.00 }, order: 3 },
                { name: 'Végétarien', prices: { 'dine-in': 0 }, order: 4 }
              ]
            }
          },
          {
            title: 'Garnitures',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Oignons', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Coriandre', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Salsa verde', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Salsa roja', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Citron vert', prices: { 'dine-in': 0 }, order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  // 8. SUSHI PLATTER
  const sushi = await prisma.product.create({
    data: {
      storeId,
      name: 'Plateau Sushi Mix',
      description: 'Assortiment de sushis et makis frais du jour',
      category: 'Sushis',
      image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 90,
      variations: {
        create: [
          {
            name: '12 pièces',
            type: 'CUSTOM',
            value: '12',
            prices: { 'dine-in': 18.90, 'takeaway': 18.90, 'delivery': 19.90, 'pickup': 18.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          },
          {
            name: '24 pièces',
            type: 'CUSTOM',
            value: '24',
            prices: { 'dine-in': 34.90, 'takeaway': 34.90, 'delivery': 35.90, 'pickup': 34.90 },
            isVisible: true,
            isDefault: false,
            order: 1
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Composition du plateau',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Mix classique (saumon, thon, crevette)', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Tout saumon', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Végétarien', prices: { 'dine-in': -2.00 }, order: 2 },
                { name: 'Premium (avec anguille et thon rouge)', prices: { 'dine-in': 5.00 }, order: 3 }
              ]
            }
          },
          {
            title: 'Accompagnements',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Gingembre extra', prices: { 'dine-in': 0.50 }, order: 0 },
                { name: 'Wasabi extra', prices: { 'dine-in': 0.50 }, order: 1 },
                { name: 'Sauce soja sucrée', prices: { 'dine-in': 0.50 }, order: 2 },
                { name: 'Edamame', prices: { 'dine-in': 3.50 }, order: 3 }
              ]
            }
          }
        ]
      }
    }
  });

  // 9. CRÊPE SUCRÉE
  const crepe = await prisma.product.create({
    data: {
      storeId,
      name: 'Crêpe Gourmande',
      description: 'Crêpe sucrée garnie selon vos envies',
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 72,
      variations: {
        create: [
          {
            name: 'Crêpe simple',
            type: 'SIZE',
            value: 'simple',
            prices: { 'dine-in': 6.90, 'takeaway': 6.90, 'delivery': 7.90, 'pickup': 6.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Garniture principale',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Nutella', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Sucre et citron', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Confiture fraise', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Caramel beurre salé', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Miel', prices: { 'dine-in': 0 }, order: 4 }
              ]
            }
          },
          {
            title: 'Suppléments gourmands',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Chantilly', prices: { 'dine-in': 1.00 }, order: 0 },
                { name: 'Boule de glace vanille', prices: { 'dine-in': 2.50 }, order: 1 },
                { name: 'Banane fraîche', prices: { 'dine-in': 1.50 }, order: 2 },
                { name: 'Fraises fraîches', prices: { 'dine-in': 2.00 }, order: 3 },
                { name: 'Amandes effilées', prices: { 'dine-in': 1.00 }, order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  // 10. SMOOTHIE BOWL
  const smoothieBowl = await prisma.product.create({
    data: {
      storeId,
      name: 'Smoothie Bowl Açaï',
      description: 'Bowl énergétique à base d\'açaï avec fruits frais et toppings',
      category: 'Petit-déjeuner',
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600',
      status: 'ACTIVE',
      hasComposition: true,
      sourceType: 'MANUAL',
      popularity: 68,
      variations: {
        create: [
          {
            name: 'Regular',
            type: 'SIZE',
            value: 'regular',
            prices: { 'dine-in': 9.90, 'takeaway': 9.90, 'delivery': 10.90, 'pickup': 9.90 },
            isVisible: true,
            isDefault: true,
            order: 0
          }
        ]
      },
      compositionSteps: {
        create: [
          {
            title: 'Base smoothie',
            isRequired: true,
            selectionType: 'SINGLE',
            order: 0,
            options: {
              create: [
                { name: 'Açaï berry', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Pitaya (dragon fruit)', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Mangue passion', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Banane chocolat', prices: { 'dine-in': 0 }, order: 3 }
              ]
            }
          },
          {
            title: 'Fruits frais (2 choix)',
            isRequired: true,
            selectionType: 'MULTIPLE',
            order: 1,
            options: {
              create: [
                { name: 'Banane', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Fraises', prices: { 'dine-in': 0 }, order: 1 },
                { name: 'Myrtilles', prices: { 'dine-in': 0 }, order: 2 },
                { name: 'Kiwi', prices: { 'dine-in': 0 }, order: 3 },
                { name: 'Mangue', prices: { 'dine-in': 0 }, order: 4 }
              ]
            }
          },
          {
            title: 'Toppings croquants',
            isRequired: false,
            selectionType: 'MULTIPLE',
            order: 2,
            options: {
              create: [
                { name: 'Granola maison', prices: { 'dine-in': 0 }, order: 0 },
                { name: 'Noix de coco râpée', prices: { 'dine-in': 0.50 }, order: 1 },
                { name: 'Graines de chia', prices: { 'dine-in': 1.00 }, order: 2 },
                { name: 'Beurre d\'amande', prices: { 'dine-in': 1.50 }, order: 3 },
                { name: 'Pépites de chocolat noir', prices: { 'dine-in': 1.00 }, order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('✅ 10 produits créés avec succès !');
  
  return {
    burger,
    pizza,
    salade,
    pokeBowl,
    wrap,
    pasta,
    tacos,
    sushi,
    crepe,
    smoothieBowl
  };
}

seedProducts()
  .then(() => {
    console.log('🎉 Seed terminé avec succès !');
  })
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });