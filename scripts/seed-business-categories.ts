#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration des 10 métiers de base
const businessCategories = [
  {
    category: 'RESTAURANT',
    displayName: 'Restaurant / Food',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Sois direct et efficace.
✅ OBLIGATOIRE: Nom, téléphone, adresse si livraison
⏰ LIMITE: Conclure commande rapidement  
🎯 FOCUS: Commande → Confirmation → Raccrocher
❌ ÉVITER: Discussions longues hors commande

SPÉCIALITÉS:
- Prendre commandes avec précision
- Gérer livraisons et retraits
- Proposer boissons et accompagnements
- Demander préférences (épicé, allergies)
- Calculer temps de préparation`,
    defaultParams: {
      deliveryRadius: 5,
      minimumOrder: 15,
      deliveryFee: 3,
      freeDeliveryThreshold: 25,
      preparationTime: 25,
      acceptsDelivery: true,
      acceptsPickup: true
    },
    availableOptions: [
      { key: 'suggestDrinks', label: 'Proposer boissons automatiquement', type: 'boolean' },
      { key: 'suggestDesserts', label: 'Suggérer desserts si commande >20€', type: 'boolean' },
      { key: 'askSpiceLevel', label: 'Demander niveau épicé', type: 'boolean' },
      { key: 'handleAllergies', label: 'Gérer allergies alimentaires', type: 'boolean' },
      { key: 'offerPaymentOnDelivery', label: 'Proposer paiement à la livraison', type: 'boolean' }
    ]
  },
  {
    category: 'BEAUTY',
    displayName: 'Salon de Beauté',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Va à l'essentiel.
✅ OBLIGATOIRE: Nom, téléphone, type prestation
⏰ LIMITE: Fixer RDV rapidement  
🎯 FOCUS: Besoin → Créneau → Confirmation
❌ ÉVITER: Conseils détaillés (RDV pour ça)

SPÉCIALITÉS:
- Réserver prestations beauté
- Informer sur durées et tarifs
- Proposer soins complémentaires
- Gérer contre-indications (grossesse)
- Suggérer packages attractifs`,
    defaultParams: {
      appointmentDuration: 90,
      advanceBooking: 24,
      cancellationPolicy: 24,
      specialistRequired: false,
      packageDeals: true
    },
    availableOptions: [
      { key: 'askHairLength', label: 'Demander longueur cheveux actuels', type: 'boolean' },
      { key: 'suggestColors', label: 'Proposer couleurs tendances', type: 'boolean' },
      { key: 'upsellTreatments', label: 'Proposer soins complémentaires', type: 'boolean' },
      { key: 'checkPregnancy', label: 'Vérifier grossesse (produits)', type: 'boolean' },
      { key: 'loyaltyProgram', label: 'Informer programme fidélité', type: 'boolean' }
    ]
  },
  {
    category: 'AUTOMOTIVE',
    displayName: 'Garage Automobile',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Efficacité max.
✅ OBLIGATOIRE: Nom, téléphone, véhicule, problème
⏰ LIMITE: Diagnostiquer et planifier vite
🎯 FOCUS: Symptômes → Urgence → RDV
❌ ÉVITER: Explications techniques longues

SPÉCIALITÉS:
- Diagnostiquer problèmes véhicules
- Évaluer urgence interventions
- Planifier rendez-vous atelier
- Proposer véhicule de courtoisie
- Informer sur délais et tarifs`,
    defaultParams: {
      interventionTime: 120,
      courtyesyCarAvailable: true,
      quoteRequired: 200,
      emergencyService: true,
      specializedBrands: [],
      workingHours: '8h-18h'
    },
    availableOptions: [
      { key: 'askVehicleDetails', label: 'Demander marque/modèle/année précis', type: 'boolean' },
      { key: 'describeSymptoms', label: 'Faire décrire symptômes détaillés', type: 'boolean' },
      { key: 'checkHistory', label: 'Vérifier historique entretien', type: 'boolean' },
      { key: 'offerCourtesyCar', label: 'Proposer véhicule de courtoisie', type: 'boolean' },
      { key: 'mandatoryQuote', label: 'Devis obligatoire avant intervention', type: 'boolean' }
    ]
  },
  {
    category: 'MEDICAL',
    displayName: 'Cabinet Médical',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Précision médicale.
✅ OBLIGATOIRE: Nom, téléphone, motif consultation
⏰ LIMITE: Évaluer et programmer vite
🎯 FOCUS: Symptômes → Urgence → RDV
❌ ÉVITER: Conseils médicaux (réservé au médecin)

SPÉCIALITÉS:
- Évaluer urgence consultations
- Planifier rendez-vous appropriés
- Orienter selon spécialités
- Gérer téléconsultations
- Respecter confidentialité stricte`,
    defaultParams: {
      consultationDuration: 30,
      emergencySlots: true,
      teleconsultation: true,
      pediatricAge: 16,
      homeVisits: false,
      specialties: []
    },
    availableOptions: [
      { key: 'collectSecuNumber', label: 'Demander numéro sécurité sociale', type: 'boolean' },
      { key: 'askCurrentTreatments', label: 'Vérifier traitements en cours', type: 'boolean' },
      { key: 'describeSymptoms', label: 'Faire décrire symptômes principaux', type: 'boolean' },
      { key: 'checkAge', label: 'Vérifier âge patient (pédiatrie)', type: 'boolean' },
      { key: 'offerTeleconsult', label: 'Proposer téléconsultation si approprié', type: 'boolean' }
    ]
  },
  {
    category: 'LEGAL',
    displayName: 'Cabinet Juridique',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Confidentialité absolue.
✅ OBLIGATOIRE: Nom, téléphone, domaine juridique
⏰ LIMITE: Qualifier demande rapidement
🎯 FOCUS: Problématique → Spécialité → RDV
❌ ÉVITER: Conseils juridiques (réservé à l'avocat)

SPÉCIALITÉS:
- Qualifier demandes juridiques
- Orienter selon spécialités
- Planifier consultations
- Informer sur tarifs
- Assurer confidentialité totale`,
    defaultParams: {
      consultationDuration: 60,
      freeFirstConsult: 30,
      specialties: ['famille', 'immobilier'],
      averageProcessTime: 90,
      confidentiality: true
    },
    availableOptions: [
      { key: 'identifyLegalField', label: 'Identifier domaine juridique précis', type: 'boolean' },
      { key: 'collectDocuments', label: 'Lister documents nécessaires', type: 'boolean' },
      { key: 'estimateTimeline', label: 'Estimer délais procédure', type: 'boolean' },
      { key: 'mentionPartners', label: 'Informer sur partenaires (experts)', type: 'boolean' },
      { key: 'remindConfidentiality', label: 'Rappeler confidentialité', type: 'boolean' }
    ]
  },
  {
    category: 'RETAIL',
    displayName: 'Commerce de Détail',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Service client efficace.
✅ OBLIGATOIRE: Nom, téléphone, produit recherché
⏰ LIMITE: Informer et vendre vite
🎯 FOCUS: Besoin → Disponibilité → Commande/Réservation
❌ ÉVITER: Descriptions produits longues

SPÉCIALITÉS:
- Vérifier disponibilité stock
- Informer sur promotions
- Gérer click & collect
- Proposer alternatives
- Fidéliser clients`,
    defaultParams: {
      stockCheck: true,
      clickAndCollect: true,
      homeDelivery: false,
      loyaltyProgram: true,
      promotionsActive: true
    },
    availableOptions: [
      { key: 'checkStock', label: 'Vérifier disponibilité en temps réel', type: 'boolean' },
      { key: 'suggestAlternatives', label: 'Proposer produits similaires', type: 'boolean' },
      { key: 'mentionPromotions', label: 'Informer sur promotions en cours', type: 'boolean' },
      { key: 'offerClickCollect', label: 'Proposer click & collect', type: 'boolean' },
      { key: 'loyaltyPoints', label: 'Gérer points fidélité', type: 'boolean' }
    ]
  },
  {
    category: 'IMMOBILIER',
    displayName: 'Agence Immobilière',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Efficacité commerciale.
✅ OBLIGATOIRE: Nom, téléphone, type bien, budget
⏰ LIMITE: Qualifier rapidement
🎯 FOCUS: Critères → Disponibilités → Visite
❌ ÉVITER: Descriptions détaillées (visite pour ça)

SPÉCIALITÉS:
- Qualifier demandes immobilières
- Proposer biens correspondants
- Planifier visites
- Informer sur financement
- Gérer négociations`,
    defaultParams: {
      geographicZone: [],
      propertyTypes: ['appartement', 'maison'],
      averageCommission: 3,
      virtualVisits: true,
      financingHelp: true
    },
    availableOptions: [
      { key: 'collectBudget', label: 'Demander budget précis', type: 'boolean' },
      { key: 'askCriteria', label: 'Lister critères détaillés', type: 'boolean' },
      { key: 'checkFinancing', label: 'Vérifier capacité financement', type: 'boolean' },
      { key: 'offerVirtualVisit', label: 'Proposer visite virtuelle', type: 'boolean' },
      { key: 'mentionFees', label: 'Informer sur honoraires', type: 'boolean' }
    ]
  },
  {
    category: 'EDUCATION',
    displayName: 'Formation / Cours',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Orientation pédagogique.
✅ OBLIGATOIRE: Nom, téléphone, formation souhaitée, niveau
⏰ LIMITE: Orienter rapidement
🎯 FOCUS: Objectifs → Programme → Inscription
❌ ÉVITER: Détails pédagogiques longs

SPÉCIALITÉS:
- Évaluer niveau et objectifs
- Orienter vers formations adaptées
- Informer sur modalités
- Planifier tests/entretiens
- Gérer inscriptions`,
    defaultParams: {
      levelAssessment: true,
      groupOrIndividual: 'both',
      certificationAvailable: true,
      onlineOption: true,
      averageCourseDuration: 10
    },
    availableOptions: [
      { key: 'assessLevel', label: 'Évaluer niveau actuel', type: 'boolean' },
      { key: 'defineObjectives', label: 'Définir objectifs formation', type: 'boolean' },
      { key: 'explainProgram', label: 'Expliquer programme brièvement', type: 'boolean' },
      { key: 'mentionCertification', label: 'Informer sur certification', type: 'boolean' },
      { key: 'scheduleInterview', label: 'Planifier entretien orientation', type: 'boolean' }
    ]
  },
  {
    category: 'TRANSPORT',
    displayName: 'Transport / Livraison',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Logistique rapide.
✅ OBLIGATOIRE: Nom, téléphone, origine, destination, type colis
⏰ LIMITE: Planifier transport vite
🎯 FOCUS: Trajets → Délais → Réservation
❌ ÉVITER: Explications logistiques complexes

SPÉCIALITÉS:
- Calculer trajets et délais
- Gérer réservations transport
- Informer sur tarifs
- Assurer suivi envois
- Gérer urgences`,
    defaultParams: {
      serviceZones: [],
      vehicleTypes: ['utilitaire', 'camion'],
      trackingAvailable: true,
      insuranceIncluded: true,
      urgentService: true
    },
    availableOptions: [
      { key: 'calculateDistance', label: 'Calculer distance et temps', type: 'boolean' },
      { key: 'checkPackageSize', label: 'Vérifier dimensions colis', type: 'boolean' },
      { key: 'offerInsurance', label: 'Proposer assurance transport', type: 'boolean' },
      { key: 'provideTracking', label: 'Fournir suivi temps réel', type: 'boolean' },
      { key: 'handleFragile', label: 'Gérer objets fragiles', type: 'boolean' }
    ]
  },
  {
    category: 'FITNESS',
    displayName: 'Sport / Fitness',
    systemPrompt: `Tu as MAX 3 MINUTES par appel. Motivation sportive.
✅ OBLIGATOIRE: Nom, téléphone, objectifs fitness, niveau
⏰ LIMITE: Orienter programme vite
🎯 FOCUS: Objectifs → Programme → Inscription
❌ ÉVITER: Conseils sportifs détaillés

SPÉCIALITÉS:
- Évaluer condition physique
- Orienter vers programmes adaptés
- Planifier séances découverte
- Gérer abonnements
- Motiver et fidéliser`,
    defaultParams: {
      fitnessLevels: ['débutant', 'intermédiaire', 'avancé'],
      personalTrainer: true,
      groupClasses: true,
      nutritionAdvice: false,
      healthAssessment: true
    },
    availableOptions: [
      { key: 'assessFitnessLevel', label: 'Évaluer niveau sportif', type: 'boolean' },
      { key: 'defineGoals', label: 'Définir objectifs précis', type: 'boolean' },
      { key: 'suggestProgram', label: 'Recommander programme adapté', type: 'boolean' },
      { key: 'offerPersonalTrainer', label: 'Proposer coach personnel', type: 'boolean' },
      { key: 'nutritionSupport', label: 'Mentionner conseils nutrition', type: 'boolean' }
    ]
  }
];

async function seedBusinessCategories() {
  console.log('🌱 Début du peuplement des configurations métiers...');

  for (const config of businessCategories) {
    try {
      const existing = await prisma.businessCategoryConfig.findUnique({
        where: { category: config.category as any }
      });

      if (existing) {
        console.log(`⚠️  Configuration ${config.displayName} existe déjà - mise à jour...`);
        await prisma.businessCategoryConfig.update({
          where: { category: config.category as any },
          data: {
            displayName: config.displayName,
            systemPrompt: config.systemPrompt,
            defaultParams: config.defaultParams,
            availableOptions: config.availableOptions,
            updatedAt: new Date()
          }
        });
      } else {
        console.log(`✅ Création configuration ${config.displayName}...`);
        await prisma.businessCategoryConfig.create({
          data: {
            category: config.category as any,
            displayName: config.displayName,
            systemPrompt: config.systemPrompt,
            defaultParams: config.defaultParams,
            availableOptions: config.availableOptions
          }
        });
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${config.displayName}:`, error);
    }
  }

  console.log('🎉 Peuplement terminé !');
}

// Exécution
seedBusinessCategories()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });