

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

type User = {
    id: string;
    name: string;
    email: string;
    role: 'Propriétaire' | 'Cuisinier' | 'Serveur';
    assignedStores: string[]; // Array of store IDs
};

type Store = {
    id: string;
    name: string;
    address: string;
    phone: string;
    status: 'active' | 'inactive';
};

const initialUsers: User[] = [
    { id: "user-1", name: "Alice Martin", email: "alice@gourmet.fr", role: 'Propriétaire', assignedStores: ["store-1", "store-2"] },
    { id: "user-2", name: "Bob Durand", email: "bob@gourmet.fr", role: 'Cuisinier', assignedStores: ["store-1"] },
    { id: "user-3", name: "Charlie Dupont", email: "charlie@gourmet.fr", role: 'Serveur', assignedStores: ["store-2"] },
    { id: "user-4", name: "Diana Petit", email: "diana@pizza-bella.it", role: 'Cuisinier', assignedStores: ["store-3"] },
];

const availableStores: Store[] = [
    { id: "store-1", name: "Le Gourmet Parisien - Centre", address: "12 Rue de la Paix, 75002 Paris", phone: "01 23 45 67 89", status: 'active' },
    { id: "store-2", name: "Le Gourmet Parisien - Montmartre", address: "5 Place du Tertre, 75018 Paris", phone: "01 98 76 54 32", status: 'active' },
    { id: "store-3", name: "Pizzeria Bella - Bastille", address: "3 Rue de la Roquette, 75011 Paris", phone: "01 44 55 66 77", status: 'inactive' },
];


export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleOpenDialog = (user: User | null = null) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Logic to save user will be implemented here
        setIsDialogOpen(false);
    };
    
    const deleteUser = (userId: string) => {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    };

    const getStoreNameById = (id: string) => {
        return availableStores.find(store => store.id === id)?.name;
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
                    <p className="text-muted-foreground">Gérez les accès et les rôles des membres de votre équipe.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un utilisateur
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Liste de vos utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Boutiques Assignées</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                       {user.assignedStores.map(id => getStoreNameById(id)).join(', ')}
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
                                                <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Cette action est irréversible et supprimera cet utilisateur.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteUser(user.id)}>Supprimer</AlertDialogAction>
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
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedUser ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur"}</DialogTitle>
                        <DialogDescription>
                           Gérez les informations et les accès de vos collaborateurs.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveUser}>
                        <div className="space-y-6 py-4 px-1">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstname">Prénom</Label>
                                    <Input id="firstname" name="firstname" defaultValue={selectedUser?.name.split(' ')[0] || ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastname">Nom</Label>
                                    <Input id="lastname" name="lastname" defaultValue={selectedUser?.name.split(' ')[1] || ''} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={selectedUser?.email || ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="role">Rôle</Label>
                                <Select name="role" defaultValue={selectedUser?.role}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Propriétaire">Propriétaire</SelectItem>
                                        <SelectItem value="Cuisinier">Cuisinier (Accès KDS)</SelectItem>
                                        <SelectItem value="Serveur">Serveur (Accès Dashboard)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Separator />

                            <div className="space-y-4">
                               <h4 className="font-medium">Assigner à des boutiques</h4>
                                <div className="space-y-2">
                                    {availableStores.map(store => (
                                        <div key={store.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`store-${store.id}`} 
                                                defaultChecked={selectedUser?.assignedStores.includes(store.id)}
                                            />
                                            <Label htmlFor={`store-${store.id}`} className="font-normal">
                                                {store.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    
