
'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Wand2, Tag, Info, ArrowLeft, ChevronRight, UploadCloud, Store } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
    },
];

const categories = ['Tout', ...new Set(initialMenuItems.map(item => item.category))];

// Simule le plan actuel de l'utilisateur. 'starter', 'pro', ou 'business'
const currentUserPlan = 'pro'; 

type CompositionView = {
    title: string;
    steps: CompositionStep[];
};

const CompositionDisplay: React.FC<{
  view: CompositionView;
  onNavigate: (steps: CompositionStep[], title: string) => void;
}> = ({ view, onNavigate }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{view.title}</h3>
      {view.steps.map((step) => (
        <Card key={step.title} className="bg-muted/30">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex justify-between items-center">
              <span>{step.title}</span>
              {step.isRequired && <Badge variant="destructive" className="text-xs">Requis</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="space-y-3">
              {step.options.map((option, index) => (
                <li key={index} className="flex flex-col text-sm border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{option.name}</span>
                    <div className="flex items-center gap-3">
                      {option.price && option.price > 0 && <span className="text-muted-foreground">(+{option.price.toFixed(2)}€)</span>}
                      {option.isDefault ? <Badge variant="secondary">Inclus</Badge> : <Badge variant="outline">Option</Badge>}
                       {option.composition && (
                        <Button variant="ghost" size="sm" className="h-auto px-2 py-1" onClick={() => onNavigate(option.composition!, option.name)}>
                          Modifier <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSyncPopupOpen, setIsSyncPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Tout');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  
  // State for composition navigation
  const [compositionHistory, setCompositionHistory] = useState<CompositionView[]>([]);
  
  const currentView = useMemo(() => {
    if (compositionHistory.length > 0) {
      return compositionHistory[compositionHistory.length - 1];
    }
    if (selectedItem?.composition) {
      return { title: "Composition de l'article", steps: selectedItem.composition };
    }
    return null;
  }, [selectedItem, compositionHistory]);

  const filteredMenuItems = useMemo(() => {
    let items = menuItems;
    if (selectedStore !== 'all') {
      items = items.filter(item => item.storeIds.includes(parseInt(selectedStore)));
    }
    if (activeTab !== 'Tout') {
      items = items.filter(item => item.category === activeTab);
    }
    return items;
  }, [menuItems, activeTab, selectedStore]);


  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setCompositionHistory([]); // Reset history when opening a new item
    setIsPopupOpen(true);
  };

  const handleNavigateComposition = (steps: CompositionStep[], title: string) => {
    setCompositionHistory(prev => [...prev, { title, steps }]);
  };

  const handleBackComposition = () => {
    setCompositionHistory(prev => prev.slice(0, -1));
  };
  
  const closePopup = () => {
    setIsPopupOpen(false);
    // A small delay to allow the animation to finish before clearing the data
    setTimeout(() => {
        setSelectedItem(null);
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <CardTitle>Votre Menu</CardTitle>
            <CardDescription>Cliquez sur un plat pour voir les détails et le modifier.</CardDescription>
          </div>
           <Dialog open={isSyncPopupOpen} onOpenChange={setIsSyncPopupOpen}>
            <DialogTrigger asChild>
              <Button>
                <UploadCloud className="mr-2 h-4 w-4" />
                Ajouter ou Synchroniser
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Outils de Synchronisation IA</DialogTitle>
                    <DialogDescription>
                        Ajoutez ou mettez à jour votre menu rapidement grâce à l'intelligence artificielle.
                    </DialogDescription>
                </DialogHeader>
                 <Tabs defaultValue="excel" className="pt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="add">Ajouter un plat</TabsTrigger>
                        <TabsTrigger value="excel">Importer un fichier</TabsTrigger>
                        <TabsTrigger value="scan">Scanner une image</TabsTrigger>
                    </TabsList>
                    <TabsContent value="add" className="pt-4">
                        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground mb-4">
                               Ajoutez manuellement un nouveau plat à votre menu.
                            </p>
                            <Button>
                              <PlusCircle className="mr-2" />
                              Créer un nouveau plat
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="excel" className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Notre IA va analyser votre fichier Excel (.xls, .xlsx) pour extraire les catégories, plats, descriptions et prix.
                      </p>
                      <MenuSyncForm />
                    </TabsContent>
                    <TabsContent value="scan" className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Scannez votre menu papier ou un flyer. L'IA détectera et ajoutera les plats pour vous.
                      </p>
                       <MenuSyncForm />
                    </TabsContent>
                </Tabs>
            </DialogContent>
           </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-between items-center border-b">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="-mb-px">
                    <TabsList>
                        {categories.map(category => (
                             <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <div className="w-64">
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger>
                            <Store className="mr-2 h-4 w-4"/>
                            <SelectValue placeholder="Sélectionner une boutique" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les boutiques</SelectItem>
                            {availableStores.map(store => (
                                <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMenuItems.map((item) => (
                    <Card 
                        key={item.id} 
                        className="overflow-hidden flex flex-col group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="relative">
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={400}
                                height={250}
                                data-ai-hint={item.imageHint}
                                className="w-full h-40 object-cover"
                            />
                             <Badge variant="secondary" className="absolute top-2 left-2">{item.category}</Badge>
                        </div>
                        <CardHeader className="flex-grow">
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <p className="text-lg font-bold pt-1">{item.price}</p>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>

      {selectedItem && (
        <Dialog open={isPopupOpen} onOpenChange={closePopup}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
               {compositionHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleBackComposition} className="absolute left-4 top-4 h-auto p-1.5 rounded-md">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              )}
              <DialogTitle className="text-2xl font-headline text-center pt-2">{compositionHistory.length > 0 ? currentView?.title : selectedItem.name}</DialogTitle>
              {compositionHistory.length === 0 && (
                <DialogDescription className="text-center">{selectedItem.description}</DialogDescription>
              )}
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Colonne Gauche (Image & Tags) - visible uniquement sur la vue principale */}
              {compositionHistory.length === 0 && (
                <div className="space-y-4 md:col-span-1">
                    <Image
                        src={selectedItem.image}
                        alt={selectedItem.name}
                        width={600}
                        height={400}
                        data-ai-hint={selectedItem.imageHint}
                        className="w-full rounded-lg object-cover shadow-lg"
                    />
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
                                    {selectedItem.tags && selectedItem.tags.length > 0 ? (
                                        selectedItem.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-sm py-1 px-3 rounded-full font-normal border-gray-300">
                                                <Tag className="mr-2 h-3 w-3" />
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Aucun tag. Utilisez l'IA pour en générer.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
              )}

              {/* Colonne Droite (Composition) ou vue complète pour sous-étapes */}
              <div className={compositionHistory.length > 0 ? "md:col-span-2" : "md:col-span-1"}>
                {currentView ? (
                    <CompositionDisplay view={currentView} onNavigate={handleNavigateComposition} />
                ) : (
                    <Card className="flex items-center justify-center p-4 bg-muted/50 h-full">
                        <Info className="h-5 w-5 mr-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Ce plat n'a pas de composition modifiable.</p>
                    </Card>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    