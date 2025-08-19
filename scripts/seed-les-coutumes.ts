// ============================================================================
// DONNÉES RÉELLES - LES COUTUMES GUICHAINVILLE
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLesCoutumes() {
  console.log('🏪 Création des données pour Les Coutumes...');

  try {
    // 1. Créer utilisateur propriétaire
    const owner = await prisma.user.upsert({
      where: { email: 'contact@lescoutumes.fr' },
      update: {},
      create: {
        id: 'owner-coutumes',
        email: 'contact@lescoutumes.fr',
        password: 'demo123',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+33234567890',
        language: 'fr',
        role: 'CLIENT'
      }
    });

    // 2. Créer le business
    const business = await prisma.business.upsert({
      where: { id: 'business-coutumes' },
      update: {},
      create: {
        id: 'business-coutumes',
        name: 'Les Coutumes',
        description: 'Commerce multi-services - Alimentation, Services, Location',
        type: 'PRODUCTS',
        ownerId: owner.id
      }
    });

    // 3. Créer la boutique
    const store = await prisma.store.upsert({
      where: { id: 'store-coutumes' },
      update: {},
      create: {
        id: 'store-coutumes',
        name: 'Les Coutumes',
        address: 'Les Coutumes, 27930, Guichainville, France',
        city: 'Guichainville',
        country: 'FR',
        businessId: business.id,
        isActive: true,
        businessCategory: 'RESTAURANT',
        hasProducts: true,
        hasReservations: true,
        hasConsultations: true,
        settings: JSON.stringify({
          currency: 'EUR',
          telnyxConfigured: true,
          phoneNumber: '+33234567890',
          schedule: {
            monday: { open: '07:00', close: '20:00' },
            tuesday: { open: '07:00', close: '20:00' },
            wednesday: { open: '07:00', close: '20:00' },
            thursday: { open: '07:00', close: '20:00' },
            friday: { open: '07:00', close: '21:00' },
            saturday: { open: '08:00', close: '21:00' },
            sunday: { open: '08:00', close: '13:00' }
          }
        })
      }
    });

    // 4. Créer des produits exemple
    const products = [
      { name: 'Pain Tradition', price: 1.20, category: 'Boulangerie' },
      { name: 'Croissant', price: 1.10, category: 'Viennoiserie' },
      { name: 'Pizza Margherita', price: 12.50, category: 'Restauration' },
      { name: 'Sandwich Jambon-Beurre', price: 4.50, category: 'Snacking' },
      { name: 'Café', price: 1.80, category: 'Boissons' },
      { name: 'Coca-Cola 33cl', price: 2.50, category: 'Boissons' },
      { name: 'Menu du Jour', price: 14.90, category: 'Restauration' },
      { name: 'Salade César', price: 8.90, category: 'Restauration' }
    ];

    // 5. Créer des services
    const services = [
      { name: 'Location Vélo Électrique', price: 35.00, duration: '1 jour' },
      { name: 'Location Trottinette', price: 25.00, duration: '1 jour' },
      { name: 'Pressing - Costume', price: 18.00, duration: '48h' },
      { name: 'Photocopie', price: 0.10, duration: 'immédiat' },
      { name: 'Envoi Colis', price: 8.50, duration: '24h' }
    ];

    // 6. Créer des clients exemple
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { id: 'cust-coutumes-1' },
        update: {},
        create: {
          id: 'cust-coutumes-1',
          phone: '+33612345678',
          firstName: 'Sophie',
          lastName: 'Martin',
          email: 'sophie.martin@email.com',
          businessId: business.id,
          status: 'REGULAR',
          avgBasket: 25.50,
          totalSpent: 450.00,
          orderCount: 18
        }
      }),
      prisma.customer.upsert({
        where: { id: 'cust-coutumes-2' },
        update: {},
        create: {
          id: 'cust-coutumes-2',
          phone: '+33698765432',
          firstName: 'Pierre',
          lastName: 'Bernard',
          email: 'p.bernard@email.com',
          businessId: business.id,
          status: 'VIP',
          avgBasket: 85.00,
          totalSpent: 1275.00,
          orderCount: 15
        }
      })
    ]);

    // 7. Créer une commande complexe multi-type
    const order1 = await prisma.order.upsert({
      where: { id: 'order-complex-1' },
      update: {},
      create: {
        id: 'order-complex-1',
        orderNumber: 'CMD-2024-001',
        customerId: customers[0].id,
        storeId: store.id,
        businessId: business.id,
        items: [
          // Section PRODUITS
          {
            type: 'product',
            category: 'Alimentation',
            items: [
              { name: 'Pain Tradition', quantity: 2, price: 1.20, total: 2.40 },
              { name: 'Croissant', quantity: 4, price: 1.10, total: 4.40 },
              { name: 'Café', quantity: 2, price: 1.80, total: 3.60 }
            ],
            subtotal: 10.40
          },
          // Section SERVICES
          {
            type: 'service',
            category: 'Location',
            items: [
              { name: 'Location Vélo Électrique', quantity: 1, duration: '2 jours', price: 70.00, total: 70.00 }
            ],
            subtotal: 70.00
          },
          // Section CONSULTATION
          {
            type: 'consultation',
            category: 'Conseil',
            items: [
              { 
                name: 'Consultation Voyage', 
                duration: '30 min',
                description: 'Conseils pour itinéraire touristique local',
                price: 0.00,
                total: 0.00
              }
            ],
            subtotal: 0.00
          }
        ],
        subtotal: 80.40,
        tax: 16.08,
        taxRate: 20,
        total: 96.48,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD'
      }
    });

    // 8. Créer des appels avec sessions IA
    const call1 = await prisma.call.upsert({
      where: { id: 'call-coutumes-1' },
      update: {},
      create: {
        id: 'call-coutumes-1',
        telnyxCallId: 'telnyx_coutumes_001',
        businessId: business.id,
        customerId: customers[0].id,
        direction: 'inbound',
        fromNumber: customers[0].phone,
        toNumber: '+33234567890',
        status: 'COMPLETED',
        startedAt: new Date('2024-08-17T10:30:00Z'),
        endedAt: new Date('2024-08-17T10:35:00Z'),
        duration: 300
      }
    });

    // 9. Créer session IA associée
    await prisma.aIConversationSession.upsert({
      where: { id: 'ai-coutumes-1' },
      update: {},
      create: {
        id: 'ai-coutumes-1',
        callId: call1.id,
        businessId: business.id,
        customerId: customers[0].id,
        messages: [
          {
            role: 'assistant',
            content: 'Bonjour, Les Coutumes à votre service. Comment puis-je vous aider ?',
            timestamp: '2024-08-17T10:30:00Z'
          },
          {
            role: 'user',
            content: 'Bonjour, je voudrais commander 2 pains et réserver un vélo pour demain.',
            timestamp: '2024-08-17T10:30:15Z'
          },
          {
            role: 'assistant',
            content: 'Parfait ! Je note 2 pains tradition. Pour le vélo électrique, ce sera pour combien de jours ?',
            timestamp: '2024-08-17T10:30:25Z'
          },
          {
            role: 'user',
            content: 'Pour 2 jours, samedi et dimanche.',
            timestamp: '2024-08-17T10:30:40Z'
          },
          {
            role: 'assistant',
            content: 'Très bien. Votre commande : 2 pains tradition (2,40€) et location vélo électrique 2 jours (70€). Total : 72,40€. Je prépare tout pour demain matin 9h ?',
            timestamp: '2024-08-17T10:30:50Z'
          },
          {
            role: 'user',
            content: 'Parfait, merci !',
            timestamp: '2024-08-17T10:31:10Z'
          }
        ],
        context: {
          intent: 'order_and_reservation',
          orderDetails: {
            products: ['2x Pain Tradition'],
            services: ['Location Vélo 2 jours'],
            total: 72.40
          },
          satisfaction: 9,
          nextAction: 'Préparation commande pour samedi 9h'
        },
        isActive: false
      }
    });

    console.log('✅ Données Les Coutumes créées avec succès !');
    console.log('');
    console.log('📍 Boutique: Les Coutumes, Guichainville');
    console.log('📞 Téléphone: +33234567890');
    console.log('👥 2 clients créés avec historique');
    console.log('🛒 Commande multi-type créée (produits + services + consultation)');
    console.log('🤖 Session IA avec conversation complète');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
seedLesCoutumes();

export { seedLesCoutumes };