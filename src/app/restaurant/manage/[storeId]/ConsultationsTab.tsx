'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserCheck,
  Clock,
  Euro,
  Plus,
  Settings,
  Briefcase,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface ConsultationsTabProps {
  storeId: string;
  storeName: string;
  config: any;
  onConfigUpdate: (config: any) => void;
}

interface ConsultationType {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  requiresAppointment: boolean;
}

interface Specialist {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  availability: string[];
  hourlyRate: number;
}

export default function ConsultationsTab({ storeId, storeName, config, onConfigUpdate }: ConsultationsTabProps) {
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([
    { id: '1', name: 'Consultation initiale', description: 'Premier rendez-vous, analyse complète du dossier', duration: 60, price: 150, category: 'Juridique', requiresAppointment: true },
    { id: '2', name: 'Suivi de dossier', description: 'Point sur l\'avancement du dossier', duration: 30, price: 75, category: 'Juridique', requiresAppointment: true },
    { id: '3', name: 'Consultation urgente', description: 'Conseil juridique urgent', duration: 45, price: 200, category: 'Urgence', requiresAppointment: false },
    { id: '4', name: 'Médiation', description: 'Séance de médiation entre parties', duration: 120, price: 300, category: 'Médiation', requiresAppointment: true },
  ]);

  const [specialists, setSpecialists] = useState<Specialist[]>([
    { id: '1', name: 'Me. Jean Dupont', title: 'Avocat spécialisé', specialties: ['Droit des affaires', 'Droit commercial'], availability: ['Lundi', 'Mardi', 'Jeudi'], hourlyRate: 150 },
    { id: '2', name: 'Me. Marie Martin', title: 'Avocat senior', specialties: ['Droit de la famille', 'Droit civil'], availability: ['Mardi', 'Mercredi', 'Vendredi'], hourlyRate: 180 },
    { id: '3', name: 'Me. Pierre Bernard', title: 'Avocat associé', specialties: ['Droit pénal', 'Droit routier'], availability: ['Lundi', 'Mercredi', 'Vendredi'], hourlyRate: 200 },
  ]);

  const [settings, setSettings] = useState({
    acceptOnlineBooking: true,
    requirePrepayment: true,
    prepaymentPercentage: 30,
    videoConsultation: true,
    phoneConsultation: true,
    inPersonOnly: false,
    sendConfirmation: true,
    sendReminder: true,
    reminderHours: 24,
    cancellationHours: 48,
    requireDocuments: true,
    maxAdvanceBookingDays: 60,
  });

  const handleAddConsultationType = () => {
    toast.info('Ajout d\'un nouveau type de consultation...');
    // TODO: Ouvrir modal d'ajout
  };

  const handleAddSpecialist = () => {
    toast.info('Ajout d\'un nouveau spécialiste...');
    // TODO: Ouvrir modal d'ajout
  };

  const handleSaveSettings = () => {
    onConfigUpdate({
      consultationTypes,
      specialists,
      settings
    });
    toast.success('Configuration des consultations mise à jour');
  };

  return (
    <div className="space-y-6">
      {/* Types de consultations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Types de consultations</CardTitle>
              <CardDescription>
                Définissez les différents types de consultations proposés
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddConsultationType}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultationTypes.map((consultation) => (
              <Card key={consultation.id} className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{consultation.name}</h4>
                      <p className="text-sm text-muted-foreground">{consultation.description}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{consultation.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{consultation.price}€</span>
                    </div>
                    <Badge variant="secondary">{consultation.category}</Badge>
                  </div>
                  {consultation.requiresAppointment && (
                    <Badge variant="outline" className="mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      Sur rendez-vous
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spécialistes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Spécialistes</CardTitle>
              <CardDescription>
                Gérez les professionnels disponibles pour les consultations
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddSpecialist}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un spécialiste
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {specialists.map((specialist) => (
              <div key={specialist.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{specialist.name}</h4>
                    <p className="text-sm text-muted-foreground">{specialist.title}</p>
                    <div className="flex gap-2 mt-1">
                      {specialist.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{specialist.hourlyRate}€/h</div>
                  <div className="text-sm text-muted-foreground">
                    {specialist.availability.length} jours/semaine
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paramètres de consultation */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de consultation</CardTitle>
          <CardDescription>
            Configurez les règles et options de consultation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Réservation en ligne</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre la prise de RDV en ligne
                  </p>
                </div>
                <Switch 
                  checked={settings.acceptOnlineBooking}
                  onCheckedChange={(checked) => setSettings({...settings, acceptOnlineBooking: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Consultation vidéo</Label>
                  <p className="text-sm text-muted-foreground">
                    Proposer des consultations par vidéo
                  </p>
                </div>
                <Switch 
                  checked={settings.videoConsultation}
                  onCheckedChange={(checked) => setSettings({...settings, videoConsultation: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Consultation téléphonique</Label>
                  <p className="text-sm text-muted-foreground">
                    Proposer des consultations par téléphone
                  </p>
                </div>
                <Switch 
                  checked={settings.phoneConsultation}
                  onCheckedChange={(checked) => setSettings({...settings, phoneConsultation: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Documents requis</Label>
                  <p className="text-sm text-muted-foreground">
                    Demander des documents avant la consultation
                  </p>
                </div>
                <Switch 
                  checked={settings.requireDocuments}
                  onCheckedChange={(checked) => setSettings({...settings, requireDocuments: checked})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prépaiement requis</Label>
                  <p className="text-sm text-muted-foreground">
                    Exiger un acompte à la réservation
                  </p>
                </div>
                <Switch 
                  checked={settings.requirePrepayment}
                  onCheckedChange={(checked) => setSettings({...settings, requirePrepayment: checked})}
                />
              </div>

              {settings.requirePrepayment && (
                <div>
                  <Label>Pourcentage d'acompte</Label>
                  <Input 
                    type="number" 
                    value={settings.prepaymentPercentage}
                    onChange={(e) => setSettings({...settings, prepaymentPercentage: parseInt(e.target.value)})}
                    className="mt-1"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div>
                <Label>Délai d'annulation (heures)</Label>
                <Input 
                  type="number" 
                  value={settings.cancellationHours}
                  onChange={(e) => setSettings({...settings, cancellationHours: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Réservation max à l'avance (jours)</Label>
                <Input 
                  type="number" 
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) => setSettings({...settings, maxAdvanceBookingDays: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>
              Enregistrer les paramètres
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}