
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
import { Button } from '@/components/ui/button';
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2, Wand2, Tag } from 'lucide-react';

type MenuItemComponent = {
  name: string;
  quantity: number;
  maxQuantity: number;
};

type MenuItem = {
  id: number;
  category: string;
  name: string;
  price: string;
  description: string;
  image: string;
  imageHint: string;
  tags?: string[];
  components?: MenuItemComponent[];
};

const initialMenuItems: MenuItem[] = [
    { 
        id: 1,
        category: 'Plats', 
        name: 'Burger "Le Classique"', 
        price: '15.50€', 
        description: 'Un classique indémodable avec un steak haché frais, cheddar fondant, salade croquante, oignons rouges, cornichons, et notre sauce burger secrète, servi avec des frites maison.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'classic burger',
        tags: ['Populaire', 'Soir', 'Famille'],
        components: [
            { name: 'Steak', quantity: 1, maxQuantity: 3 },
            { name: 'Cheddar', quantity: 1, maxQuantity: 2 },
            { name: 'Sauce Burger', quantity: 1, maxQuantity: 2 },
            { name: 'Oignons', quantity: 1, maxQuantity: 1 },
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
        category: 'Plats', 
        name: 'Pizza Regina', 
        price: '14.00€', 
        description: 'Sauce tomate, mozzarella fondante, jambon de Paris, champignons frais et olives noires.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'pizza'
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
                {selectedItem.components && selectedItem.components.length > 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <ul className="space-y-3">
                        {selectedItem.components.map((component, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="text-foreground">{component.name}</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">x{component.quantity}</Badge>
                                <span className="text-xs text-muted-foreground">(max. {component.maxQuantity})</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">Ce plat n'a pas de composants modifiables.</p>
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
