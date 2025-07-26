

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
import { useLanguage } from '@/contexts/language-context';

type UserRole = 'Propriétaire' | 'Cuisinier' | 'Serveur';

type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
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
    const { t } = useLanguage();
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

    const roleTranslations: Record<UserRole, Record<'fr'|'en', string>> = {
        'Propriétaire': { fr: 'Propriétaire', en: 'Owner' },
        'Cuisinier': { fr: 'Cuisinier', en: 'Cook' },
        'Serveur': { fr: 'Serveur', en: 'Waiter' },
    };

    const translations = {
        title: { fr: "Gestion des Utilisateurs", en: "User Management" },
        description: { fr: "Gérez les accès et les rôles des membres de votre équipe.", en: "Manage access and roles for your team members." },
        addUser: { fr: "Ajouter un utilisateur", en: "Add user" },
        userList: { fr: "Liste de vos utilisateurs", en: "Your user list" },
        name: { fr: "Nom", en: "Name" },
        email: { fr: "Email", en: "Email" },
        role: { fr: "Rôle", en: "Role" },
        assignedStores: { fr: "Boutiques Assignées", en: "Assigned Stores" },
        actions: { fr: "Actions", en: "Actions" },
        openMenu: { fr: "Ouvrir le menu", en: "Open menu" },
        edit: { fr: "Modifier", en: "Edit" },
        delete: { fr: "Supprimer", en: "Delete" },
        areYouSure: { fr: "Êtes-vous sûr ?", en: "Are you sure?" },
        deleteUserConfirmation: { fr: "Cette action est irréversible et supprimera cet utilisateur.", en: "This action is irreversible and will permanently delete this user." },
        cancel: { fr: "Annuler", en: "Cancel" },
        editUser: { fr: "Modifier l'utilisateur", en: "Edit user" },
        addNewUser: { fr: "Ajouter un nouvel utilisateur", en: "Add new user" },
        manageInfo: { fr: "Gérez les informations et les accès de vos collaborateurs.", en: "Manage information and access for your collaborators." },
        firstName: { fr: "Prénom", en: "First Name" },
        lastName: { fr: "Nom", en: "Last Name" },
        selectRole: { fr: "Sélectionner un rôle", en: "Select a role" },
        cookAccess: { fr: "Cuisinier (Accès KDS)", en: "Cook (KDS Access)" },
        waiterAccess: { fr: "Serveur (Accès Dashboard)", en: "Waiter (Dashboard Access)" },
        assignToStores: { fr: "Assigner à des boutiques", en: "Assign to stores" },
        save: { fr: "Enregistrer", en: "Save" },
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                    <p className="text-muted-foreground">{t(translations.description)}</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t(translations.addUser)}
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t(translations.userList)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t(translations.name)}</TableHead>
                                <TableHead>{t(translations.email)}</TableHead>
                                <TableHead>{t(translations.role)}</TableHead>
                                <TableHead>{t(translations.assignedStores)}</TableHead>
                                <TableHead className="text-right">{t(translations.actions)}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{t(roleTranslations[user.role])}</Badge>
                                    </TableCell>
                                    <TableCell>
                                       {user.assignedStores.map(id => getStoreNameById(id)).join(', ')}
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
                                                <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
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
                                                                {t(translations.deleteUserConfirmation)}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteUser(user.id)}>{t(translations.delete)}</AlertDialogAction>
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
                        <DialogTitle>{selectedUser ? t(translations.editUser) : t(translations.addNewUser)}</DialogTitle>
                        <DialogDescription>
                           {t(translations.manageInfo)}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveUser}>
                        <div className="space-y-6 py-4 px-1">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstname">{t(translations.firstName)}</Label>
                                    <Input id="firstname" name="firstname" defaultValue={selectedUser?.name.split(' ')[0] || ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastname">{t(translations.lastName)}</Label>
                                    <Input id="lastname" name="lastname" defaultValue={selectedUser?.name.split(' ')[1] || ''} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t(translations.email)}</Label>
                                <Input id="email" name="email" type="email" defaultValue={selectedUser?.email || ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="role">{t(translations.role)}</Label>
                                <Select name="role" defaultValue={selectedUser?.role}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder={t(translations.selectRole)} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Propriétaire">{t(roleTranslations['Propriétaire'])}</SelectItem>
                                        <SelectItem value="Cuisinier">{t(translations.cookAccess)}</SelectItem>
                                        <SelectItem value="Serveur">{t(translations.waiterAccess)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Separator />

                            <div className="space-y-4">
                               <h4 className="font-medium">{t(translations.assignToStores)}</h4>
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
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t(translations.cancel)}</Button>
                            <Button type="submit">{t(translations.save)}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
