// ============================================================================
// MOTEUR DE PLANIFICATION INTELLIGENT
// Système universel pour tous types de créneaux et disponibilités
// ============================================================================

import { addMinutes, addDays, startOfDay, endOfDay, format, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export type ScheduleType = 
  | 'FIXED_SLOTS'        // Créneaux fixes (restaurant)
  | 'FLEXIBLE_BOOKING'   // Réservation flexible (coiffeur)
  | 'AVAILABILITY_CHECK' // Vérification disponibilité (location)
  | 'ZONE_BASED'         // Basé sur zones géographiques
  | 'NO_SCHEDULE';       // Pas de planification

export interface WorkingHours {
  monday?: { start: string; end: string; };
  tuesday?: { start: string; end: string; };
  wednesday?: { start: string; end: string; };
  thursday?: { start: string; end: string; };
  friday?: { start: string; end: string; };
  saturday?: { start: string; end: string; };
  sunday?: { start: string; end: string; };
}

export interface SlotConfig {
  start: string;      // "12:00"
  end: string;        // "14:30"
  interval: number;   // 30 minutes
  duration: number;   // 120 minutes
  capacity?: number;  // Nombre de réservations par créneau
}

export interface BookingRules {
  advanceMin: number;        // Délai minimum en heures
  advanceMax: number;        // Délai maximum en jours
  allowSameDay: boolean;
  bufferTime?: number;       // Temps entre RDV en minutes
  maxDuration?: number;      // Durée max d'une réservation
  minDuration?: number;      // Durée min d'une réservation
  cancellationDeadline?: number; // Délai d'annulation en heures
}

export interface ServiceZone {
  id: string;
  name: string;
  coordinates?: Array<{ lat: number; lng: number; }>;
  radius?: number; // en km
  deliveryFee?: number;
  minOrder?: number;
  estimatedTime?: number; // en minutes
  isActive: boolean;
}

export interface ScheduleException {
  date: string;        // "2024-12-25"
  type: 'closed' | 'special_hours' | 'full_booking';
  specialHours?: { start: string; end: string; };
  reason?: string;
}

export interface ScheduleConfig {
  type: ScheduleType;
  workingHours: WorkingHours;
  slotConfig?: Record<string, SlotConfig>; // "lunch", "dinner", etc.
  bookingRules: BookingRules;
  exceptions?: ScheduleException[];
  serviceZones?: ServiceZone[];
}

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  available: boolean;
  capacity?: number;
  booked?: number;
  type?: string; // "lunch", "dinner", etc.
  price?: number;
}

export interface AvailabilityCheck {
  date: Date;
  isAvailable: boolean;
  reason?: string;
  alternativeSlots?: TimeSlot[];
}

// ============================================================================
// MOTEUR DE PLANIFICATION PRINCIPAL
// ============================================================================

export class ScheduleEngine {
  
  /**
   * Génère les créneaux disponibles pour une période donnée
   */
  generateAvailableSlots(
    config: ScheduleConfig,
    startDate: Date,
    endDate: Date,
    existingBookings: Array<{ start: Date; end: Date; }> = []
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    switch (config.type) {
      case 'FIXED_SLOTS':
        return this.generateFixedSlots(config, startDate, endDate, existingBookings);
      
      case 'FLEXIBLE_BOOKING':
        return this.generateFlexibleSlots(config, startDate, endDate, existingBookings);
      
      case 'AVAILABILITY_CHECK':
        return this.generateAvailabilitySlots(config, startDate, endDate, existingBookings);
      
      default:
        return [];
    }
  }

  /**
   * Génère des créneaux fixes (restaurant, médecin)
   */
  private generateFixedSlots(
    config: ScheduleConfig,
    startDate: Date,
    endDate: Date,
    existingBookings: Array<{ start: Date; end: Date; }>
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const workingHours = config.workingHours[dayOfWeek];
      
      if (!workingHours || this.isExceptionDate(currentDate, config.exceptions)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Générer les créneaux pour cette journée
      if (config.slotConfig) {
        Object.entries(config.slotConfig).forEach(([slotType, slotConfig]) => {
          const daySlots = this.generateDaySlots(
            currentDate,
            slotConfig,
            slotType,
            existingBookings
          );
          slots.push(...daySlots);
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return this.filterByBookingRules(slots, config.bookingRules);
  }

  /**
   * Génère des créneaux flexibles (coiffeur, beauté)
   */
  private generateFlexibleSlots(
    config: ScheduleConfig,
    startDate: Date,
    endDate: Date,
    existingBookings: Array<{ start: Date; end: Date; }>
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const workingHours = config.workingHours[dayOfWeek];
      
      if (!workingHours || this.isExceptionDate(currentDate, config.exceptions)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Créneaux toutes les 15 minutes par défaut
      const interval = 15;
      const startTime = this.parseTime(workingHours.start);
      const endTime = this.parseTime(workingHours.end);
      
      let currentTime = startTime;
      
      while (currentTime < endTime) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
        
        const slotEnd = addMinutes(slotStart, 60); // Durée par défaut 1h
        
        if (slotEnd.getHours() * 60 + slotEnd.getMinutes() <= endTime) {
          const isAvailable = !this.hasConflict(slotStart, slotEnd, existingBookings, config.bookingRules.bufferTime);
          
          slots.push({
            id: `${format(slotStart, 'yyyy-MM-dd-HH-mm')}`,
            start: slotStart,
            end: slotEnd,
            available: isAvailable
          });
        }
        
        currentTime += interval;
      }

      currentDate = addDays(currentDate, 1);
    }

    return this.filterByBookingRules(slots, config.bookingRules);
  }

  /**
   * Génère la disponibilité pour les services continus (location)
   */
  private generateAvailabilitySlots(
    config: ScheduleConfig,
    startDate: Date,
    endDate: Date,
    existingBookings: Array<{ start: Date; end: Date; }>
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      // Vérifier si le jour est disponible
      const isAvailable = !this.hasConflict(dayStart, dayEnd, existingBookings) && 
                         !this.isExceptionDate(currentDate, config.exceptions);
      
      slots.push({
        id: `day-${format(currentDate, 'yyyy-MM-dd')}`,
        start: dayStart,
        end: dayEnd,
        available: isAvailable
      });

      currentDate = addDays(currentDate, 1);
    }

    return slots;
  }

  /**
   * Génère les créneaux pour une journée donnée
   */
  private generateDaySlots(
    date: Date,
    slotConfig: SlotConfig,
    slotType: string,
    existingBookings: Array<{ start: Date; end: Date; }>
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startTime = this.parseTime(slotConfig.start);
    const endTime = this.parseTime(slotConfig.end);
    
    let currentTime = startTime;
    
    while (currentTime + slotConfig.duration <= endTime) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
      
      const slotEnd = addMinutes(slotStart, slotConfig.duration);
      
      // Vérifier les conflits
      const conflictingBookings = existingBookings.filter(booking =>
        this.isOverlapping(slotStart, slotEnd, booking.start, booking.end)
      );
      
      const bookedCount = conflictingBookings.length;
      const capacity = slotConfig.capacity || 1;
      const available = bookedCount < capacity;
      
      slots.push({
        id: `${slotType}-${format(slotStart, 'yyyy-MM-dd-HH-mm')}`,
        start: slotStart,
        end: slotEnd,
        available,
        capacity,
        booked: bookedCount,
        type: slotType
      });
      
      currentTime += slotConfig.interval;
    }
    
    return slots;
  }

  /**
   * Vérifie la disponibilité pour une période donnée
   */
  checkAvailability(
    config: ScheduleConfig,
    startDateTime: Date,
    endDateTime: Date,
    existingBookings: Array<{ start: Date; end: Date; }> = []
  ): AvailabilityCheck {
    
    // Vérifier les règles de base
    const now = new Date();
    const hoursInAdvance = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursInAdvance < config.bookingRules.advanceMin) {
      return {
        date: startDateTime,
        isAvailable: false,
        reason: `Réservation minimum ${config.bookingRules.advanceMin}h à l'avance`
      };
    }
    
    const daysInAdvance = hoursInAdvance / 24;
    if (daysInAdvance > config.bookingRules.advanceMax) {
      return {
        date: startDateTime,
        isAvailable: false,
        reason: `Réservation maximum ${config.bookingRules.advanceMax} jours à l'avance`
      };
    }

    // Vérifier les horaires de travail
    const dayOfWeek = this.getDayOfWeek(startDateTime);
    const workingHours = config.workingHours[dayOfWeek];
    
    if (!workingHours) {
      return {
        date: startDateTime,
        isAvailable: false,
        reason: 'Fermé ce jour-là'
      };
    }

    // Vérifier les exceptions
    if (this.isExceptionDate(startDateTime, config.exceptions)) {
      return {
        date: startDateTime,
        isAvailable: false,
        reason: 'Date exceptionnelle (fermé ou complet)'
      };
    }

    // Vérifier les conflits avec les réservations existantes
    const hasConflict = this.hasConflict(startDateTime, endDateTime, existingBookings, config.bookingRules.bufferTime);
    
    if (hasConflict) {
      // Proposer des créneaux alternatifs
      const alternativeSlots = this.generateAvailableSlots(
        config,
        startOfDay(startDateTime),
        addDays(startDateTime, 7),
        existingBookings
      ).slice(0, 5); // 5 premières alternatives
      
      return {
        date: startDateTime,
        isAvailable: false,
        reason: 'Créneau non disponible',
        alternativeSlots
      };
    }

    return {
      date: startDateTime,
      isAvailable: true
    };
  }

  /**
   * Vérifie si une zone géographique est desservie
   */
  checkZoneAvailability(
    zones: ServiceZone[],
    address: { lat: number; lng: number; }
  ): { available: boolean; zone?: ServiceZone; estimatedTime?: number; } {
    
    for (const zone of zones.filter(z => z.isActive)) {
      if (zone.coordinates && zone.coordinates.length > 0) {
        // Vérification polygone (simplifié)
        if (this.isPointInPolygon(address, zone.coordinates)) {
          return {
            available: true,
            zone,
            estimatedTime: zone.estimatedTime
          };
        }
      } else if (zone.radius) {
        // Vérification rayon (nécessiterait une vraie fonction de distance géographique)
        // Pour l'exemple, on accepte tout dans un rayon donné
        return {
          available: true,
          zone,
          estimatedTime: zone.estimatedTime
        };
      }
    }

    return { available: false };
  }

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  private getDayOfWeek(date: Date): keyof WorkingHours {
    const days: (keyof WorkingHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isExceptionDate(date: Date, exceptions?: ScheduleException[]): boolean {
    if (!exceptions) return false;
    const dateString = format(date, 'yyyy-MM-dd');
    return exceptions.some(ex => ex.date === dateString);
  }

  private hasConflict(
    startA: Date,
    endA: Date,
    bookings: Array<{ start: Date; end: Date; }>,
    bufferTime: number = 0
  ): boolean {
    return bookings.some(booking => {
      const bufferedStart = addMinutes(booking.start, -bufferTime);
      const bufferedEnd = addMinutes(booking.end, bufferTime);
      return this.isOverlapping(startA, endA, bufferedStart, bufferedEnd);
    });
  }

  private isOverlapping(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && endA > startB;
  }

  private filterByBookingRules(slots: TimeSlot[], rules: BookingRules): TimeSlot[] {
    const now = new Date();
    const minTime = addMinutes(now, rules.advanceMin * 60);
    const maxTime = addDays(now, rules.advanceMax);

    return slots.filter(slot => {
      return slot.start >= minTime && slot.start <= maxTime;
    });
  }

  private isPointInPolygon(point: { lat: number; lng: number; }, polygon: Array<{ lat: number; lng: number; }>): boolean {
    // Algorithme ray casting simplifié
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
          (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
}

// ============================================================================
// CONFIGURATIONS PRÉDÉFINIES
// ============================================================================

export const SCHEDULE_PRESETS = {
  restaurant: {
    type: 'FIXED_SLOTS' as ScheduleType,
    workingHours: {
      tuesday: { start: '11:30', end: '14:30' },
      wednesday: { start: '11:30', end: '14:30' },
      thursday: { start: '11:30', end: '14:30' },
      friday: { start: '11:30', end: '14:30' },
      saturday: { start: '11:30', end: '14:30' },
      sunday: { start: '11:30', end: '14:30' }
    },
    slotConfig: {
      lunch: { start: '12:00', end: '14:30', interval: 30, duration: 120, capacity: 10 },
      dinner: { start: '19:00', end: '22:00', interval: 30, duration: 120, capacity: 10 }
    },
    bookingRules: {
      advanceMin: 1,
      advanceMax: 30,
      allowSameDay: true,
      cancellationDeadline: 2
    }
  },

  beauty: {
    type: 'FLEXIBLE_BOOKING' as ScheduleType,
    workingHours: {
      monday: { start: '09:00', end: '19:00' },
      tuesday: { start: '09:00', end: '19:00' },
      wednesday: { start: '09:00', end: '19:00' },
      thursday: { start: '09:00', end: '19:00' },
      friday: { start: '09:00', end: '19:00' },
      saturday: { start: '09:00', end: '17:00' }
    },
    bookingRules: {
      advanceMin: 2,
      advanceMax: 60,
      allowSameDay: false,
      bufferTime: 15,
      cancellationDeadline: 24
    }
  },

  car_rental: {
    type: 'AVAILABILITY_CHECK' as ScheduleType,
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
      advanceMin: 1,
      advanceMax: 180,
      allowSameDay: true,
      minDuration: 1440, // 1 jour en minutes
      maxDuration: 129600 // 90 jours en minutes
    }
  }
};