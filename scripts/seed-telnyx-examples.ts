// ============================================================================
// SCRIPT D'EXEMPLE - DONNÉES TELNYX + IA + REDIS
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTelnyxExamples() {
  console.log('🌱 Création d\'exemples de données Telnyx + IA...');

  try {
    // 1. Créer un utilisateur demo
    const user = await prisma.user.upsert({
      where: { id: 'demo-owner' },
      update: {},
      create: {
        id: 'demo-owner',
        email: 'demo@example.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'Owner',
        phone: '+33123456789',
        language: 'fr',
        role: 'CLIENT'
      }
    });

    // 2. Créer un business et un store exemple
    const business = await prisma.business.upsert({
      where: { id: 'demo-business-1' },
      update: {},
      create: {
        id: 'demo-business-1',
        name: 'Restaurant Le Petit Gourmet',
        description: 'Restaurant français traditionnel avec spécialités locales',
        type: 'RESERVATIONS',
        ownerId: 'demo-owner',
      }
    });

    const store = await prisma.store.upsert({
      where: { id: 'demo-store-1' },
      update: {},
      create: {
        id: 'demo-store-1',
        name: 'Le Petit Gourmet - Centre',
        address: '15 Rue de la Paix, 75001 Paris',
        businessId: business.id,
        isActive: true,
        businessCategory: 'RESTAURANT',
        hasProducts: true,
        hasReservations: true,
        hasConsultations: false,
        settings: JSON.stringify({
          currency: 'EUR',
          telnyxConfigured: true,
          phoneNumber: '+33142968574',
          schedule: {
            monday: { open: '12:00', close: '22:00' },
            tuesday: { open: '12:00', close: '22:00' },
            wednesday: { open: '12:00', close: '22:00' },
            thursday: { open: '12:00', close: '22:00' },
            friday: { open: '12:00', close: '22:30' },
            saturday: { open: '12:00', close: '22:30' },
            sunday: { open: '12:00', close: '21:00' }
          }
        })
      }
    });

    // 3. Créer un numéro de téléphone Telnyx
    const phoneNumber = await prisma.phoneNumber.upsert({
      where: { number: '+33142968574' },
      update: {},
      create: {
        id: 'demo-phone-1',
        number: '+33142968574',
        telnyxId: 'telnyx_demo_123456',
        businessId: business.id,
        country: 'FR',
        status: 'ACTIVE',
        monthlyPrice: 1.00,
        telnyxConfig: {
          voiceAppId: 'voice_app_demo_123',
          voiceAppName: 'Kalliky-Le-Petit-Gourmet-FR',
          webhookUrl: 'https://demo.kalliky.com/api/telnyx/webhooks'
        }
      }
    });

    // 4. Créer des exemples d'appels
    const call1 = await prisma.call.upsert({
      where: { id: 'demo-call-1' },
      update: {},
      create: {
        id: 'demo-call-1',
        telnyxCallId: 'telnyx_call_demo_001',
        businessId: business.id,
        phoneNumberId: phoneNumber.id,
        direction: 'inbound',
        fromNumber: '+33123456789',
        toNumber: '+33142968574',
        status: 'COMPLETED',
        startedAt: new Date('2024-08-17T14:30:00Z'),
        endedAt: new Date('2024-08-17T14:33:24Z'),
        duration: 204, // 3 minutes 24 secondes
        recordingUrl: 'https://telnyx.com/recording/demo_001.wav'
      }
    });

    const call2 = await prisma.call.upsert({
      where: { id: 'demo-call-2' },
      update: {},
      create: {
        id: 'demo-call-2',
        telnyxCallId: 'telnyx_call_demo_002',
        businessId: business.id,
        phoneNumberId: phoneNumber.id,
        direction: 'inbound',
        fromNumber: '+33198765432',
        toNumber: '+33142968574',
        status: 'COMPLETED',
        startedAt: new Date('2024-08-16T12:15:00Z'),
        endedAt: new Date('2024-08-16T12:17:45Z'),
        duration: 165, // 2 minutes 45 secondes
        recordingUrl: 'https://telnyx.com/recording/demo_002.wav'
      }
    });

    // 5. Créer des exemples de clients
    await prisma.customer.upsert({
      where: { id: 'demo-customer-1' },
      update: {},
      create: {
        id: 'demo-customer-1',
        phone: '+33123456789',
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        businessId: business.id
      }
    });

    await prisma.customer.upsert({
      where: { id: 'demo-customer-2' },
      update: {},
      create: {
        id: 'demo-customer-2',
        phone: '+33198765432',
        firstName: 'Jean',
        lastName: 'Martin',
        businessId: business.id
      }
    });

    // 6. Créer des sessions de conversation IA
    const aiSession1 = await prisma.aIConversationSession.upsert({
      where: { id: 'demo-ai-1' },
      update: {},
      create: {
        id: 'demo-ai-1',
        callId: call1.id,
        businessId: business.id,
        customerId: 'demo-customer-1',
        messages: [
          {
            role: 'assistant',
            content: 'Bonjour et merci d\'appeler Le Petit Gourmet. Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd\'hui ?',
            timestamp: '2024-08-17T14:30:00Z'
          },
          {
            role: 'user',
            content: 'Bonjour, je souhaiterais réserver une table pour 4 personnes pour ce soir vers 20h.',
            timestamp: '2024-08-17T14:30:15Z'
          },
          {
            role: 'assistant',
            content: 'Parfait ! Je peux vous proposer une table pour 4 personnes ce soir à 20h. Puis-je avoir votre nom pour la réservation ?',
            timestamp: '2024-08-17T14:30:25Z'
          },
          {
            role: 'user',
            content: 'Oui, c\'est Madame Dubois, Marie Dubois.',
            timestamp: '2024-08-17T14:30:40Z'
          },
          {
            role: 'assistant',
            content: 'Merci Mme Dubois. Votre table pour 4 personnes est réservée ce soir à 20h. Puis-je avoir votre numéro de téléphone pour confirmer la réservation ?',
            timestamp: '2024-08-17T14:30:50Z'
          },
          {
            role: 'user',
            content: 'Bien sûr, c\'est le 01 23 45 67 89.',
            timestamp: '2024-08-17T14:31:10Z'
          },
          {
            role: 'assistant',
            content: 'Parfait ! Votre réservation est confirmée pour ce soir 17 août à 20h pour 4 personnes au nom de Mme Dubois. Nous vous attendons avec plaisir ! Y a-t-il autre chose que je puisse faire pour vous ?',
            timestamp: '2024-08-17T14:31:20Z'
          },
          {
            role: 'user',
            content: 'Non c\'est parfait, merci beaucoup !',
            timestamp: '2024-08-17T14:31:35Z'
          },
          {
            role: 'assistant',
            content: 'Je vous en prie ! À ce soir Mme Dubois. Bonne journée !',
            timestamp: '2024-08-17T14:31:45Z'
          }
        ],
        context: {
          intent: 'reservation',
          customerName: 'Marie Dubois',
          customerPhone: '+33123456789',
          reservation: {
            date: '2024-08-17',
            time: '20:00',
            guests: 4,
            confirmed: true
          },
          satisfaction: 9
        },
        isActive: false
      }
    });

    const aiSession2 = await prisma.aIConversationSession.upsert({
      where: { id: 'demo-ai-2' },
      update: {},
      create: {
        id: 'demo-ai-2',
        callId: call2.id,
        businessId: business.id,
        customerId: 'demo-customer-2',
        messages: [
          {
            role: 'assistant',
            content: 'Bonjour et merci d\'appeler Le Petit Gourmet. Comment puis-je vous aider ?',
            timestamp: '2024-08-16T12:15:00Z'
          },
          {
            role: 'user',
            content: 'Bonjour, j\'aimerais connaître vos horaires d\'ouverture et si vous avez des plats végétariens au menu.',
            timestamp: '2024-08-16T12:15:10Z'
          },
          {
            role: 'assistant',
            content: 'Bien sûr ! Nous sommes ouverts tous les jours : du lundi au jeudi de 12h à 22h, vendredi et samedi de 12h à 22h30, et dimanche de 12h à 21h. Pour les plats végétariens, nous proposons notre salade de chèvre chaud, notre risotto aux champignons, et notre tarte aux légumes de saison.',
            timestamp: '2024-08-16T12:15:25Z'
          },
          {
            role: 'user',
            content: 'Parfait ! Et le risotto, il est à combien ?',
            timestamp: '2024-08-16T12:15:45Z'
          },
          {
            role: 'assistant',
            content: 'Notre risotto aux champignons est à 18 euros. C\'est un de nos plats phares, préparé avec des champignons de saison et du parmesan affiné.',
            timestamp: '2024-08-16T12:15:55Z'
          },
          {
            role: 'user',
            content: 'Merci beaucoup pour les informations !',
            timestamp: '2024-08-16T12:16:10Z'
          },
          {
            role: 'assistant',
            content: 'Je vous en prie ! N\'hésitez pas à nous rendre visite. Bonne journée !',
            timestamp: '2024-08-16T12:16:20Z'
          }
        ],
        context: {
          intent: 'information',
          customerPhone: '+33198765432',
          inquiry: {
            about: ['horaires', 'menu végétarien', 'prix'],
            satisfied: true
          },
          satisfaction: 8
        },
        isActive: false
      }
    });

    // 7. Sessions Redis disponibles via l'API une fois le serveur Redis démarré

    console.log('✅ Exemples de données créés avec succès !');
    console.log('');
    console.log('📞 Numéro de téléphone demo: +33142968574');
    console.log('🏪 Business: Le Petit Gourmet');
    console.log('💬 2 conversations IA exemple créées');
    console.log('👥 2 clients exemple créés');
    console.log('');
    console.log('🔗 Vous pouvez maintenant tester:');
    console.log('   - Page activité: http://localhost:9002/restaurant/activity');
    console.log('   - Fiche client: http://localhost:9002/restaurant/clients/demo-customer-1');
    console.log('   - Configuration: http://localhost:9002/restaurant/manage/demo-store-1');
    console.log('   - Monitoring: http://localhost:9002/api/admin/telnyx/monitoring');

  } catch (error) {
    console.error('❌ Erreur lors de la création des exemples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
seedTelnyxExamples();

export { seedTelnyxExamples };