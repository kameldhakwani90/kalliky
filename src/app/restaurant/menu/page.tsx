

'use client';

import Image from 'next/image';
import { useState, useMemo, ChangeEvent, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Button } from '@/components/ui/button';
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Wand2, Tag, Info, ArrowLeft, ChevronRight, UploadCloud, Store, MoreHorizontal, Pencil, Trash2, Search, Clock, ImagePlus, Plus, X, List, Layers, Ruler } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type DayAvailability = {
  enabled: boolean;
  from: string;
  to: string;
};

type Availability = {
  type: 'always' | 'scheduled';
  schedule: {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
  };
};

type SaleChannel = 'dine-in' | 'takeaway' | 'delivery' | 'call-and-collect';

const saleChannels: { id: SaleChannel, label: string }[] = [
    { id: 'dine-in', label: 'Sur place' },
    { id: 'takeaway', label: 'À emporter' },
    { id: 'delivery', label: 'Livraison' },
    { id: 'call-and-collect', label: 'Call & Collect' },
];

type PricesByChannel = Partial<Record<SaleChannel, number>>;

type VariationPrice = {
  [variationId: string]: PricesByChannel;
};

type VariationVisibility = {
  [variationId: string]: boolean;
};

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

type MenuItem = {
  id: string;
  categoryId: string;
  name:string;
  description: string;
  image: string;
  imageHint: string;
  tags?: string[];
  variations: Variation[];
  composition?: CompositionStep[];
  storeIds: string[];
  status: 'active' | 'out-of-stock' | 'inactive';
  availability: Availability;
};

type Category = {
  id: string;
  name: string;
};

const availableStores = [
    { id: "store-1", name: "Le Gourmet Parisien - Centre" },
    { id: "store-2", name: "Le Gourmet Parisien - Montmartre"},
    { id: "store-3", name: "Pizzeria Bella - Bastille" },
];

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

const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Plats' },
  { id: 'cat-2', name: 'Entrées' },
  { id: 'cat-3', name: 'Menus' },
  { id: 'cat-4', name: 'Desserts' },
  { id: 'cat-5', name: 'Boissons' },
];

const initialMenuItems: MenuItem[] = [
    {
        id: 'item-1',
        categoryId: 'cat-1',
        name: 'Burger "Le Personnalisé"',
        description: 'Composez le burger de vos rêves ! Choisissez votre pain, votre protéine, vos fromages et tous les suppléments que vous aimez.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'custom burger',
        tags: ['Populaire', 'Soir', 'Famille'],
        storeIds: ["store-1", "store-2"],
        status: 'active',
        availability: defaultAvailability,
        variations: [{ id: 'var-1-1', name: 'Taille unique', prices: { 'dine-in': 16.50, 'takeaway': 16.50, 'delivery': 18.00 } }],
        composition: [
            {
                id: 'step-1-1',
                title: 'Étape 1 : Le Pain (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { id: 'opt-1-1-1', name: 'Pain Brioché' },
                    { id: 'opt-1-1-2', name: 'Pain Sésame' },
                ]
            },
            {
                id: 'step-1-2',
                title: 'Étape 2 : La Protéine (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    {
                        id: 'opt-1-2-1',
                        name: 'Steak de Boeuf (150g)',
                        composition: [
                            {
                                id: 'substep-1-2-1-1',
                                title: 'Choix de la cuisson',
                                selectionType: 'single',
                                isRequired: true,
                                options: [
                                    { id: 'subopt-1-2-1-1-1', name: 'À point' },
                                    { id: 'subopt-1-2-1-1-2', name: 'Saignant' },
                                    { id: 'subopt-1-2-1-1-3', name: 'Bien cuit' },
                                ]
                            }
                        ]
                    },
                    { id: 'opt-1-2-2', name: 'Poulet Pané Croustillant' },
                    { id: 'opt-1-2-3', name: 'Galette Végétarienne' },
                ]
            },
             {
                id: 'step-1-3',
                title: 'Étape 3 : Les Fromages (2 max)',
                selectionType: 'multiple',
                isRequired: false,
                options: [
                    { id: 'opt-1-3-1', name: 'Cheddar' },
                    { id: 'opt-1-3-2', name: 'Chèvre', prices: { 'var-1-1': { 'dine-in': 1.50 } } },
                    { id: 'opt-1-3-3', name: 'Reblochon', prices: { 'var-1-1': { 'dine-in': 1.50 } } },
                ]
            },
            {
                id: 'step-1-4',
                title: 'Étape 4 : Les Suppléments',
                selectionType: 'multiple',
                isRequired: false,
                options: [
                    { id: 'opt-1-4-1', name: 'Salade' },
                    { id: 'opt-1-4-2', name: 'Tomate' },
                    { id: 'opt-1-4-3', name: 'Oignons' },
                    { id: 'opt-1-4-4', name: 'Bacon grillé', prices: { 'var-1-1': { 'dine-in': 2.00 } } },
                    { id: 'opt-1-4-5', name: 'Oeuf au plat', prices: { 'var-1-1': { 'dine-in': 1.00 } } },
                ]
            }
        ]
    },
    {
        id: 'item-2',
        categoryId: 'cat-2',
        name: 'Salade César',
        description: 'Laitue romaine croquante, poulet grillé, croûtons à l\'ail, copeaux de parmesan et notre sauce César maison.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'caesar salad',
        tags: ['Léger', 'Midi', 'Froid'],
        storeIds: ["store-1", "store-3"],
        status: 'active',
        variations: [{ id: 'var-2-1', name: 'Taille unique', prices: { 'dine-in': 12.50 } }],
        availability: {...defaultAvailability, type: 'scheduled' },
    },
    {
        id: 'item-3',
        categoryId: 'cat-3',
        name: 'Formule Regina',
        description: 'Le classique italien en formule complète, avec une boisson au choix.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'pizza deal',
        storeIds: ["store-3"],
        status: 'out-of-stock',
        availability: defaultAvailability,
        variations: [{ id: 'var-3-1', name: 'Taille unique', prices: { 'takeaway': 18.00 } }],
        composition: [
             {
                id: 'step-3-1',
                title: 'Plat Principal',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { id: 'opt-3-1-1', name: 'Pizza Regina' },
                ]
            },
            {
                id: 'step-3-2',
                title: 'Boisson (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { id: 'opt-3-2-1', name: 'Coca-Cola (33cl)' },
                    { id: 'opt-3-2-2', name: 'Eau Plate (50cl)' },
                    { id: 'opt-3-2-3', name: 'Jus d\'orange (25cl)' },
                ]
            }
        ]
    },
    {
        id: 'item-4',
        categoryId: 'cat-4',
        name: 'Tiramisu au café',
        description: 'Biscuit cuillère imbibé de café, crème mascarpone onctueuse et cacao en poudre.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'tiramisu',
        tags: ['Sucré', 'Fait maison'],
        storeIds: ["store-1", "store-2", "store-3"],
        status: 'inactive',
        availability: defaultAvailability,
        variations: [{ id: 'var-4-1', name: 'Taille unique', prices: { 'dine-in': 8.50, 'takeaway': 8.50 } }],
    },
];

const daysOfWeek = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' },
];

const currentUserPlan = 'pro';

type CompositionView = {
    title: string;
    steps: CompositionStep[];
};

const EditableCompositionDisplay: React.FC<{
  view: CompositionView;
  variations: Variation[];
  onNavigate: (steps: CompositionStep[], title: string) => void;
  onOptionCompositionCreate: (stepIndex: number, optionIndex: number) => void;
  onUpdate: (steps: CompositionStep[]) => void;
}> = ({ view, variations, onNavigate, onOptionCompositionCreate, onUpdate }) => {

  const handleAddStep = () => {
    const newStep: CompositionStep = {
      id: `step_${Date.now()}`,
      title: 'Nouvelle étape',
      selectionType: 'single',
      isRequired: false,
      options: [],
    };
    onUpdate([...view.steps, newStep]);
  };

  const handleRemoveStep = (stepIndex: number) => {
    const newSteps = view.steps.filter((_, i) => i !== stepIndex);
    onUpdate(newSteps);
  };

  const handleAddOption = (stepIndex: number) => {
    const newSteps = [...view.steps];
    const newOption: CompositionOption = {
        id: `opt_${Date.now()}`,
        name: 'Nouvelle option',
        prices: {}
    };
    newSteps[stepIndex].options.push(newOption);
    onUpdate(newSteps);
  };

  const handleRemoveOption = (stepIndex: number, optionIndex: number) => {
    const newSteps = [...view.steps];
    newSteps[stepIndex].options = newSteps[stepIndex].options.filter((_, i) => i !== optionIndex);
    onUpdate(newSteps);
  };

  const handleOptionChange = (stepIndex: number, optionIndex: number, field: keyof CompositionOption, value: any) => {
    const newSteps = [...view.steps];
    (newSteps[stepIndex].options[optionIndex] as any)[field] = value;
    onUpdate(newSteps);
  }

  return (
    <div className="space-y-4">
      {view.steps.map((step, stepIndex) => (
        <Card key={step.id} className="bg-muted/30">
          {step.title && (
            <CardHeader className="py-3 px-4 flex-row items-center justify-between">
              <Input defaultValue={step.title} className="text-base font-semibold border-none shadow-none focus-visible:ring-1 p-1 h-auto" />
              <div className="flex items-center gap-2">
                  <Badge variant={step.isRequired ? "destructive" : "secondary"} className="text-xs">{step.isRequired ? "Requis" : "Optionnel"}</Badge>
                  <Switch checked={step.isRequired} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveStep(stepIndex)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </CardHeader>
          )}
          <CardContent className={cn("p-4 space-y-2", !step.title && "pt-4")}>
            <ul className="space-y-3">
              {step.options.map((option, optionIndex) => (
                <li key={option.id} className="text-sm border-t border-border pt-3">
                  <div className="flex justify-between items-center gap-2">
                    <Input
                      value={option.name}
                      onChange={(e) => handleOptionChange(stepIndex, optionIndex, 'name', e.target.value)}
                      className="font-medium h-8" />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => {
                        if (option.composition) {
                          onNavigate(option.composition, `Composition de : ${option.name}`)
                        } else {
                          onOptionCompositionCreate(stepIndex, optionIndex);
                        }
                      }}>
                        Modifier <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveOption(stepIndex, optionIndex)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                  {variations.length > 1 && (
                    <div className="mt-2 pl-4 space-y-2">
                      {variations.map(variation => (
                        <div key={variation.id} className="grid grid-cols-3 gap-2 items-center">
                          <Label className="text-xs text-muted-foreground">{variation.name}</Label>
                          <Input
                            type="number"
                            value={option.prices?.[variation.id] ? Object.values(option.prices[variation.id])[0] : ''}
                            className="w-full h-7 text-xs"
                            placeholder="Prix" />
                          <div className="flex items-center gap-2">
                            <Switch
                                checked={option.visibility?.[variation.id] ?? true}
                                onCheckedChange={(checked) => handleOptionChange(stepIndex, optionIndex, 'visibility', {...option.visibility, [variation.id]: checked})}
                            />
                            <span className="text-xs text-muted-foreground">Visible</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
             <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => handleAddOption(stepIndex)}><Plus className="mr-2 h-4 w-4"/> Ajouter une option</Button>
          </CardContent>
        </Card>
      ))}
      <Button variant="secondary" className="w-full" onClick={handleAddStep}><Plus className="mr-2 h-4 w-4"/> Ajouter une étape de composition</Button>
    </div>
  );
};


export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editedItem, setEditedItem] = useState<MenuItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [dialogSelectedStoreId, setDialogSelectedStoreId] = useState<string>(availableStores[0]?.id || 'all');


  const [compositionHistory, setCompositionHistory] = useState<CompositionView[]>([]);
  const [tagInput, setTagInput] = useState('');

  const currentView = useMemo(() => {
    if (compositionHistory.length > 0) {
      return compositionHistory[compositionHistory.length - 1];
    }
    if (editedItem?.composition) {
      return { title: "Composition de l'article", steps: editedItem.composition };
    }
    return null;
  }, [editedItem, compositionHistory]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const storeMatch = selectedStore === 'all' || item.storeIds.includes(selectedStore);
      const categoryMatch = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
      const searchMatch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return storeMatch && categoryMatch && statusMatch && searchMatch;
    });
  }, [menuItems, selectedStore, selectedCategory, selectedStatus, searchTerm]);


  const handleItemClick = (item: MenuItem) => {
    setEditedItem(JSON.parse(JSON.stringify(item))); // Deep copy for editing
    setCompositionHistory([]);
    setIsPopupOpen(true);
  };

  const handleCreateNewItem = () => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "cat-1",
      description: '',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'new item',
      tags: [],
      variations: [{ id: `var_${Date.now()}`, name: 'Taille unique', prices: {} }],
      storeIds: dialogSelectedStoreId === 'all' ? availableStores.map(s => s.id) : [dialogSelectedStoreId],
      status: 'inactive',
      availability: defaultAvailability,
    };
    setEditedItem(newItem);
    setCompositionHistory([]);
    setIsPopupOpen(true);
    setIsSyncPopupOpen(false);
  };

  const toggleItemStatus = (itemId: string, checked: boolean) => {
    setMenuItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            return { ...item, status: checked ? 'out-of-stock' : 'active' };
        }
        return item;
    }));
  };
  
  const getPriceDisplay = (item: MenuItem) => {
    const firstVariationPrices = Object.values(item.variations[0].prices);
    if (firstVariationPrices.length === 0) return 'N/A';
    const firstPrice = firstVariationPrices[0];
    
    if (item.variations.length > 1) {
        return `à partir de ${firstPrice.toFixed(2)}€`
    }
    return `${firstPrice.toFixed(2)}€`
  }

  const handleNavigateComposition = (steps: CompositionStep[], title: string) => {
    setCompositionHistory(prev => [...prev, { title, steps }]);
  };

  const handleBackComposition = () => {
    setCompositionHistory(prev => prev.slice(0, -1));
  };

  const updateComposition = (steps: CompositionStep[]) => {
      if (!editedItem) return;

      const newEditedItem = { ...editedItem, composition: steps };

      setEditedItem(newEditedItem);

      if (compositionHistory.length > 0) {
        const newHistory = [...compositionHistory];
        newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], steps: steps };
        setCompositionHistory(newHistory);
      }
  };

 const handleCreateBaseComposition = (isStepped: boolean) => {
    if (!editedItem) return;
    const firstStep: CompositionStep = {
      id: `step_${Date.now()}`,
      title: isStepped ? 'Étape 1' : '',
      selectionType: 'single',
      isRequired: false,
      options: [],
    };
    updateComposition([firstStep]);
  };

  const handleCreateSubComposition = (stepIndex: number, optionIndex: number) => {
     if (!editedItem || !currentView) return;

    const newSteps = [...currentView.steps];
    const optionToUpdate = newSteps[stepIndex].options[optionIndex];
    if (optionToUpdate) {
        optionToUpdate.composition = [];
        handleNavigateComposition(optionToUpdate.composition, `Composition de : ${optionToUpdate.name}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editedItem) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditedItem({...editedItem, image: reader.result as string});
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() === '' || !editedItem) return;
    setEditedItem(prev => ({
      ...prev!,
      tags: [...(prev!.tags || []), tagInput.trim()]
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
     if (!editedItem) return;
     setEditedItem(prev => ({
       ...prev!,
       tags: prev!.tags?.filter(tag => tag !== tagToRemove) || []
     }));
  }

  const closePopup = () => {
    setIsPopupOpen(false);
    setTimeout(() => {
        setEditedItem(null);
        setCompositionHistory([]);
    }, 300);
  }

  const handleDayAvailabilityChange = (day: keyof Availability['schedule'], field: keyof DayAvailability, value: any) => {
    if (!editedItem) return;
    const newAvailability = { ...editedItem.availability };
    (newAvailability.schedule[day] as any)[field] = value;
    setEditedItem({ ...editedItem, availability: newAvailability });
  };

  const handleAddVariation = () => {
    if (!editedItem) return;
    const newVariation: Variation = {
      id: `var_${Date.now()}`,
      name: '',
      prices: {},
    };
    setEditedItem({ ...editedItem, variations: [...editedItem.variations, newVariation] });
  };

  const handleRemoveVariation = (variationId: string) => {
    if (!editedItem || editedItem.variations.length <= 1) return;
    setEditedItem({ ...editedItem, variations: editedItem.variations.filter(v => v.id !== variationId) });
  };

  const handleVariationChange = (variationId: string, field: keyof Variation, value: any) => {
    if (!editedItem) return;
    setEditedItem({
      ...editedItem,
      variations: editedItem.variations.map(v => v.id === variationId ? { ...v, [field]: value } : v)
    });
  };

  const handleVariationPriceChange = (variationId: string, channel: SaleChannel, value: string) => {
    if (!editedItem) return;
    const newVariations = [...editedItem.variations];
    const variationIndex = newVariations.findIndex(v => v.id === variationId);
    if(variationIndex !== -1) {
        const newPrices = { ...newVariations[variationIndex].prices };
        const priceValue = parseFloat(value);
        if (isNaN(priceValue) || priceValue <= 0) {
            delete newPrices[channel];
        } else {
            newPrices[channel] = priceValue;
        }
        newVariations[variationIndex].prices = newPrices;
        setEditedItem({ ...editedItem, variations: newVariations });
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  }


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Menu</h1>
        <p className="text-muted-foreground">Gérez votre menu, ajoutez de nouveaux plats et synchronisez avec l'IA.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Votre Menu</CardTitle>
            <CardDescription>Consultez, modifiez et gérez la disponibilité de vos articles.</CardDescription>
          </div>
           <Dialog open={isSyncPopupOpen} onOpenChange={setIsSyncPopupOpen}>
             <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter / Synchroniser
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Outils de création et synchronisation</DialogTitle>
                    <DialogDescription>
                        Sélectionnez une boutique puis choisissez une action.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-2 py-2">
                    <Label>Appliquer à la boutique</Label>
                    <Select value={dialogSelectedStoreId} onValueChange={setDialogSelectedStoreId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner une boutique" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les boutiques</SelectItem>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <Tabs defaultValue="article" className="pt-2">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="article">Article</TabsTrigger>
                        <TabsTrigger value="category">Catégorie</TabsTrigger>
                        <TabsTrigger value="import">Importer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="article" className="pt-4 space-y-4">
                       <p className="text-sm text-muted-foreground">
                        Créez un nouvel article manuellement et configurez toutes ses options en détail.
                       </p>
                       <Button className="w-full" onClick={handleCreateNewItem}><PlusCircle className="mr-2 h-4 w-4"/>Créer un nouvel article</Button>
                    </TabsContent>
                    <TabsContent value="category" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Nom de la nouvelle catégorie</Label>
                            <Input id="cat-name" placeholder="Ex: Boissons fraîches"/>
                        </div>
                        <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Ajouter la catégorie</Button>
                    </TabsContent>
                    <TabsContent value="import" className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Importez depuis un fichier Excel ou une image (flyer, menu existant). Notre IA détectera et ajoutera les plats pour vous.
                      </p>
                      <MenuSyncForm />
                    </TabsContent>
                </Tabs>
            </DialogContent>
           </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher par nom..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-4 md:w-auto w-full">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="md:w-48 w-full"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger className="md:w-48 w-full"><Store className="h-4 w-4 mr-2" /><SelectValue placeholder="Boutique" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les boutiques</SelectItem>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="md:w-48 w-full"><SelectValue placeholder="Statut" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="out-of-stock">En rupture</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Disponibilité</TableHead>
                        <TableHead>En rupture</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredMenuItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={60}
                                height={40}
                                data-ai-hint={item.imageHint}
                                className="w-16 h-10 object-cover rounded-md"
                            />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{getCategoryName(item.categoryId)}</Badge>
                        </TableCell>
                        <TableCell>{getPriceDisplay(item)}</TableCell>
                         <TableCell>
                            {item.availability.type === 'scheduled' ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">Toujours</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Switch
                                className="data-[state=checked]:bg-red-500"
                                checked={item.status === 'out-of-stock'}
                                onCheckedChange={(checked) => toggleItemStatus(item.id, checked)}
                                disabled={item.status === 'inactive'}
                                aria-label="Toggle item status"
                            />
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Ouvrir le menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleItemClick(item)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
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

      {editedItem && (
        <Dialog open={isPopupOpen} onOpenChange={closePopup}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
               {compositionHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleBackComposition} className="absolute left-4 top-4 h-auto p-1.5 rounded-md z-10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              )}
               <DialogTitle className="text-center text-2xl font-headline pt-2">
                {compositionHistory.length > 0 ? currentView?.title : (editedItem.name || 'Nouvel Article')}
               </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto -mx-6 px-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              {compositionHistory.length === 0 && (
                <div className="space-y-4 md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline">Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative group cursor-pointer" onClick={() => imageInputRef.current?.click()}>
                                <Image
                                    src={editedItem.image}
                                    alt={editedItem.name}
                                    width={600}
                                    height={400}
                                    data-ai-hint={editedItem.imageHint}
                                    className="w-full rounded-lg object-cover shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <Button size="sm" className="pointer-events-none">
                                        <ImagePlus className="mr-2 h-4 w-4" />
                                        Changer l'image
                                    </Button>
                                </div>
                                <Input type="file" ref={imageInputRef} className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </div>
                             <div>
                                <Label htmlFor="item-name">Nom de l'article</Label>
                                <Input id="item-name" value={editedItem.name} onChange={(e) => setEditedItem({...editedItem, name: e.target.value})} />
                             </div>
                             <div>
                                <Label htmlFor="item-desc">Description</Label>
                                <Textarea id="item-desc" value={editedItem.description} onChange={(e) => setEditedItem({...editedItem, description: e.target.value})} />
                             </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline flex items-center gap-2"><Ruler className="h-4 w-4" /> Tailles & Tarifs</CardTitle>
                            <CardDescription>
                                Définissez les tailles et les prix par canal de vente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {editedItem.variations.map((variation, v_index) => (
                                <div key={variation.id} className="space-y-3 p-3 border rounded-md relative">
                                    {editedItem.variations.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 text-destructive h-7 w-7"
                                            onClick={() => handleRemoveVariation(variation.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Input
                                        placeholder="Nom de la taille (ex: Large)"
                                        value={variation.name}
                                        onChange={(e) => handleVariationChange(variation.id, 'name', e.target.value)}
                                        className="font-semibold"
                                    />
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Prix par mode de vente</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {saleChannels.map(channel => (
                                                <div key={channel.id} className="relative">
                                                    <Input
                                                        type="number"
                                                        placeholder={channel.label}
                                                        value={variation.prices[channel.id]?.toFixed(2) || ''}
                                                        onChange={(e) => handleVariationPriceChange(variation.id, channel.id, e.target.value)}
                                                        className="pl-3 pr-5 text-sm h-9"
                                                        step="0.01"
                                                    />
                                                    <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">€</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full" onClick={handleAddVariation}><Plus className="mr-2 h-4 w-4" />Ajouter une taille/variation</Button>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline flex items-center justify-between">
                                <span>Disponibilité</span>
                                <Switch
                                    checked={editedItem.availability.type === 'scheduled'}
                                    onCheckedChange={(checked) => setEditedItem(prev => prev ? {...prev, availability: {...prev.availability, type: checked ? 'scheduled' : 'always'}} : null)}
                                />
                            </CardTitle>
                             <CardDescription>
                                Définissez quand cet article peut être commandé.
                            </CardDescription>
                        </CardHeader>
                        {editedItem.availability.type === 'scheduled' && (
                            <CardContent className="space-y-4">
                                {daysOfWeek.map(day => (
                                    <div key={day.id} className="grid grid-cols-3 items-center gap-4">
                                        <div className="flex items-center gap-2 col-span-1">
                                           <Checkbox
                                                id={day.id}
                                                checked={editedItem.availability.schedule[day.id as keyof typeof editedItem.availability.schedule].enabled}
                                                onCheckedChange={(checked) => handleDayAvailabilityChange(day.id as keyof Availability['schedule'], 'enabled', !!checked)}
                                            />
                                            <Label htmlFor={day.id}>{day.label}</Label>
                                        </div>
                                        <div className={cn("col-span-2 grid grid-cols-2 gap-2", !editedItem.availability.schedule[day.id as keyof typeof editedItem.availability.schedule].enabled && "opacity-50 pointer-events-none")}>
                                            <Input
                                                type="time"
                                                value={editedItem.availability.schedule[day.id as keyof typeof editedItem.availability.schedule].from}
                                                onChange={(e) => handleDayAvailabilityChange(day.id as keyof Availability['schedule'], 'from', e.target.value)}
                                            />
                                            <Input
                                                type="time"
                                                value={editedItem.availability.schedule[day.id as keyof typeof editedItem.availability.schedule].to}
                                                onChange={(e) => handleDayAvailabilityChange(day.id as keyof Availability['schedule'], 'to', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                             </CardContent>
                        )}
                    </Card>

                    {(currentUserPlan === 'pro' || currentUserPlan === 'business') && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center justify-between font-headline">
                                    <span>Tags de Vente</span>
                                    <Button variant="ghost" size="sm" className="h-auto p-1 text-sm font-normal text-muted-foreground hover:text-primary">
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Suggérer par IA
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {editedItem.tags && editedItem.tags.map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-sm py-1 px-3 rounded-full font-normal border-gray-300 group">
                                          <Tag className="mr-2 h-3 w-3" />
                                          {tag}
                                          <button onClick={() => handleRemoveTag(tag)} className="ml-2 opacity-50 group-hover:opacity-100"><X className="h-3 w-3"/></button>
                                      </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Input
                                      placeholder="Ajouter un tag..."
                                      value={tagInput}
                                      onChange={(e) => setTagInput(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                    />
                                    <Button onClick={handleAddTag}>Ajouter</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
              )}

              <div className={compositionHistory.length > 0 ? "md:col-span-2" : "md:col-span-1"}>
                {currentView ? (
                    <EditableCompositionDisplay
                      view={currentView}
                      variations={editedItem.variations}
                      onNavigate={handleNavigateComposition}
                      onOptionCompositionCreate={handleCreateSubComposition}
                      onUpdate={updateComposition}
                    />
                ) : (
                    <Card className="flex items-center justify-center p-4 bg-muted/50 h-full">
                        <div className="text-center">
                           <Info className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground mb-4">Ce plat n'a pas de composition.</p>
                           <div className="flex flex-col gap-3">
                                <Button variant="secondary" onClick={() => handleCreateBaseComposition(true)}>
                                    <Layers className="mr-2 h-4 w-4"/> Créer une composition par étapes
                                </Button>
                                <Button variant="secondary" onClick={() => handleCreateBaseComposition(false)}>
                                    <List className="mr-2 h-4 w-4"/> Ajouter une liste d'options simple
                                </Button>
                           </div>
                        </div>
                    </Card>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={closePopup}>Annuler</Button>
                <Button>Enregistrer les modifications</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    
