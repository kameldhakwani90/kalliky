// ============================================================================
// SYSTÈME DE PATTERNS AUTOMATIQUES POUR SERVICES UNIVERSELS
// Configuration prédéfinie pour tous types de métiers
// ============================================================================

export type ServicePatternConfig = {
  id: string;
  name: string;
  description: string;
  businessCategory: 'RESTAURANT' | 'BEAUTY' | 'HAIRDRESSER' | 'AUTOMOTIVE' | 'PROFESSIONAL' | 'ENTERTAINMENT' | 'HEALTH' | 'RETAIL' | 'SERVICES';
  icon: string;
  color: string;
  pattern: 'FIXED_SLOTS' | 'FLEXIBLE_BOOKING' | 'AVAILABILITY' | 'ZONE_DELIVERY' | 'EVENT_BOOKING' | 'CLASS_SESSION' | 'INSTANT_SERVICE';
  defaultSettings: any;
  defaultSchedule: any;
  suggestedSubServices: Array<{
    name: string;
    description: string;
    duration: any;
    pricing: any;
    options?: Array<{
      name: string;
      type: string;
      pricing: any;
      conditions?: any;
    }>;
  }>;
  customFields: Array<{
    name: string;
    label: string;
    type: string;
    isRequired: boolean;
    config?: any;
  }>;
};

// ============================================================================
// PATTERNS PRÉDÉFINIS PAR SECTEUR
// ============================================================================

export const SERVICE_PATTERNS: Record<string, ServicePatternConfig> = {
  
  // 🍽️ RESTAURATION
  restaurant_table: {
    id: 'restaurant_table',
    name: 'Table Restaurant',
    description: 'Réservation de tables avec créneaux fixes',
    businessCategory: 'RESTAURANT',
    icon: '🍽️',
    color: '#f97316',
    pattern: 'FIXED_SLOTS',
    defaultSettings: {
      requiresAdvanceBooking: true,
      allowsGroupBooking: true,
      maxPartySize: 8,
      allowsCancellation: true,
      cancellationDeadline: 2 // heures
    },
    defaultSchedule: {
      type: 'FIXED_SLOTS',
      workingHours: {
        tuesday: { start: '11:30', end: '14:30' },
        wednesday: { start: '11:30', end: '14:30' },
        thursday: { start: '11:30', end: '14:30' },
        friday: { start: '11:30', end: '14:30' },
        saturday: { start: '11:30', end: '14:30' },
        sunday: { start: '11:30', end: '14:30' }
      },
      slotConfig: {
        lunch: { start: '12:00', end: '14:30', interval: 30, duration: 120 },
        dinner: { start: '19:00', end: '22:00', interval: 30, duration: 120 }
      },
      bookingRules: {
        advanceMin: 1, // heures
        advanceMax: 30, // jours
        allowSameDay: true
      }
    },
    suggestedSubServices: [
      {
        name: 'Table Terrasse',
        description: 'Table en terrasse avec vue',
        duration: { type: 'FIXED', default: 120 },
        pricing: { model: 'PERSON_BASED', basePrice: 0, personPrice: 5 }
      },
      {
        name: 'Salle Privée',
        description: 'Salle privée pour événements',
        duration: { type: 'FIXED', default: 180 },
        pricing: { model: 'FLAT_RATE', basePrice: 150 },
        options: [
          {
            name: 'Menu Groupe',
            type: 'ADDON',
            pricing: { model: 'PERSON_BASED', personPrice: 35 }
          }
        ]
      }
    ],
    customFields: [
      {
        name: 'party_size',
        label: 'Nombre de personnes',
        type: 'NUMBER',
        isRequired: true,
        config: { min: 1, max: 12 }
      },
      {
        name: 'allergies',
        label: 'Allergies alimentaires',
        type: 'TEXT',
        isRequired: false
      },
      {
        name: 'special_occasion',
        label: 'Occasion spéciale',
        type: 'SELECT',
        isRequired: false,
        config: {
          options: ['Anniversaire', 'Dîner romantique', 'Business', 'Famille', 'Autre']
        }
      }
    ]
  },

  // 💄 INSTITUT DE BEAUTÉ
  beauty: {
    id: 'beauty',
    name: 'Institut de Beauté',
    description: 'Soins esthétiques avec possibilité de déplacement',
    category: 'beauty',
    icon: '💄',
    color: '#ec4899',
    pattern: 'FLEXIBLE_BOOKING',
    defaultSettings: {
      allowsDeployment: true,
      deploymentZones: ['Paris intra-muros', 'Proche banlieue'],
      requiresConsultation: false,
      allowsProductSale: true
    },
    defaultSchedule: {
      type: 'FLEXIBLE_BOOKING',
      workingHours: {
        monday: { start: '09:00', end: '19:00' },
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '19:00' },
        friday: { start: '09:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' }
      },
      bookingRules: {
        advanceMin: 2, // heures
        advanceMax: 60, // jours
        bufferTime: 15 // minutes entre RDV
      }
    },
    suggestedSubServices: [
      {
        name: 'Soin Visage Classique',
        description: 'Nettoyage, gommage, masque et hydratation',
        duration: { type: 'FIXED', default: 60 },
        pricing: { model: 'FLAT_RATE', basePrice: 65 },
        options: [
          {
            name: 'Déplacement à domicile',
            type: 'DEPLOYMENT',
            pricing: { model: 'FLAT_RATE', basePrice: 30 },
            conditions: { maxDistance: 50 }
          },
          {
            name: 'Produits Premium',
            type: 'UPGRADE',
            pricing: { model: 'FLAT_RATE', basePrice: 20 }
          }
        ]
      },
      {
        name: 'Maquillage Mariage',
        description: 'Maquillage professionnel longue tenue',
        duration: { type: 'RANGE', min: 90, max: 150, default: 120 },
        pricing: { model: 'FLAT_RATE', basePrice: 120 },
        options: [
          {
            name: 'Essai préalable',
            type: 'ADDON',
            pricing: { model: 'FLAT_RATE', basePrice: 50 }
          },
          {
            name: 'Déplacement mariage',
            type: 'DEPLOYMENT',
            pricing: { model: 'DISTANCE_BASED', basePrice: 50, pricePerKm: 2 }
          }
        ]
      }
    ],
    customFields: [
      {
        name: 'skin_type',
        label: 'Type de peau',
        type: 'SELECT',
        isRequired: true,
        config: {
          options: ['Normale', 'Sèche', 'Grasse', 'Mixte', 'Sensible']
        }
      },
      {
        name: 'allergies',
        label: 'Allergies cosmétiques',
        type: 'TEXT',
        isRequired: false
      },
      {
        name: 'event_date',
        label: 'Date de l\'événement',
        type: 'DATE',
        isRequired: false
      }
    ]
  },

  // ✂️ COIFFURE
  hairdresser: {
    id: 'hairdresser',
    name: 'Salon de Coiffure',
    description: 'Services de coiffure et soins capillaires',
    category: 'beauty',
    icon: '✂️',
    color: '#8b5cf6',
    pattern: 'FLEXIBLE_BOOKING',
    defaultSettings: {
      allowsDeployment: true,
      requiresConsultation: false,
      allowsColorTesting: true
    },
    defaultSchedule: {
      type: 'FLEXIBLE_BOOKING',
      workingHours: {
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '20:00' },
        friday: { start: '09:00', end: '20:00' },
        saturday: { start: '08:00', end: '18:00' }
      },
      bookingRules: {
        advanceMin: 1, // heure
        advanceMax: 45, // jours
        bufferTime: 10
      }
    },
    suggestedSubServices: [
      {
        name: 'Coupe Femme',
        description: 'Coupe, brushing et conseil',
        duration: { type: 'RANGE', min: 45, max: 75, default: 60 },
        pricing: { model: 'FLAT_RATE', basePrice: 45 }
      },
      {
        name: 'Coloration + Coupe',
        description: 'Couleur personnalisée et coupe',
        duration: { type: 'RANGE', min: 120, max: 180, default: 150 },
        pricing: { model: 'FLAT_RATE', basePrice: 85 },
        options: [
          {
            name: 'Mèches',
            type: 'ADDON',
            pricing: { model: 'FLAT_RATE', basePrice: 25 }
          },
          {
            name: 'Déplacement domicile',
            type: 'DEPLOYMENT',
            pricing: { model: 'FLAT_RATE', basePrice: 35 }
          }
        ]
      }
    ],
    customFields: [
      {
        name: 'hair_type',
        label: 'Type de cheveux',
        type: 'SELECT',
        isRequired: true,
        config: {
          options: ['Fins', 'Épais', 'Bouclés', 'Raides', 'Frisés']
        }
      },
      {
        name: 'previous_color',
        label: 'Dernière coloration',
        type: 'DATE',
        isRequired: false
      }
    ]
  },

  // 🚗 LOCATION VÉHICULES
  car_rental: {
    id: 'car_rental',
    name: 'Location de Véhicules',
    description: 'Location court et long terme avec options',
    category: 'automotive',
    icon: '🚗',
    color: '#3b82f6',
    pattern: 'AVAILABILITY',
    defaultSettings: {
      requiresLicense: true,
      allowsOneWay: true,
      hasInsurance: true,
      allowsExtension: true
    },
    defaultSchedule: {
      type: 'AVAILABILITY_CHECK',
      workingHours: {
        monday: { start: '08:00', end: '20:00' },
        tuesday: { start: '08:00', end: '20:00' },
        wednesday: { start: '08:00', end: '20:00' },
        thursday: { start: '08:00', end: '20:00' },
        friday: { start: '08:00', end: '20:00' },
        saturday: { start: '08:00', end: '18:00' },
        sunday: { start: '09:00', end: '17:00' }
      },
      bookingRules: {
        advanceMin: 1, // heure
        advanceMax: 180, // jours
        minDuration: 1, // jour
        maxDuration: 90 // jours
      }
    },
    suggestedSubServices: [
      {
        name: 'Citadine Économique',
        description: 'Véhicule compact idéal pour la ville',
        duration: { type: 'UNLIMITED' },
        pricing: { 
          model: 'HYBRID', 
          dailyRate: 35, 
          kmRate: 0.25,
          freeKmPerDay: 200 
        },
        options: [
          {
            name: 'GPS Navigation',
            type: 'ADDON',
            pricing: { model: 'TIME_BASED', dailyRate: 5 }
          },
          {
            name: 'Assurance Tous Risques',
            type: 'INSURANCE',
            pricing: { model: 'TIME_BASED', dailyRate: 15 }
          },
          {
            name: 'Siège Bébé',
            type: 'ADDON',
            pricing: { model: 'TIME_BASED', dailyRate: 8 }
          }
        ]
      },
      {
        name: 'SUV Familial',
        description: 'Véhicule spacieux 7 places',
        duration: { type: 'UNLIMITED' },
        pricing: { 
          model: 'HYBRID', 
          dailyRate: 75, 
          kmRate: 0.35,
          freeKmPerDay: 200 
        }
      }
    ],
    customFields: [
      {
        name: 'driver_license',
        label: 'Numéro de permis',
        type: 'TEXT',
        isRequired: true
      },
      {
        name: 'pickup_location',
        label: 'Lieu de prise en charge',
        type: 'ADDRESS',
        isRequired: true
      },
      {
        name: 'return_location',
        label: 'Lieu de retour',
        type: 'ADDRESS',
        isRequired: true
      },
      {
        name: 'additional_drivers',
        label: 'Conducteurs supplémentaires',
        type: 'NUMBER',
        isRequired: false,
        config: { min: 0, max: 3 }
      }
    ]
  },

  // ⚖️ CONSULTATION JURIDIQUE
  legal_consultation: {
    id: 'legal_consultation',
    name: 'Consultation Juridique',
    description: 'Conseils juridiques par domaine de droit',
    category: 'professional',
    icon: '⚖️',
    color: '#059669',
    pattern: 'FLEXIBLE_BOOKING',
    defaultSettings: {
      requiresConfidentiality: true,
      allowsVideoCall: true,
      requiresPreparation: true
    },
    defaultSchedule: {
      type: 'FLEXIBLE_BOOKING',
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '17:00' }
      },
      bookingRules: {
        advanceMin: 24, // heures
        advanceMax: 90, // jours
        bufferTime: 15
      }
    },
    suggestedSubServices: [
      {
        name: 'Droit de la Famille',
        description: 'Divorce, garde d\'enfants, succession',
        duration: { type: 'RANGE', min: 30, max: 120, default: 60 },
        pricing: { model: 'TIME_BASED', hourlyRate: 150 }
      },
      {
        name: 'Droit Immobilier',
        description: 'Achat, vente, litiges immobiliers',
        duration: { type: 'RANGE', min: 45, max: 90, default: 60 },
        pricing: { model: 'TIME_BASED', hourlyRate: 180 }
      }
    ],
    customFields: [
      {
        name: 'legal_domain',
        label: 'Domaine juridique',
        type: 'SELECT',
        isRequired: true,
        config: {
          options: ['Famille', 'Immobilier', 'Travail', 'Commercial', 'Pénal', 'Autre']
        }
      },
      {
        name: 'urgency',
        label: 'Urgence du dossier',
        type: 'SELECT',
        isRequired: true,
        config: {
          options: ['Normale', 'Urgent', 'Très urgent']
        }
      },
      {
        name: 'documents',
        label: 'Documents à préparer',
        type: 'TEXT',
        isRequired: false
      }
    ]
  },

  // 🎵 ÉVÉNEMENTIEL (DJ/PHOTO)
  event_services: {
    id: 'event_services',
    name: 'Services Événementiels',
    description: 'DJ, photographie, animation d\'événements',
    category: 'entertainment',
    icon: '🎵',
    color: '#dc2626',
    pattern: 'EVENT_BOOKING',
    defaultSettings: {
      requiresDeployment: true,
      allowsEquipmentRental: true,
      requiresSetupTime: true
    },
    defaultSchedule: {
      type: 'FLEXIBLE_BOOKING',
      workingHours: {
        friday: { start: '14:00', end: '02:00' },
        saturday: { start: '10:00', end: '02:00' },
        sunday: { start: '12:00', end: '23:00' }
      },
      bookingRules: {
        advanceMin: 168, // 1 semaine
        advanceMax: 365, // 1 an
        setupTime: 60 // minutes
      }
    },
    suggestedSubServices: [
      {
        name: 'Animation DJ Mariage',
        description: 'Animation musicale complète avec matériel',
        duration: { type: 'RANGE', min: 240, max: 600, default: 480 },
        pricing: { 
          model: 'HYBRID', 
          basePrice: 500, 
          hourlyRate: 75,
          setupFee: 100 
        },
        options: [
          {
            name: 'Éclairage Professionnel',
            type: 'ADDON',
            pricing: { model: 'FLAT_RATE', basePrice: 200 }
          },
          {
            name: 'Déplacement',
            type: 'DEPLOYMENT',
            pricing: { model: 'DISTANCE_BASED', basePrice: 50, pricePerKm: 1.5 }
          }
        ]
      }
    ],
    customFields: [
      {
        name: 'event_type',
        label: 'Type d\'événement',
        type: 'SELECT',
        isRequired: true,
        config: {
          options: ['Mariage', 'Anniversaire', 'Entreprise', 'Festival', 'Autre']
        }
      },
      {
        name: 'guest_count',
        label: 'Nombre d\'invités',
        type: 'NUMBER',
        isRequired: true,
        config: { min: 10, max: 1000 }
      },
      {
        name: 'venue_address',
        label: 'Adresse du lieu',
        type: 'ADDRESS',
        isRequired: true
      }
    ]
  },

  // 🏋️ FITNESS/SPORT
  fitness: {
    id: 'fitness',
    name: 'Fitness & Sport',
    description: 'Cours collectifs et coaching personnel',
    category: 'health',
    icon: '🏋️',
    color: '#ea580c',
    pattern: 'CLASS_SESSION',
    defaultSettings: {
      allowsGroupBooking: true,
      requiresFitnessLevel: true,
      allowsTrialSession: true
    },
    defaultSchedule: {
      type: 'FIXED_SLOTS',
      workingHours: {
        monday: { start: '06:00', end: '22:00' },
        tuesday: { start: '06:00', end: '22:00' },
        wednesday: { start: '06:00', end: '22:00' },
        thursday: { start: '06:00', end: '22:00' },
        friday: { start: '06:00', end: '22:00' },
        saturday: { start: '08:00', end: '20:00' },
        sunday: { start: '08:00', end: '19:00' }
      },
      slotConfig: {
        morning: { start: '07:00', end: '11:00', interval: 60, duration: 60 },
        evening: { start: '18:00', end: '21:00', interval: 60, duration: 60 }
      }
    },
    suggestedSubServices: [
      {
        name: 'Cours de Yoga',
        description: 'Séance de yoga tous niveaux',
        duration: { type: 'FIXED', default: 60 },
        pricing: { model: 'PERSON_BASED', personPrice: 20 },
        options: [
          {
            name: 'Tapis fourni',
            type: 'ADDON',
            pricing: { model: 'FLAT_RATE', basePrice: 5 }
          }
        ]
      },
      {
        name: 'Coaching Personnel',
        description: 'Séance individuelle personnalisée',
        duration: { type: 'RANGE', min: 30, max: 90, default: 60 },
        pricing: { model: 'TIME_BASED', hourlyRate: 60 }
      }
    ],
    customFields: [
      {
        name: 'fitness_level',
        label: 'Niveau de forme',
        type: 'SELECT',
        isRequired: true,
        config: {
          options: ['Débutant', 'Intermédiaire', 'Avancé']
        }
      },
      {
        name: 'health_conditions',
        label: 'Conditions médicales',
        type: 'TEXT',
        isRequired: false
      }
    ]
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function getPatternsByCategory(category?: string): ServicePatternConfig[] {
  const patterns = Object.values(SERVICE_PATTERNS);
  if (!category) return patterns;
  return patterns.filter(p => p.category === category);
}

export function getPatternById(id: string): ServicePatternConfig | undefined {
  return SERVICE_PATTERNS[id];
}

export function getAllCategories(): string[] {
  const categories = new Set(Object.values(SERVICE_PATTERNS).map(p => p.category));
  return Array.from(categories);
}

export function createServiceFromPattern(
  storeId: string, 
  patternId: string, 
  customizations?: Partial<ServicePatternConfig>
): any {
  const pattern = getPatternById(patternId);
  if (!pattern) throw new Error(`Pattern ${patternId} not found`);

  return {
    storeId,
    name: customizations?.name || pattern.name,
    description: customizations?.description || pattern.description,
    pattern: pattern.pattern,
    category: pattern.category,
    icon: customizations?.icon || pattern.icon,
    color: customizations?.color || pattern.color,
    settings: { ...pattern.defaultSettings, ...customizations?.defaultSettings },
    scheduleConfig: {
      create: {
        ...pattern.defaultSchedule,
        ...customizations?.defaultSchedule
      }
    },
    subServices: {
      create: pattern.suggestedSubServices.map((subService, index) => ({
        ...subService,
        order: index,
        options: subService.options ? {
          create: subService.options.map((option, optIndex) => ({
            ...option,
            order: optIndex
          }))
        } : undefined
      }))
    },
    customFields: {
      create: pattern.customFields.map((field, index) => ({
        ...field,
        order: index
      }))
    }
  };
}