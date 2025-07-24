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
import MenuSyncForm from './menu-sync-form';
import { Badge } from '@/components/ui/badge';

const menuItems = [
    { category: 'Entrées', name: 'Salade César', price: '12.50€', description: 'Poulet grillé, parmesan, croûtons.' },
    { category: 'Entrées', name: 'Soupe à l\'oignon', price: '9.00€', description: 'Gratinée au fromage.' },
    { category: 'Plats', name: 'Filet de boeuf', price: '28.00€', description: 'Sauce au poivre, frites maison.' },
    { category: 'Plats', name: 'Pizza Margherita', price: '14.00€', description: 'Tomate, mozzarella, basilic.' },
    { category: 'Desserts', name: 'Tiramisu', price: '8.50€', description: 'Classique au café.' },
];

const categories = [...new Set(menuItems.map(item => item.category))];

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Menu</h1>
        <p className="text-muted-foreground">Mettez à jour votre menu et synchronisez-le avec notre IA.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Votre Menu Actuel</CardTitle>
                    <CardDescription>Voici les plats actuellement disponibles sur votre menu.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plat</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-right">Prix</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {menuItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                                    <TableCell className="text-right">{item.price}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation IA</CardTitle>
              <CardDescription>
                Importez un fichier Excel (.xls, .xlsx) pour mettre à jour
                automatiquement votre menu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MenuSyncForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
