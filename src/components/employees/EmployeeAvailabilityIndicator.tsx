'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployeeAvailability } from '@/hooks/useEmployeeAvailability';

interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
}

interface EmployeeAvailabilityIndicatorProps {
  employee: Employee;
  storeId: string;
  showDetailed?: boolean;
}

export default function EmployeeAvailabilityIndicator({
  employee,
  storeId,
  showDetailed = true
}: EmployeeAvailabilityIndicatorProps) {
  const [showPopover, setShowPopover] = useState(false);

  const {
    availability,
    loading,
    getAvailabilityPercentage,
    getNextAvailable,
    getTodayAvailability,
    getStats
  } = useEmployeeAvailability({
    employee,
    storeId,
    daysAhead: 7
  });

  if (!employee || !employee.isActive) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-xs text-muted-foreground">Inactif</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <span className="text-xs text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  const availabilityPercentage = getAvailabilityPercentage();
  const nextAvailable = getNextAvailable();
  const todaySlots = getTodayAvailability();
  const stats = getStats();

  const getStatusColor = () => {
    if (availabilityPercentage >= 70) return 'bg-green-500';
    if (availabilityPercentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (availabilityPercentage >= 70) return 'Très disponible';
    if (availabilityPercentage >= 40) return 'Moyennement disponible';
    return 'Peu disponible';
  };

  if (!showDetailed) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
        <span className="text-xs text-muted-foreground">
          {availabilityPercentage}%
        </span>
      </div>
    );
  }

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
            <Badge variant="outline" className="text-xs">
              {availabilityPercentage}% libre
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="right">
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <p className="font-medium">{employee.name}</p>
              <p className="text-xs text-muted-foreground">{getStatusText()}</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Disponibilité (7 jours)</span>
              <span>{availabilityPercentage}%</span>
            </div>
            <Progress value={availabilityPercentage} className="h-2" />
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-green-600" />
              <span>{stats.available} créneaux libres</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-red-600" />
              <span>{stats.booked} réservés</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-gray-600" />
              <span>{stats.onLeave} congés</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-blue-600" />
              <span>{stats.total} total</span>
            </div>
          </div>

          {/* Aujourd'hui */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium mb-1">Aujourd'hui</p>
            {todaySlots.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {todaySlots.filter(s => s.isAvailable).length}/{todaySlots.length} créneaux libres
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Pas d'horaires configurés</div>
            )}
          </div>

          {/* Prochain créneau libre */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium mb-1">Prochain créneau libre</p>
            {nextAvailable ? (
              <div className="text-xs">
                <p className="font-medium">{nextAvailable.date}</p>
                <p className="text-muted-foreground">
                  {nextAvailable.startTime} - {nextAvailable.endTime}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Aucun créneau disponible</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}