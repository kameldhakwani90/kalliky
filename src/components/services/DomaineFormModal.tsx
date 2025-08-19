'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface UniversalService {
  id: string;
  name: string;
  description?: string;
  pattern: string;
  isActive: boolean;
  settings: any;
}

interface DomaineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  initialData?: UniversalService | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

// Options de configuration disponibles
const DOMAIN_OPTIONS = [
  { 
    key: 'geographicZones', 
    label: 'Zones géographiques', 
    description: 'Service avec déplacement ou zones spécifiques',
    fields: ['zones', 'travelFee', 'radius']
  },
  { 
    key: 'collectiveSessions', 
    label: 'Sessions collectives', 
    description: 'Plusieurs participants par créneau',
    fields: ['maxCapacity', 'minCapacity', 'groupPricing']
  },
  { 
    key: 'sharedResources', 
    label: 'Ressources partagées', 
    description: 'Équipements, salles ou outils spécifiques',
    fields: ['resources', 'resourceConflicts']
  },
  { 
    key: 'variableDuration', 
    label: 'Durées variables', 
    description: 'Différentes durées selon le service',
    fields: ['minDuration', 'maxDuration', 'durationSteps']
  },
  { 
    key: 'advancedPricing', 
    label: 'Tarification avancée', 
    description: 'Prix dégressifs, forfaits, promotions',
    fields: ['pricingRules', 'discounts', 'packages']
  },
  { 
    key: 'timeSlots', 
    label: 'Créneaux fixes', 
    description: 'Horaires fixes prédéfinis vs flexibles',
    fields: ['fixedSlots', 'slotDuration', 'bufferTime']
  }
];

export default function DomaineFormModal({
  isOpen,
  onClose,
  storeId,
  initialData,
  mode,
  onSuccess
}: DomaineFormModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [basePrice, setBasePrice] = useState(initialData?.settings?.basePrice || 0);
  const [duration, setDuration] = useState(initialData?.settings?.duration || 60);
  const [durationType, setDurationType] = useState(initialData?.settings?.durationType || 'minutes');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    initialData?.settings?.enabledOptions || []
  );
  const [optionSettings, setOptionSettings] = useState<Record<string, any>>(
    initialData?.settings?.optionSettings || {}
  );
  const [loading, setLoading] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setBasePrice(initialData.settings?.basePrice || 0);
        setDuration(initialData.settings?.duration || 60);
        setDurationType(initialData.settings?.durationType || 'minutes');
        setSelectedOptions(initialData.settings?.enabledOptions || []);
        setOptionSettings(initialData.settings?.optionSettings || {});
      } else {
        // Reset for creation
        setName('');
        setDescription('');
        setBasePrice(0);
        setDuration(60);
        setDurationType('minutes');
        setSelectedOptions([]);
        setOptionSettings({});
      }
    }
  }, [isOpen, initialData, mode]);

  const handleOptionChange = (optionKey: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionKey]);
    } else {
      setSelectedOptions(prev => prev.filter(key => key !== optionKey));
      // Supprimer les paramètres de cette option
      setOptionSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[optionKey];
        return newSettings;
      });
    }
  };

  const handleOptionSettingChange = (optionKey: string, settingKey: string, value: any) => {
    setOptionSettings(prev => ({
      ...prev,
      [optionKey]: {
        ...prev[optionKey],
        [settingKey]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      
      const domaineData = {
        name: name.trim(),
        description: description.trim() || null,
        pattern: 'CONFIGURABLE',
        isActive: true,
        settings: {
          basePrice: basePrice || 0,
          duration: duration || 60,
          durationType,
          businessType: 'custom',
          category: name.trim(),
          enabledOptions: selectedOptions,
          optionSettings: optionSettings
        }
      };

      let response;
      if (mode === 'edit' && initialData) {
        // Mode édition domaine
        response = await fetch(`/api/universal-services/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(domaineData)
        });
      } else {
        // Mode création domaine
        response = await fetch('/api/universal-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...domaineData,
            storeId
          })
        });
      }

      if (response.ok) {
        toast.success(mode === 'edit' ? 'Domaine modifié avec succès' : 'Domaine créé avec succès');
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

  const renderOptionSettings = (option: typeof DOMAIN_OPTIONS[0]) => {
    const settings = optionSettings[option.key] || {};
    
    switch (option.key) {
      case 'geographicZones':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Rayon d'action (km)</Label>
              <Input
                type="number"
                min="1"
                placeholder="ex: 10"
                value={settings.radius || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'radius', parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Frais de déplacement (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="ex: 5.5"
                value={settings.travelFee || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'travelFee', parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
        );
        
      case 'collectiveSessions':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Capacité minimum</Label>
              <Input
                type="number"
                min="1"
                placeholder="ex: 2"
                value={settings.minCapacity || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'minCapacity', parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Capacité maximum</Label>
              <Input
                type="number"
                min="1"
                placeholder="ex: 15"
                value={settings.maxCapacity || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'maxCapacity', parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
          </div>
        );
        
      case 'variableDuration':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Durée min (min)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                placeholder="ex: 30"
                value={settings.minDuration || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'minDuration', parseInt(e.target.value) || 15)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Durée max (min)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                placeholder="ex: 120"
                value={settings.maxDuration || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'maxDuration', parseInt(e.target.value) || 60)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Pas (min)</Label>
              <Input
                type="number"
                min="5"
                step="5"
                placeholder="ex: 15"
                value={settings.durationSteps || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'durationSteps', parseInt(e.target.value) || 15)}
                className="h-8"
              />
            </div>
          </div>
        );
        
      case 'timeSlots':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Durée des créneaux (min)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                placeholder="ex: 60"
                value={settings.slotDuration || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'slotDuration', parseInt(e.target.value) || 60)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Temps de battement (min)</Label>
              <Input
                type="number"
                min="0"
                step="5"
                placeholder="ex: 15"
                value={settings.bufferTime || ''}
                onChange={(e) => handleOptionSettingChange(option.key, 'bufferTime', parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <p className="text-xs text-muted-foreground">
            Configuration disponible après sauvegarde
          </p>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Modifier le domaine' : 'Nouveau domaine'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du domaine */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du domaine *</Label>
            <Input
              id="name"
              placeholder="ex: Soins du visage, Épilation, Location véhicules"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description du domaine</Label>
            <Textarea
              id="description"
              placeholder="Description du domaine d'activité..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Options de configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Options de configuration</Label>
            <div className="grid grid-cols-1 gap-3">
              {DOMAIN_OPTIONS.map((option) => (
                <div key={option.key} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={option.key}
                      checked={selectedOptions.includes(option.key)}
                      onCheckedChange={(checked) => handleOptionChange(option.key, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={option.key} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Configuration spécifique à l'option */}
                  {selectedOptions.includes(option.key) && (
                    <div className="ml-6 p-3 bg-gray-50 rounded-lg space-y-2">
                      {renderOptionSettings(option)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prix de base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Prix de base (€)</Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Durée */}
            <div className="space-y-2">
              <Label htmlFor="duration">Durée</Label>
              <div className="flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="flex-1"
                />
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">min</SelectItem>
                    <SelectItem value="hours">h</SelectItem>
                    <SelectItem value="days">jour(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (mode === 'edit' ? 'Modification...' : 'Création...') : (mode === 'edit' ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}