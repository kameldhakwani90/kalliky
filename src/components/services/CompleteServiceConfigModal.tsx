'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Package, 
  Users, 
  Wrench, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStoreBusinessConfig } from '@/hooks/useStoreBusinessConfig';

// Components à créer
import ServiceOptionsManager from './ServiceOptionsManager';
import ProductSelectionSection from './ProductSelectionSection';
import ResourcesSelectionSection from './ResourcesSelectionSection';

interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice?: number;
  isActive: boolean;
  linkedProductsCount?: number;
}

interface CompleteServiceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  service?: Service | null;
}

type ActiveSection = 'basic' | 'products' | 'resources' | 'options';

export default function CompleteServiceConfigModal({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  service
}: CompleteServiceConfigModalProps) {
  // États principaux
  const [activeSection, setActiveSection] = useState<ActiveSection>('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: ''
  });

  // Configuration business
  const { config: businessConfig, loading: configLoading } = useStoreBusinessConfig(storeId);

  // Initialisation des données
  useEffect(() => {
    if (isOpen && service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        basePrice: service.basePrice?.toString() || ''
      });
      setActiveSection('basic');
    } else if (isOpen && !service) {
      setFormData({
        name: '',
        description: '',
        basePrice: ''
      });
      setActiveSection('basic');
    }
  }, [isOpen, service]);

  // Wording adapté selon le type de boutique
  const wording = businessConfig?.config?.wording || {
    products: "Quels produits/services ?",
    equipment: "Vos équipements",
    staff: "Votre équipe",
    options: "Options additionnelles"
  };

  const businessIcon = businessConfig?.config?.icon || '🏪';
  const businessName = businessConfig?.config?.displayName || 'Service';

  // Sections de configuration
  const sections = [
    {
      id: 'basic' as const,
      icon: Settings,
      title: 'Informations de base',
      description: 'Nom, description et apparence'
    },
    {
      id: 'products' as const,
      icon: Package,
      title: wording.products,
      description: 'Sélectionnez les produits liés à ce service'
    },
    {
      id: 'resources' as const,
      icon: Users,
      title: `${wording.equipment} + ${wording.staff}`,
      description: 'Ressources principales nécessaires'
    },
    {
      id: 'options' as const,
      icon: Sparkles,
      title: wording.options,
      description: 'Options que vos clients peuvent ajouter',
      highlight: true
    }
  ];

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom du service est requis');
      return;
    }

    try {
      setSaving(true);
      
      if (service) {
        // Modification d'un service existant
        const basePrice = formData.basePrice ? parseFloat(formData.basePrice) : null;
        
        const body = {
          id: service.id,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          icon: null,
          color: null,
          settings: {
            basePrice: basePrice
          }
        };

        const response = await fetch('/api/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la modification');
        }

        toast.success('Service modifié avec succès');
      } else {
        // Création d'un nouveau service
        const basePrice = formData.basePrice ? parseFloat(formData.basePrice) : null;
        
        const body = {
          storeId,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          icon: null,
          color: null,
          settings: {
            basePrice: basePrice
          }
        };

        const response = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la création');
        }

        const newService = await response.json();
        
        toast.success(`Service "${formData.name}" créé avec succès ! ID: ${newService.service.id}`);
        
        // TODO: Ici on pourra ajouter la logique pour affecter les produits/ressources/options
        // en utilisant newService.service.id
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (configLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-2xl border border-white/20 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Chargement</DialogTitle>
            <DialogDescription className="sr-only">Chargement de la configuration</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />
              <p className="text-gray-400">Chargement de la configuration...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-2xl border border-white/20 text-white shadow-2xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="flex items-center gap-3 text-white text-2xl font-bold">
            <div className="text-3xl animate-pulse">⚙️</div>
            {service ? `Modifier "${service.name}"` : `Nouveau Service`}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            {service ? "Modifiez les informations de votre service" : "Créez un nouveau service pour votre boutique"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20 h-12 rounded-xl">
              {sections.map((section) => (
                <TabsTrigger 
                  key={section.id}
                  value={section.id}
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-400 flex items-center justify-center gap-1 text-xs px-1 py-2 h-10 rounded-lg transition-all duration-300"
                >
                  <section.icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{
                    section.id === 'basic' ? 'Infos' :
                    section.id === 'products' ? 'Produits' :
                    section.id === 'resources' ? 'Ressources' :
                    section.id === 'options' ? 'Options' :
                    section.title
                  }</span>
                  {section.highlight && <Sparkles className="h-2 w-2 text-yellow-400 flex-shrink-0" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Section Informations de base */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-6 p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-400" />
                    Nom du service
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Manucure complète, Coiffure premium..."
                    className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 h-12 text-lg"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.name.length}/100 caractères
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-purple-400" />
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre service en détail..."
                    rows={4}
                    maxLength={500}
                    className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/500 caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <span className="text-green-400">€</span>
                    Prix de base
                    <span className="text-xs text-gray-500">(optionnel)</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="Ex: 49.99"
                    min="0"
                    step="0.01"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                  />
                  <p className="text-xs text-gray-500">
                    Prix de base en euros (peut être modifié avec les options)
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Section Produits */}
            <TabsContent value="products" className="space-y-6 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">{wording.products}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Sélectionnez les produits que vous proposez avec ce service</p>
                </div>
                <div className="p-5">
                  <ProductSelectionSection 
                    storeId={storeId}
                    serviceId={service?.id || 'temp'}
                    wording={wording}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Section Ressources */}
            <TabsContent value="resources" className="space-y-6 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">{wording.equipment} + {wording.staff}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Sélectionnez les employés et équipements nécessaires</p>
                </div>
                <div className="p-5">
                  <ResourcesSelectionSection 
                    storeId={storeId}
                    serviceId={service?.id || 'temp'}
                    wording={wording}
                    businessConfig={businessConfig?.config}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Section Options (NOUVEAU) */}
            <TabsContent value="options" className="space-y-6 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">{wording.options}</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 rounded-full">
                      Nouveau
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Créez des options additionnelles (livraison, service premium, etc.)</p>
                </div>
                <div className="p-5">
                  <ServiceOptionsManager
                    storeId={storeId}
                    serviceId={service?.id || 'temp'}
                    wording={wording}
                    businessConfig={businessConfig?.config}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer avec actions */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              disabled={saving}
              className="bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {service ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" /> 
                      Enregistrer les modifications
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" /> 
                      Créer le service
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}