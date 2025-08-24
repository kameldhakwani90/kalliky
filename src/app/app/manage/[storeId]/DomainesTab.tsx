'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  Link,
  Settings,
  Sparkles,
  Upload,
  Wand2,
  HelpCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ProductLinkModal from '@/components/services/ProductLinkModal';
import CompleteServiceConfigModal from '@/components/services/CompleteServiceConfigModal';

interface Service {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  settings: any;
  linkedProductsCount?: number;
  additionalOptionsCount?: number;
  _count?: {
    bookings: number;
    additionalOptions: number;
  };
}

interface ServicesTabProps {
  storeId: string;
  storeName: string;
  config: any;
  onConfigUpdate: (config: any) => void;
}

export default function ServicesTab({ storeId, storeName, config, onConfigUpdate }: ServicesTabProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleteConfigModal, setShowCompleteConfigModal] = useState(false);
  const [configuringService, setConfiguringService] = useState<Service | null>(null);
  const [showProductLinkModal, setShowProductLinkModal] = useState(false);
  const [linkingService, setLinkingService] = useState<Service | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  useEffect(() => {
    loadServices();
    loadStoreInfo();
  }, [storeId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      console.log('🚀 NOUVEAU DomainesTab - Chargement des services via /api/services');
      const response = await fetch(`/api/services?storeId=${storeId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      console.log('✅ Services chargés via nouvelle API:', data.services?.length || 0);
      setServices(data.services || []);
      
    } catch (error) {
      console.error('Erreur chargement services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const loadStoreInfo = async () => {
    try {
      const response = await fetch(`/api/stores/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setStoreInfo(data);
      }
    } catch (error) {
      console.error('Erreur chargement info store:', error);
    }
  };


  const handleLinkProducts = (service: Service) => {
    setLinkingService(service);
    setShowProductLinkModal(true);
  };

  const handleProductLinkUpdate = () => {
    // Recharger les services pour mettre à jour les compteurs
    loadServices();
  };





  const handleCreateCompleteService = () => {
    setConfiguringService(null);
    setShowCompleteConfigModal(true);
  };

  const handleConfigureService = (service: Service) => {
    setConfiguringService(service);
    setShowCompleteConfigModal(true);
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Supprimer le service "${service.name}" ?`)) return;
    
    try {
      const response = await fetch(`/api/services?id=${service.id}`, {
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


  // Filtrer les services par nom
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto" />
          <p className="text-gray-400">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl p-6 border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Services</h2>
            <p className="text-gray-400">
              Gérez vos services avec une configuration complète : produits, ressources, et options additionnelles
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => window.open('/help/food', '_blank')}
              className="bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Aide
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowUploadModal(true)}
              className="bg-white/5 border-white/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Upload avec IA
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => handleCreateCompleteService()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter service
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl">
            <div className="text-2xl">⚙️</div>
            <span className="font-medium text-white">Total services</span>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {filteredServices.length}
            </Badge>
          </div>
          {filteredServices.filter(s => s.isActive).length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-300">
                {filteredServices.filter(s => s.isActive).length} actif{filteredServices.filter(s => s.isActive).length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl p-6 border space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {filteredServices.length === 0 ? (
            <div className="text-center p-12">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Aucun service trouvé</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? 'Aucun service ne correspond à votre recherche' : 'Commencez par créer votre premier service'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {/* TODO: Ouvrir modal upload IA */}}
                  className="bg-white/5 border-white/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Upload avec IA
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                  onClick={() => handleCreateCompleteService()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre premier service
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        {service.icon || '⚙️'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-white">{service.name}</h3>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            service.isActive ? "bg-green-500" : "bg-gray-400"
                          )} />
                          {service.color && (
                            <div 
                              className="w-4 h-4 rounded-full border border-white/20" 
                              style={{ backgroundColor: service.color }}
                            />
                          )}
                          {(service._count?.additionalOptions || service.additionalOptionsCount) > 0 && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              <Settings className="h-3 w-3 mr-1" />
                              Configuré
                            </Badge>
                          )}
                        </div>
                        
                        {service.description && (
                          <p className="text-sm text-gray-400 mt-1">
                            {service.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {service.linkedProductsCount && service.linkedProductsCount > 0 && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Package className="h-4 w-4" />
                              {service.linkedProductsCount} produit{service.linkedProductsCount > 1 ? 's' : ''} lié{service.linkedProductsCount > 1 ? 's' : ''}
                            </span>
                          )}
                          
                          {(service._count?.additionalOptions || service.additionalOptionsCount) > 0 && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Settings className="h-4 w-4" />
                              {service._count?.additionalOptions || service.additionalOptionsCount} option{((service._count?.additionalOptions || service.additionalOptionsCount) > 1) ? 's' : ''} additionnelle{((service._count?.additionalOptions || service.additionalOptionsCount) > 1) ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem 
                          onClick={() => handleConfigureService(service)}
                          className="text-white hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier le service
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-gray-800"
                          onClick={() => handleDeleteService(service)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de configuration complète */}
      {showCompleteConfigModal && (
        <CompleteServiceConfigModal
          isOpen={showCompleteConfigModal}
          onClose={() => {
            setShowCompleteConfigModal(false);
            setConfiguringService(null);
          }}
          onSuccess={() => {
            setShowCompleteConfigModal(false);
            setConfiguringService(null);
            loadServices();
          }}
          storeId={storeId}
          service={configuringService}
        />
      )}

      {/* Modal de liaison des produits */}
      {showProductLinkModal && linkingService && (
        <ProductLinkModal
          isOpen={showProductLinkModal}
          onClose={() => {
            setShowProductLinkModal(false);
            setLinkingService(null);
          }}
          serviceId={linkingService.id}
          serviceName={linkingService.name}
          onUpdate={handleProductLinkUpdate}
        />
      )}

    </div>
  );
}