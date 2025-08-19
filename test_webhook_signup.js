// Script pour tester manuellement la création d'utilisateur via webhook
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔄 Création de l\'utilisateur test...');

    // Données de test (simulant ce qui viendrait de Stripe metadata)
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+33123456789',
      language: 'fr'
    };

    const businessData = {
      name: 'Test Restaurant',
      type: 'PRODUCTS'
    };

    const storeData = {
      name: 'Mon Restaurant Test',
      address: '123 Rue de Test, 75001 Paris',
      phone: '+33123456789',
      serviceType: 'products'
    };

    const plan = 'PRO';

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log('❌ Utilisateur existe déjà, suppression...');
      // Supprimer en cascade
      const businesses = await prisma.business.findMany({
        where: { ownerId: existingUser.id },
        include: { stores: true }
      });

      for (const business of businesses) {
        for (const store of business.stores) {
          await prisma.subscription.deleteMany({ where: { storeId: store.id } });
          await prisma.usageTracking.deleteMany({ where: { storeId: store.id } });
        }
        await prisma.store.deleteMany({ where: { businessId: business.id } });
        await prisma.phoneNumber.deleteMany({ where: { businessId: business.id } });
      }
      await prisma.business.deleteMany({ where: { ownerId: existingUser.id } });
      await prisma.trialUsage.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        language: userData.language || 'fr',
        stripeCustomerId: 'cus_test_123', // ID Stripe fictif
        role: 'CLIENT'
      }
    });

    console.log('✅ Utilisateur créé:', user.id);

    // Créer le business
    const business = await prisma.business.create({
      data: {
        name: businessData.name,
        description: `Activité ${storeData.serviceType}`,
        type: storeData.serviceType === 'products' ? 'PRODUCTS' : 'SERVICES',
        ownerId: user.id
      }
    });

    console.log('✅ Business créé:', business.id);

    // Créer le store
    const store = await prisma.store.create({
      data: {
        name: storeData.name,
        address: storeData.address,
        businessId: business.id,
        isActive: true,
        settings: JSON.stringify({
          currency: 'EUR',
          taxRates: [],
          schedule: {},
          printers: [],
          notifications: { enabled: false },
          serviceType: storeData.serviceType,
          telnyxConfigured: false,
          isConfigured: true
        })
      }
    });

    console.log('✅ Store créé:', store.id);

    // Créer l'abonnement
    const subscription = await prisma.subscription.create({
      data: {
        storeId: store.id,
        plan: plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialUsed: false,
        isActive: true,
        stripeSubscriptionId: 'sub_test_123', // ID Stripe fictif
        stripeCustomerId: 'cus_test_123'
      }
    });

    console.log('✅ Subscription créée:', subscription.id);

    // Ajouter le numéro de téléphone
    await prisma.phoneNumber.create({
      data: {
        number: storeData.phone,
        businessId: business.id,
        telnyxId: ''
      }
    });

    console.log('✅ Numéro de téléphone ajouté');

    console.log(`
🎉 Utilisateur test créé avec succès !
📧 Email: ${userData.email}
🔑 Password: ${userData.password}
🏪 Store: ${storeData.name}
💰 Plan: ${plan}

Tu peux maintenant te connecter avec ces identifiants.
    `);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();