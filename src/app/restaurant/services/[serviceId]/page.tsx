

'use client';

import Image from 'next/image';
import { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Wand2, Tag, Info, ArrowLeft, ChevronRight, Store, MoreHorizontal, Pencil, Trash2, Search, Clock, ImagePlus, Plus, X, List, Layers, Ruler, Box, CalendarDays, Users, Calendar, DollarSign, Settings, Trash, PackagePlus, FileText, Bot, MessageCircle, Check, Ban, BadgeEuro, Utensils, ConciergeBell, BrainCircuit, Loader2, Brain, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { addDays, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import IntelligentCatalogConfig from '@/components/ai/IntelligentCatalogConfig';


//======= COMMON DATA STRUCTURES =======//

type DayAvailability = {
  enabled: boolean;
  from: string;
  to: string;
};

type Availability = {
  type: 'always' | 'scheduled';
  schedule: {
    [key: string]: DayAvailability;
  };
};

const defaultAvailability: Availability = {
  type: 'always',
  schedule: {
    monday: { enabled: true, from: '09:00', to: '22:00' },
    tuesday: { enabled: true, from: '09:00', to: '22:00' },
    wednesday: { enabled: true, from: '09:00', to: '22:00' },
    thursday: { enabled: true, from: '09:00', to: '22:00' },
    friday: { enabled: true, from: '09:00', to: '22:00' },
    saturday: { enabled: true, from: '09:00', to: '22:00' },
    sunday: { enabled: true, from: '09:00', to: '22:00' },
  }
};

const daysOfWeek = [
    { id: 'monday', label: { fr: 'Lundi', en: 'Monday' } },
    { id: 'tuesday', label: { fr: 'Mardi', en: 'Tuesday' } },
    { id: 'wednesday', label: { fr: 'Mercredi', en: 'Wednesday' } },
    { id: 'thursday', label: { fr: 'Jeudi', en: 'Thursday' } },
    { id: 'friday', label: { fr: 'Vendredi', en: 'Friday' } },
    { id: 'saturday', label: { fr: 'Samedi', en: 'Saturday' } },
    { id: 'sunday', label: { fr: 'Dimanche', en: 'Sunday' } },
];

type ServiceType = 'products' | 'reservations' | 'consultation';

type Service = {
  id: string;
  storeId: string;
  name: string;
  description: string;
  type: ServiceType;
  consultationConfig?: ConsultationConfig;
};

// This is now a mock store of all services.
// In a real app this would be in a database.
const mockServices: Service[] = [
    { id: 'service-1', storeId: 'store-1', name: 'Restauration sur place', description: 'Le catalogue de tous les produits servis à table.', type: 'products' },
    { id: 'service-2', storeId: 'store-1', name: 'Vente à emporter', description: 'Le catalogue des produits disponibles à la vente à emporter.', type: 'products' },
    { id: 'service-3', storeId: 'store-2', name: 'Location de la salle de réception', description: 'Service de réservation pour les événements privés.', type: 'reservations' },
    { id: 'service-4', storeId: 'store-3', name: 'Location de voitures de luxe', description: 'Réservez nos véhicules exclusifs à la journée ou à la semaine.', type: 'reservations' },
    { id: 'service-5', storeId: 'store-4', name: 'Consultation Droit des Affaires', description: 'Prise de rendez-vous qualifiée par IA pour les nouveaux clients.', type: 'consultation', consultationConfig: {
        description: "Avocat spécialisé en droit des affaires, fusions-acquisitions et droit des sociétés.",
        acceptanceCriteria: ["création de société", "levée de fonds", "pacte d'actionnaires", "cession de fonds de commerce", "M&A"],
        rejectionCriteria: ["droit de la famille", "divorce", "garde d'enfants", "droit pénal", "droit du travail côté employé"],
        fees: "Les honoraires sont facturés au temps passé sur la base d'un taux horaire de 300€ HT. Un premier appel de 15 minutes est offert pour qualifier le dossier.",
    }},
];


//======= PRODUCTS-SPECIFIC DATA STRUCTURES =======//

type SaleChannel = 'dine-in' | 'takeaway' | 'delivery' | 'call-and-collect';

const saleChannels: { id: SaleChannel, label: Record<'fr' | 'en', string> }[] = [
    { id: 'dine-in', label: { fr: 'Sur place', en: 'Dine-in' } },
    { id: 'takeaway', label: { fr: 'À emporter', en: 'Takeaway' } },
    { id: 'delivery', label: { fr: 'Livraison', en: 'Delivery' } },
    { id: 'call-and-collect', label: { fr: 'Call & Collect', en: 'Call & Collect' } },
];

type PricesByChannel = Partial<Record<SaleChannel, number>>;
type VariationPrice = { [variationId: string]: PricesByChannel };
type VariationVisibility = { [variationId: string]: boolean };

type CompositionOption = {
  id: string;
  name: string;
  prices?: VariationPrice;
  composition?: CompositionStep[];
  visibility?: VariationVisibility;
};

type CompositionStep = {
  id: string;
  title: string;
  options: CompositionOption[];
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
};

type Variation = {
  id: string;
  name: string;
  prices: PricesByChannel;
};

type ItemManagementType = 'stock' | 'reservation';

type CatalogItem = {
  id: string;
  categoryId: string;
  name:string;
  description: string;
  image: string;
  imageHint: string;
  tags?: string[];
  variations: Variation[];
  composition?: CompositionStep[];
  status: 'active' | 'out-of-stock' | 'inactive';
  availability: Availability;
  managementType: ItemManagementType;
  stockQuantity?: number;
};

type Category = { id: string; name: string };

const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Plats' }, { id: 'cat-2', name: 'Entrées' }, { id: 'cat-3', name: 'Menus' }, { id: 'cat-4', name: 'Desserts' }, { id: 'cat-5', name: 'Boissons' },
];

const initialCatalogItems: CatalogItem[] = [
    { id: 'item-1', categoryId: 'cat-1', name: 'Burger "Le Personnalisé"', description: 'Composez le burger de vos rêves !', image: 'https://placehold.co/600x400.png', imageHint: 'custom burger', tags: ['Populaire', 'Soir', 'Famille'], status: 'active', availability: defaultAvailability, managementType: 'stock', stockQuantity: 100, variations: [{ id: 'var-1-1', name: 'Taille unique', prices: { 'dine-in': 16.50, 'takeaway': 16.50, 'delivery': 18.00 } }], composition: [ { id: 'step-1-1', title: 'Étape 1 : Le Pain (1 au choix)', selectionType: 'single', isRequired: true, options: [ { id: 'opt-1-1-1', name: 'Pain Brioché' }, { id: 'opt-1-1-2', name: 'Pain Sésame' }, ] } ] },
    { id: 'item-2', categoryId: 'cat-2', name: 'Salade César', description: 'Laitue romaine, poulet grillé, croûtons...', image: 'https://placehold.co/600x400.png', imageHint: 'caesar salad', tags: ['Léger', 'Midi', 'Froid'], status: 'active', availability: {...defaultAvailability, type: 'scheduled' }, managementType: 'stock', stockQuantity: 50, variations: [{ id: 'var-2-1', name: 'Taille unique', prices: { 'dine-in': 12.50 } }], },
];


//======= RESERVATIONS-SPECIFIC DATA STRUCTURES =======//
type PricingModel = 'fixed' | 'per_hour' | 'per_day' | 'per_unit';
type OptionPricingModel = 'fixed' | 'per_hour' | 'per_day';

type PriceOption = {
  id: string;
  name: string;
  price: number;
  pricingModel: OptionPricingModel;
};

type Pricing = {
  model: PricingModel;
  basePrice?: number;
  unitName?: string;
  perUnitPrice?: number;
  options?: PriceOption[];
};

type ReservableItem = {
    id: string;
    name: string;
    description: string;
    duration?: number; // in minutes, optional now
    pricing: Pricing;
    availability: Availability;
    status: 'active' | 'inactive';
};

type Reservation = {
    id: string;
    reservableItemId: string;
    customerName: string;
    startTime: Date;
    endTime: Date;
    status: 'confirmed' | 'pending' | 'cancelled';
};

const today = new Date();
const initialReservations: Reservation[] = [
    { id: 'resa-1', reservableItemId: 'res-item-1', customerName: 'Entreprise Corp', startTime: new Date(today.getFullYear(), today.getMonth(), 15, 14, 0), endTime: new Date(today.getFullYear(), today.getMonth(), 15, 18, 0), status: 'confirmed' },
    { id: 'resa-2', reservableItemId: 'res-item-3', customerName: 'Jean Dupont', startTime: addDays(today, 1), endTime: addDays(today, 2), status: 'confirmed' },
    { id: 'resa-3', reservableItemId: 'res-item-2', customerName: 'Marie Curie', startTime: addDays(today, 3), endTime: addDays(today, 3, 1), status: 'pending' },
];

const initialReservableItems: ReservableItem[] = [
    { id: 'res-item-1', name: 'Location Salle "Prestige"', description: 'Notre plus grande salle pour vos événements corporatifs ou privés. Capacité 100 personnes.', duration: 240, pricing: { model: 'fixed', basePrice: 500, options: [{id: 'opt-1', name: 'Nettoyage inclus', price: 150, pricingModel: 'fixed'}] }, availability: defaultAvailability, status: 'active' },
    { id: 'res-item-2', name: 'Consultation Décorateur', description: 'Une heure de consultation avec notre décorateur floral pour votre événement.', duration: 60, pricing: { model: 'per_hour', basePrice: 80 }, availability: defaultAvailability, status: 'active' },
    { id: 'res-item-3', name: 'Location Porsche 911', description: 'Vivez une expérience inoubliable au volant d\'une voiture de légende.', duration: 1440, pricing: { model: 'per_day', basePrice: 950 }, availability: defaultAvailability, status: 'active' },
    { id: 'res-item-4', name: 'Trajet VTC', description: 'Service de transport avec chauffeur.', pricing: { model: 'per_unit', unitName: 'km', perUnitPrice: 2.5, basePrice: 10 }, availability: defaultAvailability, status: 'active' },
];


//======= CONSULTATION-SPECIFIC DATA STRUCTURES =======//

type ConsultationConfig = {
    description: string;
    acceptanceCriteria: string[];
    rejectionCriteria: string[];
    fees: string;
};


//======= DYNAMIC COMPONENTS =======//

// Placeholder for EditableCompositionDisplay (it's large, keeping it minimal for clarity)
const EditableCompositionDisplay: React.FC<any> = () => <div>[Composition Editor]</div>;

const ProductsView: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const storeId = params.serviceId as string;
  
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editedItem, setEditedItem] = useState<CatalogItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);
  const [syncPopupTab, setSyncPopupTab] = useState('import');
  const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [compositionHistory, setCompositionHistory] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // États pour la composition
  const [isCompositionEnabled, setIsCompositionEnabled] = useState(false);
  const [compositionType, setCompositionType] = useState<'steps' | 'simple' | null>(null);
  const [compositionSteps, setCompositionSteps] = useState<any[]>([]);
  const [showCompositionBuilder, setShowCompositionBuilder] = useState(false);
  
  // États pour les variations et tarifs
  const [hasMultipleSizes, setHasMultipleSizes] = useState(false);
  const [hasUniformPricing, setHasUniformPricing] = useState(true); // Prix unique pour tous les canaux
  const [variations, setVariations] = useState([{
    id: 'var-1',
    name: 'Standard',
    prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
    uniformPrice: 0 // Prix unique
  }]);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  
  // États pour la configuration d'option
  const [isOptionConfigOpen, setIsOptionConfigOpen] = useState(false);
  const [currentEditingOption, setCurrentEditingOption] = useState<{
    stepId: string;
    optionId: string;
    option: any;
  } | null>(null);

  const currentUserPlan = 'pro';

  // Charger les produits depuis l'API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products?storeId=${storeId}&includeComposition=true`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Transformer les données pour correspondre au format CatalogItem
          const transformedItems: CatalogItem[] = data.products.map((product: any) => ({
            id: product.id,
            categoryId: 'cat-1', // Temporaire - on utilisera les vraies catégories plus tard
            name: product.name,
            description: product.description || '',
            image: product.image || 'https://placehold.co/600x400.png',
            imageHint: product.imageHint || product.name.toLowerCase(),
            tags: product.tags || [],
            variations: product.variations.map((v: any) => ({
              id: v.id,
              name: v.name,
              prices: v.prices
            })),
            composition: product.composition || [],
            status: product.status === 'ACTIVE' ? 'active' as const : 
                   product.status === 'OUT_OF_STOCK' ? 'out-of-stock' as const : 
                   'inactive' as const,
            availability: defaultAvailability,
            managementType: 'stock' as const,
            stockQuantity: 100, // Temporaire
          }));
          
          setCatalogItems(transformedItems);
          
          // Extraire les catégories uniques des produits
          const productCategories = [...new Set(data.products.map((p: any) => p.category))];
          const dynamicCategories = productCategories.map((cat, index) => ({
            id: `cat-${index + 1}`,
            name: cat
          }));
          
          if (dynamicCategories.length > 0) {
            setCategories(dynamicCategories);
          }
        } else {
          setError('Erreur lors du chargement des produits');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  // Fonction pour recharger les produits après upload
  const refreshProducts = async () => {
    try {
      const response = await fetch(`/api/products?storeId=${storeId}&includeComposition=true`);
      if (response.ok) {
        const data = await response.json();
        const transformedItems: CatalogItem[] = data.products.map((product: any) => ({
          id: product.id,
          categoryId: 'cat-1',
          name: product.name,
          description: product.description || '',
          image: product.image || 'https://placehold.co/600x400.png',
          imageHint: product.imageHint || product.name.toLowerCase(),
          tags: product.tags || [],
          variations: product.variations.map((v: any) => ({
            id: v.id,
            name: v.name,
            prices: v.prices
          })),
          composition: product.composition || [],
          status: product.status === 'ACTIVE' ? 'active' as const : 
                 product.status === 'OUT_OF_STOCK' ? 'out-of-stock' as const : 
                 'inactive' as const,
          availability: defaultAvailability,
          managementType: 'stock' as const,
          stockQuantity: 100,
        }));
        setCatalogItems(transformedItems);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
      const searchMatch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && statusMatch && searchMatch;
    });
  }, [catalogItems, selectedCategory, selectedStatus, searchTerm]);

  const handleItemClick = (item: CatalogItem) => {
    const itemCopy = JSON.parse(JSON.stringify(item));
    setEditedItem(itemCopy);
    
    // Initialiser les variations avec les données de l'item
    if (itemCopy.variations && itemCopy.variations.length > 0) {
      const variationsWithUniformPrice = itemCopy.variations.map((v: any) => ({
        ...v,
        uniformPrice: v.prices?.['dine-in'] || v.prices?.['takeaway'] || 0
      }));
      setVariations(variationsWithUniformPrice);
      setHasMultipleSizes(itemCopy.variations.length > 1);
    } else {
      // Si pas de variations, créer une variation par défaut
      setVariations([{
        id: 'var-1',
        name: 'Standard',
        prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
        uniformPrice: 0
      }]);
      setHasMultipleSizes(false);
    }
    
    // Initialiser la composition si elle existe
    if (itemCopy.composition && itemCopy.composition.length > 0) {
      setCompositionSteps(itemCopy.composition);
      setIsCompositionEnabled(true);
      setShowCompositionBuilder(true);
      setCompositionType('steps'); // Par défaut, on considère que c'est par étapes
    } else {
      setCompositionSteps([]);
      setIsCompositionEnabled(false);
      setShowCompositionBuilder(false);
    }
    
    setCompositionHistory([]);
    setIsPopupOpen(true);
  };
  
  const handleCreateNewItem = () => {
    const newItem: CatalogItem = {
      id: `item-${Date.now()}`, name: "Nouvel article", categoryId: categories.length > 0 ? categories[0].id : "cat-1",
      description: '', image: 'https://placehold.co/600x400.png', imageHint: 'new item', tags: [],
      variations: [{ id: `var_${Date.now()}`, name: 'Taille unique', prices: {} }], status: 'inactive',
      availability: defaultAvailability, managementType: 'stock', stockQuantity: 0,
    };
    setEditedItem(newItem);
    setCompositionHistory([]);
    setIsPopupOpen(true);
    setIsSyncPopupOpen(false);
  };

  const deleteMenuItem = (itemId: string) => { setCatalogItems(p => p.filter(i => i.id !== itemId)); };
  const toggleItemStatus = (itemId: string, checked: boolean) => { setCatalogItems(p => p.map(i => i.id === itemId ? { ...i, status: checked ? 'out-of-stock' : 'active' } : i)); };
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'N/A';
  const getPriceDisplay = (item: CatalogItem) => {
    if (!item.variations[0]) return 'N/A';
    const firstVariationPrices = Object.values(item.variations[0].prices);
    if (firstVariationPrices.length === 0) return 'N/A';
    const firstPrice = firstVariationPrices[0];
    if (item.variations.length > 1) return `à partir de ${firstPrice.toFixed(2)}€`
    return `${firstPrice.toFixed(2)}€`
  }

  // Fonction pour ajouter une nouvelle catégorie
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim()
    };
    
    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    
    // Optionnel : fermer l'onglet après ajout
    // setSyncPopupTab('import');
  };

  // Fonctions pour gérer la composition
  const handleCompositionToggle = (enabled: boolean) => {
    setIsCompositionEnabled(enabled);
    if (!enabled) {
      setCompositionType(null);
      setCompositionSteps([]);
      setShowCompositionBuilder(false);
    }
  };

  const handleCompositionTypeSelect = (type: 'steps' | 'simple') => {
    setCompositionType(type);
    setShowCompositionBuilder(true);
    
    // Initialiser avec une étape de base selon le type
    if (type === 'steps') {
      setCompositionSteps([{
        id: `step-${Date.now()}`,
        title: '',
        isRequired: true,
        selectionType: 'SINGLE',
        options: []
      }]);
    } else {
      setCompositionSteps([{
        id: `step-${Date.now()}`,
        title: 'Options',
        isRequired: false,
        selectionType: 'MULTIPLE',
        options: []
      }]);
    }
  };

  const addCompositionStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: '',
      isRequired: false,
      selectionType: compositionType === 'steps' ? 'SINGLE' : 'MULTIPLE',
      options: []
    };
    setCompositionSteps(prev => [...prev, newStep]);
  };

  const updateCompositionStep = (stepId: string, field: string, value: any) => {
    setCompositionSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const addOptionToStep = (stepId: string) => {
    const newOption = {
      id: `option-${Date.now()}`,
      name: '',
      prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0 }
    };
    
    setCompositionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, options: [...step.options, newOption] }
        : step
    ));
  };

  const updateStepOption = (stepId: string, optionId: string, field: string, value: any) => {
    setCompositionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? {
            ...step, 
            options: step.options.map((option: any) => 
              option.id === optionId ? { ...option, [field]: value } : option
            )
          }
        : step
    ));
  };

  const removeCompositionStep = (stepId: string) => {
    setCompositionSteps(prev => prev.filter(step => step.id !== stepId));
  };

  const removeStepOption = (stepId: string, optionId: string) => {
    setCompositionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, options: step.options.filter((option: any) => option.id !== optionId) }
        : step
    ));
  };

  // Fonctions pour gérer les variations et tarifs
  const addVariation = () => {
    const newVariation = {
      id: `var-${Date.now()}`,
      name: `Taille ${variations.length + 1}`,
      prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
      uniformPrice: 0
    };
    setVariations(prev => [...prev, newVariation]);
  };

  const updateVariation = (varId: string, field: string, value: any) => {
    setVariations(prev => prev.map(variation => 
      variation.id === varId ? { ...variation, [field]: value } : variation
    ));
  };

  const updateVariationPrice = (varId: string, channel: string, price: number) => {
    setVariations(prev => prev.map(variation => 
      variation.id === varId 
        ? { ...variation, prices: { ...variation.prices, [channel]: price } }
        : variation
    ));
  };

  const removeVariation = (varId: string) => {
    if (variations.length > 1) {
      setVariations(prev => prev.filter(variation => variation.id !== varId));
    }
  };

  // Fonctions pour gérer les tags
  const addTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setCurrentTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleMultipleSizesToggle = (enabled: boolean) => {
    setHasMultipleSizes(enabled);
    if (!enabled && variations.length > 1) {
      // Garder seulement la première variation
      setVariations([variations[0]]);
    }
  };

  const handleUniformPricingToggle = (enabled: boolean) => {
    setHasUniformPricing(enabled);
    if (enabled) {
      // Synchroniser tous les prix avec le prix uniforme
      setVariations(prev => prev.map(variation => {
        const uniformPrice = variation.uniformPrice || 0;
        return {
          ...variation,
          prices: {
            'dine-in': uniformPrice,
            'takeaway': uniformPrice,
            'delivery': uniformPrice,
            'pickup': uniformPrice
          }
        };
      }));
    }
  };

  const updateUniformPrice = (varId: string, price: number) => {
    setVariations(prev => prev.map(variation => 
      variation.id === varId 
        ? { 
            ...variation, 
            uniformPrice: price,
            prices: hasUniformPricing ? {
              'dine-in': price,
              'takeaway': price,
              'delivery': price,
              'pickup': price
            } : variation.prices
          }
        : variation
    ));
  };

  // Fonction pour formater automatiquement les prix
  const formatPrice = (value: string) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  // Fonction pour ouvrir la configuration d'option
  const openOptionConfig = (stepId: string, optionId: string) => {
    const step = compositionSteps.find(s => s.id === stepId);
    const option = step?.options.find((o: any) => o.id === optionId);
    
    if (option) {
      // S'assurer que l'option a des prix pour toutes les variations
      const updatedOption = {
        ...option,
        pricesByVariation: option.pricesByVariation || variations.reduce((acc: any, variation) => {
          acc[variation.id] = option.prices || { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 };
          return acc;
        }, {})
      };
      
      setCurrentEditingOption({ stepId, optionId, option: updatedOption });
      setIsOptionConfigOpen(true);
    }
  };

  // Fonction pour mettre à jour le prix d'une option pour une variation
  const updateOptionPriceForVariation = (variationId: string, channel: string, value: number) => {
    if (!currentEditingOption) return;
    
    setCurrentEditingOption(prev => {
      if (!prev) return prev;
      
      const updatedOption = { ...prev.option };
      
      // Initialiser pricesByVariation si nécessaire
      if (!updatedOption.pricesByVariation) {
        updatedOption.pricesByVariation = {};
      }
      
      // Initialiser la variation si nécessaire
      if (!updatedOption.pricesByVariation[variationId]) {
        updatedOption.pricesByVariation[variationId] = {
          'dine-in': 0,
          'takeaway': 0,
          'delivery': 0,
          'pickup': 0
        };
      }
      
      // Mettre à jour le prix
      if (channel === 'uniform') {
        // Prix uniforme pour tous les canaux
        updatedOption.pricesByVariation[variationId] = {
          'dine-in': value,
          'takeaway': value,
          'delivery': value,
          'pickup': value
        };
      } else {
        // Prix spécifique pour ce canal
        updatedOption.pricesByVariation[variationId][channel] = value;
      }
      
      return {
        ...prev,
        option: updatedOption
      };
    });
  };

  // Fonction pour sauvegarder la configuration d'option
  const saveOptionConfig = (updatedOption: any) => {
    if (!currentEditingOption) return;
    
    setCompositionSteps(prev => prev.map(step => 
      step.id === currentEditingOption.stepId 
        ? {
            ...step, 
            options: step.options.map((option: any) => 
              option.id === currentEditingOption.optionId ? currentEditingOption.option : option
            )
          }
        : step
    ));
    
    setIsOptionConfigOpen(false);
    setCurrentEditingOption(null);
  };

  // Fonction pour fermer le popup et réinitialiser les états
  const closePopup = () => { 
    setIsPopupOpen(false); 
    setTimeout(() => { 
      setEditedItem(null); 
      setCompositionHistory([]);
      // Réinitialiser les états de composition
      setIsCompositionEnabled(false);
      setCompositionType(null);
      setCompositionSteps([]);
      setShowCompositionBuilder(false);
      // Réinitialiser les variations et tags
      setHasMultipleSizes(false);
      setHasUniformPricing(true);
      setVariations([{
        id: 'var-1',
        name: 'Standard',
        prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
        uniformPrice: 0
      }]);
      setCurrentTags([]);
      setTagInput('');
      // Réinitialiser la configuration d'option
      setIsOptionConfigOpen(false);
      setCurrentEditingOption(null);
    }, 300); 
  }
  const handleBackComposition = () => {};
  const currentView = null;
  const handleAddTag = () => {};
  const handleRemoveTag = (t: string) => {};
  const handleImageChange = (e: any) => {};
  const handleVariationPriceChange = (vId: string, cId: SaleChannel, val: string) => {};
  const handleRemoveVariation = (vId: string) => {};
  const handleAddVariation = () => {};
  const handleVariationChange = (vId: string, field: keyof Variation, value: any) => {};

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Chargement du catalogue...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Catalogue du service</h1>
              <p className="mt-1 text-sm text-gray-500">Consultez et gérez les articles pour ce service.</p>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Dialog open={isAIConfigOpen} onOpenChange={setIsAIConfigOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Brain className="mr-2 h-4 w-4" />
                    Configuration IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      Configuration IA Intelligente
                    </DialogTitle>
                    <DialogDescription>
                      Automatisation complète de votre catalogue avec l'intelligence artificielle
                    </DialogDescription>
                  </DialogHeader>
                  <IntelligentCatalogConfig
                    storeId={params.serviceId}
                    catalogItems={catalogItems}
                    onConfigSave={(config) => {
                      console.log('Configuration IA sauvegardée:', config);
                      setIsAIConfigOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
              
              <Dialog open={isSyncPopupOpen} onOpenChange={setIsSyncPopupOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter / Synchroniser
                  </Button>
                </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Outils de création et synchronisation</DialogTitle></DialogHeader>
            <Tabs value={syncPopupTab} onValueChange={setSyncPopupTab} className="pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="import">Importer</TabsTrigger>
                <TabsTrigger value="article">Article</TabsTrigger>
                <TabsTrigger value="category">Catégorie</TabsTrigger>
              </TabsList>
              <TabsContent value="import" className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Gagnez du temps. Importez votre catalogue depuis un fichier (Excel, etc.) ou une simple photo de votre menu. Notre IA s'occupe de tout.
                </p>
                <MenuSyncForm onUploadComplete={refreshProducts} />
              </TabsContent>
              <TabsContent value="article" className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">Idéal pour ajouter rapidement un ou deux articles. Configurez toutes les options manuellement pour un contrôle total.</p>
                <Button className="w-full" onClick={handleCreateNewItem}><PlusCircle className="mr-2 h-4 w-4"/>Créer un nouvel article</Button>
              </TabsContent>
              <TabsContent value="category" className="pt-4 space-y-4">
                 <p className="text-sm text-muted-foreground">Organisez votre catalogue en créant des catégories pour regrouper vos articles (ex: Entrées, Plats, Boissons).</p>
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Nom de la nouvelle catégorie</Label>
                  <Input 
                    id="cat-name" 
                    placeholder="Ex: Boissons fraîches"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <PlusCircle className="mr-2 h-4 w-4"/>
                  Ajouter la catégorie
                </Button>
                
                {/* Liste des catégories existantes */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Catégories existantes ({categories.length})</Label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {categories.map(category => (
                        <div key={category.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm font-medium">{category.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setCategories(prev => prev.filter(c => c.id !== category.id))}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Filters Section */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher par nom..." 
                  className="pl-10 border-gray-200" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="flex gap-4 md:w-auto w-full">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="md:w-48 w-full border-gray-200">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="md:w-48 w-full border-gray-200">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="out-of-stock">En rupture</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Table Section */}
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[80px] font-medium text-gray-700">Image</TableHead>
                  <TableHead className="font-medium text-gray-700">Nom</TableHead>
                  <TableHead className="hidden sm:table-cell font-medium text-gray-700">Catégorie</TableHead>
                  <TableHead className="hidden md:table-cell font-medium text-gray-700">Prix</TableHead>
                  <TableHead className="hidden lg:table-cell font-medium text-gray-700">Gestion</TableHead>
                  <TableHead className="font-medium text-gray-700">En rupture</TableHead>
                  <TableHead className="text-right font-medium text-gray-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalogItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        width={60} 
                        height={40} 
                        data-ai-hint={item.imageHint} 
                        className="w-16 h-10 object-cover rounded-lg shadow-sm" 
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="border-gray-200">
                        {getCategoryName(item.categoryId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium">
                      {getPriceDisplay(item)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="text-xs font-normal bg-gray-100">
                        {`Stock: ${item.stockQuantity ?? 'Illimité'}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        className="data-[state=checked]:bg-red-500" 
                        checked={item.status === 'out-of-stock'} 
                        onCheckedChange={(checked) => toggleItemStatus(item.id, checked)} 
                        disabled={item.status === 'inactive'} 
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <span className="sr-only">Ouvrir</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleItemClick(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()} 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible et supprimera cet article définitivement.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMenuItem(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>

    {editedItem && <Dialog open={isPopupOpen} onOpenChange={closePopup}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            {compositionHistory.length > 0 && <Button variant="ghost" size="sm" onClick={handleBackComposition} className="absolute left-4 top-4 h-auto p-1.5 rounded-md z-10"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>}
            <DialogTitle className="text-center text-2xl font-headline">{compositionHistory.length > 0 ? '...' : (editedItem.name || 'Nouvel Article')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Colonne gauche : Informations Générales */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Image de l'article */}
                  <div className="space-y-2">
                    <Label>Image de l'article</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center">
                        {editedItem?.image ? (
                          <Image src={editedItem.image} alt="" width={128} height={80} className="rounded-lg object-cover" />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <Input 
                        placeholder="https://..." 
                        value={editedItem?.image || ''} 
                        onChange={(e) => setEditedItem(prev => prev ? {...prev, image: e.target.value} : null)}
                      />
                    </div>
                  </div>

                  {/* Titre de l'article */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de l'article</Label>
                    <Input 
                      id="title"
                      placeholder="ex: Burger Classique"
                      value={editedItem?.name || ''} 
                      onChange={(e) => setEditedItem(prev => prev ? {...prev, name: e.target.value} : null)}
                    />
                  </div>

                  {/* Catégorie */}
                  <div className="space-y-2">
                    <Label>Catégorie*</Label>
                    <Select 
                      value={editedItem?.categoryId || ''} 
                      onValueChange={(value) => setEditedItem(prev => prev ? {...prev, categoryId: value} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="ex: Un délicieux burger avec..."
                      value={editedItem?.description || ''} 
                      onChange={(e) => setEditedItem(prev => prev ? {...prev, description: e.target.value} : null)}
                      rows={3}
                    />
                  </div>

                </CardContent>
              </Card>

              {/* Tailles & Tarifs - Design 2025 */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-blue-600" />
                      Tailles & Tarifs
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="uniform-pricing" className="text-sm font-medium">
                          Prix unique
                        </Label>
                        <Switch 
                          id="uniform-pricing"
                          checked={hasUniformPricing}
                          onCheckedChange={handleUniformPricingToggle}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="multiple-sizes" className="text-sm font-medium">
                          Plusieurs tailles
                        </Label>
                        <Switch 
                          id="multiple-sizes"
                          checked={hasMultipleSizes}
                          onCheckedChange={handleMultipleSizesToggle}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {hasUniformPricing 
                      ? "Même prix pour tous les canaux de vente" 
                      : hasMultipleSizes 
                        ? "Configurez différentes tailles avec des prix spécifiques par canal de vente"
                        : "Prix différents par canal de vente"
                    }
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  
                  <div className="space-y-4">
                    {/* En-têtes des colonnes */}
                    {hasUniformPricing ? (
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <Box className="h-3 w-3" />
                          {hasMultipleSizes ? "Taille" : "Article"}
                        </div>
                        <div className="text-center">Prix unique</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <Box className="h-3 w-3" />
                          {hasMultipleSizes ? "Taille" : "Article"}
                        </div>
                        <div className="text-center">Sur Place</div>
                        <div className="text-center">À Emporter</div>
                        <div className="text-center">Livraison</div>
                        <div className="text-center">Collecte</div>
                      </div>
                    )}
                    
                    {/* Variations dynamiques */}
                    {variations.map((variation, index) => (
                      hasUniformPricing ? (
                        /* Mode prix unique */
                        <div 
                          key={variation.id} 
                          className="grid grid-cols-2 gap-3 items-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {/* Nom de la variation */}
                          <div className="flex items-center gap-2">
                            {hasMultipleSizes ? (
                              <Input 
                                value={variation.name}
                                onChange={(e) => updateVariation(variation.id, 'name', e.target.value)}
                                className="text-sm font-medium border-0 bg-transparent focus:bg-background"
                                placeholder="Nom de la taille"
                              />
                            ) : (
                              <div className="text-sm font-medium text-muted-foreground">
                                Prix standard
                              </div>
                            )}
                          </div>

                          {/* Prix unique */}
                          <div className="relative flex items-center">
                            <Input 
                              type="number"
                              step="0.01"
                              value={variation.uniformPrice?.toFixed(2) || '0.00'}
                              onChange={(e) => updateUniformPrice(variation.id, parseFloat(e.target.value) || 0)}
                              onBlur={(e) => {
                                // Force 2 decimal places formatting on blur
                                const value = parseFloat(e.target.value) || 0;
                                e.target.value = value.toFixed(2);
                              }}
                              className="text-center text-sm border-0 bg-background/80 focus:bg-background pr-8"
                              placeholder="0.00"
                            />
                            <span className="absolute right-2 text-xs text-muted-foreground pointer-events-none">
                              €
                            </span>
                            {hasMultipleSizes && variations.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeVariation(variation.id)}
                                className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Mode prix par canal */
                        <div 
                          key={variation.id} 
                          className="grid grid-cols-5 gap-3 items-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {/* Nom de la variation */}
                          <div className="flex items-center gap-2">
                            {hasMultipleSizes ? (
                              <Input 
                                value={variation.name}
                                onChange={(e) => updateVariation(variation.id, 'name', e.target.value)}
                                className="text-sm font-medium border-0 bg-transparent focus:bg-background"
                                placeholder="Nom de la taille"
                              />
                            ) : (
                              <div className="text-sm font-medium text-muted-foreground">
                                Prix standard
                              </div>
                            )}
                          </div>

                          {/* Prix par canal */}
                          {['dine-in', 'takeaway', 'delivery', 'pickup'].map((channel) => (
                            <div key={channel} className="relative">
                              <Input 
                                type="number"
                                step="0.01"
                                value={(variation.prices[channel] || 0).toFixed(2)}
                                onChange={(e) => updateVariationPrice(variation.id, channel, parseFloat(e.target.value) || 0)}
                                onBlur={(e) => {
                                  // Force 2 decimal places formatting on blur
                                  const value = parseFloat(e.target.value) || 0;
                                  e.target.value = value.toFixed(2);
                                }}
                                className="text-center text-sm border-0 bg-background/80 focus:bg-background"
                                placeholder="0.00"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                €
                              </span>
                            </div>
                          ))}

                          {/* Bouton supprimer (seulement si multiple et plus d'une variation) */}
                          {hasMultipleSizes && variations.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeVariation(variation.id)}
                              className="ml-auto h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    ))}

                    {/* Bouton ajouter variation */}
                    {hasMultipleSizes && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addVariation}
                        className="w-full border-dashed border-2 h-12 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une taille
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section Tags - Design moderne */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    Tags & Étiquettes
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajoutez des mots-clés pour faciliter la recherche et l'organisation
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  
                  {/* Input pour ajouter des tags */}
                  <div className="flex gap-2 mb-4">
                    <Input 
                      placeholder="Ajouter un tag (ex: végétarien, épicé...)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                      size="sm"
                      className="px-4"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Liste des tags */}
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer group"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {currentTags.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Aucun tag ajouté. Commencez à taper pour ajouter des étiquettes.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Colonne droite : Composition */}
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-600" />
                      Composition de l'article
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="composition-toggle" className="text-sm font-medium">
                        Article configurable
                      </Label>
                      <Switch 
                        id="composition-toggle"
                        checked={isCompositionEnabled}
                        onCheckedChange={handleCompositionToggle}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isCompositionEnabled 
                      ? "Article avec options personnalisables (ex: burger avec choix d'ingrédients)"
                      : "Article simple sans options de personnalisation"
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  {!isCompositionEnabled ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">
                        Activez l'interrupteur pour créer un article avec des options
                        ou des étapes de personnalisation (ex: Burger, Pizza).
                      </p>
                    </div>
                  ) : !showCompositionBuilder && compositionSteps.length === 0 ? (
                    <div className="space-y-4 p-2">
                      {/* Option 1 : Composition par étapes */}
                      <Card 
                        className="cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50"
                        onClick={() => handleCompositionTypeSelect('steps')}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="relative">
                            <Layers className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-purple-100 rounded-full flex items-center justify-center">
                              <Layers className="h-2 w-2 text-purple-600" />
                            </div>
                          </div>
                          <h3 className="font-semibold mb-2 text-gray-900">Créer une composition par étapes</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Idéal pour burgers, sandwichs, poké bowls...
                          </p>
                          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-purple-600 font-medium">
                            <span>Configuration avancée</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Option 2 : Liste simple */}
                      <Card 
                        className="cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 border-2 border-dashed border-green-200 hover:border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
                        onClick={() => handleCompositionTypeSelect('simple')}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="relative">
                            <List className="h-12 w-12 mx-auto mb-3 text-green-600" />
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-100 rounded-full flex items-center justify-center">
                              <Plus className="h-2 w-2 text-green-600" />
                            </div>
                          </div>
                          <h3 className="font-semibold mb-2 text-gray-900">Ajouter une liste d'options simple</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Idéal pour suppléments, extras, garnitures...
                          </p>
                          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
                            <span>Configuration rapide</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* Composition Builder */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {compositionType === 'steps' ? 'Composition par étapes' : 'Options simples'}
                        </h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowCompositionBuilder(false)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Retour
                        </Button>
                      </div>

                      {/* Liste des étapes */}
                      {compositionSteps.map((step, index) => (
                        <Card key={step.id} className="border-dashed">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Input 
                                placeholder={compositionType === 'steps' ? `Étape ${index + 1}` : "Nom du groupe d'options"}
                                value={step.title}
                                onChange={(e) => updateCompositionStep(step.id, 'title', e.target.value)}
                              />
                              <div className="flex items-center space-x-2">
                                <Label className="text-xs">Requis</Label>
                                <Switch 
                                  checked={step.isRequired}
                                  onCheckedChange={(checked) => updateCompositionStep(step.id, 'isRequired', checked)}
                                />
                                {compositionSteps.length > 1 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeCompositionStep(step.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Options de l'étape */}
                            {step.options.map((option: any, optionIndex: number) => (
                              <div key={option.id} className="flex items-center gap-2 pl-4 p-2 rounded-lg bg-background border border-border/50 hover:border-border transition-colors">
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                
                                <Input 
                                  placeholder="Nom de l'option"
                                  value={option.name}
                                  onChange={(e) => updateStepOption(step.id, option.id, 'name', e.target.value)}
                                  className="flex-1 min-w-0 border-0 bg-transparent focus:bg-muted/50"
                                />
                                
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={(option.prices?.['dine-in'] || 0).toFixed(2)}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      updateStepOption(step.id, option.id, 'prices', {
                                        ...option.prices,
                                        'dine-in': value
                                      });
                                    }}
                                    onBlur={(e) => {
                                      // Force 2 decimal places formatting on blur
                                      const value = parseFloat(e.target.value) || 0;
                                      e.target.value = value.toFixed(2);
                                    }}
                                    className="w-16 sm:w-20 text-center border-0 bg-muted/50 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">€</span>
                                </div>

                                {/* Bouton de configuration avec icône ⚙️ */}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openOptionConfig(step.id, option.id)}
                                  className={`h-8 w-8 p-0 flex-shrink-0 transition-colors ${
                                    option.hasSubOptions || option.linkedComponentId 
                                      ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                                      : 'hover:bg-blue-100 hover:text-blue-600'
                                  }`}
                                  title="Configurer l'option (prix par canal, composants...)"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>

                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeStepOption(step.id, option.id)}
                                  className="h-8 w-8 p-0 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addOptionToStep(step.id)}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Ajouter une option
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      <Button 
                        variant="outline" 
                        onClick={addCompositionStep}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une {compositionType === 'steps' ? 'étape' : 'section'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
          <DialogFooter className="px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={closePopup}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {/* Popup de configuration d'option */}
      <Dialog open={isOptionConfigOpen} onOpenChange={setIsOptionConfigOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurer l'option : {currentEditingOption?.option?.name || ''}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Ajoutez des sous-options pour une personnalisation avancée (ex: choix de la 
              cuisson pour une viande).
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            
            {/* Toggle pour activer la configuration */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-medium">Activer la configuration de cette option</h3>
                <p className="text-sm text-muted-foreground">
                  Permet d'ajouter des choix spécifiques pour cette option
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            {/* Prix par taille si plusieurs tailles */}
            {hasMultipleSizes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Prix par taille
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configurez des prix différents selon la taille du produit
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {variations.map((variation) => (
                      <div key={variation.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{variation.name}</span>
                        </div>
                        
                        {hasUniformPricing ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              step="0.01"
                              value={(currentEditingOption?.option?.pricesByVariation?.[variation.id]?.['dine-in'] || 0).toFixed(2)}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                updateOptionPriceForVariation(variation.id, 'uniform', value);
                              }}
                              className="w-20 text-center"
                              placeholder="0.00"
                            />
                            <span className="text-xs text-muted-foreground">€</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {['dine-in', 'takeaway', 'delivery', 'pickup'].map((channel) => (
                              <div key={channel} className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground mb-1">
                                  {channel === 'dine-in' ? 'Sur place' : 
                                   channel === 'takeaway' ? 'Emporter' :
                                   channel === 'delivery' ? 'Livraison' : 'Collecte'}
                                </span>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  value={(currentEditingOption?.option?.pricesByVariation?.[variation.id]?.[channel] || 0).toFixed(2)}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    updateOptionPriceForVariation(variation.id, channel, value);
                                  }}
                                  className="w-16 text-center text-xs"
                                  placeholder="0.00"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Étapes de sous-options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Étapes de sous-options
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Créez des étapes pour les options de cette option.
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <Button 
                    variant="outline"
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une Étape de Sous-Option
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionConfigOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => saveOptionConfig(currentEditingOption?.option)}>
              Enregistrer l'Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


const ReservationsView: React.FC = () => {
    const { t } = useLanguage();
    const [reservableItems, setReservableItems] = useState(initialReservableItems);
    const [reservations, setReservations] = useState(initialReservations);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);
    const [syncPopupTab, setSyncPopupTab] = useState('import');
    const [editedItem, setEditedItem] = useState<Partial<ReservableItem> | null>(null);

    const handleNewItem = () => {
        setEditedItem({
            pricing: { model: 'fixed', basePrice: 0, options: [] },
            availability: defaultAvailability,
            status: 'active',
        });
        setIsItemDialogOpen(true);
        setIsSyncPopupOpen(false);
    };

    const handleEditItem = (item: ReservableItem) => {
        setEditedItem(JSON.parse(JSON.stringify(item))); // Deep copy
        setIsItemDialogOpen(true);
    };

    const handleDeleteItem = (itemId: string) => {
        setReservableItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSaveItem = () => {
        if (!editedItem || !editedItem.name) return; // Basic validation
        const finalItem: ReservableItem = {
            id: editedItem.id || `res-item-${Date.now()}`,
            name: editedItem.name,
            description: editedItem.description || '',
            duration: editedItem.duration || undefined,
            pricing: editedItem.pricing || { model: 'fixed', basePrice: 0 },
            availability: editedItem.availability || defaultAvailability,
            status: editedItem.status || 'active',
        };
        setReservableItems(prev => {
            const exists = prev.some(s => s.id === finalItem.id);
            return exists ? prev.map(s => s.id === finalItem.id ? finalItem : s) : [...prev, finalItem];
        });
        setIsItemDialogOpen(false);
    };
    
    const reservationsForSelectedDay = useMemo(() => {
        return reservations.filter(r => selectedDate && isSameDay(r.startTime, selectedDate));
    }, [reservations, selectedDate]);

    const handlePricingChange = <T extends keyof Pricing>(field: T, value: Pricing[T]) => {
        setEditedItem(prev => {
            if (!prev) return null;
            const newPricing = { ...(prev.pricing || { model: 'fixed' }), [field]: value };
            // Reset fields that are not relevant for the new model
            if (field === 'model') {
                if (value !== 'per_unit') {
                    delete newPricing.unitName;
                    delete newPricing.perUnitPrice;
                }
                if (value === 'per_unit') {
                     delete newPricing.basePrice;
                }
            }
            return { ...prev, pricing: newPricing };
        });
    };
    
    const handleOptionChange = (index: number, field: keyof PriceOption, value: any) => {
        setEditedItem(prev => {
            if (!prev || !prev.pricing || !prev.pricing.options) return prev;
            const newOptions = [...prev.pricing.options];
            (newOptions[index] as any)[field] = value;
            return { ...prev, pricing: { ...prev.pricing, options: newOptions } };
        });
    };

    const addOption = () => {
        setEditedItem(prev => {
            if (!prev || !prev.pricing) return prev;
            const newOption: PriceOption = { id: `opt-${Date.now()}`, name: '', price: 0, pricingModel: 'fixed' };
            const options = [...(prev.pricing.options || []), newOption];
            return { ...prev, pricing: { ...prev.pricing, options } };
        });
    };

    const removeOption = (index: number) => {
        setEditedItem(prev => {
             if (!prev || !prev.pricing || !prev.pricing.options) return prev;
             const options = prev.pricing.options.filter((_, i) => i !== index);
             return { ...prev, pricing: { ...prev.pricing, options } };
        });
    };

    const getPriceDisplay = (item: ReservableItem) => {
        let text = '';
        const price = item.pricing.basePrice;

        switch(item.pricing.model) {
            case 'fixed':
            case 'per_hour':
            case 'per_day':
                text = `${(price || 0).toFixed(2)}€`;
                if (item.pricing.model === 'per_hour') text += ' / h';
                if (item.pricing.model === 'per_day') text += ' / jour';
                break;
            case 'per_unit':
                text = `${(item.pricing.perUnitPrice || 0).toFixed(2)}€ / ${item.pricing.unitName || 'unité'}`;
                if (price) text = `${price.toFixed(2)}€ + ${text}`;
                break;
        }

        if (item.pricing.options && item.pricing.options.length > 0) {
            return `À partir de ${text}`;
        }
        return text;
    };


    return (
        <>
            <Tabs defaultValue="calendar">
                <TabsList className="mb-4">
                    <TabsTrigger value="calendar"><Calendar className="mr-2 h-4 w-4"/> Calendrier</TabsTrigger>
                    <TabsTrigger value="prestations"><Settings className="mr-2 h-4 w-4"/> Prestations</TabsTrigger>
                </TabsList>
                <TabsContent value="calendar">
                    <Card>
                        <CardContent className="grid grid-cols-1 gap-6 p-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <ShadcnCalendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="mx-auto rounded-md border"
                                    locale={fr}
                                    components={{
                                        DayContent: (props) => {
                                            const isReserved = reservations.some(r => isSameDay(r.startTime, props.date));
                                            return (
                                                <div className="relative flex h-full w-full items-center justify-center">
                                                    <span className="relative z-10">{format(props.date, 'd')}</span>
                                                    {isReserved && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary"></span>}
                                                </div>
                                            )
                                        }
                                    }}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="mb-3 text-lg font-semibold">Réservations pour le {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : ''}</h3>
                                <div className="space-y-3">
                                    {reservationsForSelectedDay.length > 0 ? reservationsForSelectedDay.map(res => {
                                        const item = reservableItems.find(i => i.id === res.reservableItemId);
                                        return (
                                            <Card key={res.id} className="bg-muted/50">
                                                <CardContent className="flex items-center justify-between p-3">
                                                    <div>
                                                        <p className="font-semibold">{item?.name}</p>
                                                        <p className="text-sm text-muted-foreground">{res.customerName}</p>
                                                        <p className="text-xs text-muted-foreground">{format(res.startTime, 'HH:mm')} - {format(res.endTime, 'HH:mm')}</p>
                                                    </div>
                                                    <Badge variant={res.status === 'confirmed' ? 'default' : 'secondary'} className={res.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}>{res.status}</Badge>
                                                </CardContent>
                                            </Card>
                                        )
                                    }) : (
                                        <div className="py-10 text-center text-muted-foreground">
                                            <p>Aucune réservation pour ce jour.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="prestations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Prestations Réservables</CardTitle>
                            <CardDescription>Configurez les services ou biens que vos clients peuvent réserver.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-right">
                                <Dialog open={isSyncPopupOpen} onOpenChange={setIsSyncPopupOpen}>
                                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Ajouter / Synchroniser</Button></DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                        <DialogHeader><DialogTitle>Création de Prestations</DialogTitle></DialogHeader>
                                        <Tabs value={syncPopupTab} onValueChange={setSyncPopupTab} className="pt-2">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="import">Importer</TabsTrigger>
                                            <TabsTrigger value="prestation">Prestation</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="import" className="pt-4 space-y-4">
                                            <p className="text-sm text-muted-foreground">
                                            Gagnez du temps. Importez vos prestations depuis une brochure, un flyer ou un fichier. Notre IA s'occupe de tout.
                                            </p>
                                            <MenuSyncForm />
                                        </TabsContent>
                                        <TabsContent value="prestation" className="pt-4 space-y-4">
                                            <p className="text-sm text-muted-foreground">Idéal pour ajouter une prestation rapidement. Configurez toutes les options manuellement pour un contrôle total.</p>
                                            <Button className="w-full" onClick={handleNewItem}><PlusCircle className="mr-2 h-4 w-4"/>Créer une nouvelle prestation</Button>
                                        </TabsContent>
                                        </Tabs>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Prestation</TableHead>
                                            <TableHead>Durée</TableHead>
                                            <TableHead>Prix</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reservableItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>{item.duration ? `${item.duration} min` : 'N/A'}</TableCell>
                                                <TableCell>{getPriceDisplay(item)}</TableCell>
                                                <TableCell><Badge variant={item.status === 'active' ? 'default' : 'secondary'} className={item.status === 'active' ? 'bg-green-100 text-green-700' : ''}>{item.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditItem(item)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editedItem?.id ? 'Modifier la prestation' : 'Nouvelle prestation réservable'}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] space-y-6 overflow-y-auto px-1 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-name">Nom de la prestation</Label>
                            <Input id="item-name" value={editedItem?.name || ''} onChange={e => setEditedItem(p => ({...p, name: e.target.value}))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item-desc">Description</Label>
                            <Textarea id="item-desc" value={editedItem?.description || ''} onChange={e => setEditedItem(p => ({...p, description: e.target.value}))}/>
                        </div>
                        
                        <Card className="bg-muted/50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Tarification</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Modèle de tarification</Label>
                                        <Select value={editedItem?.pricing?.model} onValueChange={(v: PricingModel) => handlePricingChange('model', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Prix Fixe</SelectItem>
                                                <SelectItem value="per_hour">Prix Par Heure</SelectItem>
                                                <SelectItem value="per_day">Prix Par Jour</SelectItem>
                                                <SelectItem value="per_unit">Prix Par Unité</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="item-duration">Durée par défaut (minutes)</Label>
                                        <Input id="item-duration" type="number" value={editedItem?.duration || ''} onChange={e => setEditedItem(p => ({...p, duration: parseInt(e.target.value) || undefined}))}/>
                                    </div>
                                </div>
                                {editedItem?.pricing?.model !== 'per_unit' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="item-price">Prix de base (€)</Label>
                                        <Input id="item-price" type="number" placeholder="Prix" value={editedItem?.pricing?.basePrice || ''} onChange={e => handlePricingChange('basePrice', parseFloat(e.target.value) || 0)}/>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2 col-span-1">
                                            <Label>Prix de base (€)</Label>
                                            <Input type="number" placeholder="Facultatif" value={editedItem?.pricing?.basePrice || ''} onChange={e => handlePricingChange('basePrice', parseFloat(e.target.value) || undefined)}/>
                                        </div>
                                        <div className="space-y-2 col-span-1">
                                            <Label>Nom de l'unité</Label>
                                            <Input placeholder="km, heure, etc." value={editedItem?.pricing?.unitName || ''} onChange={e => handlePricingChange('unitName', e.target.value)}/>
                                        </div>
                                        <div className="space-y-2 col-span-1">
                                            <Label>Prix / unité (€)</Label>
                                            <Input type="number" value={editedItem?.pricing?.perUnitPrice || ''} onChange={e => handlePricingChange('perUnitPrice', parseFloat(e.target.value) || 0)}/>
                                        </div>
                                    </div>
                                )}
                                <Separator />
                                <div>
                                    <Label>Options supplémentaires (facultatif)</Label>
                                    <div className="mt-2 space-y-2">
                                        {editedItem?.pricing?.options?.map((opt, index) => (
                                            <div key={opt.id} className="grid grid-cols-12 items-center gap-2">
                                                <div className="col-span-5">
                                                    <Input placeholder="Nom de l'option" value={opt.name} onChange={(e) => handleOptionChange(index, 'name', e.target.value)} />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input type="number" placeholder="Prix" value={opt.price} onChange={(e) => handleOptionChange(index, 'price', parseFloat(e.target.value) || 0)} />
                                                </div>
                                                <div className="col-span-3">
                                                    <Select value={opt.pricingModel} onValueChange={(v: OptionPricingModel) => handleOptionChange(index, 'pricingModel', v)}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">Forfait</SelectItem>
                                                            <SelectItem value="per_hour">/ heure</SelectItem>
                                                            <SelectItem value="per_day">/ jour</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeOption(index)}><Trash className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={addOption}>
                                        <PackagePlus className="mr-2 h-4 w-4" /> Ajouter une option
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center space-x-2 pt-4">
                            <Switch id="item-status" checked={editedItem?.status === 'active'} onCheckedChange={c => setEditedItem(p => ({...p, status: c ? 'active' : 'inactive'}))} />
                            <Label htmlFor="item-status">Actif (disponible à la réservation)</Label>
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveItem}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

const ConsultationView: React.FC<{ service: Service, onSave: (config: ConsultationConfig) => void }> = ({ service, onSave }) => {
    const { t } = useLanguage();
    const [config, setConfig] = useState<ConsultationConfig>(
        service.consultationConfig || {
            description: '',
            acceptanceCriteria: [],
            rejectionCriteria: [],
            fees: '',
        }
    );
    const [newAcceptanceCriterion, setNewAcceptanceCriterion] = useState('');
    const [newRejectionCriterion, setNewRejectionCriterion] = useState('');

    const handleAddCriterion = (type: 'acceptance' | 'rejection') => {
        if (type === 'acceptance' && newAcceptanceCriterion) {
            setConfig(prev => ({...prev, acceptanceCriteria: [...prev.acceptanceCriteria, newAcceptanceCriterion]}));
            setNewAcceptanceCriterion('');
        }
        if (type === 'rejection' && newRejectionCriterion) {
            setConfig(prev => ({...prev, rejectionCriteria: [...prev.rejectionCriteria, newRejectionCriterion]}));
            setNewRejectionCriterion('');
        }
    };

    const handleRemoveCriterion = (type: 'acceptance' | 'rejection', index: number) => {
        if (type === 'acceptance') {
            setConfig(prev => ({...prev, acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index)}));
        }
        if (type === 'rejection') {
            setConfig(prev => ({...prev, rejectionCriteria: prev.rejectionCriteria.filter((_, i) => i !== index)}));
        }
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuration de l'IA de Consultation</CardTitle>
                    <CardDescription>
                        Fournissez à l'IA les informations nécessaires pour qualifier les appels entrants et vous fournir un score de pertinence.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="consult-desc">Description du service / professionnel</Label>
                        <Textarea id="consult-desc" placeholder="Ex: Avocat spécialisé en droit des affaires..." value={config.description} onChange={e => setConfig(p => ({ ...p, description: e.target.value }))}/>
                    </div>

                    <Card className="bg-green-50 border border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2"><Check className="text-green-600"/>Critères d'acceptation</CardTitle>
                            <CardDescription>Mots-clés ou phrases qui indiquent une forte pertinence.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex gap-2">
                             <Input placeholder="Ex: Création de société" value={newAcceptanceCriterion} onChange={e => setNewAcceptanceCriterion(e.target.value)} />
                             <Button onClick={() => handleAddCriterion('acceptance')}>Ajouter</Button>
                           </div>
                           <div className="mt-2 space-x-2 space-y-2">
                                {config.acceptanceCriteria.map((criterion, index) => (
                                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-sm">
                                        {criterion}
                                        <button onClick={() => handleRemoveCriterion('acceptance', index)} className="ml-2 rounded-full hover:bg-green-200 p-0.5"><X className="h-3 w-3"/></button>
                                    </Badge>
                                ))}
                           </div>
                        </CardContent>
                    </Card>

                     <Card className="bg-red-50 border border-red-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2"><Ban className="text-red-600"/>Critères de refus (Freins)</CardTitle>
                            <CardDescription>Mots-clés ou phrases qui indiquent une faible pertinence.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex gap-2">
                             <Input placeholder="Ex: Droit de la famille" value={newRejectionCriterion} onChange={e => setNewRejectionCriterion(e.target.value)} />
                             <Button onClick={() => handleAddCriterion('rejection')}>Ajouter</Button>
                           </div>
                           <div className="mt-2 space-x-2 space-y-2">
                                {config.rejectionCriteria.map((criterion, index) => (
                                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-800 text-sm">
                                        {criterion}
                                        <button onClick={() => handleRemoveCriterion('rejection', index)} className="ml-2 rounded-full hover:bg-red-200 p-0.5"><X className="h-3 w-3"/></button>
                                    </Badge>
                                ))}
                           </div>
                        </CardContent>
                    </Card>
                    
                    <div className="space-y-2">
                        <Label htmlFor="consult-fees">Informations sur les honoraires/frais</Label>
                        <Textarea id="consult-fees" placeholder="Ex: 300€/heure, premier appel de 15min offert..." value={config.fees} onChange={e => setConfig(p => ({ ...p, fees: e.target.value }))}/>
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <Button onClick={() => onSave(config)}>Enregistrer la configuration</Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const ServiceTypeSelector: React.FC<{ onSelect: (type: ServiceType) => void }> = ({ onSelect }) => {
    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Configurer le service de votre boutique</DialogTitle>
                <DialogDescription>
                    Choisissez le type d'activité principal pour cette boutique. Ce choix déterminera les outils de configuration disponibles.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Card onClick={() => onSelect('products')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                    <CardHeader className="items-center text-center">
                        <Utensils className="h-8 w-8 mb-2 text-primary" />
                        <CardTitle className="text-lg">Vente de Produits</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-xs text-muted-foreground">
                        Idéal pour restaurants, cafés, fast-foods. Gestion de catalogue, prix, options, etc.
                    </CardContent>
                </Card>
                <Card onClick={() => onSelect('reservations')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                     <CardHeader className="items-center text-center">
                        <ConciergeBell className="h-8 w-8 mb-2 text-primary" />
                        <CardTitle className="text-lg">Gestion de Réservations</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-xs text-muted-foreground">
                        Idéal pour location de salles, de matériel, de véhicules. Gestion de calendrier, tarifs, etc.
                    </CardContent>
                </Card>
                 <Card onClick={() => onSelect('consultation')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                     <CardHeader className="items-center text-center">
                        <BrainCircuit className="h-8 w-8 mb-2 text-primary" />
                        <CardTitle className="text-lg">Prise de RDV Qualifiée</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-xs text-muted-foreground">
                        Pour professions libérales (avocats, consultants). Qualification d'appels par IA.
                    </CardContent>
                </Card>
            </div>
        </DialogContent>
    );
}

export default function ServiceDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  // The serviceId from URL is actually the storeId in our new logic
  const storeId = params.serviceId as string;
  
  // We manage one service per store, fetched based on storeId
  const [service, setService] = useState<Service | null | undefined>(undefined);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        // Récupérer les données du store depuis l'API
        const response = await fetch('/api/restaurant/activities');
        if (response.ok) {
          const activities = await response.json();
          
          // Trouver le store correspondant et extraire son serviceType
          let foundStore = null;
          for (const activity of activities) {
            const store = activity.stores?.find((s: any) => s.id === storeId);
            if (store) {
              const settings = typeof store.settings === 'string' ? JSON.parse(store.settings || '{}') : store.settings || {};
              foundStore = {
                ...store,
                serviceType: settings.serviceType || 'products',
                businessName: activity.name
              };
              break;
            }
          }
          
          if (foundStore) {
            // Créer un service basé sur les données du store
            const serviceFromStore: Service = {
              id: `service-${storeId}`,
              storeId: storeId,
              name: foundStore.businessName,
              description: `Service de ${foundStore.serviceType} pour ${foundStore.businessName}`,
              type: foundStore.serviceType as ServiceType
            };
            setService(serviceFromStore);
          } else {
            setService(null);
            setIsSelectorOpen(true);
          }
        } else {
          setService(null);
          setIsSelectorOpen(true);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        setService(null);
        setIsSelectorOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, [storeId]);

  const handleSaveConsultationConfig = (config: ConsultationConfig) => {
    if (!service) return;
    const updatedService = { ...service, consultationConfig: config };
    setService(updatedService);
    // Here you would also update the main services list, e.g., through a context or a server call
    // For now, we just update the local state.
    const serviceIndex = mockServices.findIndex(s => s.id === service.id);
    if(serviceIndex > -1) {
        mockServices[serviceIndex] = updatedService;
    }
  };
  
  const handleSelectServiceType = (type: ServiceType) => {
    // This function creates a new service associated with the store
    const newService: Service = {
        id: `service-${storeId}`, // Link service ID to store ID
        storeId: storeId,
        type: type,
        // Add default names and descriptions based on type
        name: type === 'products' ? 'Catalogue de Produits' : type === 'reservations' ? 'Service de Réservation' : 'Service de Consultation',
        description: `Service de ${type} pour la boutique ${storeId}`
    };
    mockServices.push(newService); // Add to our mock data source
    setService(newService);
    setIsSelectorOpen(false);
  }

  // Initial loading state before we have checked for a service
  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <p>Chargement du service...</p>
        </div>
    );
  }

  // If no service, show the selector dialog
  if (!service) {
      return (
        <Dialog open={isSelectorOpen} onOpenChange={(open) => { if(!open) router.push('/restaurant/stores')}}>
            <ServiceTypeSelector onSelect={handleSelectServiceType} />
        </Dialog>
      )
  }

  const renderServiceView = () => {
    switch (service.type) {
        case 'products':
            return <ProductsView />;
        case 'reservations':
            return <ReservationsView />;
        case 'consultation':
            return <ConsultationView service={service} onSave={handleSaveConsultationConfig} />;
        default:
            return <p>Type de service non reconnu.</p>;
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="mb-4">
        <Button variant="ghost" onClick={() => router.push('/restaurant/stores')} className="-ml-4 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux boutiques
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
                <p className="text-muted-foreground">{service.description}</p>
            </div>
        </div>
      </header>
      
      {renderServiceView()}

    </div>
  );
}

    