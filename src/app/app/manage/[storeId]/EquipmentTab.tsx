'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Wrench,
  Edit,
  Trash2,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  specifications?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    category?: string;
    features?: string[];
  };
  erpId?: string;
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    notes?: string;
  }>;
  assignments: Array<{
    id: string;
    variant: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentTabProps {
  storeId: string;
  storeName: string;
}

const DAYS_OF_WEEK = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

const getStatusColor = (isActive: boolean) => 
  isActive ? 'bg-green-500' : 'bg-gray-400';

const getStatusLabel = (isActive: boolean) => 
  isActive ? 'Actif' : 'Inactif';

const getStatusIcon = (isActive: boolean) => 
  isActive ? CheckCircle : XCircle;

const getStatusVariant = (isActive: boolean) => 
  isActive ? 'default' as const : 'secondary' as const;

export default function EquipmentTab({ storeId, storeName }: EquipmentTabProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEquipment();
  }, [storeId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}/equipment`);
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.equipment || []);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement équipements:', error);
      toast.error('Erreur lors du chargement des équipements');
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipmentStatus = async (item: Equipment) => {
    const newIsActive = !item.isActive;
    
    try {
      const response = await fetch(`/api/stores/${storeId}/equipment/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newIsActive })
      });

      if (response.ok) {
        toast.success(`Équipement ${newIsActive ? 'activé' : 'désactivé'}`);
        loadEquipment();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification équipement:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const deleteEquipment = async (item: Equipment) => {
    if (!confirm(`Supprimer l'équipement "${item.name}" ?`)) return;

    try {
      const response = await fetch(`/api/stores/${storeId}/equipment/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Équipement "${item.name}" supprimé`);
        loadEquipment();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression équipement:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getAvailabilityDays = (schedules: Equipment['schedules']) => {
    if (!schedules || schedules.length === 0) return 'Disponibilité non définie';
    return schedules
      .filter(s => s.isAvailable)
      .map(s => DAYS_OF_WEEK[s.dayOfWeek])
      .join(', ');
  };

  const getAssignedServices = (assignments: Equipment['assignments']) => {
    return assignments
      .map(a => a.variant.service.name)
      .filter((name, index, arr) => arr.indexOf(name) === index) // Unique
      .join(', ');
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.specifications?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.specifications?.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des équipements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des équipements</h2>
          <p className="text-muted-foreground">
            Gérez vos équipements, leur disponibilité et maintenance pour {storeName}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un équipement
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un équipement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wrench className="h-4 w-4" />
          {equipment.length} équipement{equipment.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des équipements */}
      {filteredEquipment.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun équipement trouvé</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Aucun équipement ne correspond à votre recherche' : 'Commencez par ajouter votre premier équipement'}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un équipement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => {
            const StatusIcon = getStatusIcon(item.isActive);
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        getStatusColor(item.isActive)
                      )} />
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                        {item.uniqueId && (
                          <p className="text-sm text-muted-foreground">#{item.uniqueId}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(item.isActive)} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusLabel(item.isActive)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleEquipmentStatus(item)}>
                            <Activity className="h-4 w-4 mr-2" />
                            {item.isActive ? 'Désactiver' : 'Activer'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toast.info('Modification d\'équipement - À implémenter')}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteEquipment(item)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}

                  {/* Spécifications */}
                  {item.specifications && (
                    <div className="space-y-2">
                      {item.specifications.brand && (
                        <div className="flex items-center gap-2 text-sm">
                          <Settings className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Marque:</span>
                          <span>{item.specifications.brand}</span>
                        </div>
                      )}
                      {item.specifications.model && (
                        <div className="flex items-center gap-2 text-sm">
                          <Settings className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Modèle:</span>
                          <span>{item.specifications.model}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuration complète disponible dans "Modifier" */}

                  {/* Services assignés */}
                  {item.assignments.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-3 w-3" />
                        Services assignés
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getAssignedServices(item.assignments)}
                      </p>
                    </div>
                  )}

                  {/* Fonctionnalités */}
                  {item.specifications?.features && item.specifications.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.specifications.features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {item.specifications.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.specifications.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}