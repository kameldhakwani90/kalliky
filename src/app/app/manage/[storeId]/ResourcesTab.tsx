'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Wrench,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
  Package,
  PlusCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  type: 'EMPLOYEE' | 'EQUIPMENT';
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  specifications?: any;
  availability?: any;
  constraints?: any;
  costs?: any;
  metadata?: any;
  _count?: {
    assignments: number;
  };
}

interface ResourcesTabProps {
  storeId: string;
  storeName: string;
}

export default function ResourcesTab({ storeId, storeName }: ResourcesTabProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    uniqueId: '',
    type: 'EQUIPMENT' as 'EQUIPMENT' | 'EMPLOYEE',
    specifications: {
      brand: '',
      model: '',
      category: ''
    }
  });

  useEffect(() => {
    loadResources();
  }, [storeId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}/resources`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      setResources(data.resources || []);
      
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      toast.error('Erreur lors du chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = () => {
    setEditingResource(null);
    setFormData({
      name: '',
      description: '',
      uniqueId: '',
      type: 'EQUIPMENT',
      specifications: {
        brand: '',
        model: '',
        category: ''
      }
    });
    setShowResourceModal(true);
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      description: resource.description || '',
      uniqueId: resource.uniqueId || '',
      type: resource.type,
      specifications: resource.specifications || {
        brand: '',
        model: '',
        category: ''
      }
    });
    setShowResourceModal(true);
  };

  const handleSaveResource = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      const url = editingResource 
        ? `/api/stores/${storeId}/resources/${editingResource.id}`
        : `/api/stores/${storeId}/resources`;
      
      const method = editingResource ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }

      toast.success(editingResource ? 'Ressource modifiée' : 'Ressource créée');
      setShowResourceModal(false);
      loadResources();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteResource = async (resource: Resource) => {
    if (!confirm(`Supprimer la ressource "${resource.name}" ?`)) return;
    
    try {
      const response = await fetch(`/api/stores/${storeId}/resources/${resource.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Ressource supprimée');
        loadResources();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const equipmentResources = filteredResources.filter(r => r.type === 'EQUIPMENT');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-gray-400">Chargement des ressources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl p-6 border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Équipements & Ressources</h2>
            <p className="text-gray-400">Gérez vos équipements, machines et outils de travail</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => handleCreateResource()}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un équipement
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl">
            <div className="text-2xl">🔧</div>
            <span className="font-medium text-white">Total équipements</span>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {equipmentResources.length}
            </Badge>
          </div>
          {equipmentResources.filter(r => r.isActive).length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-300">
                {equipmentResources.filter(r => r.isActive).length} actif{equipmentResources.filter(r => r.isActive).length > 1 ? 's' : ''}
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
              placeholder="Rechercher une ressource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {equipmentResources.length === 0 ? (
            <div className="text-center p-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-white mb-2">Aucun équipement trouvé</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? "Aucun équipement ne correspond à votre recherche" : "Commencez par créer votre premier équipement"}
              </p>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                onClick={() => handleCreateResource()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter votre premier équipement
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {equipmentResources.map((resource) => (
                <div 
                  key={resource.id} 
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        🔧
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-white">{resource.name}</h3>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            resource.isActive ? "bg-green-500" : "bg-gray-400"
                          )} />
                          {resource._count?.assignments && resource._count.assignments > 0 && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {resource._count.assignments} service{resource._count.assignments > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        {resource.description && (
                          <p className="text-sm text-gray-400 mt-1">
                            {resource.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {resource.uniqueId && (
                            <span className="text-gray-500">ID: {resource.uniqueId}</span>
                          )}
                          {resource.specifications?.brand && (
                            <span className="text-gray-500">Marque: {resource.specifications.brand}</span>
                          )}
                          {resource.specifications?.model && (
                            <span className="text-gray-500">Modèle: {resource.specifications.model}</span>
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
                          onClick={() => handleEditResource(resource)}
                          className="text-white hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-gray-800"
                          onClick={() => handleDeleteResource(resource)}
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

      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-2xl border border-white/20 text-white shadow-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="flex items-center gap-3 text-white text-2xl font-bold">
              <div className="text-3xl animate-pulse">🔧</div>
              {editingResource ? "Modifier l'équipement" : "Nouvel équipement"}
            </DialogTitle>
            <p className="text-gray-400 text-sm mt-1">
              {editingResource ? "Modifiez les informations de votre équipement" : "Ajoutez un nouvel équipement à votre inventaire"}
            </p>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                Nom de l&apos;équipement
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Imprimante 3D, Poste de soudure, Cabine UV..."
                className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 font-medium flex items-center gap-2">
                <Edit className="h-4 w-4 text-purple-400" />
                Description
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Décrivez l'équipement, ses caractéristiques, son utilisation..."
                className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 font-medium flex items-center gap-2">
                <Settings className="h-4 w-4 text-green-400" />
                Identifiant unique
                <span className="text-xs text-gray-500">(optionnel)</span>
              </Label>
              <Input
                value={formData.uniqueId}
                onChange={(e) => setFormData({...formData, uniqueId: e.target.value})}
                placeholder="Ex: EQP-001, MACHINE-A12..."
                className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
              />
            </div>

            <div className="space-y-4 p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Wrench className="h-4 w-4 text-yellow-400" />
                Spécifications techniques
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs font-medium">Marque</Label>
                  <Input
                    value={formData.specifications.brand}
                    onChange={(e) => setFormData({
                      ...formData, 
                      specifications: {...formData.specifications, brand: e.target.value}
                    })}
                    placeholder="Ex: Canon, Bosch, HP..."
                    className="bg-black/30 border-white/20 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs font-medium">Modèle</Label>
                  <Input
                    value={formData.specifications.model}
                    onChange={(e) => setFormData({
                      ...formData, 
                      specifications: {...formData.specifications, model: e.target.value}
                    })}
                    placeholder="Ex: MX-2000, Pro 3600..."
                    className="bg-black/30 border-white/20 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs font-medium">Catégorie</Label>
                <Input
                  value={formData.specifications.category}
                  onChange={(e) => setFormData({
                    ...formData, 
                    specifications: {...formData.specifications, category: e.target.value}
                  })}
                  placeholder="Ex: Impression, Découpe, Mesure..."
                  className="bg-black/30 border-white/20 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setShowResourceModal(false)}
                className="flex-1 bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveResource}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                {editingResource ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> 
                    Enregistrer les modifications
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" /> 
                    Créer l&apos;équipement
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}