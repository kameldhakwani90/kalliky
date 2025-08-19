'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, 
  Sparkles, 
  Home, 
  Calendar,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Euro,
  MapPin,
  Settings,
  Package,
  Users,
  Scissors,
  Heart,
  Dumbbell,
  Palette,
  Info,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onComplete: (serviceData: any) => void;
}

// Types de business prédéfinis
const BUSINESS_TYPES = [
  {
    id: 'vehicle_rental',
    name: 'Location de véhicules',
    icon: Car,
    color: 'from-blue-500 to-blue-600',
    description: 'Voitures, motos, vélos, trottinettes...',
    categories: ['Voitures', 'Deux-roues', 'Utilitaires'],
    serviceTypes: ['Location journée', 'Location weekend', 'Location semaine', 'Location longue durée']
  },
  {
    id: 'beauty_salon',
    name: 'Institut de beauté',
    icon: Sparkles,
    color: 'from-pink-500 to-pink-600',
    description: 'Soins esthétiques, épilation, manucure...',
    categories: ['Soins visage', 'Soins corps', 'Épilation', 'Manucure/Pédicure'],
    serviceTypes: ['Sur place', 'À domicile', 'Forfait mensuel']
  },
  {
    id: 'home_services',
    name: 'Services à domicile',
    icon: Home,
    color: 'from-green-500 to-green-600',
    description: 'Ménage, jardinage, bricolage, cours...',
    categories: ['Ménage', 'Jardinage', 'Bricolage', 'Cours particuliers'],
    serviceTypes: ['Intervention ponctuelle', 'Abonnement mensuel', 'Forfait annuel']
  },
  {
    id: 'health_wellness',
    name: 'Santé & Bien-être',
    icon: Heart,
    color: 'from-red-500 to-red-600',
    description: 'Massage, yoga, coaching, thérapie...',
    categories: ['Massage', 'Yoga', 'Coaching', 'Thérapie'],
    serviceTypes: ['Séance individuelle', 'Cours collectif', 'Abonnement']
  },
  {
    id: 'fitness',
    name: 'Sport & Fitness',
    icon: Dumbbell,
    color: 'from-orange-500 to-orange-600',
    description: 'Salle de sport, coach personnel, cours...',
    categories: ['Musculation', 'Cardio', 'Cours collectifs', 'Coaching'],
    serviceTypes: ['Séance', 'Abonnement mensuel', 'Carte 10 séances']
  },
  {
    id: 'custom',
    name: 'Autre activité',
    icon: Settings,
    color: 'from-gray-500 to-gray-600',
    description: 'Configurez votre activité sur mesure',
    categories: [],
    serviceTypes: []
  }
];

export default function ServiceWizard({ isOpen, onClose, storeId, onComplete }: ServiceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceData, setServiceData] = useState({
    businessType: '',
    businessTypeName: '',
    category: '',
    serviceName: '',
    serviceType: '',
    durationType: 'minutes', // minutes, hours, days, fixed
    duration: 60,
    basePrice: 0,
    hasVariants: false,
    variants: [] as any[],
    hasOptions: false,
    options: [] as any[],
    requiresAddress: false,
    maxDistance: 0,
    zones: [] as any[],
    schedule: {
      monday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
      tuesday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
      wednesday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
      thursday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
      friday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] }
    }
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(serviceData);
    onClose();
  };

  const selectedBusinessType = BUSINESS_TYPES.find(bt => bt.id === serviceData.businessType);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Quelle est votre activité ?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez le type d'activité qui correspond le mieux à votre business
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = serviceData.businessType === type.id;
                
                return (
                  <Card 
                    key={type.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-blue-500"
                    )}
                    onClick={() => setServiceData({
                      ...serviceData,
                      businessType: type.id,
                      businessTypeName: type.name
                    })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          type.color
                        )}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{type.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Catégorie de service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dans quelle catégorie se situe votre service ?
              </p>
            </div>

            {selectedBusinessType?.categories.length > 0 ? (
              <RadioGroup 
                value={serviceData.category} 
                onValueChange={(value) => setServiceData({ ...serviceData, category: value })}
              >
                <div className="space-y-2">
                  {selectedBusinessType.categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={category} id={category} />
                      <Label htmlFor={category} className="flex-1 cursor-pointer">
                        {category}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="custom" id="custom-category" />
                    <Label htmlFor="custom-category" className="flex-1 cursor-pointer">
                      Autre (personnalisé)
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            ) : (
              <div>
                <Label htmlFor="custom-category">Nom de la catégorie</Label>
                <Input
                  id="custom-category"
                  placeholder="Ex: Location de matériel"
                  value={serviceData.category}
                  onChange={(e) => setServiceData({ ...serviceData, category: e.target.value })}
                />
              </div>
            )}

            {serviceData.category === 'custom' && (
              <div className="mt-4">
                <Label htmlFor="custom-category-name">Nom personnalisé de la catégorie</Label>
                <Input
                  id="custom-category-name"
                  placeholder="Ex: Location de matériel médical"
                  onChange={(e) => setServiceData({ ...serviceData, category: e.target.value })}
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Détails du service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configurez les informations de base de votre service
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="service-name">Nom du service</Label>
                <Input
                  id="service-name"
                  placeholder="Ex: Location journée, Épilation jambes, Cours de yoga..."
                  value={serviceData.serviceName}
                  onChange={(e) => setServiceData({ ...serviceData, serviceName: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                {/* Type de durée */}
                <div>
                  <Label>Type de tarification</Label>
                  <RadioGroup 
                    value={serviceData.durationType} 
                    onValueChange={(value) => setServiceData({ 
                      ...serviceData, 
                      durationType: value,
                      // Ajuster la durée selon le type
                      duration: value === 'days' ? 1 : value === 'hours' ? 1 : value === 'fixed' ? 1 : 60
                    })}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="minutes" id="minutes" />
                        <Label htmlFor="minutes" className="flex-1 cursor-pointer">
                          <div className="font-medium">Par minutes</div>
                          <div className="text-xs text-muted-foreground">Ex: massage, consultation</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="hours" id="hours" />
                        <Label htmlFor="hours" className="flex-1 cursor-pointer">
                          <div className="font-medium">Par heures</div>
                          <div className="text-xs text-muted-foreground">Ex: cours particuliers</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="days" id="days" />
                        <Label htmlFor="days" className="flex-1 cursor-pointer">
                          <div className="font-medium">Par jours</div>
                          <div className="text-xs text-muted-foreground">Ex: location voiture</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="fixed" id="fixed" />
                        <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                          <div className="font-medium">Prix forfaitaire</div>
                          <div className="text-xs text-muted-foreground">Ex: prestation unique</div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">
                      Durée {
                        serviceData.durationType === 'days' ? '(en jours)' :
                        serviceData.durationType === 'hours' ? '(en heures)' :
                        serviceData.durationType === 'minutes' ? '(en minutes)' :
                        '(unitaire)'
                      }
                    </Label>
                    {serviceData.durationType !== 'fixed' ? (
                      <Input
                        id="duration"
                        type="number"
                        step={serviceData.durationType === 'hours' ? '0.5' : '1'}
                        placeholder={
                          serviceData.durationType === 'days' ? '1' :
                          serviceData.durationType === 'hours' ? '1.5' :
                          '60'
                        }
                        value={serviceData.duration}
                        onChange={(e) => setServiceData({ ...serviceData, duration: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <Input
                        value="1 prestation"
                        disabled
                        className="bg-gray-50"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="base-price">
                      Prix de base 
                      {serviceData.durationType === 'days' && ' (€/jour)'}
                      {serviceData.durationType === 'hours' && ' (€/heure)'}
                      {serviceData.durationType === 'minutes' && ' (€/séance)'}
                      {serviceData.durationType === 'fixed' && ' (€)'}
                    </Label>
                    <Input
                      id="base-price"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={serviceData.basePrice === 0 ? '' : serviceData.basePrice}
                      onChange={(e) => setServiceData({ 
                        ...serviceData, 
                        basePrice: e.target.value === '' ? 0 : parseFloat(e.target.value) 
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-variants"
                    checked={serviceData.hasVariants}
                    onCheckedChange={(checked) => setServiceData({ ...serviceData, hasVariants: !!checked })}
                  />
                  <Label htmlFor="has-variants" className="cursor-pointer">
                    Ce service a plusieurs variantes (ex: différents véhicules, différents soins...)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-options"
                    checked={serviceData.hasOptions}
                    onCheckedChange={(checked) => setServiceData({ ...serviceData, hasOptions: !!checked })}
                  />
                  <Label htmlFor="has-options" className="cursor-pointer">
                    Ce service a des options supplémentaires (ex: GPS, assurance, produits premium...)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires-address"
                    checked={serviceData.requiresAddress}
                    onCheckedChange={(checked) => setServiceData({ ...serviceData, requiresAddress: !!checked })}
                  />
                  <Label htmlFor="requires-address" className="cursor-pointer">
                    Service à domicile / avec déplacement
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {serviceData.hasVariants ? 'Variantes du service' : 'Options supplémentaires'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {serviceData.hasVariants 
                  ? 'Ajoutez les différentes variantes de votre service (ex: différents véhicules)'
                  : 'Ajoutez les options disponibles pour ce service'}
              </p>
            </div>

            {serviceData.hasVariants && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Variantes disponibles</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newVariant = { name: '', price: 0, description: '', available: true };
                      setServiceData({
                        ...serviceData,
                        variants: [...serviceData.variants, newVariant]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une variante
                  </Button>
                </div>

                {serviceData.variants.map((variant, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nom (ex: Renault Clio)"
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...serviceData.variants];
                            newVariants[index].name = e.target.value;
                            setServiceData({ ...serviceData, variants: newVariants });
                          }}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00 €"
                          value={variant.price === 0 ? '' : variant.price}
                          onChange={(e) => {
                            const newVariants = [...serviceData.variants];
                            newVariants[index].price = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setServiceData({ ...serviceData, variants: newVariants });
                          }}
                        />
                      </div>
                      <Input
                        placeholder="Description (optionnel)"
                        value={variant.description}
                        onChange={(e) => {
                          const newVariants = [...serviceData.variants];
                          newVariants[index].description = e.target.value;
                          setServiceData({ ...serviceData, variants: newVariants });
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}

                {serviceData.variants.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune variante ajoutée</p>
                      <p className="text-xs mt-1">Cliquez sur "Ajouter une variante" pour commencer</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {serviceData.hasOptions && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Options disponibles</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newOption = { name: '', price: 0, description: '', pricingType: 'once' }; // once, per_day, per_hour, per_unit
                      setServiceData({
                        ...serviceData,
                        options: [...serviceData.options, newOption]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une option
                  </Button>
                </div>

                {serviceData.options.map((option, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nom (ex: GPS, Livraison...)"
                          value={option.name}
                          onChange={(e) => {
                            const newOptions = [...serviceData.options];
                            newOptions[index].name = e.target.value;
                            setServiceData({ ...serviceData, options: newOptions });
                          }}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00 €"
                          value={option.price === 0 ? '' : option.price}
                          onChange={(e) => {
                            const newOptions = [...serviceData.options];
                            newOptions[index].price = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setServiceData({ ...serviceData, options: newOptions });
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Comment cette option est-elle facturée ?</Label>
                        <Select 
                          value={option.pricingType || 'once'} 
                          onValueChange={(value) => {
                            const newOptions = [...serviceData.options];
                            newOptions[index].pricingType = value;
                            setServiceData({ ...serviceData, options: newOptions });
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Une seule fois</SelectItem>
                            {serviceData.durationType === 'days' && (
                              <SelectItem value="per_day">Par jour</SelectItem>
                            )}
                            {serviceData.durationType === 'hours' && (
                              <SelectItem value="per_hour">Par heure</SelectItem>
                            )}
                            {(serviceData.durationType === 'minutes' || serviceData.durationType === 'fixed') && (
                              <SelectItem value="per_session">Par séance</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Input
                        placeholder="Description (ex: Livraison à domicile dans un rayon de 10km)"
                        value={option.description}
                        onChange={(e) => {
                          const newOptions = [...serviceData.options];
                          newOptions[index].description = e.target.value;
                          setServiceData({ ...serviceData, options: newOptions });
                        }}
                        className="text-xs"
                      />
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Ex: {option.name || 'GPS'} {' '}
                          {option.pricingType === 'once' && '= 50€ (une fois)'}
                          {option.pricingType === 'per_day' && '= 10€ × 3 jours = 30€'}
                          {option.pricingType === 'per_hour' && '= 5€ × 2h = 10€'}
                          {option.pricingType === 'per_session' && '= 10€ par séance'}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newOptions = serviceData.options.filter((_, i) => i !== index);
                            setServiceData({ ...serviceData, options: newOptions });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        if (serviceData.requiresAddress) {
          return (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Configuration des zones de déplacement</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Définissez vos zones d'intervention et les tarifs associés
                </p>
              </div>

              <div>
                <Label htmlFor="max-distance">Distance maximale (km)</Label>
                <Input
                  id="max-distance"
                  type="number"
                  placeholder="15"
                  value={serviceData.maxDistance}
                  onChange={(e) => setServiceData({ ...serviceData, maxDistance: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Zones tarifaires</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newZone = { name: '', maxDistance: 0, price: 0 };
                      setServiceData({
                        ...serviceData,
                        zones: [...serviceData.zones, newZone]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une zone
                  </Button>
                </div>

                {serviceData.zones.map((zone, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Nom (ex: Zone 1)"
                          value={zone.name}
                          onChange={(e) => {
                            const newZones = [...serviceData.zones];
                            newZones[index].name = e.target.value;
                            setServiceData({ ...serviceData, zones: newZones });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Distance max (km)"
                          value={zone.maxDistance}
                          onChange={(e) => {
                            const newZones = [...serviceData.zones];
                            newZones[index].maxDistance = parseInt(e.target.value);
                            setServiceData({ ...serviceData, zones: newZones });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Supplément (€)"
                          value={zone.price}
                          onChange={(e) => {
                            const newZones = [...serviceData.zones];
                            newZones[index].price = parseFloat(e.target.value);
                            setServiceData({ ...serviceData, zones: newZones });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {serviceData.zones.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune zone définie</p>
                      <p className="text-xs mt-1">Ajoutez des zones pour les frais de déplacement</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        }

        // Si pas de déplacement, passer directement au planning
        return renderStep6();

      case 6:
        return renderStep6();

      default:
        return null;
    }
  };

  const renderStep6 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Récapitulatif</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Vérifiez les informations avant de créer votre service
        </p>
      </div>

      <div className="space-y-3">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type d'activité</span>
              <Badge>{serviceData.businessTypeName}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Catégorie</span>
              <span className="font-medium">{serviceData.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="font-medium">{serviceData.serviceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Durée</span>
              <span className="font-medium">{serviceData.duration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prix de base</span>
              <span className="font-medium">{serviceData.basePrice}€</span>
            </div>
            {serviceData.hasVariants && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Variantes</span>
                <Badge variant="secondary">{serviceData.variants.length} variante(s)</Badge>
              </div>
            )}
            {serviceData.hasOptions && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Options</span>
                <Badge variant="secondary">{serviceData.options.length} option(s)</Badge>
              </div>
            )}
            {serviceData.requiresAddress && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service à domicile</span>
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {serviceData.maxDistance}km max
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Prochaine étape</p>
              <p className="text-xs">
                Après la création, vous pourrez configurer les horaires détaillés et ajouter d'autres services dans cette catégorie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Créer un nouveau service</DialogTitle>
          <DialogDescription>
            Étape {currentStep} sur {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !serviceData.businessType) ||
                (currentStep === 2 && !serviceData.category) ||
                (currentStep === 3 && !serviceData.serviceName)
              }
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Créer le service
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}