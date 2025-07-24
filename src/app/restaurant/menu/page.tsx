
'use client';

import Image from 'next/image';
import { useState } from 'react';
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
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2, Wand2, Tag, Info } from 'lucide-react';

type CompositionOption = {
  name: string;
  defaultQuantity: number;
  maxQuantity: number;
  price?: number; // Optional price for extras
  isDefault?: boolean;
};

type CompositionStep = {
  title: string;
  options: CompositionOption[];
  selectionType: 'single' | 'multiple'; // Defines if user can select one or many options
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
                    { name: 'Steak de Boeuf (150g)', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
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
                    { name: 'Salade, Tomate, Oignons', defaultQuantity: 1, maxQuantity: 1, isDefault: true },
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
    },
    { 
        id: 3,
        category: 'Menus', 
        name: 'Formule Regina', 
        price: '18.00€', 
        description: 'Le classique italien en formule complète, avec une boisson au choix.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'pizza deal',
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
        tags: ['Sucré', 'Fait maison']
    },
];

const categories = ['Tout', ...new Set(initialMenuItems.map(item => item.category))];

// Simule le plan actuel de l'utilisateur. 'starter', 'pro', ou 'business'
const currentUserPlan = 'pro'; 

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsPopupOpen(true);
  };

  return (
    <div className="space-y-8">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Menu</h1>
        <p className="text-muted-foreground">Gérez votre menu, ajoutez de nouveaux plats et synchronisez avec l'IA.</p>
      </header>
       <Card>
        <CardHeader>
          <CardTitle>Outils de Synchronisation IA</CardTitle>
          <CardDescription>
            Ajoutez ou mettez à jour votre menu rapidement grâce à l'intelligence artificielle.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="excel">
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
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Votre Menu</CardTitle>
          <CardDescription>Cliquez sur un plat pour voir les détails et le modifier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="border-b">
                <Tabs defaultValue="Tout" className="-mb-px">
                    <TabsList>
                        {categories.map(category => (
                             <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {menuItems.map((item) => (
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
        <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">{selectedItem.name}</DialogTitle>
              <DialogDescription>{selectedItem.description}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                        <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>Tags de Vente</span>
                                <Button variant="ghost" size="sm">
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Suggérer par IA
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex flex-wrap gap-2">
                                {selectedItem.tags && selectedItem.tags.length > 0 ? (
                                    selectedItem.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-base py-1 px-3">
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
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Composition du plat</h3>
                {selectedItem.composition && selectedItem.composition.length > 0 ? (
                    <Accordion type="multiple" defaultValue={selectedItem.composition.map(c => c.title)} className="w-full">
                    {selectedItem.composition.map((step) => (
                      <AccordionItem key={step.title} value={step.title}>
                        <AccordionTrigger>{step.title}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-3">
                            {step.options.map((option, index) => (
                              <li key={index} className="flex justify-between items-center text-sm">
                                <div>
                                    <span>{option.name}</span>
                                    {option.price && option.price > 0 && <span className="text-muted-foreground ml-2">(+{option.price.toFixed(2)}€)</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {option.isDefault ? (
                                        <Badge variant="secondary">Inclus</Badge>
                                    ) : (
                                        <Badge variant="outline">Option</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {option.defaultQuantity > 0 ? `x${option.defaultQuantity}`: ''} (max. {option.maxQuantity})
                                    </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                    <Card className="flex items-center justify-center p-4 bg-muted/50">
                        <Info className="h-5 w-5 mr-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Ce plat n'a pas de composition modifiable.</p>
                    </Card>
                )}
                <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="w-full"><Pencil className="mr-2 h-4 w-4" />Modifier</Button>
                    <Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
