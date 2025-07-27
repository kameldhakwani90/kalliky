

'use client';

import Image from 'next/image';
import { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { PlusCircle, Wand2, Tag, Info, ArrowLeft, ChevronRight, Store, MoreHorizontal, Pencil, Trash2, Search, Clock, ImagePlus, Plus, X, List, Layers, Ruler } from 'lucide-react';
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

const saleChannels: { id: SaleChannel, label: Record<'fr' | 'en', string> }[] = [
    { id: 'dine-in', label: { fr: 'Sur place', en: 'Dine-in' } },
    { id: 'takeaway', label: { fr: 'À emporter', en: 'Takeaway' } },
    { id: 'delivery', label: { fr: 'Livraison', en: 'Delivery' } },
    { id: 'call-and-collect', label: { fr: 'Call & Collect', en: 'Call & Collect' } },
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
    { id: 'monday', label: { fr: 'Lundi', en: 'Monday' } },
    { id: 'tuesday', label: { fr: 'Mardi', en: 'Tuesday' } },
    { id: 'wednesday', label: { fr: 'Mercredi', en: 'Wednesday' } },
    { id: 'thursday', label: { fr: 'Jeudi', en: 'Thursday' } },
    { id: 'friday', label: { fr: 'Vendredi', en: 'Friday' } },
    { id: 'saturday', label: { fr: 'Samedi', en: 'Saturday' } },
    { id: 'sunday', label: { fr: 'Dimanche', en: 'Sunday' } },
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
  const { t } = useLanguage();

  const handleAddStep = () => {
    const newStep: CompositionStep = {
      id: `step_${Date.now()}`,
      title: t({ fr: 'Nouvelle étape', en: 'New step' }),
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
        name: t({ fr: 'Nouvelle option', en: 'New option' }),
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

  const handleOptionPriceChange = (stepIndex: number, optionIndex: number, variationId: string, channel: SaleChannel, value: string) => {
      const newSteps = [...view.steps];
      const option = newSteps[stepIndex].options[optionIndex];
      if (!option) return;

      const newPrices = { ...(option.prices || {}) };
      if (!newPrices[variationId]) {
          newPrices[variationId] = {};
      }

      const priceValue = parseFloat(value);
      if (isNaN(priceValue) || priceValue <= 0) {
          delete newPrices[variationId]![channel];
          if (Object.keys(newPrices[variationId]!).length === 0) {
              delete newPrices[variationId];
          }
      } else {
          newPrices[variationId]![channel] = priceValue;
      }

      (newSteps[stepIndex].options[optionIndex] as any)['prices'] = newPrices;
      onUpdate(newSteps);
  };

  const translations = {
    required: { fr: 'Requis', en: 'Required' },
    optional: { fr: 'Optionnel', en: 'Optional' },
    confirmStepDeletion: { fr: 'Êtes-vous sûr de vouloir supprimer cette étape ?', en: 'Are you sure you want to delete this step?' },
    irreversibleAction: { fr: 'Cette action est irréversible.', en: 'This action is irreversible.' },
    cancel: { fr: 'Annuler', en: 'Cancel' },
    delete: { fr: 'Supprimer', en: 'Delete' },
    edit: { fr: 'Modifier', en: 'Edit' },
    confirmOptionDeletion: { fr: 'Êtes-vous sûr de vouloir supprimer cette option ?', en: 'Are you sure you want to delete this option?' },
    price: { fr: 'Prix', en: 'Price' },
    visible: { fr: 'Visible', en: 'Visible' },
    addOption: { fr: 'Ajouter une option', en: 'Add an option' },
    addCompositionStep: { fr: 'Ajouter une étape de composition', en: 'Add composition step' },
  };

  return (
    <div className="space-y-4">
      {view.steps.map((step, stepIndex) => (
        <Card key={step.id} className="bg-muted/30">
          {step.title && (
            <CardHeader className="py-3 px-4 flex-row items-center justify-between">
              <Input defaultValue={step.title} className="text-base font-semibold border-none shadow-none focus-visible:ring-1 p-1 h-auto" />
              <div className="flex items-center gap-2">
                  <Badge variant={step.isRequired ? "destructive" : "secondary"} className="text-xs">{step.isRequired ? t(translations.required) : t(translations.optional)}</Badge>
                  <Switch checked={step.isRequired} />
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>{t(translations.confirmStepDeletion)}</AlertDialogTitle>
                              <AlertDialogDescription>{t(translations.irreversibleAction)}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveStep(stepIndex)}>{t(translations.delete)}</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
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
                          onNavigate(option.composition, `${t({fr: "Composition de", en: "Composition of"})}: ${option.name}`)
                        } else {
                          onOptionCompositionCreate(stepIndex, optionIndex);
                        }
                      }}>
                        {t(translations.edit)} <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>{t(translations.confirmOptionDeletion)}</AlertDialogTitle>
                                  <AlertDialogDescription>{t(translations.irreversibleAction)}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveOption(stepIndex, optionIndex)}>{t(translations.delete)}</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {variations.length > 1 && (
                    <div className="mt-2 pl-4 space-y-2">
                      {variations.map(variation => (
                        <div key={variation.id} className="grid grid-cols-3 gap-2 items-center">
                          <Label className="text-xs text-muted-foreground">{variation.name}</Label>
                           <div className="relative">
                            <Input
                                type="number"
                                value={option.prices?.[variation.id]?.[Object.keys(option.prices?.[variation.id] || {})[0] as SaleChannel]?.toFixed(2) || ''}
                                onChange={(e) => handleOptionPriceChange(stepIndex, optionIndex, variation.id, 'dine-in', e.target.value)}
                                className="w-full h-7 text-xs pl-2 pr-5"
                                placeholder={t(translations.price)} />
                            <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">€</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                                checked={option.visibility?.[variation.id] ?? true}
                                onCheckedChange={(checked) => handleOptionChange(stepIndex, optionIndex, 'visibility', {...option.visibility, [variation.id]: checked})}
                            />
                            <span className="text-xs text-muted-foreground">{t(translations.visible)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
             <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => handleAddOption(stepIndex)}><Plus className="mr-2 h-4 w-4"/> {t(translations.addOption)}</Button>
          </CardContent>
        </Card>
      ))}
      <Button variant="secondary" className="w-full" onClick={handleAddStep}><Plus className="mr-2 h-4 w-4"/> {t(translations.addCompositionStep)}</Button>
    </div>
  );
};


export default function MenuPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editedItem, setEditedItem] = useState<MenuItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);
  const [syncPopupTab, setSyncPopupTab] = useState('article');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [dialogSelectedStoreId, setDialogSelectedStoreId] = useState<string>(availableStores[0]?.id || 'all');


  const [compositionHistory, setCompositionHistory] = useState<CompositionView[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const storeId = searchParams.get('storeId');
    const action = searchParams.get('action');
    if (storeId && availableStores.some(s => s.id === storeId)) {
        setSelectedStore(storeId);
    }
    if (action === 'add') {
        setIsSyncPopupOpen(true);
        setSyncPopupTab('import');
    }
  }, [searchParams]);

  const currentView = useMemo(() => {
    if (compositionHistory.length > 0) {
      return compositionHistory[compositionHistory.length - 1];
    }
    if (editedItem?.composition) {
      return { title: t({fr: "Composition de l'article", en: "Item Composition"}), steps: editedItem.composition };
    }
    return null;
  }, [editedItem, compositionHistory, t]);

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
      name: t({fr: "Nouvel article", en: "New Item"}),
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
  
  const deleteMenuItem = (itemId: string) => {
    setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
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
    if (!item.variations[0]) return 'N/A';
    const firstVariationPrices = Object.values(item.variations[0].prices);
    if (firstVariationPrices.length === 0) return 'N/A';
    const firstPrice = firstVariationPrices[0];
    
    if (item.variations.length > 1) {
        return `${t({fr: 'à partir de', en: 'from'})} ${firstPrice.toFixed(2)}€`
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
      title: isStepped ? t({fr: 'Étape 1', en: 'Step 1'}) : '',
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
        handleNavigateComposition(optionToUpdate.composition, `${t({fr: "Composition de", en: "Composition of"})}: ${optionToUpdate.name}`);
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

  const translations = {
    title: { fr: "Gestion du Menu", en: "Menu Management" },
    description: { fr: "Gérez votre menu, ajoutez de nouveaux plats et synchronisez avec l'IA.", en: "Manage your menu, add new items, and sync with AI." },
    yourMenu: { fr: "Votre Menu", en: "Your Menu" },
    yourMenuDescription: { fr: "Consultez, modifiez et gérez la disponibilité de vos articles.", en: "View, edit, and manage the availability of your items." },
    addSync: { fr: "Ajouter / Synchroniser", en: "Add / Sync" },
    searchByName: { fr: "Rechercher par nom...", en: "Search by name..." },
    allCategories: { fr: "Toutes les catégories", en: "All categories" },
    allStores: { fr: "Toutes les boutiques", en: "All stores" },
    allStatuses: { fr: "Tous les statuts", en: "All statuses" },
    image: { fr: "Image", en: "Image" },
    name: { fr: "Nom", en: "Name" },
    category: { fr: "Catégorie", en: "Category" },
    price: { fr: "Prix", en: "Price" },
    availability: { fr: "Disponibilité", en: "Availability" },
    outOfStock: { fr: "En rupture", en: "Out of stock" },
    action: { fr: "Action", en: "Action" },
    always: { fr: "Toujours", en: "Always" },
    creationTools: { fr: "Outils de création et synchronisation", en: "Creation and Synchronization Tools" },
    selectStoreAction: { fr: "Sélectionnez une boutique puis choisissez une action.", en: "Select a store then choose an action." },
    applyToStore: { fr: "Appliquer à la boutique", en: "Apply to store" },
    selectStore: { fr: "Sélectionner une boutique", en: "Select a store" },
    item: { fr: "Article", en: "Item" },
    import: { fr: "Importer", en: "Import" },
    createItemManually: { fr: "Créez un nouvel article manuellement et configurez toutes ses options en détail.", en: "Create a new item manually and configure all its options in detail." },
    createNewItem: { fr: "Créer un nouvel article", en: "Create a new item" },
    newCategoryName: { fr: "Nom de la nouvelle catégorie", en: "New category name" },
    categoryNamePlaceholder: { fr: "Ex: Boissons fraîches", en: "Ex: Cold Drinks" },
    addCategory: { fr: "Ajouter la catégorie", en: "Add category" },
    importDescription: { fr: "Importez depuis un fichier Excel ou une image (flyer, menu existant). Notre IA détectera et ajoutera les plats pour vous.", en: "Import from an Excel file or an image (flyer, existing menu). Our AI will detect and add the dishes for you." },
    openMenu: { fr: "Ouvrir le menu", en: "Open menu" },
    edit: { fr: "Modifier", en: "Edit" },
    delete: { fr: "Supprimer", en: "Delete" },
    areYouSure: { fr: "Êtes-vous sûr ?", en: "Are you sure?" },
    deleteItemConfirmation: { fr: "Cette action est irréversible et supprimera cet article définitivement.", en: "This action is irreversible and will permanently delete this item." },
    cancel: { fr: "Annuler", en: "Cancel" },
    back: { fr: "Retour", en: "Back" },
    newItem: { fr: "Nouvel Article", en: "New Item" },
    generalInfo: { fr: "Informations générales", en: "General Information" },
    changeImage: { fr: "Changer l'image", en: "Change image" },
    itemName: { fr: "Nom de l'article", en: "Item name" },
    itemDescription: { fr: "Description", en: "Description" },
    sizesAndPrices: { fr: "Tailles & Tarifs", en: "Sizes & Prices" },
    sizesAndPricesDescription: { fr: "Définissez les tailles et les prix par canal de vente.", en: "Define sizes and prices per sales channel." },
    sizeNamePlaceholder: { fr: "Nom de la taille (ex: Large)", en: "Size name (e.g., Large)" },
    pricePerChannel: { fr: "Prix par mode de vente", en: "Price per sales channel" },
    addSize: { fr: "Ajouter une taille/variation", en: "Add a size/variation" },
    availabilityTitle: { fr: "Disponibilité", en: "Availability" },
    availabilityDescription: { fr: "Définissez quand cet article peut être commandé.", en: "Define when this item can be ordered." },
    salesTags: { fr: "Tags de Vente", en: "Sales Tags" },
    suggestWithAI: { fr: "Suggérer par IA", en: "Suggest with AI" },
    addTag: { fr: "Ajouter un tag...", en: "Add a tag..." },
    add: { fr: "Ajouter", en: "Add" },
    noComposition: { fr: "Ce plat n'a pas de composition.", en: "This dish has no composition." },
    createSteppedComposition: { fr: "Créer une composition par étapes", en: "Create stepped composition" },
    addSimpleOptionList: { fr: "Ajouter une liste d'options simple", en: "Add a simple option list" },
    saveChanges: { fr: "Enregistrer les modifications", en: "Save changes" },
    active: { fr: "Actif", en: "Active" },
    outOfStockStatus: { fr: "En rupture", en: "Out of stock" },
    inactive: { fr: "Inactif", en: "Inactive" },
    confirmVariationDeletion: { fr: "Êtes-vous sûr de vouloir supprimer cette variation ?", en: "Are you sure you want to delete this variation?" },
    variationDeletionDescription: { fr: "Toutes les données de prix et de disponibilité pour cette taille seront perdues.", en: "All price and availability data for this size will be lost." },

  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
        <p className="text-muted-foreground">{t(translations.description)}</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>{t(translations.yourMenu)}</CardTitle>
            <CardDescription>{t(translations.yourMenuDescription)}</CardDescription>
          </div>
           <Dialog open={isSyncPopupOpen} onOpenChange={setIsSyncPopupOpen}>
             <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t(translations.addSync)}
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t(translations.creationTools)}</DialogTitle>
                    <DialogDescription>
                        {t(translations.selectStoreAction)}
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-2 py-2">
                    <Label>{t(translations.applyToStore)}</Label>
                    <Select value={dialogSelectedStoreId} onValueChange={setDialogSelectedStoreId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t(translations.selectStore)} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t(translations.allStores)}</SelectItem>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <Tabs value={syncPopupTab} onValueChange={setSyncPopupTab} className="pt-2">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="article">{t(translations.item)}</TabsTrigger>
                        <TabsTrigger value="category">{t(translations.category)}</TabsTrigger>
                        <TabsTrigger value="import">{t(translations.import)}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="article" className="pt-4 space-y-4">
                       <p className="text-sm text-muted-foreground">
                        {t(translations.createItemManually)}
                       </p>
                       <Button className="w-full" onClick={handleCreateNewItem}><PlusCircle className="mr-2 h-4 w-4"/>{t(translations.createNewItem)}</Button>
                    </TabsContent>
                    <TabsContent value="category" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">{t(translations.newCategoryName)}</Label>
                            <Input id="cat-name" placeholder={t(translations.categoryNamePlaceholder)}/>
                        </div>
                        <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>{t(translations.addCategory)}</Button>
                    </TabsContent>
                    <TabsContent value="import" className="pt-4 space-y-4">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                          <p className="text-sm text-muted-foreground">Emplacement Vidéo Explicative</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t(translations.importDescription)}
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
                    <Input placeholder={t(translations.searchByName)} className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-4 md:w-auto w-full">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="md:w-48 w-full"><SelectValue placeholder={t(translations.category)} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t(translations.allCategories)}</SelectItem>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger className="md:w-48 w-full"><Store className="h-4 w-4 mr-2" /><SelectValue placeholder={t({fr: "Boutique", en: "Store"})} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t(translations.allStores)}</SelectItem>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="md:w-48 w-full"><SelectValue placeholder={t({fr: "Statut", en: "Status"})} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t(translations.allStatuses)}</SelectItem>
                            <SelectItem value="active">{t(translations.active)}</SelectItem>
                            <SelectItem value="out-of-stock">{t(translations.outOfStockStatus)}</SelectItem>
                            <SelectItem value="inactive">{t(translations.inactive)}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">{t(translations.image)}</TableHead>
                        <TableHead>{t(translations.name)}</TableHead>
                        <TableHead>{t(translations.category)}</TableHead>
                        <TableHead>{t(translations.price)}</TableHead>
                        <TableHead>{t(translations.availability)}</TableHead>
                        <TableHead>{t(translations.outOfStock)}</TableHead>
                        <TableHead className="text-right">{t(translations.action)}</TableHead>
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
                                <span className="text-xs text-muted-foreground italic">{t(translations.always)}</span>
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
                                        <span className="sr-only">{t(translations.openMenu)}</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleItemClick(item)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {t(translations.edit)}
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t(translations.delete)}
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t(translations.areYouSure)}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t(translations.deleteItemConfirmation)}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteMenuItem(item.id)}>{t(translations.delete)}</AlertDialogAction>
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
        </CardContent>
      </Card>

      {editedItem && (
        <Dialog open={isPopupOpen} onOpenChange={closePopup}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
               {compositionHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleBackComposition} className="absolute left-4 top-4 h-auto p-1.5 rounded-md z-10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t(translations.back)}
                </Button>
              )}
               <DialogTitle className="text-center text-2xl font-headline pt-2">
                {compositionHistory.length > 0 ? currentView?.title : (editedItem.name || t(translations.newItem))}
               </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto -mx-6 px-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              {compositionHistory.length === 0 && (
                <div className="space-y-4 md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline">{t(translations.generalInfo)}</CardTitle>
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
                                        {t(translations.changeImage)}
                                    </Button>
                                </div>
                                <Input type="file" ref={imageInputRef} className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </div>
                             <div>
                                <Label htmlFor="item-name">{t(translations.itemName)}</Label>
                                <Input id="item-name" value={editedItem.name} onChange={(e) => setEditedItem({...editedItem, name: e.target.value})} />
                             </div>
                             <div>
                                <Label htmlFor="item-desc">{t(translations.itemDescription)}</Label>
                                <Textarea id="item-desc" value={editedItem.description} onChange={(e) => setEditedItem({...editedItem, description: e.target.value})} />
                             </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline flex items-center gap-2"><Ruler className="h-4 w-4" /> {t(translations.sizesAndPrices)}</CardTitle>
                            <CardDescription>
                                {t(translations.sizesAndPricesDescription)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {editedItem.variations.map((variation, v_index) => (
                                <div key={variation.id} className="space-y-3 p-3 border rounded-md relative">
                                    {editedItem.variations.length > 1 && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-1 right-1 text-destructive h-7 w-7"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t(translations.confirmVariationDeletion)}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t(translations.variationDeletionDescription)}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemoveVariation(variation.id)}>{t(translations.delete)}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    <Input
                                        placeholder={t(translations.sizeNamePlaceholder)}
                                        value={variation.name}
                                        onChange={(e) => handleVariationChange(variation.id, 'name', e.target.value)}
                                        className="font-semibold"
                                    />
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t(translations.pricePerChannel)}</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {saleChannels.map(channel => (
                                                <div key={channel.id} className="relative">
                                                    <Input
                                                        type="number"
                                                        placeholder={t(channel.label)}
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
                            <Button variant="outline" size="sm" className="w-full" onClick={handleAddVariation}><Plus className="mr-2 h-4 w-4" />{t(translations.addSize)}</Button>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline flex items-center justify-between">
                                <span>{t(translations.availabilityTitle)}</span>
                                <Switch
                                    checked={editedItem.availability.type === 'scheduled'}
                                    onCheckedChange={(checked) => setEditedItem(prev => prev ? {...prev, availability: {...prev.availability, type: checked ? 'scheduled' : 'always'}} : null)}
                                />
                            </CardTitle>
                             <CardDescription>
                                {t(translations.availabilityDescription)}
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
                                            <Label htmlFor={day.id}>{t(day.label)}</Label>
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
                                    <span>{t(translations.salesTags)}</span>
                                    <Button variant="ghost" size="sm" className="h-auto p-1 text-sm font-normal text-muted-foreground hover:text-primary">
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        {t(translations.suggestWithAI)}
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
                                      placeholder={t(translations.addTag)}
                                      value={tagInput}
                                      onChange={(e) => setTagInput(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                    />
                                    <Button onClick={handleAddTag}>{t(translations.add)}</Button>
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
                           <p className="text-sm text-muted-foreground mb-4">{t(translations.noComposition)}</p>
                           <div className="flex flex-col gap-3">
                                <Button variant="secondary" onClick={() => handleCreateBaseComposition(true)}>
                                    <Layers className="mr-2 h-4 w-4"/> {t(translations.createSteppedComposition)}
                                </Button>
                                <Button variant="secondary" onClick={() => handleCreateBaseComposition(false)}>
                                    <List className="mr-2 h-4 w-4"/> {t(translations.addSimpleOptionList)}
                                </Button>
                           </div>
                        </div>
                    </Card>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={closePopup}>{t(translations.cancel)}</Button>
                <Button>{t(translations.saveChanges)}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
