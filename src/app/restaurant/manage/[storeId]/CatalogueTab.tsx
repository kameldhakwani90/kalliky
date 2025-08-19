'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Package, 
  Edit, 
  Trash2, 
  MoreVertical,
  Upload,
  Download,
  Loader2,
  Tag,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ProductForm from './ProductForm';

// Composant d'import simple
interface SimpleImportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onImportComplete: () => void;
}

function SimpleImportPopup({ isOpen, onClose, storeId, onImportComplete }: SimpleImportPopupProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez PDF, JPEG, PNG, Excel ou CSV.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', storeId);
      formData.append('autoProcess', 'true');
      formData.append('extractComponents', 'true');

      const response = await fetch('/api/ai/menu-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      toast.success('🎉 Import réussi ! Produits et composants créés automatiquement.');
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🤖 Import AI - Catalogue
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uploadez votre menu et notre IA extraira automatiquement tous les produits avec leurs compositions.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{isUploading ? 'Upload en cours...' : 'Glissez votre fichier ici'}</p>
                <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
              </div>
            </div>
            
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  stock?: number;
  popularity?: number;
  profitMargin?: number;
  variations: Array<{
    id: string;
    name: string;
    prices: any;
  }>;
  image?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  components?: any[];
}

interface CatalogueTabProps {
  storeId: string;
  storeName: string;
  config: any;
  onConfigUpdate: (config: any) => void;
}

export default function CatalogueTab({ storeId, storeName, config, onConfigUpdate }: CatalogueTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);

  // Charger les vrais produits et catégories depuis l'API
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [storeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?storeId=${storeId}&includeComposition=true`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/components/categories/${storeId}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const allCategories = ['all', ...new Set([...products.map(p => p.category), ...customCategories])];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      await fetchProducts(); // Recharger la liste
      toast.success('Produit supprimé avec succès');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    // ✅ Mise à jour immédiate du state local pour UX fluide
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, status: newStatus } : p
    ));
    
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          status: newStatus
        }),
      });

      if (!response.ok) {
        // ❌ En cas d'erreur, revenir en arrière
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: product.status } : p
        ));
        throw new Error('Erreur lors de la mise à jour');
      }

      toast.success(newStatus === 'ACTIVE' ? 'Produit activé' : 'Produit désactivé');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Erreur lors de la mise à jour de la disponibilité');
    }
  };

  const handleProductSave = async (productData: any) => {
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const body = editingProduct 
        ? { ...productData, id: editingProduct.id }
        : { ...productData, storeId };


      const response = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      await fetchProducts(); // Recharger la liste
      setIsProductFormOpen(false);
      setEditingProduct(null);
      toast.success(editingProduct ? 'Produit modifié' : 'Produit créé');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleImport = () => {
    setIsImportPopupOpen(true);
  };

  const handleExport = () => {
    try {
      // Préparer les données à exporter
      const exportData = products.map(product => ({
        'Nom': product.name,
        'Description': product.description,
        'Catégorie': product.category,
        'Statut': product.status === 'ACTIVE' ? 'Disponible' : 'Indisponible',
        'Prix Dine-in': product.variations?.[0]?.prices?.['dine-in'] || 0,
        'Prix Takeaway': product.variations?.[0]?.prices?.['takeaway'] || 0,
        'Prix Delivery': product.variations?.[0]?.prices?.['delivery'] || 0,
        'Prix Pickup': product.variations?.[0]?.prices?.['pickup'] || 0,
        'Stock': product.stock || 0,
        'Popularité': product.popularity || 0,
        'Marge': product.profitMargin || 0,
        'Tags': product.tags?.join(', ') || '',
        'Créé le': new Date(product.createdAt).toLocaleDateString('fr-FR'),
        'Modifié le': new Date(product.updatedAt).toLocaleDateString('fr-FR')
      }));

      // Convertir en CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Échapper les virgules et guillemets
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalogue-${storeName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`📊 Catalogue exporté ! ${products.length} produits`);
    } catch (error) {
      console.error('Error exporting catalogue:', error);
      toast.error('Erreur lors de l\'export du catalogue');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    // Vérifier si la catégorie existe déjà
    if (allCategories.includes(newCategoryName.trim())) {
      toast.error('Cette catégorie existe déjà');
      return;
    }

    // Ajouter la catégorie à la liste locale
    setCustomCategories(prev => [...prev, newCategoryName.trim()]);
    setIsCategoryFormOpen(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    toast.success(`Catégorie "${newCategoryName.trim()}" ajoutée. Elle est maintenant disponible dans le formulaire de produit.`);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    
    try {
      const response = await fetch(`/api/components/categories/${storeId}/${categoryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      await fetchCategories();
      toast.success('Catégorie supprimée avec succès');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catalogue des produits</CardTitle>
              <CardDescription>
                Gérez vos produits, catégories et prix
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produits
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Catégories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Gestion des produits</h3>
                <Button size="sm" onClick={handleAddProduct}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Toutes les catégories</option>
                  {allCategories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{products.length}</div>
                    <p className="text-xs text-muted-foreground">Produits totaux</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{allCategories.length - 1}</div>
                    <p className="text-xs text-muted-foreground">Catégories</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{products.filter(p => p.status === 'ACTIVE').length}</div>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const prices = products
                          .filter(p => p.variations && p.variations.length > 0 && p.variations[0].prices)
                          .map(p => Object.values(p.variations[0].prices)[0] as number)
                          .filter(price => typeof price === 'number' && !isNaN(price));
                        return prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2) : '0.00';
                      })()}€
                    </div>
                    <p className="text-xs text-muted-foreground">Prix moyen</p>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des produits */}
              <div className="border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4">Produit</th>
                  <th className="text-left p-4">Catégorie</th>
                  <th className="text-left p-4">Prix</th>
                  <th className="text-left p-4">Disponibilité</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      Aucun produit trouvé
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">
                          {product.variations && product.variations.length > 0 && product.variations[0].prices 
                            ? `${Object.values(product.variations[0].prices)[0]?.toFixed(2) || '0.00'}€`
                            : '0.00€'
                          }
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={product.status === 'ACTIVE'}
                            onCheckedChange={() => handleToggleAvailability(product)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {product.status === 'ACTIVE' ? "Disponible" : "Indisponible"}
                            </span>
                            {product.status === 'ACTIVE' && product.availabilitySchedule?.enabled && (
                              <span className="text-xs text-muted-foreground">
                                📅 Planning personnalisé
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Gestion des catégories</h3>
                <Button size="sm" onClick={() => setIsCategoryFormOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter une catégorie
                </Button>
              </div>

              {/* Statistiques des catégories */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{allCategories.length - 1}</div>
                    <p className="text-xs text-muted-foreground">Catégories de produits</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {categories.reduce((sum, cat) => sum + (cat.components?.length || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Composants totaux</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {Math.round(categories.reduce((sum, cat) => sum + (cat.components?.length || 0), 0) / Math.max(categories.length, 1))}
                    </div>
                    <p className="text-xs text-muted-foreground">Moy. par catégorie composants</p>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des catégories de produits */}
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Catégorie</th>
                      <th className="text-left p-4">Nombre de produits</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategories.filter(c => c !== 'all').length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center p-8 text-muted-foreground">
                          Aucune catégorie de produit trouvée
                        </td>
                      </tr>
                    ) : (
                      allCategories.filter(c => c !== 'all').map((categoryName) => (
                        <tr key={categoryName} className="border-t hover:bg-muted/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded bg-blue-500"></div>
                              <div>
                                <div className="font-medium">{categoryName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              {products.filter(p => p.category === categoryName).length} produits
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    // TODO: Renommer tous les produits de cette catégorie
                                    toast.info('Fonction à implémenter');
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section des catégories de composants */}
              <div className="mt-8">
                <h4 className="text-md font-semibold mb-4">Catégories de composants (pour les compositions)</h4>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4">Catégorie</th>
                        <th className="text-left p-4">Description</th>
                        <th className="text-left p-4">Composants</th>
                        <th className="text-right p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-muted-foreground">
                            Aucune catégorie de composant trouvée
                          </td>
                        </tr>
                      ) : (
                        categories.map((category) => (
                          <tr key={category.id} className="border-t hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color || '#64748b' }}></div>
                                <div>
                                  <div className="font-medium">{category.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">
                                {category.description || 'Aucune description'}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">
                                {category.components?.length || 0} composants
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de formulaire de produit */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            storeId={storeId}
            onSave={handleProductSave}
            onCancel={() => setIsProductFormOpen(false)}
            availableCategories={allCategories.filter(c => c !== 'all')}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de formulaire de catégorie */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nom de la catégorie *</Label>
              <Input
                id="categoryName"
                placeholder="ex: Légumes, Viandes..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Input
                id="categoryDescription"
                placeholder="Description de la catégorie..."
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCategoryFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddCategory}>
                Créer la catégorie
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup d'import AI */}
      <SimpleImportPopup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        storeId={storeId}
        onImportComplete={() => {
          fetchProducts();
          fetchCategories();
        }}
      />
    </div>
  );
}