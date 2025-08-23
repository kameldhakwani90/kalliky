/**
 * CONFIGURATIONS STATIQUES PAR TYPE D'ACTIVITÉ
 * 
 * Configurations de base sécurisées et versionnées dans le code.
 * L'admin peut override le wording via BusinessCategoryConfig en DB.
 */

export interface BusinessConfig {
  code: string;
  displayName: string;
  icon: string;
  wording: {
    products: string;
    equipment: string;
    staff: string;
    options: string;
  };
  systemPrompt: string;
  menuExtractionPrompt: string;
  validation: {
    requiredProducts: boolean;
    minProducts: number;
    requiredEquipment: boolean;
    minEquipment: number;
    requiredStaff: boolean;
    minStaff: number;
  };
}

export const BUSINESS_CONFIGS: Record<string, BusinessConfig> = {
  RESTAURANT: {
    code: 'RESTAURANT',
    displayName: 'Restaurant',
    icon: '🍽️',
    
    wording: {
      products: "Que servez-vous ?",
      equipment: "Vos tables et espaces",
      staff: "Votre équipe de service", 
      options: "Services additionnels"
    },
    
    systemPrompt: `Tu es l'assistant IA professionnel d'un restaurant.

CONTEXTE: Tu gères les appels téléphoniques avec une limite de 3 minutes maximum par appel.

MISSION:
- Prendre les commandes de plats et menus
- Gérer les réservations de tables
- Informer sur les disponibilités et horaires
- Proposer des alternatives si nécessaire
- Traiter les demandes de livraison si disponible

STYLE:
- Professionnel mais chaleureux
- Rapide et efficace (3min max)
- Suggère des plats populaires
- Confirme toujours la commande

LIMITES:
- Ne pas dépasser 3 minutes d'appel
- Transférer vers humain si problème complexe
- Confirmer adresse pour livraisons`,

    menuExtractionPrompt: `Analyse cette image de menu de restaurant et extrait:

INFORMATIONS À EXTRAIRE:
- Nom de chaque plat/menu
- Prix exact avec devise
- Description/ingrédients principaux
- Catégorie (Entrées, Plats, Desserts, Boissons)
- Allergènes si mentionnés
- Options disponibles (taille, accompagnement)

FORMAT DE SORTIE JSON:
{
  "items": [
    {
      "name": "nom du plat",
      "price": prix_numérique,
      "currency": "EUR",
      "category": "catégorie",
      "description": "description",
      "options": ["option1", "option2"],
      "allergens": ["allergène1"]
    }
  ]
}

IMPORTANT: Sois précis sur les prix et orthographe correcte des noms.`,
    
    validation: {
      requiredProducts: true,
      minProducts: 1,
      requiredEquipment: true,
      minEquipment: 1,
      requiredStaff: true,
      minStaff: 1
    }
  },

  BEAUTY: {
    code: 'BEAUTY',
    displayName: 'Salon de Beauté',
    icon: '💄',
    
    wording: {
      products: "Quels soins proposez-vous ?",
      equipment: "Vos cabines et espaces",
      staff: "Vos esthéticiennes et spécialistes",
      options: "Prestations premium"
    },
    
    systemPrompt: `Tu es l'assistant IA professionnel d'un salon de beauté.

CONTEXTE: Tu gères les appels téléphoniques avec une limite de 3 minutes maximum par appel.

MISSION:
- Prendre les rendez-vous pour soins beauté
- Informer sur les prestations et tarifs
- Gérer les disponibilités des esthéticiennes
- Conseiller selon type de peau/besoin
- Proposer des services à domicile si disponible

STYLE:
- Professionnel et bienveillant
- Attentif aux besoins beauté
- Rassurant et conseil personnalisé
- Respect intimité et confidentialité

SPÉCIALITÉS:
- Soins visage (hydratation, anti-âge, nettoyage)
- Soins corps (massages, gommages, enveloppements)
- Épilation et manucure/pédicure
- Conseils produits et routines

LIMITES:
- Ne pas dépasser 3 minutes d'appel
- Pas de diagnostic médical
- Transférer vers spécialiste si allergie`,

    menuExtractionPrompt: `Analyse cette carte de soins de salon de beauté et extrait:

INFORMATIONS À EXTRAIRE:
- Nom de chaque soin/prestation
- Prix exact avec devise
- Durée de la prestation
- Zone traitée (visage, corps, mains, etc.)
- Technique utilisée
- Produits/marques mentionnés

FORMAT DE SORTIE JSON:
{
  "treatments": [
    {
      "name": "nom du soin",
      "price": prix_numérique,
      "currency": "EUR", 
      "duration": durée_en_minutes,
      "category": "visage|corps|mains|pieds",
      "description": "description technique",
      "products": ["marque/produit utilisé"]
    }
  ]
}

IMPORTANT: Précision sur durées et techniques utilisées.`,
    
    validation: {
      requiredProducts: true,
      minProducts: 1,
      requiredEquipment: true,
      minEquipment: 1,
      requiredStaff: true,
      minStaff: 1
    }
  },

  RENTAL: {
    code: 'RENTAL',
    displayName: 'Location Véhicules',
    icon: '🚗',
    
    wording: {
      products: "Que louez-vous ?",
      equipment: "Vos emplacements et garages",
      staff: "Vos commerciaux et livreurs",
      options: "Services complémentaires"
    },
    
    systemPrompt: `Tu es l'assistant IA professionnel d'une agence de location de véhicules.

CONTEXTE: Tu gères les appels téléphoniques avec une limite de 3 minutes maximum par appel.

MISSION:
- Gérer les réservations de véhicules
- Informer sur disponibilités et tarifs
- Proposer véhicules selon besoin client
- Organiser livraison/récupération
- Expliquer conditions de location

STYLE:
- Professionnel et commercial
- Rassurant sur sécurité véhicules
- Clair sur conditions et assurances
- Proactif sur services additionnels

TYPES VÉHICULES:
- Citadines économiques
- Berlines et SUV
- Véhicules utilitaires
- Véhicules de prestige

SERVICES:
- Livraison/récupération véhicule
- Assurances complémentaires
- GPS et équipements
- Kilométrage illimité/limité

LIMITES:
- Ne pas dépasser 3 minutes d'appel
- Vérification permis obligatoire
- Âge minimum selon véhicule`,

    menuExtractionPrompt: `Analyse cette liste de véhicules de location et extrait:

INFORMATIONS À EXTRAIRE:
- Modèle et marque du véhicule
- Catégorie (citadine, berline, SUV, utilitaire)
- Prix de location (jour/semaine/mois)
- Caractéristiques (portes, places, transmission)
- Consommation et carburant
- Équipements inclus

FORMAT DE SORTIE JSON:
{
  "vehicles": [
    {
      "brand": "marque",
      "model": "modèle",
      "category": "citadine|berline|suv|utilitaire|prestige",
      "price_per_day": prix_numérique,
      "currency": "EUR",
      "seats": nombre_places,
      "transmission": "manuel|automatique",
      "fuel": "essence|diesel|électrique|hybride",
      "features": ["GPS", "climatisation", "etc"]
    }
  ]
}

IMPORTANT: Précision sur catégories et prix selon durée.`,
    
    validation: {
      requiredProducts: true,
      minProducts: 1,
      requiredEquipment: false, // Optionnel pour location
      minEquipment: 0,
      requiredStaff: false,     // Commercial optionnel
      minStaff: 0
    }
  },

  AUTOMOTIVE: {
    code: 'AUTOMOTIVE', 
    displayName: 'Services Automobile',
    icon: '🔧',
    
    wording: {
      products: "Quelles prestations proposez-vous ?",
      equipment: "Vos équipements techniques", 
      staff: "Vos mécaniciens et techniciens",
      options: "Services complémentaires"
    },
    
    systemPrompt: `Tu es l'assistant IA professionnel d'un garage automobile.

CONTEXTE: Tu gères les appels téléphoniques avec une limite de 3 minutes maximum par appel.

MISSION:
- Prendre rendez-vous pour réparations/révisions
- Diagnostiquer problèmes simples au téléphone
- Informer sur tarifs et délais
- Organiser récupération/livraison véhicule
- Proposer véhicule de courtoisie

STYLE:
- Professionnel et technique
- Rassurant sur qualité réparations
- Transparent sur coûts
- Pédagogue pour expliquer pannes

PRESTATIONS:
- Révisions et vidanges
- Réparations moteur/freins/électronique
- Contrôle technique et contre-visite
- Carrosserie et peinture
- Pneus et géométrie

LIMITES:
- Ne pas dépasser 3 minutes d'appel
- Diagnostic précis nécessite inspection
- Devis gratuit sur demande`,

    menuExtractionPrompt: `Analyse cette liste de prestations automobile et extrait:

INFORMATIONS À EXTRAIRE:
- Nom de la prestation/service
- Prix ou fourchette tarifaire
- Durée approximative
- Type d'intervention (révision, réparation, etc.)
- Pièces incluses/non incluses
- Garantie proposée

FORMAT DE SORTIE JSON:
{
  "services": [
    {
      "name": "nom prestation",
      "price": prix_numérique,
      "currency": "EUR",
      "duration": durée_heures,
      "category": "révision|réparation|carrosserie|pneumatique",
      "includes": ["pièce1", "main d'oeuvre"],
      "warranty": "durée_garantie"
    }
  ]
}`,
    
    validation: {
      requiredProducts: true,
      minProducts: 1,
      requiredEquipment: true,
      minEquipment: 1,
      requiredStaff: true,
      minStaff: 1
    }
  },

  LEGAL: {
    code: 'LEGAL',
    displayName: 'Services Juridiques',
    icon: '⚖️',
    
    wording: {
      products: "Quelles consultations proposez-vous ?",
      equipment: "Vos bureaux et salles de réunion",
      staff: "Vos avocats et collaborateurs",
      options: "Services premium"
    },
    
    systemPrompt: `Tu es l'assistant IA professionnel d'un cabinet juridique.

CONTEXTE: Tu gères les appels téléphoniques avec une limite de 3 minutes maximum par appel.

MISSION:
- Prendre rendez-vous consultations juridiques
- Identifier domaine de droit concerné
- Orienter vers avocat spécialisé
- Informer sur tarifs consultation
- Organiser rendez-vous urgents si nécessaire

STYLE:
- Professionnel et confidentiel
- Rassurant et empathique
- Précis sur procédures
- Respect secret professionnel

DOMAINES:
- Droit de la famille (divorce, succession)
- Droit immobilier (vente, location)
- Droit du travail (licenciement, prud'hommes)
- Droit pénal (défense, partie civile)
- Droit commercial (contrats, litiges)

LIMITES:
- Ne pas donner de conseils juridiques précis
- Première consultation payante obligatoire
- Urgence = dans les 48h maximum`,

    menuExtractionPrompt: `Analyse cette liste de consultations juridiques et extrait:

INFORMATIONS À EXTRAIRE:
- Domaine de droit
- Type de consultation
- Tarif horaire ou forfaitaire
- Durée consultation type
- Spécialisations particulières
- Procédures incluses

FORMAT DE SORTIE JSON:
{
  "consultations": [
    {
      "domain": "domaine_droit",
      "service": "type_consultation", 
      "price": prix_numérique,
      "currency": "EUR",
      "duration": durée_minutes,
      "specialties": ["spécialité1"],
      "includes": ["conseil", "rédaction"]
    }
  ]
}`,
    
    validation: {
      requiredProducts: true,
      minProducts: 1,
      requiredEquipment: true,
      minEquipment: 1,
      requiredStaff: true,
      minStaff: 1
    }
  },

  HEALTH: {
    code: 'HEALTH',
    displayName: 'Services Santé',
    icon: '🏥',
    
    wording: {
      products: "Quelles consultations proposez-vous ?",
      equipment: "Vos cabinets et équipements",
      staff: "Vos praticiens",
      options: "Services complémentaires"
    },
    
    systemPrompt: `Tu es l'assistant IA professionnel d'un cabinet médical.

CONTEXTE: Tu gères les appels téléphoniques avec une limite de 3 minutes maximum par appel.

MISSION:
- Prendre rendez-vous médicaux
- Identifier urgence médicale
- Orienter vers bon praticien
- Gérer planning consultations
- Rappeler préparation si nécessaire

STYLE:
- Professionnel et bienveillant
- Discret et respectueux
- Efficace pour urgences
- Rassurant mais vigilant

SPÉCIALITÉS:
- Médecine générale
- Cardiologie, dermatologie
- Kinésithérapie, ostéopathie  
- Psychologie, psychiatrie
- Analyses et examens

URGENCES:
- Orienter vers SAMU si urgent
- Rendez-vous jour même si nécessaire
- Téléconsultation si disponible

LIMITES:
- Ne pas faire de diagnostic
- Pas de conseils médicaux précis
- Secret médical strict`,

    menuExtractionPrompt: `Analyse cette liste de consultations médicales et extrait:

INFORMATIONS À EXTRAIRE:
- Spécialité médicale
- Type de consultation
- Tarif consultation
- Durée type
- Remboursement sécurité sociale
- Équipements particuliers utilisés

FORMAT DE SORTIE JSON:
{
  "consultations": [
    {
      "specialty": "spécialité",
      "consultation_type": "première|suivi|urgence",
      "price": prix_numérique,
      "currency": "EUR", 
      "duration": durée_minutes,
      "reimbursed": true/false,
      "equipment": ["équipement_utilisé"]
    }
  ]
}`,
    
    validation: {
      requiredProducts: true,
      minProducts: 1,
      requiredEquipment: true,
      minEquipment: 1,
      requiredStaff: true,
      minStaff: 1
    }
  }
};

// Types pour TypeScript
export type BusinessCategoryCode = keyof typeof BUSINESS_CONFIGS;

// Helper functions
export const getBusinessConfig = (category: string): BusinessConfig | null => {
  return BUSINESS_CONFIGS[category] || null;
};

export const getAllBusinessConfigs = (): BusinessConfig[] => {
  return Object.values(BUSINESS_CONFIGS);
};

export const isValidBusinessCategory = (category: string): category is BusinessCategoryCode => {
  return category in BUSINESS_CONFIGS;
};

// Export des codes pour validation
export const BUSINESS_CATEGORY_CODES = Object.keys(BUSINESS_CONFIGS);