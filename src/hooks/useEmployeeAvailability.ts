import { useState, useEffect, useCallback } from 'react';
import { 
  calculateEmployeeAvailability, 
  calculateAvailabilityPercentage,
  getNextAvailableSlot,
  getAvailabilityStats,
  groupSlotsByDate,
  AvailabilitySlot 
} from '@/lib/availability';

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

interface UseEmployeeAvailabilityOptions {
  employee: Employee;
  storeId: string;
  daysAhead?: number;
  slotDuration?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useEmployeeAvailability({
  employee,
  storeId,
  daysAhead = 7,
  slotDuration = 60,
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes
}: UseEmployeeAvailabilityOptions) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [leaves, setLeaves] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fonction pour charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les congés
      const leavesResponse = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves`);
      if (!leavesResponse.ok) throw new Error('Erreur chargement congés');
      const leavesData = await leavesResponse.json();

      // Charger les réservations
      const bookingsResponse = await fetch(`/api/stores/${storeId}/employees/${employee.id}/bookings`);
      if (!bookingsResponse.ok) throw new Error('Erreur chargement réservations');
      const bookingsData = await bookingsResponse.json();

      setLeaves(leavesData.leaves || []);
      setBookings(bookingsData.bookings || []);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Erreur chargement données disponibilité:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [storeId, employee.id]);

  // Calculer la disponibilité quand les données changent
  useEffect(() => {
    if (employee && leaves && bookings) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const slots = calculateEmployeeAvailability(
        employee,
        leaves,
        bookings,
        startDate,
        endDate,
        slotDuration
      );

      setAvailability(slots);
    }
  }, [employee, leaves, bookings, daysAhead, slotDuration]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadData]);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fonctions utilitaires
  const getAvailabilityPercentage = useCallback(() => {
    return calculateAvailabilityPercentage(availability);
  }, [availability]);

  const getNextAvailable = useCallback(() => {
    return getNextAvailableSlot(availability);
  }, [availability]);

  const getStats = useCallback(() => {
    return getAvailabilityStats(availability);
  }, [availability]);

  const getSlotsByDate = useCallback(() => {
    return groupSlotsByDate(availability);
  }, [availability]);

  const getTodayAvailability = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return availability.filter(slot => slot.date === today);
  }, [availability]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    // Données
    availability,
    leaves,
    bookings,
    lastUpdated,
    
    // État
    loading,
    error,
    
    // Fonctions utilitaires
    getAvailabilityPercentage,
    getNextAvailable,
    getStats,
    getSlotsByDate,
    getTodayAvailability,
    refresh
  };
}