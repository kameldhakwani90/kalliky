'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Settings,
  Eye,
  Edit,
  Package,
  Calendar,
  MapPin,
  Clock,
  Euro,
  Users,
  ChevronRight,
  MoreVertical,
  Trash2,
  Copy,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CategoryPopup from '@/components/services/CategoryPopup';
import CategoryEditModal from '@/components/services/CategoryEditModal';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import CategoryDetailModal from '@/components/services/CategoryDetailModal';
import ServiceManageModal from '@/components/services/ServiceManageModal';

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

interface NewServicesTabProps {
  storeId: string;
  storeName: string;
  config: any;
  onConfigUpdate: (config: any) => void;
}

export default function NewServicesTab({ storeId, storeName, config, onConfigUpdate }: NewServicesTabProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<UniversalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalMode, setEditModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingService, setEditingService] = useState<UniversalService | null>(null);
  const [selectedService, setSelectedService] = useState<UniversalService | null>(null);

  useEffect(() => {
    loadServices();
    loadCategoriesFromConfig();
  }, [storeId, config]);

  const loadCategoriesFromConfig = () => {
    if (config?.serviceCategories) {
      const savedCategories = config.serviceCategories.map((cat: any) => ({
        ...cat,
        serviceCount: 0,
        services: []
      }));
      setCategories(prev => [...prev.filter(c => !c.isCustom), ...savedCategories]);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/universal-services?storeId=${storeId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      const loadedServices = data.services || [];
      
      setServices(loadedServices);
      
      // Organiser les services par catégories
      organizeServicesByCategories(loadedServices);
      
    } catch (error) {
      console.error('Erreur chargement services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const organizeServicesByCategories = (servicesList: UniversalService[]) => {
    // Commencer avec les catégories sauvegardées
    const savedCategories = config?.serviceCategories || [];
    const categoriesMap = new Map<string, ServiceCategory>();

    // Ajouter les catégories sauvegardées
    savedCategories.forEach((savedCat: any) => {
      categoriesMap.set(savedCat.id, {
        id: savedCat.id,
        name: savedCat.name,
        description: savedCat.description,
        icon: savedCat.icon,
        color: savedCat.color,
        serviceCount: 0,
        services: [],
        isCustom: savedCat.isCustom || false
      });
    });

    // Grouper les services par catégorie
    servicesList.forEach(service => {
      const businessType = service.settings?.businessType || 'custom';
      const businessTypeName = service.settings?.businessTypeName || 'Autre';
      const categoryName = service.settings?.category || 'Non catégorisé';

      // Chercher d'abord par businessType (ID de catégorie)
      let targetCategory = null;
      for (const [key, cat] of categoriesMap.entries()) {
        if (cat.id === businessType || cat.name === categoryName) {
          targetCategory = cat;
          break;
        }
      }

      // Si pas trouvée, créer une catégorie par défaut
      if (!targetCategory) {
        const defaultKey = `default_${categoryName}`;
        targetCategory = {
          id: defaultKey,
          name: categoryName,
          description: businessTypeName,
          icon: getIconForBusinessType(businessType),
          color: getColorForBusinessType(businessType),
          serviceCount: 0,
          services: [],
          isCustom: businessType === 'custom'
        };
        categoriesMap.set(defaultKey, targetCategory);
      }

      targetCategory.services.push(service);
      targetCategory.serviceCount = targetCategory.services.length;
    });

    setCategories(Array.from(categoriesMap.values()));
  };

  const getIconForBusinessType = (type: string): string => {
    const icons: Record<string, string> = {
      'vehicle_rental': '🚗',
      'beauty_salon': '💅',
      'home_services': '🏠',
      'health_wellness': '❤️',
      'fitness': '💪',
      'restaurant': '🍽️',
      'hairdresser': '✂️',
      'repair': '🔧',
      'education': '🎓',
      'entertainment': '🎵',
      'photography': '📷',
      'custom': '⚙️'
    };
    return icons[type] || '⚙️';
  };

  const getColorForBusinessType = (type: string) => {
    const colors: any = {
      'vehicle_rental': 'from-blue-500 to-blue-600',
      'beauty_salon': 'from-pink-500 to-pink-600',
      'home_services': 'from-green-500 to-green-600',
      'health_wellness': 'from-red-500 to-red-600',
      'fitness': 'from-orange-500 to-orange-600',
      'restaurant': 'from-yellow-500 to-yellow-600',
      'hairdresser': 'from-purple-500 to-purple-600',
      'repair': 'from-gray-500 to-gray-600',
      'education': 'from-indigo-500 to-indigo-600',
      'entertainment': 'from-teal-500 to-teal-600',
      'photography': 'from-cyan-500 to-cyan-600',
      'custom': 'from-gray-400 to-gray-500'
    };
    return colors[type] || 'from-gray-400 to-gray-500';
  };

  const handleSelectCategory = async (categoryData: any) => {
    try {
      // Sauvegarder la catégorie dans le store settings
      const updatedConfig = {
        ...config,
        serviceCategories: [
          ...(config.serviceCategories || []),
          {
            id: categoryData.id,
            name: categoryData.name,
            description: categoryData.description,
            icon: categoryData.icon,
            color: categoryData.color,
            isCustom: categoryData.isCustom || false
          }
        ]
      };

      // Sauvegarder dans la base
      await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicesConfig: updatedConfig
        })
      });

      // Mettre à jour le state local
      onConfigUpdate(updatedConfig);
      
      // Créer une nouvelle catégorie
      const newCategory: ServiceCategory = {
        id: categoryData.id,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        serviceCount: 0,
        services: [],
        isCustom: categoryData.isCustom || false
      };
      
      setCategories(prev => [...prev, newCategory]);
      toast.success(`Catégorie "${categoryData.name}" créée et sauvegardée !`);
      
      // Ouvrir directement la création de service dans cette catégorie
      setSelectedCategory(newCategory);
      setShowServiceModal(true);
    } catch (error) {
      console.error('Erreur sauvegarde catégorie:', error);
      toast.error('Erreur lors de la sauvegarde de la catégorie');
    }
  };

  const handleOpenCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
  };

  const handleCreateServiceInCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setShowServiceModal(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    console.log('handleEditCategory appelé avec:', category);
    setSelectedCategory(category);
    setEditModalMode('edit');
    setShowEditModal(true);
    console.log('Modal edit devrait s\'ouvrir:', true);
  };

  const handleDuplicateCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setEditModalMode('duplicate');
    setShowEditModal(true);
  };

  const handleDeleteCategory = async (category: ServiceCategory) => {
    if (category.services.length > 0) {
      toast.error(`Impossible de supprimer "${category.name}" : elle contient ${category.services.length} service(s)`);
      return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      return;
    }
    
    try {
      // Supprimer la catégorie du config et sauvegarder en base
      const updatedConfig = {
        ...config,
        serviceCategories: (config.serviceCategories || []).filter((cat: any) => cat.id !== category.id)
      };

      await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicesConfig: updatedConfig
        })
      });

      // Mettre à jour le state local
      onConfigUpdate(updatedConfig);
      setCategories(prev => prev.filter(cat => cat.id !== category.id));
      toast.success(`Catégorie "${category.name}" supprimée`);
    } catch (error) {
      console.error('Erreur suppression catégorie:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
    }
  };

  const handleSaveCategory = (categoryData: ServiceCategory) => {
    if (editModalMode === 'edit') {
      setCategories(prev => prev.map(cat => 
        cat.id === categoryData.id ? categoryData : cat
      ));
    } else {
      // create ou duplicate
      setCategories(prev => [...prev, categoryData]);
    }
  };

  const handleEditService = (service: UniversalService) => {
    // Trouver la catégorie du service
    const serviceCategory = categories.find(cat => 
      cat.services.some(s => s.id === service.id)
    );
    
    setEditingService(service);
    setSelectedCategory(serviceCategory || null);
    setShowServiceModal(true);
  };

  const handleToggleService = async (service: UniversalService) => {
    try {
      const response = await fetch('/api/universal-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: service.id,
          isActive: !service.isActive
        })
      });

      if (response.ok) {
        toast.success(!service.isActive ? 'Service activé' : 'Service désactivé');
        // Force le rechargement immédiat
        await loadServices();
        // Force un re-render si nécessaire
        setTimeout(() => loadServices(), 100);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur toggle service:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDuplicateService = async (service: UniversalService) => {
    try {
      const response = await fetch('/api/universal-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          duplicateFrom: service.id,
          name: `${service.name} (copie)`,
          description: `Copie de ${service.description || service.name}`
        })
      });

      if (response.ok) {
        toast.success(`Service "${service.name}" dupliqué`);
        loadServices();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la duplication');
      }
    } catch (error) {
      console.error('Erreur duplication service:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleDeleteService = async (service: UniversalService) => {
    // Vérifier s'il y a des réservations
    if (service._count?.bookings && service._count.bookings > 0) {
      const confirmDelete = confirm(
        `⚠️ ATTENTION : Le service "${service.name}" a ${service._count.bookings} réservation(s).\n\n` +
        `Si vous le supprimez :\n` +
        `✅ Il disparaîtra de votre gestion\n` +
        `✅ L'historique/tickets clients seront préservés\n\n` +
        `Êtes-vous sûr de vouloir continuer ?`
      );
      if (!confirmDelete) return;
    } else {
      if (!confirm(`Supprimer le service "${service.name}" ?`)) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/universal-services?id=${service.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Service "${service.name}" supprimé`);
        loadServices(); // Recharger la liste
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression service:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const cleanAllServices = async () => {
    if (!confirm('⚠️ ATTENTION : Cela va supprimer TOUS les services de ce store. Êtes-vous sûr ?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Récupérer tous les services actuels
      const response = await fetch(`/api/universal-services?storeId=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        const allServices = data.services || [];
        
        // Supprimer tous les services un par un
        const deletePromises = allServices.map(service => 
          fetch(`/api/universal-services?id=${service.id}`, {
            method: 'DELETE'
          })
        );
        
        await Promise.all(deletePromises);
      }

      // Nettoyer les catégories sauvegardées du store config
      const cleanConfig = {
        ...config,
        serviceCategories: []
      };

      await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicesConfig: cleanConfig
        })
      });

      // Mettre à jour le state local
      onConfigUpdate(cleanConfig);
      setCategories([]);
      setServices([]);

      toast.success('Tous les services et catégories ont été supprimés !');
    } catch (error) {
      console.error('Erreur nettoyage:', error);
      toast.error('Erreur lors du nettoyage');
    } finally {
      setLoading(false);
    }
  };

  const createTestServices = async () => {
    try {
      // Services de test à créer
      const testServices = [
        {
          name: 'Location voiture journée',
          description: 'Location de véhicule pour une journée complète',
          pattern: 'AVAILABILITY',
          businessType: 'vehicle_rental',
          businessTypeName: 'Location véhicules',
          category: 'Location véhicules',
          basePrice: 45,
          icon: '🚗'
        },
        {
          name: 'Épilation jambes complète',
          description: 'Épilation complète des deux jambes',
          pattern: 'FLEXIBLE_BOOKING',
          businessType: 'beauty_salon',
          businessTypeName: 'Soins esthétiques',
          category: 'Soins esthétiques',
          basePrice: 35,
          icon: '💅'
        },
        {
          name: 'Ménage 2h domicile',
          description: 'Service de ménage complet à domicile',
          pattern: 'ZONE_DELIVERY',
          businessType: 'home_services',
          businessTypeName: 'Services à domicile',
          category: 'Services à domicile',
          basePrice: 40,
          icon: '🏠'
        }
      ];

      // Créer tous les services
      for (const service of testServices) {
        await fetch('/api/universal-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId,
            name: service.name,
            description: service.description,
            pattern: service.pattern,
            icon: service.icon,
            isActive: true,
            settings: {
              businessType: service.businessType,
              businessTypeName: service.businessTypeName,
              category: service.category,
              basePrice: service.basePrice,
              duration: 60,
              durationType: 'minutes'
            }
          })
        });
      }

      toast.success('3 services de test créés avec succès !');
      loadServices(); // Recharger pour voir les nouveaux services
    } catch (error) {
      console.error('Erreur création services test:', error);
      toast.error('Erreur lors de la création des services de test');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.services.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Services</h2>
          <p className="text-muted-foreground">
            Gérez vos services par catégories
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCategoryPopup(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une catégorie
          </Button>
          {categories.length > 0 && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={cleanAllServices}
              title="Nettoyer tous les services pour les tests"
            >
              🧹 Nettoyer
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      {categories.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher une catégorie ou service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Liste des catégories */}
      {filteredCategories.length === 0 && categories.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Aucune catégorie de service</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Commencez par créer votre première catégorie de services. 
              Par exemple : Location, Soins esthétiques, Services à domicile...
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowCategoryPopup(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première catégorie
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={createTestServices}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Services de test
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={cleanAllServices}
                >
                  🧹 Nettoyer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {category.name}
                        <Badge variant="secondary">
                          {category.serviceCount} service{category.serviceCount > 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCategory(category)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir tout
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCreateServiceInCategory(category)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau service
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier catégorie
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateCategory(category)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer catégorie
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCategory(category)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer catégorie
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {category.services.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Aucun service dans cette catégorie
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateServiceInCategory(category)}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le premier service
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {category.services.slice(0, 3).map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            service.isActive ? "bg-green-500" : "bg-gray-400"
                          )} />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {service.settings?.basePrice !== undefined && (
                                <p>
                                  {service.settings.basePrice === 0 ? 'Gratuit' : `À partir de ${service.settings.basePrice}€`}
                                  {service.settings?.durationType === 'days' && service.settings.basePrice > 0 && '/jour'}
                                  {service.settings?.durationType === 'hours' && service.settings.basePrice > 0 && '/heure'}
                                </p>
                              )}
                              {service.settings?.variants && service.settings.variants.length > 0 && (
                                <p className="text-xs">
                                  {service.settings.variants.length} prestation{service.settings.variants.length > 1 ? 's' : ''}
                                </p>
                              )}
                              {service.settings?.options && service.settings.options.length > 0 && (
                                <p className="text-xs">
                                  {service.settings.options.length} option{service.settings.options.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {service._count?.bookings && service._count.bookings > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {service._count.bookings} réservation{service._count.bookings > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service);
                              setShowManageModal(true);
                            }}
                            className="bg-white hover:bg-gray-50"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Gérer
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleService(service)}>
                                {service.isActive ? (
                                  <>🔴 Désactiver</>
                                ) : (
                                  <>🟢 Activer</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateService(service)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
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
                    ))}
                    
                    {category.services.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCategory(category)}
                        className="w-full"
                      >
                        Voir les {category.services.length - 3} autres services
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Popup de création de catégorie */}
      <CategoryPopup
        isOpen={showCategoryPopup}
        onClose={() => setShowCategoryPopup(false)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Modal d'édition de catégorie */}
      <CategoryEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        category={selectedCategory}
        mode={editModalMode}
        onSave={handleSaveCategory}
      />

      {/* Modal de création/modification de service */}
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setEditingService(null);
        }}
        storeId={storeId}
        category={selectedCategory}
        editingService={editingService}
        onServiceCreated={() => {
          loadServices();
          setShowServiceModal(false);
          setEditingService(null);
        }}
      />

      {/* Modal détail de catégorie */}
      <CategoryDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        category={selectedCategory}
        storeId={storeId}
        onServiceUpdate={() => {
          loadServices();
        }}
      />

      {/* Modal de gestion avancée */}
      {selectedService && (
        <ServiceManageModal
          isOpen={showManageModal}
          onClose={() => {
            setShowManageModal(false);
            setSelectedService(null);
          }}
          service={selectedService}
          storeId={storeId}
          onServiceUpdate={loadServices}
        />
      )}
    </div>
  );
}