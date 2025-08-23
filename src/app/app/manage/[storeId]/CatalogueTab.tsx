'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingData, setProcessingData] = useState<{
    sessionId: string;
    status: string;
    progress: string;
    productsCreated?: number;
  } | null>(null);

  const pollProcessingStatus = async (sessionId: string) => {
    const maxAttempts = 40; // 40 * 3 seconds = 2 minutes max
    let attempts = 0;
    
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/ai/upload-status/${sessionId}`);
        const data = await response.json();
        
        setProcessingData(prev => prev ? {
          ...prev,
          status: data.status,
          progress: getProgressMessage(data.status),
          productsCreated: data.productsCreated
        } : null);
        
        if (data.status === 'COMPLETED') {
          // Succès !
          toast.success(`🎉 ${data.productsCreated} produits créés automatiquement !`);
          setIsProcessing(false);
          setProcessingData(null);
          onImportComplete(); // Refresh la liste des produits
          onClose();
          return;
        }
        
        if (data.status === 'FAILED') {
          throw new Error('Le traitement IA a échoué');
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Timeout: le traitement prend trop de temps');
        }
        
        // Continuer le polling dans 3 secondes
        setTimeout(poll, 3000);
        
      } catch (error) {
        console.error('Polling error:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors du traitement');
        setIsProcessing(false);
        setProcessingData(null);
      }
    };
    
    // Commencer le polling
    poll();
  };
  
  const getProgressMessage = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Préparation de l\'analyse...';
      case 'EXTRACTING_TEXT': return 'L\'IA analyse votre menu...';
      case 'PROCESSING': return 'Création des produits en cours...';
      case 'COMPLETED': return 'Traitement terminé !';
      case 'FAILED': return 'Erreur lors du traitement';
      default: return 'Traitement en cours...';
    }
  };

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

    // Limite de taille : 10 MB
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes

    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez PDF, JPEG, PNG, Excel ou CSV.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux. Limite : 10 MB maximum.');
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

      const data = await response.json();
      
      // Démarrer le polling pour suivre le traitement IA
      setIsUploading(false);
      setIsProcessing(true);
      setProcessingData({
        sessionId: data.sessionId,
        status: data.status,
        progress: 'Analyse de votre menu en cours...'
      });

      await pollProcessingStatus(data.sessionId);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import');
      setIsUploading(false);
      setIsProcessing(false);
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
      <DialogContent className="max-w-lg bg-black/95 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-xl">
            <div className="text-2xl">🤖</div>
            Import AI - Catalogue
          </DialogTitle>
        </DialogHeader>
        
        {isProcessing ? (
          // Mode "IA en train de réfléchir"
          <div className="space-y-8 py-4">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full flex items-center justify-center mb-4">
                <div className="text-4xl animate-bounce">🧠</div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">IA en action</h3>
              <p className="text-blue-400 animate-pulse text-lg font-medium">
                {processingData?.progress}
              </p>
            </div>

            {/* Animation de points qui bougent */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>

            {/* Barre de progression simulée */}
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"></div>
            </div>

            <div className="text-center text-gray-400 text-sm">
              Extraction des produits, prix et compositions...
              {processingData?.productsCreated && (
                <div className="text-green-400 mt-2">
                  ✅ {processingData.productsCreated} produits créés
                </div>
              )}
            </div>
          </div>
        ) : (
          // Mode upload normal
          <div className="space-y-6">
            <p className="text-gray-400">
              Uploadez votre menu et notre IA extraira automatiquement tous les produits avec leurs compositions.
            </p>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-400 bg-blue-500/10' 
                  : 'border-white/30 bg-white/5 hover:bg-white/10'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  ) : (
                    <div className="text-3xl">📤</div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">
                    {isUploading ? 'Upload en cours...' : 'Glissez votre fichier ici'}
                  </p>
                  <p className="text-gray-400">ou cliquez pour sélectionner</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Formats: PDF, JPEG, PNG, Excel, CSV
                  </p>
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
        )}
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

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
          status: newStatus,
          storeId: storeId
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
      {/* Header moderne avec navigation par icônes */}
      <div className="backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl p-6 border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Catalogue des produits</h2>
            <p className="text-gray-400">Gérez vos produits, catégories et prix</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleImport}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </div>

        {/* Navigation par icônes + boutons d'action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === 'products'
                  ? 'bg-white/20 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="text-2xl">🛍️</div>
              <span className="font-medium">Produits</span>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                {products.length}
              </Badge>
            </button>
            
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === 'categories'
                  ? 'bg-white/20 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="text-2xl">🏷️</div>
              <span className="font-medium">Catégories</span>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                {allCategories.length - 1}
              </Badge>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <Button 
                onClick={handleAddProduct}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter produit
              </Button>
            )}
            {activeTab === 'categories' && (
              <Button 
                onClick={() => setIsCategoryFormOpen(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter catégorie
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu Produits */}
      {activeTab === 'products' && (
        <div className="backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl p-6 border space-y-6">
          {/* Barre de recherche et filtres */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition-all"
              />
            </div>
            <select
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none transition-all"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all" className="bg-gray-800">Toutes les catégories</option>
              {allCategories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
              ))}
            </select>
          </div>

          {/* Liste des produits moderne avec scroll */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {loading ? (
              <div className="text-center p-8 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                Chargement des produits...
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center p-12">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold text-white mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-400 mb-6">Commencez par ajouter votre premier produit</p>
                <Button 
                  onClick={handleAddProduct}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter votre premier produit
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {paginatedProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="backdrop-blur-xl bg-white/10 border-white/20 rounded-2xl p-6 border hover:bg-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                            <div className="text-xl">🛍️</div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                              >
                                {product.category}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{product.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              {product.variations && product.variations.length > 0 && product.variations[0].prices 
                                ? `${Object.values(product.variations[0].prices)[0]?.toFixed(2) || '0.00'}€`
                                : '0.00€'
                              }
                            </div>
                            <div className="text-sm text-gray-400">Prix de base</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={product.status === 'ACTIVE'}
                              onCheckedChange={() => handleToggleAvailability(product)}
                              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500 data-[state=unchecked]:bg-white/20 scale-75"
                            />
                            <div className="text-sm">
                              <div className={`font-medium ${product.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'}`}>
                                {product.status === 'ACTIVE' ? "Disponible" : "Indisponible"}
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem onClick={() => handleEditProduct(product)} className="text-white hover:bg-gray-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6">
                    <div className="text-gray-400 text-sm">
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        ← Précédent
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`${
                              currentPage === page
                                ? 'bg-white text-black'
                                : 'text-white hover:bg-white/10'
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        Suivant →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Contenu Catégories */}
      {activeTab === 'categories' && (
        <div className="backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl p-6 border space-y-6">
          {/* Catégories de produits */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Catégories de produits</h3>
            {allCategories.filter(c => c !== 'all').length === 0 ? (
              <div className="text-center p-12">
                <div className="text-6xl mb-4">🏷️</div>
                <h3 className="text-xl font-semibold text-white mb-2">Aucune catégorie trouvée</h3>
                <p className="text-gray-400 mb-6">Organisez vos produits en créant des catégories</p>
                <Button 
                  onClick={() => setIsCategoryFormOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer votre première catégorie
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {allCategories.filter(c => c !== 'all').map((categoryName) => (
                  <div 
                    key={categoryName}
                    className="backdrop-blur-xl bg-white/10 border-white/20 rounded-2xl p-6 border hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center">
                          <div className="text-xl">🏷️</div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{categoryName}</h3>
                          <p className="text-gray-400 text-sm">Catégorie de produits</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="secondary" 
                          className="bg-green-500/20 text-green-300 border-green-500/30"
                        >
                          {products.filter(p => p.category === categoryName).length} produits
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toast.info('Fonction à implémenter')}
                              className="text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catégories de composants */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Catégories de composants</h3>
            <p className="text-gray-400 text-sm mb-6">Pour organiser les ingrédients et compositions</p>
            
            {categories.length === 0 ? (
              <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-4xl mb-4">🧩</div>
                <h4 className="text-lg font-semibold text-white mb-2">Aucune catégorie de composants</h4>
                <p className="text-gray-400">Les catégories de composants sont créées automatiquement lors de l'import IA</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {categories.map((category) => (
                  <div 
                    key={category.id}
                    className="backdrop-blur-xl bg-white/10 border-white/20 rounded-2xl p-6 border hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.color || '#64748b'}20` }}
                        >
                          <div className="text-xl">🧩</div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                          <p className="text-gray-400 text-sm">{category.description || 'Aucune description'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="secondary" 
                          className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                        >
                          {category.components?.length || 0} composants
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog de formulaire de produit - Style Apple */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-xl border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <div className="text-2xl">🛍️</div>
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

      {/* Dialog de formulaire de catégorie - Style Apple */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent className="max-w-md bg-black/95 backdrop-blur-xl border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <div className="text-2xl">🏷️</div>
              Ajouter une catégorie
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="categoryName" className="text-white">Nom de la catégorie *</Label>
              <input
                id="categoryName"
                placeholder="ex: Légumes, Viandes..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="categoryDescription" className="text-white">Description</Label>
              <input
                id="categoryDescription"
                placeholder="Description de la catégorie..."
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition-all"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCategoryFormOpen(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAddCategory}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
              >
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