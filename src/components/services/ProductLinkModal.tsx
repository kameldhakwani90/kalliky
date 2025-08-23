'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Package, 
  Plus, 
  Minus, 
  Euro,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  image?: string;
  productType: string;
  isBookable: boolean;
  stock?: number;
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

interface ProductLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  onUpdate: () => void;
}

export default function ProductLinkModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  onUpdate
}: ProductLinkModalProps) {
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && serviceId) {
      loadProducts();
    }
  }, [isOpen, serviceId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}/products`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      setLinkedProducts(data.linkedProducts || []);
      setAvailableProducts(data.availableProducts || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId,
          order: linkedProducts.length 
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la liaison');
      
      toast.success('Produit lié au service');
      loadProducts();
      onUpdate();
    } catch (error) {
      console.error('Erreur liaison produit:', error);
      toast.error('Erreur lors de la liaison du produit');
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/products?productId=${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression du lien');
      
      toast.success('Produit délié du service');
      loadProducts();
      onUpdate();
    } catch (error) {
      console.error('Erreur suppression lien:', error);
      toast.error('Erreur lors de la suppression du lien');
    }
  };

  const handleBulkLink = async () => {
    if (selectedProducts.size === 0) return;

    try {
      setLoading(true);
      const promises = Array.from(selectedProducts).map(productId =>
        fetch(`/api/services/${serviceId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId,
            order: linkedProducts.length 
          })
        })
      );

      await Promise.all(promises);
      
      toast.success(`${selectedProducts.size} produits liés au service`);
      setSelectedProducts(new Set());
      loadProducts();
      onUpdate();
    } catch (error) {
      console.error('Erreur liaison multiple:', error);
      toast.error('Erreur lors de la liaison des produits');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailable = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinked = linkedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductTypeBadge = (type: string) => {
    const colors = {
      RENTAL: 'bg-blue-100 text-blue-800',
      SERVICE_ITEM: 'bg-green-100 text-green-800',
      RETAIL: 'bg-gray-100 text-gray-800',
      CONSUMABLE: 'bg-orange-100 text-orange-800'
    };
    
    const labels = {
      RENTAL: 'Location',
      SERVICE_ITEM: 'Service',
      RETAIL: 'Vente',
      CONSUMABLE: 'Consommable'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || colors.RETAIL}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits liés - {serviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Produits disponibles */}
            <div className="border rounded-lg p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Produits disponibles ({filteredAvailable.length})</h3>
                {selectedProducts.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleBulkLink}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Lier {selectedProducts.size}
                  </Button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit disponible</p>
                    <p className="text-sm">Les produits doivent être de type Location ou Service</p>
                  </div>
                ) : (
                  filteredAvailable.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
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
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getProductTypeBadge(product.productType)}
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                                {product.stock !== null && (
                                  <span className="text-xs text-gray-500">
                                    Stock: {product.stock || 0}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleLinkProduct(product.id)}
                              className="shrink-0 h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Produits liés */}
            <div className="border rounded-lg p-4 flex flex-col">
              <h3 className="font-medium mb-3">Produits liés ({filteredLinked.length})</h3>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredLinked.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit lié</p>
                    <p className="text-sm">Sélectionnez des produits à gauche</p>
                  </div>
                ) : (
                  filteredLinked.map((product) => (
                    <div key={product.linkId} className="border rounded-lg p-3 bg-green-50 border-green-200">
                      <div className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getProductTypeBadge(product.productType)}
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                                {product.variations.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {product.variations.length} variante{product.variations.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUnlinkProduct(product.id)}
                              className="shrink-0 h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}