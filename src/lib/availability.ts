import { addDays, format, isWithinInterval, parseISO, startOfDay, endOfDay, parse } from 'date-fns';

interface Employee {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE';
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
}

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  employeeId: string;
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

/**
 * Calcule la disponibilité d'un employé pour une période donnée
 */
export function calculateEmployeeAvailability(
  employee: Employee,
  leaves: Leave[],
  bookings: Booking[],
  startDate: Date,
  endDate: Date,
  slotDuration = 60 // en minutes
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  
  // Si l'employé n'est pas actif, pas de créneaux disponibles
  if (employee.status !== 'ACTIVE') {
    return slots;
  }

  let currentDate = startOfDay(startDate);
  
  while (currentDate <= endOfDay(endDate)) {
    const dayOfWeek = currentDate.getDay();
    const dateString = format(currentDate, 'yyyy-MM-dd');
    
    // Vérifier les horaires de travail pour ce jour
    const workSchedules = employee.schedules.filter(
      schedule => schedule.dayOfWeek === dayOfWeek && schedule.isAvailable
    );
    
    if (workSchedules.length === 0) {
      // Pas d'horaire de travail ce jour
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // Vérifier les congés approuvés
    const isOnLeave = leaves.some(leave => 
      leave.status === 'APPROVED' &&
      isWithinInterval(currentDate, {
        start: startOfDay(parseISO(leave.startDate)),
        end: endOfDay(parseISO(leave.endDate))
      })
    );
    
    if (isOnLeave) {
      // En congé ce jour
      workSchedules.forEach(schedule => {
        const scheduleSlots = generateTimeSlots(
          dateString,
          schedule.startTime,
          schedule.endTime,
          slotDuration
        );
        
        scheduleSlots.forEach(slot => {
          slots.push({
            ...slot,
            isAvailable: false,
            reason: 'En congé'
          });
        });
      });
      
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // Générer les créneaux pour chaque horaire de travail
    workSchedules.forEach(schedule => {
      const scheduleSlots = generateTimeSlots(
        dateString,
        schedule.startTime,
        schedule.endTime,
        slotDuration
      );
      
      // Vérifier les réservations existantes
      const dayBookings = bookings.filter(
        booking => booking.date === dateString && 
        booking.employeeId === employee.id &&
        (booking.status === 'CONFIRMED' || booking.status === 'PENDING')
      );
      
      scheduleSlots.forEach(slot => {
        const isBooked = dayBookings.some(booking => 
          isTimeSlotOverlapping(
            slot.startTime,
            slot.endTime,
            booking.startTime,
            booking.endTime
          )
        );
        
        slots.push({
          ...slot,
          isAvailable: !isBooked,
          reason: isBooked ? 'Réservé' : undefined
        });
      });
    });
    
    currentDate = addDays(currentDate, 1);
  }
  
  return slots;
}

/**
 * Génère des créneaux horaires pour une période donnée
 */
function generateTimeSlots(
  date: string,
  startTime: string,
  endTime: string,
  slotDuration: number
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());
  
  let current = start;
  
  while (current < end) {
    const slotStart = format(current, 'HH:mm');
    const slotEnd = format(addMinutes(current, slotDuration), 'HH:mm');
    
    // Vérifier que le créneau ne dépasse pas l'heure de fin
    if (addMinutes(current, slotDuration) <= end) {
      slots.push({
        date,
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: true
      });
    }
    
    current = addMinutes(current, slotDuration);
  }
  
  return slots;
}

/**
 * Ajoute des minutes à une date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Vérifie si deux créneaux horaires se chevauchent
 */
function isTimeSlotOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parse(start1, 'HH:mm', new Date());
  const e1 = parse(end1, 'HH:mm', new Date());
  const s2 = parse(start2, 'HH:mm', new Date());
  const e2 = parse(end2, 'HH:mm', new Date());
  
  return s1 < e2 && s2 < e1;
}

/**
 * Calcule le pourcentage de disponibilité d'un employé
 */
export function calculateAvailabilityPercentage(
  slots: AvailabilitySlot[]
): number {
  if (slots.length === 0) return 0;
  
  const availableSlots = slots.filter(slot => slot.isAvailable).length;
  return Math.round((availableSlots / slots.length) * 100);
}

/**
 * Trouve le prochain créneau disponible
 */
export function getNextAvailableSlot(
  slots: AvailabilitySlot[]
): AvailabilitySlot | null {
  const now = new Date();
  const currentDateString = format(now, 'yyyy-MM-dd');
  const currentTime = format(now, 'HH:mm');
  
  // Trier les créneaux par date et heure
  const sortedSlots = slots
    .filter(slot => slot.isAvailable)
    .filter(slot => {
      // Garder seulement les créneaux futurs
      if (slot.date > currentDateString) return true;
      if (slot.date === currentDateString && slot.startTime > currentTime) return true;
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  
  return sortedSlots[0] || null;
}

/**
 * Groupe les créneaux par date
 */
export function groupSlotsByDate(
  slots: AvailabilitySlot[]
): Record<string, AvailabilitySlot[]> {
  return slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);
}

/**
 * Calcule les statistiques de disponibilité
 */
export function getAvailabilityStats(slots: AvailabilitySlot[]) {
  const total = slots.length;
  const available = slots.filter(slot => slot.isAvailable).length;
  const booked = slots.filter(slot => slot.reason === 'Réservé').length;
  const onLeave = slots.filter(slot => slot.reason === 'En congé').length;
  
  return {
    total,
    available,
    booked,
    onLeave,
    availabilityPercentage: total > 0 ? Math.round((available / total) * 100) : 0,
    bookingPercentage: total > 0 ? Math.round((booked / total) * 100) : 0
  };
}