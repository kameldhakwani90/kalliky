
'use client';

import Image from 'next/image';
import { useState, useMemo, ChangeEvent } from 'react';
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
import { PlusCircle, Wand2, Tag, Info, ArrowLeft, ChevronRight, UploadCloud, Store, MoreHorizontal, Pencil, Trash2, Search, Clock, ImagePlus, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type CompositionOption = {
  name: string;
  defaultQuantity: number;
  maxQuantity: number;
  price?: number; 
  isDefault?: boolean;
  composition?: CompositionStep[];
};

type CompositionStep = {
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
  availability: {
      type: 'always' | 'scheduled';
      from?: string;
      to?: string;
  };
};

const availableStores = [
    { id: 1, name: "Le Gourmet Parisien - Centre" },
    { id: 2, name: "Le Gourmet Parisien - Montmartre"},
    { id: 3, name: "Pizzeria Bella - Bastille" },
];

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
        availability: { type: 'always' },
        composition: [
            {
                title: 'Étape 1 : Le Pain (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { name: 'Pain Brioché', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                    { name: 'Pain Sésame', defaultQuantity: 0, maxQuantity: 1 },
                ]
            },
            {
                title: 'Étape 2 : La Protéine (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { 
                        name: 'Steak de Boeuf (150g)', 
                        defaultQuantity: 1, 
                        maxQuantity: 1, 
                        isDefault: true,
                        composition: [
                            {
                                title: 'Choix de la cuisson',
                                selectionType: 'single',
                                isRequired: true,
                                options: [
                                    { name: 'À point', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                                    { name: 'Saignant', defaultQuantity: 0, maxQuantity: 1 },
                                    { name: 'Bien cuit', defaultQuantity: 0, maxQuantity: 1 },
                                ]
                            }
                        ]
                    },
                    { name: 'Poulet Pané Croustillant', defaultQuantity: 0, maxQuantity: 1 },
                    { name: 'Galette Végétarienne', defaultQuantity: 0, maxQuantity: 1 },
                ]
            },
             {
                title: 'Étape 3 : Les Fromages (2 max)',
                selectionType: 'multiple',
                isRequired: false,
                options: [
                    { name: 'Cheddar', defaultQuantity: 1, maxQuantity: 2, isDefault: true },
                    { name: 'Chèvre', defaultQuantity: 0, maxQuantity: 2, price: 1.50 },
                    { name: 'Reblochon', defaultQuantity: 0, maxQuantity: 2, price: 1.50 },
                ]
            },
            {
                title: 'Étape 4 : Les Suppléments',
                selectionType: 'multiple',
                isRequired: false,
                options: [
                    { name: 'Salade', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                    { name: 'Tomate', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                    { name: 'Oignons', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                    { name: 'Bacon grillé', defaultQuantity: 0, maxQuantity: 2, price: 2.00 },
                    { name: 'Oeuf au plat', defaultQuantity: 0, maxQuantity: 1, price: 1.00 },
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
        availability: { type: 'scheduled', from: '12:00', to: '14:30' },
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
        availability: { type: 'always' },
        composition: [
             {
                title: 'Plat Principal',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { name: 'Pizza Regina', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                ]
            },
            {
                title: 'Boisson (1 au choix)',
                selectionType: 'single',
                isRequired: true,
                options: [
                    { name: 'Coca-Cola (33cl)', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
                    { name: 'Eau Plate (50cl)', defaultQuantity: 0, maxQuantity: 1 },
                    { name: 'Jus d\'orange (25cl)', defaultQuantity: 0, maxQuantity: 1 },
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
        availability: { type: 'always' },
    },
];

const categoriesData = ['Plats', 'Entrées', 'Menus', 'Desserts', 'Boissons'];

const currentUserPlan = 'pro'; 

type CompositionView = {
    title: string;
    steps: CompositionStep[];
};

const EditableCompositionDisplay: React.FC<{
  view: CompositionView;
  onNavigate: (steps: CompositionStep[], title: string) => void;
  onOptionCompositionCreate: (stepIndex: number, optionIndex: number) => void;
}> = ({ view, onNavigate, onOptionCompositionCreate }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{view.title}</h3>
      {view.steps.map((step, stepIndex) => (
        <Card key={stepIndex} className="bg-muted/30">
          <CardHeader className="py-3 px-4 flex-row items-center justify-between">
            <Input defaultValue={step.title} className="text-base font-semibold border-none shadow-none focus-visible:ring-1 p-1 h-auto" />
             <div className="flex items-center gap-2">
                <Badge variant={step.isRequired ? "destructive" : "secondary"} className="text-xs">{step.isRequired ? "Requis" : "Optionnel"}</Badge>
                <Switch checked={step.isRequired} />
             </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <ul className="space-y-2">
              {step.options.map((option, optionIndex) => (
                <li key={optionIndex} className="flex flex-col text-sm border-t border-border pt-3">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
             <Button variant="outline" size="sm" className="w-full mt-2"><Plus className="mr-2 h-4 w-4"/> Ajouter une option</Button>
          </CardContent>
        </Card>
      ))}
      <Button variant="secondary" className="w-full"><Plus className="mr-2 h-4 w-4"/> Ajouter une étape de composition</Button>
    </div>
  );
};


export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<string[]>(categoriesData);
  const [editedItem, setEditedItem] = useState<MenuItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

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

  const handleCreateAndEditItem = () => {
    if (!newItemName || !newItemCategory) return;
    const newItem: MenuItem = {
      id: Date.now(),
      name: newItemName,
      category: newItemCategory,
      price: '0.00€',
      description: '',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'new item',
      tags: [],
      storeIds: availableStores.map(s => s.id),
      status: 'inactive',
      availability: { type: 'always' },
    };
    
    setNewItemName('');
    setNewItemCategory('');
    setIsSyncPopupOpen(false);
    
    // Defer opening the edit popup to allow the sync popup to close smoothly
    setTimeout(() => {
        handleItemClick(newItem);
    }, 100);
  };
  
  const toggleItemStatus = (itemId: number, checked: boolean) => {
    setMenuItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            const newStatus = checked ? 'out-of-stock' : 'active';
            return { ...item, status: newStatus };
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

  const handleCreateBaseComposition = () => {
    if (!editedItem) return;
    setEditedItem(prev => ({
        ...prev!,
        composition: [],
    }));
  };

  const handleCreateSubComposition = (stepIndex: number, optionIndex: number) => {
     if (!editedItem || !currentView) return;

    const newComposition = [...currentView.steps];
    const optionToUpdate = newComposition[stepIndex].options[optionIndex];
    if (optionToUpdate) {
        optionToUpdate.composition = [];
        handleNavigateComposition(optionToUpdate.composition, `Composition de : ${optionToUpdate.name}`);
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
                 <Tabs defaultValue="add-item" className="pt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="add-item">Article</TabsTrigger>
                        <TabsTrigger value="add-cat">Catégorie</TabsTrigger>
                        <TabsTrigger value="import">Importer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="add-item" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-name">Nom de l'article</Label>
                            <Input 
                                id="item-name" 
                                placeholder="Ex: Pizza Margherita"
                                value={newItemName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItemName(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="item-cat">Catégorie</Label>
                            <Select onValueChange={setNewItemCategory} value={newItemCategory}>
                                <SelectTrigger><SelectValue placeholder="Choisir une catégorie"/></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full" onClick={handleCreateAndEditItem}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter l'article et modifier</Button>
                    </TabsContent>
                    <TabsContent value="add-cat" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Nom de la nouvelle catégorie</Label>
                            <Input id="cat-name" placeholder="Ex: Boissons fraîches"/>
                        </div>
                        <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Ajouter la catégorie</Button>
                    </TabsContent>
                    <TabsContent value="import" className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Importez depuis un fichier Excel ou une image. Notre IA détectera et ajoutera les plats pour vous.
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
                                    <span className="text-xs">{item.availability.from} - {item.availability.to}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">Toujours</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Switch
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
                    <>
                    <Input className="text-2xl font-headline text-center h-auto p-1 border-none focus-visible:ring-1" defaultValue={editedItem.name} />
                    <Textarea className="text-center text-muted-foreground border-none focus-visible:ring-1 resize-none" defaultValue={editedItem.description} />
                    </>
                 )}
               </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto -mx-6 px-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {compositionHistory.length === 0 && (
                <div className="space-y-4 md:col-span-1">
                    <div className="relative group">
                        <Image
                            src={editedItem.image}
                            alt={editedItem.name}
                            width={600}
                            height={400}
                            data-ai-hint={editedItem.imageHint}
                            className="w-full rounded-lg object-cover shadow-lg"
                        />
                        <Button size="sm" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImagePlus className="mr-2 h-4 w-4" />
                            Changer
                        </Button>
                    </div>

                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-headline flex items-center justify-between">
                                <span>Disponibilité</span>
                                <Switch 
                                    checked={editedItem.availability.type === 'scheduled'}
                                    onCheckedChange={(checked) => setEditedItem(prev => prev ? {...prev, availability: {...prev.availability, type: checked ? 'scheduled' : 'always'}} : null)}
                                />
                            </CardTitle>
                        </CardHeader>
                        {editedItem.availability.type === 'scheduled' && (
                             <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="from-time">De</Label>
                                    <Input id="from-time" type="time" defaultValue={editedItem.availability.from}/>
                                </div>
                                <div>
                                    <Label htmlFor="to-time">À</Label>
                                    <Input id="to-time" type="time" defaultValue={editedItem.availability.to}/>
                                </div>
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
                    />
                ) : (
                    <Card className="flex items-center justify-center p-4 bg-muted/50 h-full">
                        <div className="text-center">
                           <Info className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground mb-4">Ce plat n'a pas de composition.</p>
                           <Button variant="secondary" onClick={handleCreateBaseComposition}><Plus className="mr-2 h-4 w-4"/> Créer une composition</Button>
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
