'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Package, 
  Search, 
  Plus, 
  X, 
  Check,
  Filter,
  ShoppingCart,
  Euro,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  productType: string;
  isBookable: boolean;
  stock?: number;
  image?: string;
  variations: Array<{
    id: string;
    name: string;
    prices: any;
  }>;
}

interface LinkedProduct extends Product {
  linkId: string;
  order: number;
}

interface ProductSelectionSectionProps {
  storeId: string;
  serviceId?: string;
  wording: {
    products: string;
    equipment: string;
    staff: string;
    options: string;
  };
}

export default function ProductSelectionSection({ 
  storeId, 
  serviceId, 
  wording 
}: ProductSelectionSectionProps) {
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  // Charger les produits liés
  useEffect(() => {
    if (serviceId && serviceId !== 'temp') {
      loadLinkedProducts();
    }
  }, [serviceId]);

  const loadLinkedProducts = async () => {
    if (!serviceId || serviceId === 'temp') {
      setLinkedProducts([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}/products`);
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setLinkedProducts(data.linkedProducts || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    if (!serviceId) return;

    try {
      const response = await fetch(`/api/services/${serviceId}/products?productId=${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur suppression');
      
      toast.success('Produit retiré du service');
      loadLinkedProducts();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression du lien');
    }
  };

  const getProductTypeBadge = (type: string) => {
    const colors = {
      RENTAL: 'bg-blue-100 text-blue-800 border-blue-300',
      SERVICE_ITEM: 'bg-green-100 text-green-800 border-green-300',
      RETAIL: 'bg-gray-100 text-gray-800 border-gray-300',
      CONSUMABLE: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    
    const labels = {
      RENTAL: 'Location',
      SERVICE_ITEM: 'Service',
      RETAIL: 'Vente',
      CONSUMABLE: 'Consommable'
    };

    return (
      <Badge 
        variant="outline" 
        className={cn("text-xs font-medium", colors[type as keyof typeof colors] || colors.RETAIL)}
      >
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {!serviceId ? (
        <div className="text-center py-8 text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>Enregistrez d'abord les informations de base</p>
          <p className="text-sm">pour pouvoir lier des produits</p>
        </div>
      ) : linkedProducts.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600">
          <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucun produit lié</h3>
          <p className="text-slate-400 mb-4">
            Sélectionnez les produits que vous proposez avec ce service
          </p>
          <Button 
            onClick={() => setShowSelectionModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sélectionner des produits
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">{wording.products}</h3>
              {linkedProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-slate-600 text-slate-300">
                  {linkedProducts.length} produit{linkedProducts.length > 1 ? 's' : ''} lié{linkedProducts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowSelectionModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Sélectionner produits
            </Button>
          </div>
          {linkedProducts.map((product) => (
            <div 
              key={product.linkId} 
              className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
            >
                {/* Image produit si disponible */}
                {product.image && (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white truncate">
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {getProductTypeBadge(product.productType)}
                        <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                          {product.category}
                        </Badge>
                        {product.isBookable && (
                          <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-600">
                            <Check className="h-3 w-3 mr-1" />
                            Réservable
                          </Badge>
                        )}
                        {typeof product.stock === 'number' && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            Stock: {product.stock}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Prix si disponible dans les variations */}
                      {product.variations.length > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-white flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            À partir de XXX€
                          </div>
                          <div className="text-xs text-slate-400">
                            {product.variations.length} variation{product.variations.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkProduct(product.id)}
                        className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}

      {showSelectionModal && (
        <ProductSelectionModal
          isOpen={showSelectionModal}
          onClose={() => setShowSelectionModal(false)}
          storeId={storeId}
          serviceId={serviceId!}
          onUpdate={loadLinkedProducts}
        />
      )}
    </div>
  );
}

// Modal de sélection des produits (version simplifiée, on peut utiliser l'existant)
interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  serviceId: string;
  onUpdate: () => void;
}

function ProductSelectionModal({ 
  isOpen, 
  onClose, 
  storeId, 
  serviceId, 
  onUpdate 
}: ProductSelectionModalProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadAvailableProducts();
    }
  }, [isOpen]);

  const loadAvailableProducts = async () => {
    try {
      setLoading(true);
      // Charger les produits du catalogue au lieu des produits du service
      const response = await fetch(`/api/products?storeId=${storeId}`);
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setAvailableProducts(data.products || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!serviceId || serviceId === 'temp') {
      toast.error('Veuillez d\'abord créer le service');
      return;
    }

    try {
      setLoading(true);
      const promises = Array.from(selectedProducts).map(productId =>
        fetch(`/api/services/${serviceId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, order: 0 })
        })
      );

      await Promise.all(promises);
      
      toast.success(`${selectedProducts.size} produit${selectedProducts.size > 1 ? 's' : ''} lié${selectedProducts.size > 1 ? 's' : ''} au service`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la liaison');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5 text-green-400" />
            Sélectionner des produits
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choisissez les produits de votre catalogue à associer à ce service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-400 focus:ring-green-400/20"
            />
          </div>

          {/* Liste des produits */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun produit disponible</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 border border-slate-600 bg-slate-800 rounded-lg hover:bg-slate-700">
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedProducts);
                      if (checked) {
                        newSelected.add(product.id);
                      } else {
                        newSelected.delete(product.id);
                      }
                      setSelectedProducts(newSelected);
                    }}
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium text-white">{product.name}</div>
                    <div className="text-sm text-slate-400">{product.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getProductTypeBadge(product.productType)}
                      <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-400">
              {selectedProducts.size} produit{selectedProducts.size !== 1 ? 's' : ''} sélectionné{selectedProducts.size !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                Annuler
              </Button>
              <Button 
                onClick={handleLinkProducts}
                disabled={selectedProducts.size === 0 || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                Lier {selectedProducts.size > 0 && selectedProducts.size} produit{selectedProducts.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getProductTypeBadge(type: string) {
  const colors = {
    RENTAL: 'bg-blue-100 text-blue-800 border-blue-300',
    SERVICE_ITEM: 'bg-green-100 text-green-800 border-green-300',
    RETAIL: 'bg-gray-100 text-gray-800 border-gray-300',
    CONSUMABLE: 'bg-orange-100 text-orange-800 border-orange-300'
  };
  
  const labels = {
    RENTAL: 'Location',
    SERVICE_ITEM: 'Service', 
    RETAIL: 'Vente',
    CONSUMABLE: 'Consommable'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-medium", colors[type as keyof typeof colors] || colors.RETAIL)}
    >
      {labels[type as keyof typeof labels] || type}
    </Badge>
  );
}