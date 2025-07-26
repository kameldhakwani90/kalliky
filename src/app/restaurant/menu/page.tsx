

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
import { PlusCircle, Wand2, Tag, Info, ArrowLeft, ChevronRight, UploadCloud, Store, MoreHorizontal, Pencil, Trash2, Search, Clock, ImagePlus, Plus, X, List, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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

type CompositionOption = {
  id: string;
  name: string;
  price?: number; 
  composition?: CompositionStep[];
};

type CompositionStep = {
  id: string;
  title: string;
  options: CompositionOption[];
  selectionType: 'single' | 'multiple'; 
  isRequired: boolean;
};

type MenuItem = {
  id: number;
  category: string;
  name:string;
  price: string;
  description: string;
  image: string;
  imageHint: string;
  tags?: string[];
  composition?: CompositionStep[];
  storeIds: number[];
  status: 'active' | 'out-of-stock' | 'inactive';
  availability: Availability;
};

const availableStores = [
    { id: 1, name: "Le Gourmet Parisien - Centre" },
    { id: 2, name: "Le Gourmet Parisien - Montmartre"},
    { id: 3, name: "Pizzeria Bella - Bastille" },
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


const initialMenuItems: MenuItem[] = [
    { 
        id: 1,
        category: 'Plats', 
        name: 'Burger "Le Personnalisé"', 
        price: 'à partir de 16.50€', 
        description: 'Composez le burger de vos rêves ! Choisissez votre pain, votre protéine, vos fromages et tous les suppléments que vous aimez.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'custom burger',
        tags: ['Populaire', 'Soir', 'Famille'],
        storeIds: [1, 2],
        status: 'active',
        availability: defaultAvailability,
        composition: [
            {
                id: 'step1',
                title: 'Étape 1 : Le Pain (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { id: 'opt1.1', name: 'Pain Brioché' },
                    { id: 'opt1.2', name: 'Pain Sésame' },
                ]
            },
            {
                id: 'step2',
                title: 'Étape 2 : La Protéine (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { 
                        id: 'opt2.1',
                        name: 'Steak de Boeuf (150g)', 
                        composition: [
                            {
                                id: 'substep1',
                                title: 'Choix de la cuisson',
                                selectionType: 'single',
                                isRequired: true,
                                options: [
                                    { id: 'subopt1.1', name: 'À point' },
                                    { id: 'subopt1.2', name: 'Saignant' },
                                    { id: 'subopt1.3', name: 'Bien cuit' },
                                ]
                            }
                        ]
                    },
                    { id: 'opt2.2', name: 'Poulet Pané Croustillant' },
                    { id: 'opt2.3', name: 'Galette Végétarienne' },
                ]
            },
             {
                id: 'step3',
                title: 'Étape 3 : Les Fromages (2 max)',
                selectionType: 'multiple',
                isRequired: false,
                options: [
                    { id: 'opt3.1', name: 'Cheddar' },
                    { id: 'opt3.2', name: 'Chèvre', price: 1.50 },
                    { id: 'opt3.3', name: 'Reblochon', price: 1.50 },
                ]
            },
            {
                id: 'step4',
                title: 'Étape 4 : Les Suppléments',
                selectionType: 'multiple',
                isRequired: false,
                options: [
                    { id: 'opt4.1', name: 'Salade' },
                    { id: 'opt4.2', name: 'Tomate' },
                    { id: 'opt4.3', name: 'Oignons' },
                    { id: 'opt4.4', name: 'Bacon grillé', price: 2.00 },
                    { id: 'opt4.5', name: 'Oeuf au plat', price: 1.00 },
                ]
            }
        ]
    },
    { 
        id: 2,
        category: 'Entrées', 
        name: 'Salade César', 
        price: '12.50€', 
        description: 'Laitue romaine croquante, poulet grillé, croûtons à l\'ail, copeaux de parmesan et notre sauce César maison.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'caesar salad',
        tags: ['Léger', 'Midi', 'Froid'],
        storeIds: [1, 3],
        status: 'active',
        availability: {...defaultAvailability, type: 'scheduled' },
    },
    { 
        id: 3,
        category: 'Menus', 
        name: 'Formule Regina', 
        price: '18.00€', 
        description: 'Le classique italien en formule complète, avec une boisson au choix.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'pizza deal',
        storeIds: [3],
        status: 'out-of-stock',
        availability: defaultAvailability,
        composition: [
             {
                id: 'step_menu1',
                title: 'Plat Principal',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { id: 'opt_menu1.1', name: 'Pizza Regina' },
                ]
            },
            {
                id: 'step_menu2',
                title: 'Boisson (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { id: 'opt_menu2.1', name: 'Coca-Cola (33cl)' },
                    { id: 'opt_menu2.2', name: 'Eau Plate (50cl)' },
                    { id: 'opt_menu2.3', name: 'Jus d\'orange (25cl)' },
                ]
            }
        ]
    },
    { 
        id: 4,
        category: 'Desserts', 
        name: 'Tiramisu au café', 
        price: '8.50€', 
        description: 'Biscuit cuillère imbibé de café, crème mascarpone onctueuse et cacao en poudre.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'tiramisu',
        tags: ['Sucré', 'Fait maison'],
        storeIds: [1, 2, 3],
        status: 'inactive',
        availability: defaultAvailability,
    },
];

const categoriesData = ['Plats', 'Entrées', 'Menus', 'Desserts', 'Boissons'];
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
  onNavigate: (steps: CompositionStep[], title: string) => void;
  onOptionCompositionCreate: (stepIndex: number, optionIndex: number) => void;
  onUpdate: (steps: CompositionStep[]) => void;
}> = ({ view, onNavigate, onOptionCompositionCreate, onUpdate }) => {

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
        price: 0
    };
    newSteps[stepIndex].options.push(newOption);
    onUpdate(newSteps);
  };

  const handleRemoveOption = (stepIndex: number, optionIndex: number) => {
    const newSteps = [...view.steps];
    newSteps[stepIndex].options = newSteps[stepIndex].options.filter((_, i) => i !== optionIndex);
    onUpdate(newSteps);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{view.title}</h3>
      {view.steps.map((step, stepIndex) => (
        <Card key={step.id} className="bg-muted/30">
          <CardHeader className="py-3 px-4 flex-row items-center justify-between">
            <Input defaultValue={step.title} className="text-base font-semibold border-none shadow-none focus-visible:ring-1 p-1 h-auto" />
             <div className="flex items-center gap-2">
                <Badge variant={step.isRequired ? "destructive" : "secondary"} className="text-xs">{step.isRequired ? "Requis" : "Optionnel"}</Badge>
                <Switch checked={step.isRequired} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveStep(stepIndex)}><Trash2 className="h-4 w-4"/></Button>
             </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <ul className="space-y-2">
              {step.options.map((option, optionIndex) => (
                <li key={option.id} className="flex flex-col text-sm border-t border-border pt-3">
                  <div className="flex justify-between items-center gap-2">
                    <Input defaultValue={option.name} className="font-medium h-8" />
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue={option.price} className="w-24 h-8" placeholder="Prix sup." />
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
  const [categories, setCategories] = useState<string[]>(categoriesData);
  const [editedItem, setEditedItem] = useState<MenuItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
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
      const storeMatch = selectedStore === 'all' || item.storeIds.includes(parseInt(selectedStore));
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const statusMatch = selectedStatus === 'all' || item.status === statusMatch;
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
      id: Date.now(),
      name: "Nouvel Article",
      category: categories.length > 0 ? categories[0] : "Plats",
      price: '0.00€',
      description: 'Description du nouvel article',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'new item',
      tags: [],
      storeIds: availableStores.map(s => s.id),
      status: 'inactive',
      availability: defaultAvailability,
    };
    setEditedItem(newItem);
    setCompositionHistory([]); 
    setIsPopupOpen(true);
    setIsSyncPopupOpen(false);
  };
  
  const toggleItemStatus = (itemId: number, checked: boolean) => {
    setMenuItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            return { ...item, status: checked ? 'out-of-stock' : 'active' };
        }
        return item;
    }));
  };

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
                        Utilisez nos outils pour créer ou mettre à jour votre menu rapidement.
                    </DialogDescription>
                </DialogHeader>
                 <Tabs defaultValue="import" className="pt-4">
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
                            {categoriesData.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger className="md:w-48 w-full"><Store className="h-4 w-4 mr-2" /><SelectValue placeholder="Boutique" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les boutiques</SelectItem>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>)}
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
                            <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.price}</TableCell>
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
               <div className="text-center pt-2">
                 {compositionHistory.length > 0 ? (
                    <DialogTitle className="text-2xl font-headline">{currentView?.title}</DialogTitle>
                 ) : (
                    <DialogTitle className="text-2xl font-headline">{editedItem.name}</DialogTitle>
                 )}
               </div>
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
