'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Calendar, 
  CalendarPlus, 
  CalendarX,
  Users,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEmployeeAvailability } from '@/hooks/useEmployeeAvailability';

interface Employee {
  id: string;
  name: string;
  description?: string;
  uniqueId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE';
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    notes?: string;
  }>;
  assignments: Array<{
    id: string;
    variant: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
      };
    };
  }>;
}

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface WorkSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

interface EmployeePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  storeId: string;
  onUpdate: () => void;
}

const DAYS_OF_WEEK = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

const LEAVE_TYPES = {
  VACATION: { label: 'Congés payés', color: 'bg-blue-500' },
  SICK: { label: 'Arrêt maladie', color: 'bg-red-500' },
  PERSONAL: { label: 'Congé personnel', color: 'bg-yellow-500' },
  OTHER: { label: 'Autre', color: 'bg-gray-500' }
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500'
};

export default function EmployeePlanningModal({
  isOpen,
  onClose,
  employee,
  storeId,
  onUpdate
}: EmployeePlanningModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [newLeave, setNewLeave] = useState({
    startDate: '',
    endDate: '',
    type: 'VACATION' as const,
    notes: ''
  });
  const [editingInfo, setEditingInfo] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    name: employee.name,
    description: employee.description || '',
    uniqueId: employee.uniqueId || '',
    email: employee.contactInfo?.email || '',
    phone: employee.contactInfo?.phone || '',
    address: employee.contactInfo?.address || ''
  });

  const loadEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les horaires depuis l'API
      const schedulesResponse = await fetch(`/api/stores/${storeId}/employees/${employee.id}/schedules`);
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules || []);
      }
      
      // Charger les congés
      const leavesResponse = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves`);
      if (leavesResponse.ok) {
        const leavesData = await leavesResponse.json();
        setLeaves(leavesData.leaves || []);
      }

      // Charger les services disponibles pour assignment
      const servicesResponse = await fetch(`/api/stores/${storeId}/services`);
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setAvailableServices(servicesData.services || []);
      }
    } catch (error) {
      console.error('Erreur chargement données employé:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [storeId, employee.id]);

  useEffect(() => {
    if (isOpen && employee?.id) {
      loadEmployeeData();
    }
  }, [isOpen, employee?.id, loadEmployeeData]);

  // Transformer l'employé pour le hook de disponibilité
  const transformedEmployee = useMemo(() => ({
    id: employee.id,
    status: employee.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
    schedules: schedules // Utiliser les schedules chargés depuis l'API
  }), [employee.id, employee.isActive, schedules]);

  // Hook pour la gestion de la disponibilité
  const {
    availability,
    loading: availabilityLoading,
    getAvailabilityPercentage,
    getNextAvailable,
    getStats,
    getSlotsByDate,
    getTodayAvailability,
    refresh: refreshAvailability
  } = useEmployeeAvailability({
    employee: transformedEmployee,
    storeId,
    daysAhead: 14,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  const handleSaveSchedule = async (schedule: WorkSchedule) => {
    try {
      const method = schedule.id ? 'PUT' : 'POST';
      const url = schedule.id 
        ? `/api/stores/${storeId}/employees/${employee.id}/schedules/${schedule.id}`
        : `/api/stores/${storeId}/employees/${employee.id}/schedules`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });

      if (response.ok) {
        toast.success('Horaire sauvegardé');
        setEditingSchedule(null);
        loadEmployeeData();
        onUpdate();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Supprimer cet horaire ?')) return;

    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Horaire supprimé');
        loadEmployeeData();
        onUpdate();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddLeave = async () => {
    if (!newLeave.startDate || !newLeave.endDate) {
      toast.error('Veuillez remplir les dates');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      });

      if (response.ok) {
        toast.success('Congé ajouté');
        setNewLeave({ startDate: '', endDate: '', type: 'VACATION', notes: '' });
        loadEmployeeData();
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Congé ${status === 'APPROVED' ? 'approuvé' : 'refusé'}`);
        loadEmployeeData();
      } else {
        toast.error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleSaveEmployeeInfo = async () => {
    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: employeeInfo.name,
          description: employeeInfo.description,
          uniqueId: employeeInfo.uniqueId,
          contactInfo: {
            email: employeeInfo.email,
            phone: employeeInfo.phone,
            address: employeeInfo.address
          }
        })
      });

      if (response.ok) {
        toast.success('Informations mises à jour');
        setEditingInfo(false);
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            Planning de {employee.name}
            {employee.uniqueId && (
              <Badge variant="outline">{employee.uniqueId}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="schedule">Horaires</TabsTrigger>
            <TabsTrigger value="leaves">Congés</TabsTrigger>
            <TabsTrigger value="assignments">Services</TabsTrigger>
            <TabsTrigger value="availability">Disponibilité</TabsTrigger>
          </TabsList>

          {/* Onglet Informations */}
          <TabsContent value="info" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Informations générales</h3>
              {!editingInfo ? (
                <Button onClick={() => setEditingInfo(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveEmployeeInfo}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingInfo(false);
                      setEmployeeInfo({
                        name: employee.name,
                        description: employee.description || '',
                        uniqueId: employee.uniqueId || '',
                        email: employee.contactInfo?.email || '',
                        phone: employee.contactInfo?.phone || '',
                        address: employee.contactInfo?.address || ''
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label>Nom complet</Label>
                {editingInfo ? (
                  <Input
                    value={employeeInfo.name}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, name: e.target.value })}
                    placeholder="Nom de l'employé"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border">{employee.name}</div>
                )}
              </div>

              {/* Référence */}
              <div className="space-y-2">
                <Label>Référence employé</Label>
                {editingInfo ? (
                  <Input
                    value={employeeInfo.uniqueId}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, uniqueId: e.target.value })}
                    placeholder="Ex: EMP001"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border">{employee.uniqueId || 'Non défini'}</div>
                )}
              </div>

              {/* Description/Poste */}
              <div className="space-y-2">
                <Label>Poste/Description</Label>
                {editingInfo ? (
                  <Textarea
                    value={employeeInfo.description}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, description: e.target.value })}
                    placeholder="Description du poste..."
                    rows={2}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border min-h-[60px]">
                    {employee.description || 'Non défini'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                {editingInfo ? (
                  <Input
                    type="email"
                    value={employeeInfo.email}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, email: e.target.value })}
                    placeholder="email@exemple.com"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border">
                    {employee.contactInfo?.email || 'Non défini'}
                  </div>
                )}
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label>Téléphone</Label>
                {editingInfo ? (
                  <Input
                    type="tel"
                    value={employeeInfo.phone}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border">
                    {employee.contactInfo?.phone || 'Non défini'}
                  </div>
                )}
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label>Adresse</Label>
                {editingInfo ? (
                  <Textarea
                    value={employeeInfo.address}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, address: e.target.value })}
                    placeholder="Adresse complète..."
                    rows={2}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border min-h-[60px]">
                    {employee.contactInfo?.address || 'Non défini'}
                  </div>
                )}
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={employee.isActive ? "default" : "secondary"}>
                    {employee.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {employee.isActive ? 'Employé disponible pour le travail' : 'Employé actuellement indisponible'}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Horaires */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Horaires de travail</h3>
              <Button
                onClick={() => setEditingSchedule({
                  dayOfWeek: 1,
                  startTime: '09:00',
                  endTime: '17:00',
                  isAvailable: true,
                  notes: ''
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un horaire
              </Button>
            </div>

            <div className="grid gap-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const daySchedules = schedules.filter(s => s.dayOfWeek === index);
                
                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {daySchedules.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Pas d'horaire configuré
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {daySchedules.map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                                <Badge variant={schedule.isAvailable ? "default" : "secondary"}>
                                  {schedule.isAvailable ? 'Disponible' : 'Indisponible'}
                                </Badge>
                                {schedule.notes && (
                                  <span className="text-sm text-muted-foreground">
                                    {schedule.notes}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSchedule(schedule)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => schedule.id && handleDeleteSchedule(schedule.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Modal d'édition d'horaire */}
            {editingSchedule && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-96">
                  <CardHeader>
                    <CardTitle>
                      {editingSchedule.id ? 'Modifier l\'horaire' : 'Nouvel horaire'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Jour</Label>
                      <select 
                        value={editingSchedule.dayOfWeek}
                        onChange={(e) => setEditingSchedule({
                          ...editingSchedule,
                          dayOfWeek: parseInt(e.target.value)
                        })}
                        className="w-full p-2 border rounded"
                      >
                        {DAYS_OF_WEEK.map((day, index) => (
                          <option key={index} value={index}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Heure début</Label>
                        <Input
                          type="time"
                          value={editingSchedule.startTime}
                          onChange={(e) => setEditingSchedule({
                            ...editingSchedule,
                            startTime: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Heure fin</Label>
                        <Input
                          type="time"
                          value={editingSchedule.endTime}
                          onChange={(e) => setEditingSchedule({
                            ...editingSchedule,
                            endTime: e.target.value
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        placeholder="Notes optionnelles..."
                        value={editingSchedule.notes || ''}
                        onChange={(e) => setEditingSchedule({
                          ...editingSchedule,
                          notes: e.target.value
                        })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={editingSchedule.isAvailable}
                        onChange={(e) => setEditingSchedule({
                          ...editingSchedule,
                          isAvailable: e.target.checked
                        })}
                      />
                      <Label htmlFor="isAvailable">Disponible pour les réservations</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleSaveSchedule(editingSchedule)}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingSchedule(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Onglet Congés */}
          <TabsContent value="leaves" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestion des congés</h3>
            </div>

            {/* Formulaire d'ajout de congé */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nouveau congé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date début</Label>
                    <Input
                      type="date"
                      value={newLeave.startDate}
                      onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date fin</Label>
                    <Input
                      type="date"
                      value={newLeave.endDate}
                      onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={newLeave.type}
                      onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value as any })}
                      className="w-full p-2 border rounded"
                    >
                      {Object.entries(LEAVE_TYPES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Raison, commentaires..."
                      value={newLeave.notes}
                      onChange={(e) => setNewLeave({ ...newLeave, notes: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleAddLeave} className="w-full">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Ajouter le congé
                </Button>
              </CardContent>
            </Card>

            {/* Liste des congés */}
            <div className="space-y-3">
              <h4 className="font-medium">Congés programmés</h4>
              {leaves.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun congé programmé
                </div>
              ) : (
                <div className="space-y-2">
                  {leaves.map((leave) => (
                    <Card key={leave.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", LEAVE_TYPES[leave.type].color)} />
                            <div>
                              <div className="font-medium">
                                {LEAVE_TYPES[leave.type].label}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Du {new Date(leave.startDate).toLocaleDateString()} au {new Date(leave.endDate).toLocaleDateString()}
                                {leave.notes && ` • ${leave.notes}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={cn("text-white", STATUS_COLORS[leave.status])}
                            >
                              {leave.status === 'PENDING' ? 'En attente' : 
                               leave.status === 'APPROVED' ? 'Approuvé' : 'Refusé'}
                            </Badge>
                            {leave.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateLeaveStatus(leave.id, 'APPROVED')}
                                  className="h-7"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateLeaveStatus(leave.id, 'REJECTED')}
                                  className="h-7"
                                >
                                  Refuser
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Services assignés */}
          <TabsContent value="assignments" className="space-y-4">
            <h3 className="text-lg font-semibold">Services assignés</h3>
            
            {/* Services disponibles pour assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {availableServices.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucun service disponible
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableServices.map((service) => (
                      <div key={service.id} className="space-y-2">
                        <div className="font-medium">{service.name}</div>
                        {service.variants && service.variants.length > 0 && (
                          <div className="pl-4 space-y-2">
                            {service.variants.map((variant: any) => {
                              const isAssigned = employee.assignments.some(a => a.variant.id === variant.id);
                              return (
                                <div key={variant.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`variant-${variant.id}`}
                                    checked={isAssigned}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        // TODO: Assigner le service
                                        toast.info('Assignment de service - À implémenter');
                                      } else {
                                        // TODO: Retirer l'assignment
                                        toast.info('Retrait d\'assignment - À implémenter');
                                      }
                                    }}
                                  />
                                  <label htmlFor={`variant-${variant.id}`} className="text-sm">
                                    {variant.name}
                                  </label>
                                  {isAssigned && (
                                    <Badge variant="outline" className="text-xs">Assigné</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services actuellement assignés */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services actuellement assignés</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.assignments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucun service assigné
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {employee.assignments.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{assignment.variant.service.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Variante: {assignment.variant.name}
                              </div>
                            </div>
                            <Badge variant="default">Assigné</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Disponibilité */}
          <TabsContent value="availability" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Disponibilité temps réel</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshAvailability}
                disabled={availabilityLoading}
              >
                {availabilityLoading ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>

            {/* Statistiques globales */}
            {(() => {
              const stats = getStats();
              const availabilityPercentage = getAvailabilityPercentage();
              const nextAvailable = getNextAvailable();
              const todaySlots = getTodayAvailability();

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Disponibilité globale</p>
                          <p className="text-2xl font-bold text-green-600">{availabilityPercentage}%</p>
                        </div>
                        <Calendar className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                          <p className="text-2xl font-bold">
                            {todaySlots.filter(s => s.isAvailable).length}/{todaySlots.length}
                          </p>
                          <p className="text-xs text-muted-foreground">créneaux libres</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Prochain créneau</p>
                          {nextAvailable ? (
                            <div>
                              <p className="font-medium">{nextAvailable.date}</p>
                              <p className="text-sm text-muted-foreground">
                                {nextAvailable.startTime} - {nextAvailable.endTime}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aucun créneau libre</p>
                          )}
                        </div>
                        <MapPin className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Calendrier détaillé */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calendrier des 14 prochains jours</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const slotsByDate = getSlotsByDate();
                  const dates = Object.keys(slotsByDate).sort();

                  return (
                    <div className="space-y-3">
                      {dates.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4" />
                          <p>Aucun créneau configuré</p>
                        </div>
                      ) : (
                        dates.map(date => {
                          const dateSlots = slotsByDate[date];
                          const availableSlots = dateSlots.filter(s => s.isAvailable);
                          const bookedSlots = dateSlots.filter(s => s.reason === 'Réservé');
                          const leaveSlots = dateSlots.filter(s => s.reason === 'En congé');

                          return (
                            <div key={date} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium">
                                    {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long'
                                    })}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {availableSlots.length} libre{availableSlots.length > 1 ? 's' : ''} • 
                                    {bookedSlots.length} réservé{bookedSlots.length > 1 ? 's' : ''} • 
                                    {leaveSlots.length} congé{leaveSlots.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                                <Badge 
                                  variant={availableSlots.length > 0 ? "default" : "secondary"}
                                  className={cn(
                                    availableSlots.length > 0 ? "bg-green-500" : "bg-gray-400"
                                  )}
                                >
                                  {Math.round((availableSlots.length / dateSlots.length) * 100)}%
                                </Badge>
                              </div>

                              <div className="grid grid-cols-6 gap-1">
                                {dateSlots.map((slot, index) => (
                                  <div
                                    key={index}
                                    className={cn(
                                      "p-1 rounded text-xs text-center",
                                      slot.isAvailable 
                                        ? "bg-green-100 text-green-800 border border-green-200" 
                                        : slot.reason === 'Réservé'
                                        ? "bg-red-100 text-red-800 border border-red-200"
                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                    )}
                                    title={`${slot.startTime}-${slot.endTime}${slot.reason ? ` (${slot.reason})` : ''}`}
                                  >
                                    {slot.startTime}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}