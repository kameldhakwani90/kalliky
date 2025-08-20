// ============================================================================
// CONSTANTES PAYS - Pays supportés par Telnyx avec leurs informations
// ============================================================================

export interface Operator {
  name: string;
  includedInPlan: boolean;
  type: 'mobile' | 'fixe' | 'mixte';
  note?: string;
}

export interface TelnyxCountry {
  code: string;
  name: string;
  flag: string;
  monthlyPrice: number;
  currency: string;
  inboundRate: number;  // prix par minute entrant
  outboundRate: number; // prix par minute sortant
  popular?: boolean;
  operators?: Operator[];
}

export const TELNYX_COUNTRIES: TelnyxCountry[] = [
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    monthlyPrice: 1.00,
    currency: 'EUR',
    inboundRate: 0.0085,
    outboundRate: 0.02,
    popular: true,
    operators: [
      { name: 'Orange', includedInPlan: true, type: 'mixte' },
      { name: 'SFR', includedInPlan: true, type: 'mixte' },
      { name: 'Bouygues Telecom', includedInPlan: true, type: 'mixte' },
      { name: 'Free Mobile', includedInPlan: true, type: 'mixte' },
      { name: 'Prépayés génériques', includedInPlan: false, type: 'mobile', note: 'Facturation possible selon votre abonnement' }
    ]
  },
  {
    code: 'US',
    name: 'États-Unis',
    flag: '🇺🇸',
    monthlyPrice: 1.00,
    currency: 'USD',
    inboundRate: 0.0085,
    outboundRate: 0.01,
    popular: true,
    operators: [
      { name: 'Verizon', includedInPlan: true, type: 'mixte' },
      { name: 'AT&T', includedInPlan: true, type: 'mixte' },
      { name: 'T-Mobile', includedInPlan: true, type: 'mixte' },
      { name: 'Sprint', includedInPlan: true, type: 'mixte' },
      { name: 'Autres MVNO', includedInPlan: true, type: 'mixte' }
    ]
  },
  {
    code: 'GB',
    name: 'Royaume-Uni',
    flag: '🇬🇧',
    monthlyPrice: 1.20,
    currency: 'EUR',
    inboundRate: 0.01,
    outboundRate: 0.025,
    operators: [
      { name: 'EE', includedInPlan: true, type: 'mixte' },
      { name: 'Vodafone UK', includedInPlan: true, type: 'mixte' },
      { name: 'O2 UK', includedInPlan: true, type: 'mixte' },
      { name: 'Three UK', includedInPlan: true, type: 'mixte' }
    ]
  },
  {
    code: 'DE',
    name: 'Allemagne',
    flag: '🇩🇪',
    monthlyPrice: 1.50,
    currency: 'EUR',
    inboundRate: 0.01,
    outboundRate: 0.03,
    operators: [
      { name: 'Deutsche Telekom', includedInPlan: true, type: 'mixte' },
      { name: 'Vodafone Deutschland', includedInPlan: true, type: 'mixte' },
      { name: 'Telefónica (O2)', includedInPlan: true, type: 'mixte' }
    ]
  },
  {
    code: 'ES',
    name: 'Espagne',
    flag: '🇪🇸',
    monthlyPrice: 1.50,
    currency: 'EUR',
    inboundRate: 0.01,
    outboundRate: 0.025,
    operators: [
      { name: 'Movistar', includedInPlan: true, type: 'mixte' },
      { name: 'Vodafone España', includedInPlan: true, type: 'mixte' },
      { name: 'Orange España', includedInPlan: true, type: 'mixte' }
    ]
  },
  {
    code: 'IT',
    name: 'Italie',
    flag: '🇮🇹',
    monthlyPrice: 1.50,
    currency: 'EUR',
    inboundRate: 0.01,
    outboundRate: 0.025,
    operators: [
      { name: 'TIM', includedInPlan: true, type: 'mixte' },
      { name: 'Vodafone Italia', includedInPlan: true, type: 'mixte' },
      { name: 'WindTre', includedInPlan: true, type: 'mixte' }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    monthlyPrice: 1.00,
    currency: 'USD',
    inboundRate: 0.0085,
    outboundRate: 0.01,
    operators: [
      { name: 'Rogers', includedInPlan: true, type: 'mixte' },
      { name: 'Bell', includedInPlan: true, type: 'mixte' },
      { name: 'Telus', includedInPlan: true, type: 'mixte' },
      { name: 'Freedom Mobile', includedInPlan: true, type: 'mixte' }
    ]
  },
  {
    code: 'AU',
    name: 'Australie',
    flag: '🇦🇺',
    monthlyPrice: 1.50,
    currency: 'AUD',
    inboundRate: 0.015,
    outboundRate: 0.035,
    operators: [
      { name: 'Telstra', includedInPlan: true, type: 'mixte' },
      { name: 'Optus', includedInPlan: true, type: 'mixte' },
      { name: 'Vodafone Australia', includedInPlan: true, type: 'mixte' }
    ]
  }
];

// Pays populaires en premier
export const POPULAR_COUNTRIES = TELNYX_COUNTRIES.filter(c => c.popular);
export const OTHER_COUNTRIES = TELNYX_COUNTRIES.filter(c => !c.popular);

// Fonction utilitaire pour obtenir un pays par code
export const getTelnyxCountry = (code: string): TelnyxCountry | undefined => {
  return TELNYX_COUNTRIES.find(c => c.code === code);
};

// Fonction pour formater le prix avec la devise
export const formatCountryPrice = (country: TelnyxCountry): string => {
  // Ne plus afficher les prix - retourner une chaîne vide
  return '';
};