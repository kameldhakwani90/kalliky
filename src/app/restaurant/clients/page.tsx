

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Filter, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

type Customer = {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    status: 'Nouveau' | 'Fidèle' | 'VIP';
    totalSpent: string;
    lastSeen: string;
};

const initialCustomers: Customer[] = [
    {
        id: 'cust-1',
        phone: "06 12 34 56 78",
        firstName: "Alice",
        lastName: "Martin",
        email: "alice.martin@email.com",
        status: "Fidèle",
        totalSpent: "870.00€",
        lastSeen: "28/05/2024",
    },
     {
        id: 'cust-2',
        phone: "07 87 65 43 21",
        firstName: "Bob",
        lastName: "Dupont",
        status: "Nouveau",
        totalSpent: "57.90€",
        lastSeen: "27/05/2024",
    },
];

export default function ClientsPage() {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const router = useRouter();

    const handleViewCustomer = (customerId: string) => {
        router.push(`/restaurant/clients/${customerId}`);
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fichier Clients</h1>
                    <p className="text-muted-foreground">Consultez et gérez les informations de vos clients.</p>
                </div>
                <div className="flex items-center gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par nom, tél..." className="pl-10" />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtres
                    </Button>
                     <Button asChild>
                        <Link href="/restaurant/clients/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nouveau Client
                        </Link>
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Liste de vos clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Total Dépensé</TableHead>
                                <TableHead>Dernière Commande</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleViewCustomer(customer.id)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {(customer.firstName ? customer.firstName.charAt(0) : '') + (customer.lastName ? customer.lastName.charAt(0) : '') || 'CL'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p>{customer.firstName} {customer.lastName || 'Client Anonyme'}</p>
                                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.email || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}>{customer.status}</Badge>
                                    </TableCell>
                                    <TableCell>{customer.totalSpent}</TableCell>
                                    <TableCell>{customer.lastSeen}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer.id); }}>
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
