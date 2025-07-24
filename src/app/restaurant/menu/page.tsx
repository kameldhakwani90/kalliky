
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
    { 
        category: 'Entrées', 
        name: 'Salade César', 
        price: '12.50€', 
        description: 'Laitue romaine croquante, poulet grillé, croûtons à l\'ail, copeaux de parmesan et notre sauce César maison.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'caesar salad'
    },
    { 
        category: 'Plats', 
        name: 'Filet de boeuf Rossini', 
        price: '28.00€', 
        description: 'Tournedos de filet de bœuf poêlé, surmonté d\'une tranche de foie gras chaud, servi avec une sauce au Madère et des frites maison.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'beef steak'
    },
    { 
        category: 'Plats', 
        name: 'Pizza Regina', 
        price: '14.00€', 
        description: 'Sauce tomate, mozzarella fondante, jambon de Paris, champignons frais et olives noires.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'pizza'
    },
    { 
        category: 'Desserts', 
        name: 'Tiramisu au café', 
        price: '8.50€', 
        description: 'Biscuit cuillère imbibé de café, crème mascarpone onctueuse et cacao en poudre.',
        image: 'https://placehold.co/600x400.png',
        imageHint: 'tiramisu'
    },
];

const categories = ['Tout', ...new Set(menuItems.map(item => item.category))];

export default function MenuPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Menu</h1>
          <p className="text-muted-foreground">Gérez votre menu, ajoutez de nouveaux plats et synchronisez avec l\'IA.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Ajouter un plat
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Votre Menu</CardTitle>
          <CardDescription>Parcourez et gérez les plats de votre restaurant.</CardDescription>
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
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden flex flex-col">
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
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <p className="text-xl font-bold pt-1">{item.price}</p>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Outils de Synchronisation IA</CardTitle>
          <CardDescription>
            Ajoutez ou mettez à jour votre menu rapidement grâce à l'intelligence artificielle.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="excel">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="excel">Importer un fichier Excel</TabsTrigger>
                    <TabsTrigger value="scan">Scanner une image</TabsTrigger>
                </TabsList>
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
    </div>
  );
}
