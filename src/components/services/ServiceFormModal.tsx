'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Users, MapPin, Clock, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceVariant {
  id: string;
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  specifications?: any;
  capacityConfig?: any;
  pricingConfig?: any;
  metadata?: any;
}

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  domaineId: string;
  initialData?: ServiceVariant | null;
  mode: 'create' | 'edit' | 'duplicate';
  onSuccess: () => void;
  domainSettings?: {
    enabledOptions?: string[];
    optionSettings?: Record<string, any>;
  };
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  domaineId,
  initialData,
  mode,
  onSuccess,
  domainSettings
}: ServiceFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(1);
  const [specifications, setSpecifications] = useState<{ [key: string]: string }>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  // États pour les options dynamiques
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState('');
  const [groupSettings, setGroupSettings] = useState({
    minCapacity: 1,
    maxCapacity: 1,
    groupPricing: false
  });
  const [durationSettings, setDurationSettings] = useState({
    availableDurations: [60], // en minutes
    customDuration: 60
  });
  const [resourceSettings, setResourceSettings] = useState({
    requiredResources: [],
    optionalResources: []
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'duplicate') && initialData) {
        setName(mode === 'duplicate' ? `${initialData.name} (Copie)` : initialData.name);
        setDescription(initialData.description || '');
        setUniqueId(mode === 'duplicate' ? '' : initialData.uniqueId || '');
        setBasePrice(initialData.pricingConfig?.basePrice || 0);
        setMaxCapacity(initialData.capacityConfig?.maxCapacity || 1);
        setSpecifications(initialData.specifications || {});
        setFeatures(initialData.specifications?.features || []);
      } else {
        // Reset for creation
        setName('');
        setDescription('');
        setUniqueId('');
        setBasePrice(0);
        setMaxCapacity(1);
        setSpecifications({});
        setFeatures([]);
      }
      setNewFeature('');
    }
  }, [isOpen, initialData, mode]);

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  // Fonctions pour les zones géographiques
  const handleAddZone = () => {
    if (newZone.trim() && !zones.includes(newZone.trim())) {
      setZones([...zones, newZone.trim()]);
      setNewZone('');
    }
  };

  const handleRemoveZone = (zone: string) => {
    setZones(zones.filter(z => z !== zone));
    setSelectedZones(selectedZones.filter(z => z !== zone));
  };

  const handleZoneSelection = (zone: string, selected: boolean) => {
    if (selected) {
      setSelectedZones([...selectedZones, zone]);
    } else {
      setSelectedZones(selectedZones.filter(z => z !== zone));
    }
  };

  // Fonctions pour durées variables
  const handleAddDuration = () => {
    const { customDuration } = durationSettings;
    if (customDuration > 0 && !durationSettings.availableDurations.includes(customDuration)) {
      setDurationSettings(prev => ({
        ...prev,
        availableDurations: [...prev.availableDurations, customDuration].sort((a, b) => a - b)
      }));
    }
  };

  const handleRemoveDuration = (duration: number) => {
    setDurationSettings(prev => ({
      ...prev,
      availableDurations: prev.availableDurations.filter(d => d !== duration)
    }));
  };

  // Vérifier si une option est activée
  const isOptionEnabled = (optionKey: string) => {
    return domainSettings?.enabledOptions?.includes(optionKey) || false;
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setSpecifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      
      const serviceData = {
        name: name.trim(),
        description: description.trim() || null,
        uniqueId: uniqueId.trim() || null,
        isActive: true,
        specifications: {
          ...specifications,
          features: features.length > 0 ? features : undefined,
          // Ajouter les zones si l'option est activée
          ...(isOptionEnabled('geographicZones') && {
            zones: selectedZones,
            availableZones: zones
          }),
          // Ajouter les durées si l'option est activée
          ...(isOptionEnabled('variableDuration') && {
            availableDurations: durationSettings.availableDurations
          })
        },
        capacityConfig: {
          // Utiliser les paramètres de groupe si l'option est activée
          maxCapacity: isOptionEnabled('collectiveSessions') 
            ? groupSettings.maxCapacity 
            : (maxCapacity || 1),
          minCapacity: isOptionEnabled('collectiveSessions') 
            ? groupSettings.minCapacity 
            : 1,
          ...(isOptionEnabled('collectiveSessions') && {
            groupPricing: groupSettings.groupPricing
          })
        },
        pricingConfig: {
          basePrice: basePrice || 0,
          currency: 'EUR'
        },
        metadata: {
          domainOptions: domainSettings?.enabledOptions || [],
          ...(isOptionEnabled('sharedResources') && {
            resourceRequirements: resourceSettings
          })
        }
      };

      let response;
      if (mode === 'edit' && initialData) {
        // Mode édition service
        response = await fetch(`/api/universal-services-extended/${domaineId}/variants/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData)
        });
      } else {
        // Mode création ou duplication service
        response = await fetch(`/api/universal-services-extended/${domaineId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData)
        });
      }

      if (response.ok) {
        const actionText = mode === 'edit' ? 'modifié' : mode === 'duplicate' ? 'dupliqué' : 'créé';
        toast.success(`Service ${actionText} avec succès`);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case 'edit': return 'Modifier le service';
      case 'duplicate': return 'Dupliquer le service';
      default: return 'Nouveau service';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du service */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du service *</Label>
            <Input
              id="name"
              placeholder="ex: Nettoyage peau classique, Clio Blanche Auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Prix */}
          <div className="space-y-2">
            <Label htmlFor="basePrice">Prix de base (€) *</Label>
            <Input
              id="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          {/* Sessions collectives - Capacité */}
          {isOptionEnabled('collectiveSessions') && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-800">Configuration groupe</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCapacity">Participants minimum</Label>
                  <Input
                    id="minCapacity"
                    type="number"
                    min="1"
                    value={groupSettings.minCapacity}
                    onChange={(e) => setGroupSettings(prev => ({
                      ...prev,
                      minCapacity: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Participants maximum</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    value={groupSettings.maxCapacity}
                    onChange={(e) => setGroupSettings(prev => ({
                      ...prev,
                      maxCapacity: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="groupPricing"
                  checked={groupSettings.groupPricing}
                  onChange={(e) => setGroupSettings(prev => ({
                    ...prev,
                    groupPricing: e.target.checked
                  }))}
                />
                <Label htmlFor="groupPricing" className="text-sm">Prix dégressif selon le nombre</Label>
              </div>
            </div>
          )}

          {/* Capacité simple si pas de sessions collectives */}
          {!isOptionEnabled('collectiveSessions') && (
            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Capacité max</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* ID Unique (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="uniqueId">Identifiant unique (optionnel)</Label>
            <Input
              id="uniqueId"
              placeholder="ex: CLIO-001, CABINE-VIP"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
            />
          </div>

          {/* Spécifications */}
          <div className="space-y-2">
            <Label>Spécifications</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Marque"
                value={specifications.brand || ''}
                onChange={(e) => handleSpecificationChange('brand', e.target.value)}
              />
              <Input
                placeholder="Modèle"
                value={specifications.model || ''}
                onChange={(e) => handleSpecificationChange('model', e.target.value)}
              />
              <Input
                placeholder="Couleur"
                value={specifications.color || ''}
                onChange={(e) => handleSpecificationChange('color', e.target.value)}
              />
              <Input
                placeholder="Catégorie"
                value={specifications.category || ''}
                onChange={(e) => handleSpecificationChange('category', e.target.value)}
              />
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="space-y-2">
            <Label>Caractéristiques</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une caractéristique..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
              />
              <Button type="button" onClick={handleAddFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feature)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Zones géographiques */}
          {isOptionEnabled('geographicZones') && (
            <div className="space-y-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-800">Zones de service</h4>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une zone (ex: Centre-ville, Banlieue...)"
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddZone())}
                />
                <Button type="button" onClick={handleAddZone} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {zones.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Zones disponibles :</Label>
                  <div className="space-y-1">
                    {zones.map((zone) => (
                      <div key={zone} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`zone-${zone}`}
                            checked={selectedZones.includes(zone)}
                            onChange={(e) => handleZoneSelection(zone, e.target.checked)}
                          />
                          <Label htmlFor={`zone-${zone}`} className="text-sm">{zone}</Label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveZone(zone)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Durées variables */}
          {isOptionEnabled('variableDuration') && (
            <div className="space-y-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium text-orange-800">Durées disponibles</h4>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="15"
                  step="15"
                  placeholder="Durée en minutes"
                  value={durationSettings.customDuration}
                  onChange={(e) => setDurationSettings(prev => ({
                    ...prev,
                    customDuration: parseInt(e.target.value) || 60
                  }))}
                />
                <Button type="button" onClick={handleAddDuration} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {durationSettings.availableDurations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {durationSettings.availableDurations.map((duration) => (
                    <Badge key={duration} variant="outline" className="text-xs">
                      {duration} min
                      <button
                        type="button"
                        onClick={() => handleRemoveDuration(duration)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ressources partagées */}
          {isOptionEnabled('sharedResources') && (
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-800">Ressources nécessaires</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Configuration des ressources disponible après sauvegarde du service
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'En cours...' : (mode === 'edit' ? 'Modifier' : mode === 'duplicate' ? 'Dupliquer' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}