'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Mail, Phone, MapPin, Save, X, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onEmployeeAdded: () => void;
}

interface WorkSchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface EmployeeFormData {
  name: string;
  description: string;
  uniqueId: string;
  email: string;
  phone: string;
  address: string;
  schedules: WorkSchedule[];
}

export default function AddEmployeeModal({
  isOpen,
  onClose,
  storeId,
  onEmployeeAdded
}: AddEmployeeModalProps) {
  const defaultSchedules: WorkSchedule[] = [
    { day: 'Lundi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Mardi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Mercredi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Jeudi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Vendredi', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Samedi', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Dimanche', enabled: false, startTime: '09:00', endTime: '18:00' }
  ];

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    description: '',
    uniqueId: '',
    email: '',
    phone: '',
    address: '',
    schedules: defaultSchedules
  });
  const [loading, setLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/stores/${storeId}/employees`, {
        method: 'POST',
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
          isActive: true
        })
      });

      if (response.ok) {
        toast.success('Employé ajouté avec succès');
        setFormData({
          name: '',
          description: '',
          uniqueId: '',
          email: '',
          phone: '',
          address: '',
          schedules: defaultSchedules
        });
        onEmployeeAdded();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur ajout employé:', error);
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      uniqueId: '',
      email: '',
      phone: '',
      address: '',
      schedules: defaultSchedules
    });
    onClose();
  };

  const updateSchedule = (index: number, field: keyof WorkSchedule, value: any) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, schedules: newSchedules });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            Ajouter un employé
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
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
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
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
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
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
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
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
                    className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
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
                      className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
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
                      className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Planning de travail</h3>
                </div>
                
                {formData.schedules.map((schedule, index) => (
                  <div key={schedule.day} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={(checked) => updateSchedule(index, 'enabled', checked)}
                          className="data-[state=checked]:bg-blue-600"
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Ajout...' : 'Ajouter l\'employé'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}