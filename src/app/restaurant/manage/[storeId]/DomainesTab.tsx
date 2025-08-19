'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Package,
  Euro,
  Users,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DomaineFormModal from '@/components/services/DomaineFormModal';
import ServiceFormModal from '@/components/services/ServiceFormModal';

interface ServiceVariant {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  capacity?: number;
  resources?: any[];
}

interface UniversalService {
  id: string;
  name: string;
  description?: string;
  pattern: string;
  isActive: boolean;
  settings: any;
  _count?: {
    bookings: number;
  };
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  services: UniversalService[];
}

interface DomainesTabProps {
  storeId: string;
  storeName: string;
  config: any;
  onConfigUpdate: (config: any) => void;
}

export default function DomainesTab({ storeId, storeName, config, onConfigUpdate }: DomainesTabProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<UniversalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [serviceVariants, setServiceVariants] = useState<{ [key: string]: ServiceVariant[] }>({});
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<UniversalService | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{ domaineId: string; variant?: any; mode: 'create' | 'edit' | 'duplicate'; domainSettings?: any } | null>(null);

  useEffect(() => {
    loadServices();
  }, [storeId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/universal-services?storeId=${storeId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      const loadedServices = data.services || [];
      
      setServices(loadedServices);
      organizeServicesByCategories(loadedServices);
      
    } catch (error) {
      console.error('Erreur chargement services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const organizeServicesByCategories = (servicesList: UniversalService[]) => {
    const categoriesMap = new Map<string, ServiceCategory>();

    servicesList.forEach(service => {
      const categoryName = service.settings?.category || 'Services';
      
      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, {
          id: categoryName.toLowerCase().replace(/\s+/g, '-'),
          name: categoryName,
          description: '',
          icon: '🚗',
          color: '#6B7280',
          services: []
        });
      }
      
      categoriesMap.get(categoryName)!.services.push(service);
    });

    setCategories(Array.from(categoriesMap.values()));
  };

  const loadServiceVariants = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/universal-services-extended/${serviceId}/variants`);
      if (response.ok) {
        const data = await response.json();
        setServiceVariants(prev => ({
          ...prev,
          [serviceId]: data.variants || []
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des variantes:', error);
    }
  };

  const toggleServiceExpansion = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
      // Charger les variantes si pas déjà chargées
      if (!serviceVariants[serviceId]) {
        loadServiceVariants(serviceId);
      }
    }
    setExpandedServices(newExpanded);
  };

  const handleAddVariant = async (serviceId: string) => {
    const name = prompt('Nom de la variante:');
    if (!name) return;
    
    const price = prompt('Prix (€):');
    
    try {
      const response = await fetch(`/api/universal-services-extended/${serviceId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isActive: true,
          pricingConfig: price ? { basePrice: parseFloat(price) } : undefined
        })
      });
      
      if (response.ok) {
        toast.success('Variante ajoutée');
        loadServiceVariants(serviceId);
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleCreateDomaine = () => {
    setEditingService(null);
    setShowServiceModal(true);
  };

  const handleCreateService = (domaineId: string) => {
    const domain = services.find(s => s.id === domaineId);
    setEditingVariant({ 
      domaineId, 
      mode: 'create',
      domainSettings: domain?.settings 
    });
    setShowVariantModal(true);
  };

  const handleEditVariant = (domaineId: string, variant: any) => {
    const domain = services.find(s => s.id === domaineId);
    setEditingVariant({ 
      domaineId, 
      variant, 
      mode: 'edit',
      domainSettings: domain?.settings 
    });
    setShowVariantModal(true);
  };

  const handleDuplicateService = (serviceId: string, variant: any) => {
    const domain = services.find(s => s.id === serviceId);
    setEditingVariant({ 
      domaineId: serviceId, 
      variant, 
      mode: 'duplicate',
      domainSettings: domain?.settings 
    });
    setShowVariantModal(true);
  };

  const handleEditService = (service: UniversalService) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = async (service: UniversalService) => {
    if (!confirm(`Supprimer le service "${service.name}" ?`)) return;
    
    try {
      const response = await fetch(`/api/universal-services/${service.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Service supprimé');
        loadServices();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteVariant = async (serviceId: string, variantId: string) => {
    if (!confirm('Supprimer cette variante ?')) return;
    
    try {
      const response = await fetch(`/api/universal-services-extended/${serviceId}/variants/${variantId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Variante supprimée');
        loadServiceVariants(serviceId);
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    services: cat.services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.services.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domaines</h2>
          <p className="text-muted-foreground">
            Gérez vos domaines de services
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={() => handleCreateDomaine()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau domaine
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une catégorie ou service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Catégories et services */}
      {filteredCategories.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun service trouvé</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Aucun service ne correspond à votre recherche' : 'Commencez par créer votre premier service'}
            </p>
            <Button onClick={() => handleCreateDomaine()}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un domaine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{category.icon}</div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Voitures, motos, vélos... • {category.services.length} service{category.services.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Voir tout</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreateDomaine()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau domaine
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {category.services.map((service) => {
                  const isExpanded = expandedServices.has(service.id);
                  const variants = serviceVariants[service.id] || [];
                  
                  return (
                    <div key={service.id}>
                      {/* Service principal */}
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            service.isActive ? "bg-green-500" : "bg-gray-400"
                          )} />
                          <div className="flex-1">
                            <p className="font-medium">{service.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {service.settings?.basePrice !== undefined && (
                                <span>
                                  {service.settings.basePrice === 0 ? 'Gratuit' : `${service.settings.basePrice}€`}
                                </span>
                              )}
                              {variants.length > 0 && (
                                <span>{variants.length} service{variants.length > 1 ? 's' : ''}</span>
                              )}
                              {service.settings?.options && service.settings.options.length > 0 && (
                                <span>{service.settings.options.length} option{service.settings.options.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {service._count?.bookings && service._count.bookings > 0 && (
                            <div className="text-lg font-semibold mr-2">
                              {service._count.bookings}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleServiceExpansion(service.id)}
                            className="p-1"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteService(service)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Section des variantes - affichée quand expandé */}
                      {isExpanded && (
                        <div className="ml-8 mr-4 mb-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Services</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCreateService(service.id)}
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                          
                          {variants.length === 0 ? (
                            <div className="text-center py-3 text-xs text-muted-foreground">
                              Aucun service configuré
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {variants.map((variant: any) => (
                                <div key={variant.id} className="flex items-center justify-between p-2 bg-white rounded">
                                  <div>
                                    <p className="text-sm font-medium">{variant.name}</p>
                                    {variant.pricingConfig?.basePrice !== undefined && (
                                      <p className="text-xs text-muted-foreground">
                                        {variant.pricingConfig.basePrice === 0 ? 'Gratuit' : `${variant.pricingConfig.basePrice}€`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditVariant(service.id, variant)}
                                      title="Modifier"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleDuplicateService(service.id, variant)}
                                      title="Dupliquer"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleDeleteVariant(service.id, variant.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <span className="text-sm font-medium text-gray-600">Ressources</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Assigner
                            </Button>
                          </div>
                          
                          <div className="text-center py-3 text-xs text-muted-foreground">
                            Aucune ressource assignée
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de création/édition de domaine */}
      {showServiceModal && (
        <DomaineFormModal
          isOpen={showServiceModal}
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(null);
          }}
          onSuccess={() => {
            setShowServiceModal(false);
            setEditingService(null);
            loadServices();
          }}
          storeId={storeId}
          initialData={editingService}
          mode={editingService ? 'edit' : 'create'}
        />
      )}
      
      {/* Modal de création/édition de service (ex-variante) */}
      {showVariantModal && editingVariant && (
        <ServiceFormModal
          isOpen={showVariantModal}
          onClose={() => {
            setShowVariantModal(false);
            setEditingVariant(null);
          }}
          onSuccess={() => {
            setShowVariantModal(false);
            if (editingVariant) {
              loadServiceVariants(editingVariant.domaineId);
            }
            setEditingVariant(null);
          }}
          domaineId={editingVariant.domaineId}
          initialData={editingVariant.variant || null}
          mode={editingVariant.mode}
          domainSettings={editingVariant.domainSettings}
        />
      )}
    </div>
  );
}