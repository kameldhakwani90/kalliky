'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Edit,
  MoreVertical,
  Trash2,
  Copy,
  Settings,
  Calendar,
  Euro,
  Clock,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ServiceFormModal from './ServiceFormModal';
import ServiceManageModal from './ServiceManageModal';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  serviceCount: number;
  services: UniversalService[];
  isCustom?: boolean;
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
  };
}

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ServiceCategory | null;
  storeId: string;
  onServiceUpdate: () => void;
}

export default function CategoryDetailModal({ 
  isOpen, 
  onClose, 
  category, 
  storeId,
  onServiceUpdate 
}: CategoryDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingService, setEditingService] = useState<UniversalService | null>(null);
  const [managingService, setManagingService] = useState<UniversalService | null>(null);

  if (!category || !isOpen) return null;

  const filteredServices = category.services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditService = (service: UniversalService) => {
    console.log('Modifier service:', service.name);
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleDuplicateService = async (service: UniversalService) => {
    try {
      const response = await fetch('/api/universal-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          name: `${service.name} (Copie)`,
          description: service.description,
          pattern: service.pattern,
          icon: service.icon,
          settings: service.settings
        })
      });

      if (response.ok) {
        toast.success(`Service "${service.name}" dupliqué !`);
        onServiceUpdate();
      } else {
        throw new Error('Erreur lors de la duplication');
      }
    } catch (error) {
      console.error('Error duplicating service:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleDeleteService = async (service: UniversalService) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${service.name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/universal-services?id=${service.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Service "${service.name}" supprimé`);
        onServiceUpdate();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleService = async (service: UniversalService) => {
    try {
      console.log('🔄 Toggle service:', service.name, 'de', service.isActive, 'vers', !service.isActive);
      
      const response = await fetch('/api/universal-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: service.id,
          isActive: !service.isActive
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Toggle réussi:', result);
        toast.success(!service.isActive ? 'Service activé' : 'Service désactivé');
        onServiceUpdate();
      } else {
        const error = await response.json();
        console.error('❌ Erreur API:', error);
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Erreur lors de la mise à jour');
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className={`
                w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl
                ${category.color}
              `}>
                {category.icon}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">{category.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {category.serviceCount} service{category.serviceCount > 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                onClick={() => setShowServiceModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau service
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Barre de recherche */}
            {category.services.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher un service dans cette catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* Liste des services */}
            {filteredServices.length === 0 && category.services.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold mb-2">Aucun service dans cette catégorie</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Commencez par créer votre premier service dans "{category.name}".
                  </p>
                  <Button 
                    onClick={() => setShowServiceModal(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => {
                  const patternInfo = getPatternInfo(service.pattern);
                  return (
                    <Card key={service.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Statut */}
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              service.isActive ? "bg-green-500" : "bg-gray-400"
                            )} />
                            
                            {/* Info service */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold">{service.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {patternInfo.name}
                                </Badge>
                                {service.settings?.basePrice && (
                                  <Badge variant="outline" className="text-xs">
                                    À partir de {service.settings.basePrice}€
                                  </Badge>
                                )}
                              </div>
                              
                              {service.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              )}
                              
                              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                {service.settings?.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {service.settings.duration} {
                                      service.settings?.durationType === 'days' ? 'jour(s)' :
                                      service.settings?.durationType === 'hours' ? 'h' : 'min'
                                    }
                                  </div>
                                )}
                                {service._count?.subServices && service._count.subServices > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    {service._count.subServices} prestation{service._count.subServices > 1 ? 's' : ''}
                                  </div>
                                )}
                                {service._count?.bookings && service._count.bookings > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {service._count.bookings} réservation{service._count.bookings > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleService(service)}
                            >
                              {service.isActive ? 'Désactiver' : 'Activer'}
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
                                <DropdownMenuItem onClick={() => handleDuplicateService(service)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setManagingService(service);
                                  setShowManageModal(true);
                                }}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Gérer
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteService(service)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredServices.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun service trouvé pour "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de création de service */}
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setEditingService(null);
        }}
        storeId={storeId}
        category={category}
        editingService={editingService}
        onServiceCreated={() => {
          onServiceUpdate();
          setShowServiceModal(false);
          setEditingService(null);
        }}
      />

      {/* Modal de gestion avancée */}
      {managingService && (
        <ServiceManageModal
          isOpen={showManageModal}
          onClose={() => {
            setShowManageModal(false);
            setManagingService(null);
          }}
          service={managingService}
          storeId={storeId}
          onServiceUpdate={onServiceUpdate}
        />
      )}
    </>
  );
}