import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServicesAndTickets() {
  const storeId = '82540287-6abe-4b83-b195-4cd494426d4d';
  const businessId = '9fc3b422-00fd-40ec-9b73-9d25a276fa5f'; // Pizza mario business ID
  
  console.log('🍕 Creating services and customer tickets for Pizza Mario...');
  
  try {
    // Check if services already exist
    const existingServices = await prisma.universalService.findMany({
      where: { storeId }
    });

    if (existingServices.length > 0) {
      console.log(`⚠️  Found ${existingServices.length} existing services, skipping service creation...`);
    } else {
      // 1. Create services
    const services = [
      {
        name: 'Location salle de fête',
        description: 'Location de notre salle privée pour événements (anniversaires, baptêmes, etc.)',
        pattern: 'FLEXIBLE_BOOKING',
        icon: '🏛️',
        color: '#FF6B6B',
        settings: {
          basePrice: 150.00,
          duration: 4, // 4 heures
          maxGuests: 50,
          type: 'LOCATION'
        },
        variants: [
          {
            name: 'Demi-journée',
            pricingConfig: {
              basePrice: 150.00,
              duration: 240, // 4h en minutes
              maxCapacity: 50
            }
          },
          {
            name: 'Journée complète',
            pricingConfig: {
              basePrice: 250.00,
              duration: 480, // 8h en minutes
              maxCapacity: 50
            }
          }
        ]
      },
      {
        name: 'Service traiteur à domicile',
        description: 'Livraison et service de nos pizzas et plats italiens pour vos événements',
        pattern: 'FLEXIBLE_BOOKING',
        icon: '🍕',
        color: '#4ECDC4',
        settings: {
          basePrice: 25.00, // par personne
          minGuests: 15,
          maxGuests: 100,
          type: 'CATERING'
        },
        variants: [
          {
            name: 'Menu Pizza (15-30 pers.)',
            pricingConfig: {
              pricePerPerson: 25.00,
              duration: 180, // 3h service
              maxCapacity: 30
            }
          },
          {
            name: 'Menu Complet (30-60 pers.)',
            pricingConfig: {
              pricePerPerson: 35.00,
              duration: 240, // 4h service
              maxCapacity: 60
            }
          },
          {
            name: 'Menu Premium (60-100 pers.)',
            pricingConfig: {
              pricePerPerson: 45.00,
              duration: 300, // 5h service
              maxCapacity: 100
            }
          }
        ]
      },
      {
        name: 'Personnel événementiel',
        description: 'Mise à disposition de serveurs expérimentés pour vos événements',
        pattern: 'FLEXIBLE_BOOKING',
        icon: '👨‍💼',
        color: '#45B7D1',
        settings: {
          basePrice: 20.00, // par heure par serveur
          minHours: 4,
          maxStaff: 10,
          type: 'STAFF'
        },
        variants: [
          {
            name: 'Serveur (4h minimum)',
            pricingConfig: {
              hourlyRate: 20.00,
              minDuration: 240, // 4h minimum
              maxCapacity: 1
            }
          },
          {
            name: 'Chef de rang (4h minimum)',
            pricingConfig: {
              hourlyRate: 25.00,
              minDuration: 240, // 4h minimum
              maxCapacity: 1
            }
          },
          {
            name: 'Équipe complète (2 serveurs + chef)',
            pricingConfig: {
              hourlyRate: 60.00, // par heure pour l'équipe
              minDuration: 240, // 4h minimum
              maxCapacity: 3
            }
          }
        ]
      }
    ];

    console.log('🎯 Creating services...');
    const createdServices = [];

    for (const service of services) {
      const { variants, ...serviceData } = service;
      
      const createdService = await prisma.universalService.create({
        data: {
          ...serviceData,
          storeId
        }
      });

      // Create service variants
      for (const variant of variants) {
        await prisma.serviceVariant.create({
          data: {
            ...variant,
            serviceId: createdService.id
          }
        });
      }

      createdServices.push(createdService);
      console.log(`✅ Created service: ${service.name}`);
    }
    }

    // 2. Create realistic customers
    const existingCustomers = await prisma.customer.findMany({
      where: { businessId }
    });

    if (existingCustomers.length > 0) {
      console.log(`⚠️  Found ${existingCustomers.length} existing customers, skipping customer creation...`);
    } else {
    console.log('👥 Creating customers...');
    }
    const customers = [
      {
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@gmail.com',
        phone: '+33645123789',
        status: 'REGULAR'
      },
      {
        firstName: 'Jean-Pierre',
        lastName: 'Dubois',
        email: 'jp.dubois@orange.fr',
        phone: '+33612987654',
        status: 'VIP'
      },
      {
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@yahoo.fr',
        phone: '+33687456321',
        status: 'REGULAR'
      },
      {
        firstName: 'Thomas',
        lastName: 'Lefevre',
        email: 'thomas.lefevre@outlook.com',
        phone: '+33698765432',
        status: 'REGULAR'
      },
      {
        firstName: 'Amélie',
        lastName: 'Bonneau',
        email: 'amelie.bonneau@free.fr',
        phone: '+33654987123',
        status: 'NEW'
      }
    ];

    const createdCustomers = [];
    
    if (existingCustomers.length === 0) {
      for (const customer of customers) {
        const createdCustomer = await prisma.customer.create({
          data: {
            ...customer,
            businessId
          }
        });
        createdCustomers.push(createdCustomer);
        console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);
      }
    }

    // 3. Create activity logs (customer interactions)
    const existingActivities = await prisma.activityLog.findMany({
      where: { storeId }
    });

    if (existingActivities.length > 0) {
      console.log(`⚠️  Found ${existingActivities.length} existing activities, skipping activity creation...`);
    } else {
    console.log('📝 Creating customer activity logs...');
    
    // Use existing customers if any, otherwise use created customers
    const customersToUse = existingCustomers.length > 0 ? existingCustomers : createdCustomers;
    
    const activities = [
      {
        customerId: customersToUse[0]?.id,
        type: 'CALL',
        title: 'Demande réservation salle',
        description: 'Appel entrant - Demande de réservation salle pour anniversaire',
        metadata: {
          duration: 420, // 7 minutes
          outcome: 'Réservation programmée',
          followUp: 'Devis à envoyer'
        }
      },
      {
        customerId: customersToUse[1]?.id,
        type: 'CALL',
        title: 'Devis traiteur entreprise',
        description: 'Appel reçu - Demande de devis traiteur entreprise',
        metadata: {
          subject: 'Devis traiteur réunion équipe',
          priority: 'HIGH'
        }
      },
      {
        customerId: customersToUse[2]?.id,
        type: 'COMPLAINT',
        title: 'Pizza froide livraison',
        description: 'Réclamation - Pizza froide à la livraison',
        metadata: {
          orderNumber: 'CMD-2024-0208-001',
          resolution: 'Geste commercial effectué'
        }
      },
      {
        customerId: customersToUse[3]?.id,
        type: 'CALL',
        title: 'Info animations enfants',
        description: 'Appel entrant - Information sur animations enfants',
        metadata: {
          duration: 180, // 3 minutes
          outcome: 'Information fournie'
        }
      },
      {
        customerId: customersToUse[4]?.id,
        type: 'VISIT',
        title: 'Demande menu végétalien',
        description: 'Visite client - Demande menu végétalien',
        metadata: {
          subject: 'Options végétaliennes disponibles ?',
          priority: 'MEDIUM'
        }
      }
    ];

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - (activities.length - i) * 2); // Échelonner les dates

      await prisma.activityLog.create({
        data: {
          ...activity,
          storeId,
          entityId: activity.customerId,
          createdAt
        }
      });

      console.log(`✅ Created activity: ${activity.description}`);
    }
    }

    console.log('🎉 Services and activities seeding completed successfully!');
    console.log(`
📊 Summary:
- ${existingServices.length > 0 ? 'Services already exist' : `${createdServices?.length || 0} services created`} (Location, Traiteur, Personnel)
- ${existingCustomers.length > 0 ? 'Customers already exist' : `${createdCustomers?.length || 0} customers created`}  
- ${existingActivities.length > 0 ? 'Activities already exist' : `${activities?.length || 0} customer activities created`}
- All with realistic data for Pizza Mario
    `);

  } catch (error) {
    console.error('❌ Error seeding services and tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedServicesAndTickets();