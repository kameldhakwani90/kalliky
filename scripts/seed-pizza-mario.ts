import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPizzaMario() {
  const storeId = '82540287-6abe-4b83-b195-4cd494426d4d';
  
  console.log('🍕 Seeding Pizza Mario with realistic data...');
  
  try {
    // Check if data already exists
    const existingEmployees = await prisma.serviceResource.findMany({
      where: { storeId, type: 'EMPLOYEE' }
    });

    const existingProducts = await prisma.product.findMany({
      where: { storeId }
    });

    if (existingEmployees.length > 0) {
      console.log(`⚠️  Found ${existingEmployees.length} existing employees, skipping employee creation...`);
    } else {
      // 1. Create employees
      console.log('👨‍🍳 Creating employees...');
    
    const employees = [
      {
        name: 'Marco Pizzaiolo',
        description: 'Chef pizzaiolo principal avec 15 ans d\'expérience',
        uniqueId: 'CHEF001',
        type: 'EMPLOYEE',
        specifications: {
          email: 'marco@pizzamario.com',
          phone: '+33612345678',
          specialties: ['Pizza napolitaine', 'Pâte artisanale', 'Four à bois', 'Cuisine italienne'],
          certifications: ['CAP Cuisine', 'Certificat Pizzaiolo Naples']
        },
        isActive: true
      },
      {
        name: 'Sofia Garnier',
        description: 'Serveuse expérimentée et responsable salle',
        uniqueId: 'SERV001',
        type: 'EMPLOYEE',
        specifications: {
          email: 'sofia@pizzamario.com',
          phone: '+33612345679',
          specialties: ['Service client', 'Gestion salle', 'Langues étrangères', 'Caisse'],
          certifications: ['Formation service', 'Anglais C1']
        },
        isActive: true
      },
      {
        name: 'Luigi Preparatore',
        description: 'Aide cuisinier et préparateur',
        uniqueId: 'PREP001',
        type: 'EMPLOYEE',
        specifications: {
          email: 'luigi@pizzamario.com',
          phone: '+33612345680',
          specialties: ['Préparation ingrédients', 'Hygiène cuisine', 'Aide pizzaiolo'],
          certifications: ['Formation hygiène']
        },
        isActive: true
      }
    ];

    for (const employee of employees) {
      const createdEmployee = await prisma.serviceResource.create({
        data: {
          ...employee,
          storeId
        }
      });

      console.log(`✅ Created employee: ${employee.name}`);
    }
    }

    const existingEquipment = await prisma.serviceResource.findMany({
      where: { storeId, type: 'EQUIPMENT' }
    });

    if (existingEquipment.length > 0) {
      console.log(`⚠️  Found ${existingEquipment.length} existing equipment, skipping equipment creation...`);
    } else {
      // 2. Create equipment
      console.log('🔧 Creating equipment...');
    
    const equipment = [
      {
        name: 'Four à pizza napolitain',
        description: 'Four à bois traditionnel pour pizzas napolitaines',
        uniqueId: 'FOUR001',
        type: 'EQUIPMENT',
        specifications: {
          brand: 'Napoli Forni',
          model: 'Tradizionale 120',
          serialNumber: 'NF-2023-001',
          category: 'Four',
          features: ['Bois de chêne', 'Température 450°C', 'Sole en pierre', 'Capacité 8 pizzas']
        },
        isActive: true
      },
      {
        name: 'Machine à pâte professionnelle',
        description: 'Pétrin spiral pour pâte à pizza',
        uniqueId: 'PETRIN001',
        type: 'EQUIPMENT',
        specifications: {
          brand: 'Italforni',
          model: 'SP-40',
          serialNumber: 'IF-2022-789',
          category: 'Pétrissage',
          features: ['40L de capacité', 'Vitesse variable', 'Bol inox', 'Timer digital']
        },
        isActive: true
      },
      {
        name: 'Chambre de fermentation',
        description: 'Chambre climatisée pour fermentation de la pâte',
        uniqueId: 'CHAMBRE001',
        type: 'EQUIPMENT',
        specifications: {
          brand: 'PizzaTech',
          model: 'Ferment Pro 200',
          serialNumber: 'PT-2023-456',
          category: 'Fermentation',
          features: ['Contrôle température et humidité', '200 pâtons', 'Minuteur 72h', 'Éclairage LED']
        },
        isActive: true
      }
    ];

    for (const item of equipment) {
      const createdEquipment = await prisma.serviceResource.create({
        data: {
          ...item,
          storeId
        }
      });

      console.log(`✅ Created equipment: ${item.name}`);
    }
    }

    if (existingProducts.length > 0) {
      console.log(`⚠️  Found ${existingProducts.length} existing products, skipping product creation...`);
    } else {
      // 3. Create products (pizzas and drinks)
      console.log('🍕 Creating pizza catalog...');

    const products = [
      {
        name: 'Pizza Margherita',
        description: 'La classique - tomate San Marzano, mozzarella di bufala, basilic frais, huile d\'olive extra vierge',
        category: 'Pizzas Classiques',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 14.50, 'takeaway': 13.50, 'delivery': 15.50, 'pickup': 13.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 18.50, 'takeaway': 17.50, 'delivery': 19.50, 'pickup': 17.50 }
          }
        ],
        stock: 50,
        popularity: 95,
        profitMargin: 65,
        tags: ['Végétarien', 'Classique', 'Basilic']
      },
      {
        name: 'Pizza Napoletana',
        description: 'Authentique napolitaine - tomate, mozzarella, anchois, câpres, origan, olives noires',
        category: 'Pizzas Classiques',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 16.50, 'takeaway': 15.50, 'delivery': 17.50, 'pickup': 15.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 20.50, 'takeaway': 19.50, 'delivery': 21.50, 'pickup': 19.50 }
          }
        ],
        stock: 40,
        popularity: 80,
        profitMargin: 68,
        tags: ['Anchois', 'Méditerranéenne', 'Traditionnelle']
      },
      {
        name: 'Pizza Diavola',
        description: 'Épicée - tomate, mozzarella, salami piquant, piment rouge, origan',
        category: 'Pizzas Épicées',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 17.50, 'takeaway': 16.50, 'delivery': 18.50, 'pickup': 16.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 21.50, 'takeaway': 20.50, 'delivery': 22.50, 'pickup': 20.50 }
          }
        ],
        stock: 35,
        popularity: 75,
        profitMargin: 70,
        tags: ['Épicé', 'Salami', 'Piquant']
      },
      {
        name: 'Pizza Quattro Stagioni',
        description: 'Les quatre saisons - tomate, mozzarella, jambon, champignons, artichauts, olives noires',
        category: 'Pizzas Gourmandes',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 19.50, 'takeaway': 18.50, 'delivery': 20.50, 'pickup': 18.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 23.50, 'takeaway': 22.50, 'delivery': 24.50, 'pickup': 22.50 }
          }
        ],
        stock: 30,
        popularity: 85,
        profitMargin: 72,
        tags: ['Jambon', 'Champignons', 'Artichauts', 'Complète']
      },
      {
        name: 'Pizza Prosciutto e Funghi',
        description: 'Classique italienne - tomate, mozzarella, jambon de Parme, champignons frais',
        category: 'Pizzas Classiques',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 18.50, 'takeaway': 17.50, 'delivery': 19.50, 'pickup': 17.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 22.50, 'takeaway': 21.50, 'delivery': 23.50, 'pickup': 21.50 }
          }
        ],
        stock: 45,
        popularity: 88,
        profitMargin: 69,
        tags: ['Jambon de Parme', 'Champignons', 'Italien']
      },
      {
        name: 'Pizza Végétarienne',
        description: 'Jardin d\'été - tomate, mozzarella, courgettes, aubergines, poivrons, roquette',
        category: 'Pizzas Végétariennes',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 17.50, 'takeaway': 16.50, 'delivery': 18.50, 'pickup': 16.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 21.50, 'takeaway': 20.50, 'delivery': 22.50, 'pickup': 20.50 }
          }
        ],
        stock: 25,
        popularity: 65,
        profitMargin: 75,
        tags: ['Végétarien', 'Légumes', 'Roquette', 'Frais']
      },
      {
        name: 'Pizza Truffe',
        description: 'Luxueuse - crème de truffe, mozzarella, champignons porcins, jambon de Parme, roquette',
        category: 'Pizzas Premium',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Normale',
            prices: { 'dine-in': 26.50, 'takeaway': 25.50, 'delivery': 27.50, 'pickup': 25.50 }
          },
          {
            name: 'Grande',
            prices: { 'dine-in': 32.50, 'takeaway': 31.50, 'delivery': 33.50, 'pickup': 31.50 }
          }
        ],
        stock: 15,
        popularity: 55,
        profitMargin: 78,
        tags: ['Premium', 'Truffe', 'Luxe', 'Porcins']
      },
      // Boissons
      {
        name: 'Coca-Cola',
        description: 'Canette 33cl',
        category: 'Boissons',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Canette',
            prices: { 'dine-in': 3.50, 'takeaway': 3.00, 'delivery': 3.50, 'pickup': 3.00 }
          }
        ],
        stock: 100,
        popularity: 90,
        profitMargin: 85,
        tags: ['Soda', 'Rafraîchissant']
      },
      {
        name: 'San Pellegrino',
        description: 'Eau pétillante italienne 50cl',
        category: 'Boissons',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Bouteille',
            prices: { 'dine-in': 4.50, 'takeaway': 4.00, 'delivery': 4.50, 'pickup': 4.00 }
          }
        ],
        stock: 80,
        popularity: 70,
        profitMargin: 80,
        tags: ['Eau', 'Pétillant', 'Italien']
      },
      {
        name: 'Chianti Classico',
        description: 'Vin rouge toscan DOCG - Bouteille 75cl',
        category: 'Vins',
        status: 'ACTIVE',
        variations: [
          {
            name: 'Bouteille',
            prices: { 'dine-in': 28.50, 'takeaway': 26.50, 'delivery': 29.50, 'pickup': 26.50 }
          },
          {
            name: 'Verre',
            prices: { 'dine-in': 7.50, 'takeaway': 0, 'delivery': 0, 'pickup': 0 }
          }
        ],
        stock: 30,
        popularity: 60,
        profitMargin: 70,
        tags: ['Vin rouge', 'Italien', 'DOCG', 'Toscan']
      }
    ];

    for (const product of products) {
      const { variations, tags, status, stock, popularity, profitMargin, ...productData } = product;
      
      const createdProduct = await prisma.product.create({
        data: {
          ...productData,
          storeId
        }
      });

      // Create variations
      for (const variation of variations) {
        await prisma.productVariation.create({
          data: {
            ...variation,
            value: variation.name, // Use name as value
            productId: createdProduct.id
          }
        });
      }

      // Create tags if they exist
      if (tags && tags.length > 0) {
        await prisma.productTagRelation.createMany({
          data: tags.map(tag => ({
            productId: createdProduct.id,
            tag
          }))
        });
      }

      console.log(`✅ Created product: ${product.name}`);
    }
    }

    console.log('🎉 Pizza Mario seeding completed successfully!');
    console.log(`
📊 Summary:
- ${existingEmployees.length > 0 ? 'Employees already exist' : '3 employees created'}
- ${existingEquipment.length > 0 ? 'Equipment already exists' : '3 equipment items created'}  
- ${existingProducts.length > 0 ? 'Products already exist' : '10 products created'}
- All with realistic data for Pizza Mario
    `);

  } catch (error) {
    console.error('❌ Error seeding Pizza Mario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPizzaMario();