'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Edit,
  Trash2,
  Copy,
  Settings,
  Users,
  Calendar,
  Euro,
  Package,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  createdAt: string;
  updatedAt: string;
}

interface ServiceResource {
  id: string;
  type: 'EMPLOYEE' | 'EQUIPMENT' | 'LOCATION' | 'VIRTUAL';
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  specifications?: any;
  availability?: any;
  constraints?: any;
  costs?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface UniversalService {
  id: string;
  name: string;
  description?: string;
  pattern: string;
  isActive: boolean;
  settings: any;
  _count?: {
    subServices: number;
    bookings: number;
    variants?: number;
  };
}

interface ServiceManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: UniversalService;
  storeId: string;
  onServiceUpdate: () => void;
}

const ServiceManageModal: React.FC<ServiceManageModalProps> = ({
  isOpen,
  onClose,
  service,
  storeId,
  onServiceUpdate
}) => {
  const [variants, setVariants] = useState<ServiceVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);

  useEffect(() => {
    if (isOpen && service) {
      loadServiceData();
    }
  }, [isOpen, service]);

  const loadServiceData = async () => {
    setLoading(true);
    try {
      // Charger les variantes
      const variantsResponse = await fetch(`/api/universal-services-extended/${service.id}/variants`);
      if (variantsResponse.ok) {
        const variantsData = await variantsResponse.json();
        setVariants(variantsData.variants || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getPatternInfo = (pattern: string) => {
    const patterns: Record<string, { name: string; icon: string; color: string }> = {
      FLEXIBLE_BOOKING: { name: 'Réservation flexible', icon: '📅', color: '#3b82f6' },
      FIXED_SLOTS: { name: 'Créneaux fixes', icon: '⏰', color: '#f59e0b' },
      AVAILABILITY: { name: 'Disponibilité', icon: '✅', color: '#10b981' },
      ZONE_DELIVERY: { name: 'Zones de service', icon: '🚗', color: '#8b5cf6' },
      EVENT_BOOKING: { name: 'Événements', icon: '🎉', color: '#ef4444' },
      CLASS_SESSION: { name: 'Sessions/Cours', icon: '🎓', color: '#06b6d4' }
    };
    return patterns[pattern] || { name: pattern, icon: '⚙️', color: '#64748b' };
  };

  const handleCreateVariant = () => {
    setSelectedVariant(null);
    setShowVariantModal(true);
  };

  const handleEditVariant = (variant: ServiceVariant) => {
    setSelectedVariant(variant);
    setShowVariantModal(true);
  };

  if (!service || !isOpen) return null;

  const patternInfo = getPatternInfo(service.pattern);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl"
                style={{ background: patternInfo.color }}
              >
                <span className="text-white">{patternInfo.icon}</span>
              </div>
              <div>
                <DialogTitle className="text-2xl">{service.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{patternInfo.name}</Badge>
                  <Badge variant={service.isActive ? "default" : "secondary"}>
                    {service.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Variantes du service</h3>
                  <p className="text-sm text-muted-foreground">
                    Configurez les différentes variantes avec leurs propres ressources et planning
                  </p>
                </div>
                <Button onClick={handleCreateVariant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle variante
                </Button>
              </div>

              {variants.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune variante configurée</h3>
                    <p className="text-muted-foreground mb-6">
                      Créez des variantes pour gérer différentes configurations de ce service.<br/>
                      Chaque variante aura son propre planning et ses ressources assignées.
                    </p>
                    <Button onClick={handleCreateVariant}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la première variante
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {variants.map((variant) => (
                    <Card key={variant.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <CardTitle className="text-lg truncate">{variant.name}</CardTitle>
                            {variant.uniqueId && (
                              <p className="text-sm text-muted-foreground">#{variant.uniqueId}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={variant.isActive ? "default" : "secondary"} className="text-xs">
                              {variant.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditVariant(variant)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {variant.description && (
                          <p className="text-sm text-muted-foreground">{variant.description}</p>
                        )}
                        
                        <div className="space-y-2">
                          {variant.pricingConfig?.basePrice !== undefined && (
                            <div className="flex items-center gap-2 text-sm">
                              <Euro className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">Prix:</span>
                              <span>
                                {variant.pricingConfig.basePrice === 0 ? 'Gratuit' : `${variant.pricingConfig.basePrice}€`}
                              </span>
                            </div>
                          )}
                          
                          {variant.capacityConfig?.maxCapacity && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">Capacité:</span>
                              <span>{variant.capacityConfig.maxCapacity} personnes max</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Ressources assignées</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => handleEditVariant(variant)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Aucune ressource assignée
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Planning</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => handleEditVariant(variant)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Aucun planning configuré
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceManageModal;