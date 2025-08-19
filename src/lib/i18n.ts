import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      // Navigation
      nav: {
        features: "Fonctionnalités",
        pricing: "Tarifs",
        demo: "Démo",
        login: "Connexion",
        signup: "Commencer",
        language: "Langue"
      },
      // Hero Section
      hero: {
        title: "L'IA qui transforme",
        titleHighlight: "vos appels",
        titleEnd: "en revenus",
        subtitle: "Automatisez la prise de commandes, réservations et consultations avec notre IA conversationnelle. Disponible 24h/7j, dans toutes les langues.",
        cta: "Demander une démo",
        ctaSecondary: "Voir en action",
        stats: {
          conversion: "+340% de conversions",
          availability: "24h/7j disponible", 
          languages: "12+ langues"
        }
      },
      // Features
      features: {
        title: "Une IA pour chaque",
        titleHighlight: "secteur d'activité",
        subtitle: "Adaptée aux spécificités de votre métier",
        restaurant: {
          title: "Restaurants & Fast-food",
          description: "Prise de commandes automatisée, gestion des stocks en temps réel",
          benefits: ["0% commission vs 35% Uber", "Économie employé nuit/weekend", "Menu intelligent"]
        },
        rental: {
          title: "Location & Services",
          description: "Réservations optimisées, disponibilités en temps réel",
          benefits: ["Disponibilité 24h/7j", "Réduction no-show 80%", "Planning automatique"]
        },
        consultation: {
          title: "Cabinets & Consultations",
          description: "Qualification automatique, agenda intelligent",
          benefits: ["Filtrage prospects", "+200% rendez-vous qualifiés", "Facturation auto"]
        }
      },
      // ROI Calculator
      calculator: {
        title: "Calculez votre",
        titleHighlight: "retour sur investissement",
        subtitle: "Découvrez combien vous pourriez économiser et gagner",
        sectors: {
          restaurant: "Restaurant/Fast-food",
          rental: "Location/Services", 
          consultation: "Cabinet/Consultation"
        },
        inputs: {
          calls: "Appels par jour",
          revenue: "CA mensuel actuel",
          employees: "Employés téléphone",
          hours: "Heures d'ouverture"
        },
        results: {
          monthly: "Économies mensuelles",
          yearly: "Gain annuel",
          roi: "ROI en 12 mois",
          breakeven: "Rentabilité en"
        },
        comparison: {
          title: "Vs concurrence",
          uber: "Uber Eats prend 35%",
          traditional: "Employé 24h coûte",
          our: "Notre solution"
        }
      },
      // Pricing
      pricing: {
        title: "Tarifs transparents",
        subtitle: "Choisissez le plan adapté à votre activité",
        cta: "Commencer",
        trial: "14 jours gratuits"
      },
      // Footer
      footer: {
        cta: "Prêt à transformer votre activité ?",
        ctaButton: "Démarrer maintenant"
      }
    }
  },
  en: {
    translation: {
      // Navigation
      nav: {
        features: "Features",
        pricing: "Pricing",
        demo: "Demo",
        login: "Login",
        signup: "Get Started",
        language: "Language"
      },
      // Hero Section
      hero: {
        title: "AI that transforms",
        titleHighlight: "your calls",
        titleEnd: "into revenue",
        subtitle: "Automate order taking, bookings and consultations with our conversational AI. Available 24/7, in all languages.",
        cta: "Request a demo",
        ctaSecondary: "See in action",
        stats: {
          conversion: "+340% conversions",
          availability: "24/7 available",
          languages: "12+ languages"
        }
      },
      // Features
      features: {
        title: "AI for every",
        titleHighlight: "business sector",
        subtitle: "Adapted to your industry specifics",
        restaurant: {
          title: "Restaurants & Fast-food",
          description: "Automated order taking, real-time inventory management",
          benefits: ["0% commission vs 35% Uber", "Save night/weekend staff", "Smart menu"]
        },
        rental: {
          title: "Rental & Services",
          description: "Optimized bookings, real-time availability",
          benefits: ["24/7 availability", "80% no-show reduction", "Auto scheduling"]
        },
        consultation: {
          title: "Offices & Consultations", 
          description: "Automatic qualification, smart calendar",
          benefits: ["Prospect filtering", "+200% qualified appointments", "Auto billing"]
        }
      },
      // ROI Calculator
      calculator: {
        title: "Calculate your",
        titleHighlight: "return on investment",
        subtitle: "Discover how much you could save and earn",
        sectors: {
          restaurant: "Restaurant/Fast-food",
          rental: "Rental/Services",
          consultation: "Office/Consultation"
        },
        inputs: {
          calls: "Calls per day",
          revenue: "Monthly revenue",
          employees: "Phone employees",
          hours: "Opening hours"
        },
        results: {
          monthly: "Monthly savings",
          yearly: "Annual gain", 
          roi: "ROI in 12 months",
          breakeven: "Break-even in"
        },
        comparison: {
          title: "Vs competition",
          uber: "Uber Eats takes 35%",
          traditional: "24h employee costs",
          our: "Our solution"
        }
      },
      // Pricing
      pricing: {
        title: "Transparent pricing",
        subtitle: "Choose the plan that fits your business",
        cta: "Get Started",
        trial: "14-day free trial"
      },
      // Footer
      footer: {
        cta: "Ready to transform your business?",
        ctaButton: "Start now"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    lng: 'fr', // default language
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;