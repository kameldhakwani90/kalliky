'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Mail, Phone, MapPin, Save, X, Clock, Calendar, CalendarPlus, CalendarX, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkSchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface Employee {
  id: string;
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  metadata?: {
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    availability?: {
      schedules?: WorkSchedule[];
    };
  };
}

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  storeId: string;
  onUpdate: () => void;
}

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

export default function EmployeeEditModal({
  isOpen,
  onClose,
  employee,
  storeId,
  onUpdate
}: EmployeeEditModalProps) {
  const defaultSchedules: WorkSchedule[] = [
    { day: 'Lundi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Mardi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Mercredi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Jeudi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Vendredi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Samedi', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Dimanche', enabled: false, startTime: '09:00', endTime: '18:00' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    uniqueId: '',
    email: '',
    phone: '',
    address: '',
    schedules: defaultSchedules
  });
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [newLeave, setNewLeave] = useState({
    startDate: '',
    endDate: '',
    type: 'VACATION' as const,
    notes: ''
  });
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Charger les données de l'employé
  const loadEmployeeData = useCallback(async () => {
    if (!employee || !isOpen) return;
    
    try {
      setLoading(true);
      
      // Charger les congés
      const leavesResponse = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves`);
      if (leavesResponse.ok) {
        const leavesData = await leavesResponse.json();
        setLeaves(leavesData.leaves || []);
      }

      // Charger les services disponibles
      const servicesResponse = await fetch(`/api/stores/${storeId}/services`);
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setAvailableServices(servicesData.services || []);
      }

      // Charger les services assignés à l'employé depuis metadata
      const metadata = employee.metadata as any;
      const assignedServices = metadata?.assignedServices?.services || [];
      setSelectedServices(assignedServices);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, [employee, storeId, isOpen]);

  // Initialiser les données quand l'employé change
  useEffect(() => {
    if (employee && isOpen) {
      const schedules = employee.metadata?.availability?.schedules || defaultSchedules;
      setFormData({
        name: employee.name || '',
        description: employee.description || '',
        uniqueId: employee.uniqueId || '',
        email: employee.metadata?.contactInfo?.email || '',
        phone: employee.metadata?.contactInfo?.phone || '',
        address: employee.metadata?.contactInfo?.address || '',
        schedules: schedules
      });
      loadEmployeeData();
    }
  }, [employee, isOpen, loadEmployeeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          uniqueId: formData.uniqueId.trim() || null,
          contactInfo: {
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null
          },
          schedules: formData.schedules,
          selectedServices: selectedServices,
          isActive: true
        })
      });

      if (response.ok) {
        toast.success('Employé modifié avec succès');
        onUpdate();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification employé:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const updateSchedule = (index: number, field: keyof WorkSchedule, value: any) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleAddLeave = async () => {
    if (!newLeave.startDate || !newLeave.endDate) {
      toast.error('Veuillez remplir les dates de début et fin');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      });

      if (response.ok) {
        toast.success('Congé ajouté avec succès');
        setNewLeave({ startDate: '', endDate: '', type: 'VACATION', notes: '' });
        loadEmployeeData();
      } else {
        toast.error('Erreur lors de l\'ajout du congé');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout du congé');
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            Modifier l'employé
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Informations
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                Horaires
              </TabsTrigger>
              <TabsTrigger 
                value="leaves" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              >
                <CalendarX className="h-4 w-4 mr-2" />
                Congés
              </TabsTrigger>
              <TabsTrigger 
                value="skills" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              >
                <Users className="h-3 w-3 mr-2" />
                Compétences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-6">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 font-medium">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                  required
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Référence */}
                <div className="space-y-2">
                  <Label htmlFor="uniqueId" className="text-slate-300 font-medium">Référence</Label>
                  <Input
                    id="uniqueId"
                    value={formData.uniqueId}
                    onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                    placeholder="Ex: EMP001"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                {/* Description/Poste */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300 font-medium">Poste</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Cuisinier, Serveur..."
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300 font-medium">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300 font-medium">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Adresse complète..."
                      rows={2}
                      className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Planning de travail</h3>
                </div>
                
                {formData.schedules.map((schedule, index) => (
                  <div key={schedule.day} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={(checked) => updateSchedule(index, 'enabled', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                        <span className="font-medium text-white min-w-[80px]">{schedule.day}</span>
                      </div>
                      {schedule.enabled && (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          Actif
                        </Badge>
                      )}
                    </div>
                    
                    {schedule.enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Début</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Fin</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="leaves" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarPlus className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-medium text-white">Gestion des congés</h3>
                </div>

                {/* Formulaire d'ajout de congé */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-4">
                  <h4 className="text-md font-medium text-white mb-3">Ajouter un congé</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Date de début</Label>
                      <Input
                        type="date"
                        value={newLeave.startDate}
                        onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Date de fin</Label>
                      <Input
                        type="date"
                        value={newLeave.endDate}
                        onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Type de congé</Label>
                    <select
                      value={newLeave.type}
                      onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value as any })}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2"
                    >
                      {Object.entries(LEAVE_TYPES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Notes (optionnel)</Label>
                    <Textarea
                      value={newLeave.notes}
                      onChange={(e) => setNewLeave({ ...newLeave, notes: e.target.value })}
                      placeholder="Notes sur le congé..."
                      className="bg-slate-700 border-slate-600 text-white text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  <Button 
                    type="button"
                    onClick={handleAddLeave} 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le congé
                  </Button>
                </div>

                {/* Liste des congés */}
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-white">Congés existants</h4>
                  
                  {leaves.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <CalendarX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun congé enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaves.map((leave) => (
                        <div key={leave.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-3 h-3 rounded-full", LEAVE_TYPES[leave.type].color)} />
                              <div>
                                <p className="text-white font-medium">
                                  {LEAVE_TYPES[leave.type].label}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Du {new Date(leave.startDate).toLocaleDateString()} au {new Date(leave.endDate).toLocaleDateString()}
                                  {leave.notes && ` • ${leave.notes}`}
                                </p>
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
                                    type="button"
                                    size="sm"
                                    onClick={() => handleUpdateLeaveStatus(leave.id, 'APPROVED')}
                                    className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleUpdateLeaveStatus(leave.id, 'REJECTED')}
                                    className="h-6 px-2 bg-red-600 hover:bg-red-700 text-white text-xs"
                                  >
                                    ✗
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-medium text-white">Compétences et Services</h3>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-md font-medium text-white mb-3">Services assignés</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Sélectionnez les services que cet employé peut effectuer
                  </p>
                  
                  {availableServices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun service disponible</p>
                      <p className="text-xs mt-1">Créez des services dans la section "Gestion des services"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                      {availableServices.map((service) => (
                        <label 
                          key={service.id} 
                          className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, service.id]);
                              } else {
                                setSelectedServices(selectedServices.filter(id => id !== service.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {service.icon && (
                                <span className="text-lg">{service.icon}</span>
                              )}
                              <span className="text-white font-medium">{service.name}</span>
                              {service.color && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: service.color }}
                                />
                              )}
                            </div>
                            {service.description && (
                              <p className="text-xs text-slate-400">{service.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {selectedServices.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-md font-medium text-white mb-3">Services sélectionnés ({selectedServices.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map((serviceId) => {
                        const service = availableServices.find(s => s.id === serviceId);
                        return service ? (
                          <Badge 
                            key={serviceId} 
                            className="bg-purple-600 text-white flex items-center gap-2"
                          >
                            {service.icon && <span>{service.icon}</span>}
                            {service.name}
                            <button
                              type="button"
                              onClick={() => setSelectedServices(selectedServices.filter(id => id !== serviceId))}
                              className="ml-1 hover:bg-purple-700 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Boutons */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}