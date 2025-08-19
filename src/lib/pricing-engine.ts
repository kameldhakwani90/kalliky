// ============================================================================
// MOTEUR DE FACTURATION HYBRIDE
// Système universel pour tous types de modèles de prix
// ============================================================================

export type PricingModel = 
  | 'FLAT_RATE'        // Prix fixe
  | 'TIME_BASED'       // Basé sur le temps
  | 'PERSON_BASED'     // Par personne
  | 'DISTANCE_BASED'   // Par distance
  | 'USAGE_BASED'      // Par utilisation
  | 'HYBRID'           // Combinaison de plusieurs
  | 'PACKAGE'          // Forfait
  | 'SUBSCRIPTION'     // Abonnement
  | 'DYNAMIC';         // Prix dynamique

export interface PricingConfig {
  model: PricingModel;
  
  // Prix de base
  basePrice?: number;
  
  // Prix par unité de temps
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  
  // Prix par personne/unité
  personPrice?: number;
  unitPrice?: number;
  
  // Prix par distance
  pricePerKm?: number;
  pricePerMile?: number;
  
  // Seuils et limites
  freeKmPerDay?: number;
  freeHours?: number;
  minDuration?: number;
  maxDuration?: number;
  
  // Frais supplémentaires
  setupFee?: number;
  deliveryFee?: number;
  cancellationFee?: number;
  
  // Remises et majorations
  earlyBirdDiscount?: number;  // %
  lastMinuteSurcharge?: number; // %
  weekendSurcharge?: number;   // %
  holidaySurcharge?: number;   // %
  
  // Configuration avancée
  tieredPricing?: Array<{
    from: number;
    to: number;
    price: number;
    unit: 'hour' | 'day' | 'person' | 'km';
  }>;
  
  // Conditions d'application
  conditions?: {
    minQuantity?: number;
    maxQuantity?: number;
    timeSlots?: string[];
    daysOfWeek?: number[];
    seasonality?: 'low' | 'high' | 'peak';
  };
}

export interface BookingData {
  startDateTime?: Date;
  endDateTime?: Date;
  duration?: number; // minutes
  personCount?: number;
  distance?: number; // km
  isWeekend?: boolean;
  isHoliday?: boolean;
  isLastMinute?: boolean;
  isEarlyBird?: boolean;
  selectedOptions?: Array<{
    id: string;
    name: string;
    pricing: PricingConfig;
    quantity?: number;
  }>;
  customData?: Record<string, any>;
}

export interface PricingResult {
  baseAmount: number;
  optionsAmount: number;
  subtotal: number;
  discounts: number;
  surcharges: number;
  fees: number;
  total: number;
  breakdown: Array<{
    label: string;
    amount: number;
    type: 'base' | 'option' | 'fee' | 'discount' | 'surcharge';
    calculation?: string;
  }>;
  currency: string;
}

// ============================================================================
// MOTEUR DE CALCUL PRINCIPAL
// ============================================================================

export class PricingEngine {
  private currency: string = 'EUR';

  constructor(currency: string = 'EUR') {
    this.currency = currency;
  }

  /**
   * Calcule le prix total d'une réservation
   */
  calculatePrice(
    servicePricing: PricingConfig,
    bookingData: BookingData
  ): PricingResult {
    const result: PricingResult = {
      baseAmount: 0,
      optionsAmount: 0,
      subtotal: 0,
      discounts: 0,
      surcharges: 0,
      fees: 0,
      total: 0,
      breakdown: [],
      currency: this.currency
    };

    // 1. Calcul du prix de base
    result.baseAmount = this.calculateBasePrice(servicePricing, bookingData);
    this.addToBreakdown(result, 'Prix de base', result.baseAmount, 'base');

    // 2. Calcul des options
    if (bookingData.selectedOptions) {
      for (const option of bookingData.selectedOptions) {
        const optionPrice = this.calculateBasePrice(option.pricing, bookingData) * (option.quantity || 1);
        result.optionsAmount += optionPrice;
        this.addToBreakdown(result, option.name, optionPrice, 'option');
      }
    }

    // 3. Sous-total avant modifications
    result.subtotal = result.baseAmount + result.optionsAmount;

    // 4. Application des frais
    const fees = this.calculateFees(servicePricing, bookingData);
    result.fees = fees;
    if (fees > 0) {
      this.addToBreakdown(result, 'Frais de service', fees, 'fee');
    }

    // 5. Application des remises
    const discounts = this.calculateDiscounts(servicePricing, bookingData, result.subtotal);
    result.discounts = discounts;
    if (discounts > 0) {
      this.addToBreakdown(result, 'Remise', -discounts, 'discount');
    }

    // 6. Application des majorations
    const surcharges = this.calculateSurcharges(servicePricing, bookingData, result.subtotal);
    result.surcharges = surcharges;
    if (surcharges > 0) {
      this.addToBreakdown(result, 'Majoration', surcharges, 'surcharge');
    }

    // 7. Total final
    result.total = result.subtotal + result.fees - result.discounts + result.surcharges;

    return result;
  }

  /**
   * Calcule le prix de base selon le modèle
   */
  private calculateBasePrice(pricing: PricingConfig, booking: BookingData): number {
    switch (pricing.model) {
      case 'FLAT_RATE':
        return pricing.basePrice || 0;

      case 'TIME_BASED':
        return this.calculateTimeBased(pricing, booking);

      case 'PERSON_BASED':
        const personPrice = pricing.personPrice || 0;
        const basePrice = pricing.basePrice || 0;
        return basePrice + (personPrice * (booking.personCount || 1));

      case 'DISTANCE_BASED':
        const distancePrice = pricing.pricePerKm || 0;
        const baseDistancePrice = pricing.basePrice || 0;
        return baseDistancePrice + (distancePrice * (booking.distance || 0));

      case 'HYBRID':
        return this.calculateHybrid(pricing, booking);

      case 'PACKAGE':
        return this.calculatePackage(pricing, booking);

      case 'DYNAMIC':
        return this.calculateDynamic(pricing, booking);

      default:
        return pricing.basePrice || 0;
    }
  }

  /**
   * Calcul basé sur le temps
   */
  private calculateTimeBased(pricing: PricingConfig, booking: BookingData): number {
    let duration = booking.duration || 0; // en minutes
    
    // Si on a des dates de début/fin, calculer la durée
    if (booking.startDateTime && booking.endDateTime) {
      duration = Math.max(0, 
        (booking.endDateTime.getTime() - booking.startDateTime.getTime()) / (1000 * 60)
      );
    }

    const durationHours = duration / 60;
    const durationDays = duration / (60 * 24);

    // Choisir le meilleur tarif
    let price = 0;
    
    if (pricing.dailyRate && durationHours >= 24) {
      // Tarif journalier si plus de 24h
      price = pricing.dailyRate * Math.ceil(durationDays);
    } else if (pricing.hourlyRate) {
      // Tarif horaire
      price = pricing.hourlyRate * Math.ceil(durationHours);
    } else if (pricing.basePrice) {
      // Prix fixe
      price = pricing.basePrice;
    }

    return price;
  }

  /**
   * Calcul hybride (combinaison de plusieurs modèles)
   */
  private calculateHybrid(pricing: PricingConfig, booking: BookingData): number {
    let total = 0;

    // Prix de base
    if (pricing.basePrice) {
      total += pricing.basePrice;
    }

    // Composante temporelle
    if (pricing.hourlyRate || pricing.dailyRate) {
      total += this.calculateTimeBased(pricing, booking);
    }

    // Composante par personne
    if (pricing.personPrice && booking.personCount) {
      total += pricing.personPrice * booking.personCount;
    }

    // Composante distance
    if (pricing.pricePerKm && booking.distance) {
      // Appliquer les kilomètres gratuits
      const chargeableKm = Math.max(0, booking.distance - (pricing.freeKmPerDay || 0));
      total += pricing.pricePerKm * chargeableKm;
    }

    return total;
  }

  /**
   * Calcul forfaitaire avec paliers
   */
  private calculatePackage(pricing: PricingConfig, booking: BookingData): number {
    if (!pricing.tieredPricing) {
      return pricing.basePrice || 0;
    }

    const duration = booking.duration || 0;
    const personCount = booking.personCount || 1;

    // Trouver le bon palier
    for (const tier of pricing.tieredPricing) {
      let value = 0;
      
      switch (tier.unit) {
        case 'hour':
          value = duration / 60;
          break;
        case 'day':
          value = duration / (60 * 24);
          break;
        case 'person':
          value = personCount;
          break;
        case 'km':
          value = booking.distance || 0;
          break;
      }

      if (value >= tier.from && (tier.to === -1 || value <= tier.to)) {
        return tier.price;
      }
    }

    return pricing.basePrice || 0;
  }

  /**
   * Calcul dynamique (basé sur l'offre/demande)
   */
  private calculateDynamic(pricing: PricingConfig, booking: BookingData): number {
    let basePrice = pricing.basePrice || 0;

    // Facteurs dynamiques
    if (booking.isWeekend) {
      basePrice *= 1.2; // +20% le weekend
    }

    if (booking.isHoliday) {
      basePrice *= 1.5; // +50% les jours fériés
    }

    if (booking.isLastMinute) {
      basePrice *= 1.3; // +30% dernière minute
    }

    return Math.round(basePrice * 100) / 100;
  }

  /**
   * Calcul des frais
   */
  private calculateFees(pricing: PricingConfig, booking: BookingData): number {
    let fees = 0;

    if (pricing.setupFee) {
      fees += pricing.setupFee;
    }

    if (pricing.deliveryFee) {
      fees += pricing.deliveryFee;
    }

    return fees;
  }

  /**
   * Calcul des remises
   */
  private calculateDiscounts(pricing: PricingConfig, booking: BookingData, subtotal: number): number {
    let discounts = 0;

    if (booking.isEarlyBird && pricing.earlyBirdDiscount) {
      discounts += subtotal * (pricing.earlyBirdDiscount / 100);
    }

    return discounts;
  }

  /**
   * Calcul des majorations
   */
  private calculateSurcharges(pricing: PricingConfig, booking: BookingData, subtotal: number): number {
    let surcharges = 0;

    if (booking.isWeekend && pricing.weekendSurcharge) {
      surcharges += subtotal * (pricing.weekendSurcharge / 100);
    }

    if (booking.isHoliday && pricing.holidaySurcharge) {
      surcharges += subtotal * (pricing.holidaySurcharge / 100);
    }

    if (booking.isLastMinute && pricing.lastMinuteSurcharge) {
      surcharges += subtotal * (pricing.lastMinuteSurcharge / 100);
    }

    return surcharges;
  }

  /**
   * Ajoute une ligne au détail de facturation
   */
  private addToBreakdown(
    result: PricingResult, 
    label: string, 
    amount: number, 
    type: 'base' | 'option' | 'fee' | 'discount' | 'surcharge'
  ): void {
    result.breakdown.push({
      label,
      amount: Math.round(amount * 100) / 100,
      type
    });
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function validatePricingConfig(config: PricingConfig): string[] {
  const errors: string[] = [];

  switch (config.model) {
    case 'FLAT_RATE':
      if (!config.basePrice) {
        errors.push('Prix de base requis pour le modèle forfaitaire');
      }
      break;

    case 'TIME_BASED':
      if (!config.hourlyRate && !config.dailyRate) {
        errors.push('Tarif horaire ou journalier requis pour le modèle temporel');
      }
      break;

    case 'PERSON_BASED':
      if (!config.personPrice) {
        errors.push('Prix par personne requis pour le modèle par personne');
      }
      break;

    case 'DISTANCE_BASED':
      if (!config.pricePerKm) {
        errors.push('Prix par kilomètre requis pour le modèle par distance');
      }
      break;

    case 'HYBRID':
      if (!config.basePrice && !config.hourlyRate && !config.personPrice && !config.pricePerKm) {
        errors.push('Au moins un composant de prix requis pour le modèle hybride');
      }
      break;
  }

  return errors;
}

// ============================================================================
// EXEMPLES D'USAGE
// ============================================================================

export const PRICING_EXAMPLES = {
  restaurant: {
    model: 'PERSON_BASED' as PricingModel,
    basePrice: 0,
    personPrice: 5,
    weekendSurcharge: 10
  },

  beauty: {
    model: 'FLAT_RATE' as PricingModel,
    basePrice: 65,
    earlyBirdDiscount: 10
  },

  carRental: {
    model: 'HYBRID' as PricingModel,
    dailyRate: 35,
    pricePerKm: 0.25,
    freeKmPerDay: 200,
    weekendSurcharge: 15
  },

  legal: {
    model: 'TIME_BASED' as PricingModel,
    hourlyRate: 150,
    setupFee: 50
  }
};