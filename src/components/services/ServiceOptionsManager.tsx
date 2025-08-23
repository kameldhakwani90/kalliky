'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Euro,
  Users,
  Clock,
  Calendar,
  Settings,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BusinessConfig } from '@/lib/constants/business-configs';

interface ServiceOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceType: 'FIXED' | 'PER_PERSON' | 'PER_DAY' | 'PER_HOUR';
  isActive: boolean;
  orderIndex: number;
  metadata?: any;
  optionResources?: Array<{
    id: string;
    resourceType: 'EMPLOYEE' | 'EQUIPMENT';
    resourceId: string;
    isRequired: boolean;
    constraints?: any;
    resourceDetail?: {
      name: string;
      type: string;
    };
  }>;
}

interface ServiceOptionsManagerProps {
  storeId: string;
  serviceId?: string;
  wording: {
    products: string;
    equipment: string;
    staff: string;
    options: string;
  };
  businessConfig?: BusinessConfig;
}

const PRICE_TYPE_LABELS = {
  FIXED: 'Prix fixe',
  PER_PERSON: 'Par personne',
  PER_DAY: 'Par jour',
  PER_HOUR: 'Par heure'
};

const PRICE_TYPE_ICONS = {
  FIXED: Euro,
  PER_PERSON: Users,
  PER_DAY: Calendar,
  PER_HOUR: Clock
};

export default function ServiceOptionsManager({
  storeId,
  serviceId,
  wording,
  businessConfig
}: ServiceOptionsManagerProps) {
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOption, setEditingOption] = useState<ServiceOption | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Charger les options existantes
  useEffect(() => {
    if (serviceId && serviceId !== 'temp') {
      loadOptions();
    }
  }, [serviceId]);

  const loadOptions = async () => {
    if (!serviceId || serviceId === 'temp') return;

    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}/additional-options`);
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setOptions(data.options || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (option: ServiceOption) => {
    if (!confirm(`Supprimer l'option "${option.name}" ?`)) return;

    try {
      const response = await fetch(`/api/services/${serviceId}/additional-options/${option.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur suppression');
      
      toast.success('Option supprimée');
      loadOptions();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (option: ServiceOption) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/additional-options/${option.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !option.isActive })
      });

      if (!response.ok) throw new Error('Erreur modification');
      
      toast.success(`Option ${!option.isActive ? 'activée' : 'désactivée'}`);
      loadOptions();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const getPriceDisplay = (option: ServiceOption) => {
    const IconComponent = PRICE_TYPE_ICONS[option.priceType];
    const label = PRICE_TYPE_LABELS[option.priceType];
    
    if (option.price === 0) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <IconComponent className="h-4 w-4" />
          <span className="font-medium">Gratuit</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-blue-400">
        <IconComponent className="h-4 w-4" />
        <span className="font-medium">+{option.price}€</span>
        <span className="text-xs text-slate-400">/{label.toLowerCase()}</span>
      </div>
    );
  };

  const getResourcesBadge = (option: ServiceOption) => {
    const resourceCount = option.optionResources?.length || 0;
    if (resourceCount === 0) {
      return (
        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
          Aucune ressource
        </Badge>
      );
    }

    const employeeCount = option.optionResources?.filter(r => r.resourceType === 'EMPLOYEE').length || 0;
    const equipmentCount = option.optionResources?.filter(r => r.resourceType === 'EQUIPMENT').length || 0;

    return (
      <div className="flex gap-1">
        {employeeCount > 0 && (
          <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-600">
            <Users className="h-3 w-3 mr-1" />
            {employeeCount}
          </Badge>
        )}
        {equipmentCount > 0 && (
          <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-600">
            <Settings className="h-3 w-3 mr-1" />
            {equipmentCount}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">{wording.options}</h3>
          {options.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-slate-600 text-slate-300">
              {options.length} option{options.length > 1 ? 's' : ''} configurée{options.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {businessConfig?.commonOptions && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTemplates(true)}
              className="text-yellow-400 border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/40"
            >
              <Zap className="h-4 w-4 mr-2" />
              Templates
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={() => setShowCreateModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            disabled={!serviceId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter option
          </Button>
        </div>
      </div>
      <p className="text-sm text-slate-400">
        Créez des options que vos clients peuvent ajouter à ce service (livraison, services premium, etc.)
      </p>
      
      {!serviceId ? (
        <div className="text-center py-8 text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>Enregistrez d'abord les informations de base</p>
          <p className="text-sm">pour pouvoir créer des options</p>
        </div>
      ) : options.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl border-2 border-dashed border-yellow-600">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Aucune option configurée
          </h3>
          <p className="text-slate-300 mb-4 max-w-md mx-auto">
            Créez des options additionnelles pour enrichir votre service et augmenter votre chiffre d'affaires
          </p>
          <div className="flex justify-center gap-2">
            {businessConfig?.commonOptions && (
              <Button 
                variant="outline" 
                onClick={() => setShowTemplates(true)}
                className="text-yellow-400 border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/40"
              >
                <Zap className="h-4 w-4 mr-2" />
                Voir les templates
              </Button>
            )}
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une option
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {options.map((option) => (
            <div 
              key={option.id}
              className={cn(
                "p-4 border rounded-xl transition-all hover:shadow-md",
                option.isActive 
                  ? "border-slate-600 bg-slate-800" 
                  : "border-slate-700 bg-slate-800/50 opacity-75"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      option.isActive ? "bg-green-500" : "bg-gray-400"
                    )} />
                    <h4 className="font-semibold text-white text-lg">
                      {option.name}
                    </h4>
                    {getPriceDisplay(option)}
                  </div>
                  
                  {option.description && (
                    <p className="text-slate-300 mb-3 text-sm">
                      {option.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3">
                    {getResourcesBadge(option)}
                    <Badge 
                      variant={option.isActive ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        option.isActive 
                          ? "bg-green-900/20 text-green-400 border-green-600" 
                          : "bg-slate-600 text-slate-400"
                      )}
                    >
                      {option.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={option.isActive}
                    onCheckedChange={() => handleToggleActive(option)}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingOption(option);
                      setShowCreateModal(true);
                    }}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOption(option)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création/édition d'option */}
      {showCreateModal && (
        <ServiceOptionModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOption(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingOption(null);
            loadOptions();
          }}
          storeId={storeId}
          serviceId={serviceId!}
          initialData={editingOption}
        />
      )}

      {/* Modal templates */}
      {showTemplates && businessConfig?.commonOptions && (
        <TemplatesModal
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSuccess={() => {
            setShowTemplates(false);
            loadOptions();
          }}
          storeId={storeId}
          serviceId={serviceId!}
          templates={businessConfig.commonOptions}
          businessName={businessConfig.displayName}
        />
      )}
    </div>
  );
}

// Modal de création/édition d'option
interface ServiceOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  serviceId: string;
  initialData?: ServiceOption | null;
}

function ServiceOptionModal({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  serviceId,
  initialData
}: ServiceOptionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    priceType: 'FIXED' as const
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        price: initialData.price,
        priceType: initialData.priceType
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        priceType: 'FIXED'
      });
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom de l\'option est requis');
      return;
    }
    
    if (!serviceId || serviceId === 'temp') {
      toast.error('Veuillez d\'abord créer le service');
      return;
    }

    try {
      setSaving(true);
      const url = initialData 
        ? `/api/services/${serviceId}/additional-options/${initialData.id}`
        : `/api/services/${serviceId}/additional-options`;
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erreur sauvegarde');
      
      toast.success(initialData ? 'Option modifiée' : 'Option créée');
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {initialData ? 'Modifier l\'option' : 'Nouvelle option'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {initialData ? 'Modifiez les détails de cette option' : 'Créez une nouvelle option pour votre service'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Nom de l'option *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Livraison à domicile, Service premium..."
              maxLength={100}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-yellow-400 focus:ring-yellow-400/20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'option (optionnel)"
              rows={3}
              maxLength={500}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-yellow-400 focus:ring-yellow-400/20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Prix
              </label>
              <Input
                type="number"
                min="0"
                max="99999"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="text-right bg-slate-800 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Type de prix
              </label>
              <Select 
                value={formData.priceType} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priceType: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="FIXED">Prix fixe</SelectItem>
                  <SelectItem value="PER_PERSON">Par personne</SelectItem>
                  <SelectItem value="PER_DAY">Par jour</SelectItem>
                  <SelectItem value="PER_HOUR">Par heure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
            <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !formData.name.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {initialData ? 'Modifier' : 'Créer'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal templates pré-configurés
interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  serviceId: string;
  templates: any[];
  businessName: string;
}

function TemplatesModal({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  serviceId,
  templates,
  businessName
}: TemplatesModalProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const handleCreateFromTemplates = async () => {
    if (selectedTemplates.size === 0) return;
    if (!serviceId || serviceId === 'temp') {
      toast.error('Veuillez d\'abord créer le service');
      return;
    }

    try {
      setCreating(true);
      const promises = Array.from(selectedTemplates).map(index => {
        const template = templates[index];
        return fetch(`/api/services/${serviceId}/additional-options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: template.name,
            description: template.description || '',
            price: template.defaultPrice || 0,
            priceType: template.priceType || 'FIXED'
          })
        });
      });

      await Promise.all(promises);
      
      toast.success(`${selectedTemplates.size} option${selectedTemplates.size > 1 ? 's' : ''} créée${selectedTemplates.size > 1 ? 's' : ''}`);
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-yellow-400" />
            Templates {businessName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Sélectionnez des options pré-définies à ajouter à votre service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Sélectionnez les options pré-configurées que vous souhaitez ajouter à votre service
          </p>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {templates.map((template, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all",
                  selectedTemplates.has(index)
                    ? "border-yellow-500 bg-yellow-900/20"
                    : "border-slate-600 bg-slate-800 hover:border-slate-500"
                )}
                onClick={() => {
                  const newSelected = new Set(selectedTemplates);
                  if (newSelected.has(index)) {
                    newSelected.delete(index);
                  } else {
                    newSelected.add(index);
                  }
                  setSelectedTemplates(newSelected);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-400">
                      {template.defaultPrice === 0 ? 'Gratuit' : `+${template.defaultPrice}€`}
                    </div>
                    <div className="text-xs text-slate-400">
                      {PRICE_TYPE_LABELS[template.priceType as keyof typeof PRICE_TYPE_LABELS]}
                    </div>
                  </div>
                </div>
                
                {selectedTemplates.has(index) && (
                  <CheckCircle className="h-5 w-5 text-yellow-400 absolute top-4 right-4" />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-400">
              {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} sélectionné{selectedTemplates.size !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                Annuler
              </Button>
              <Button 
                onClick={handleCreateFromTemplates}
                disabled={selectedTemplates.size === 0 || creating}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer {selectedTemplates.size > 0 && selectedTemplates.size} option{selectedTemplates.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}