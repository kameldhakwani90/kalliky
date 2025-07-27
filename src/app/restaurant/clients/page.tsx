

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Filter, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

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
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const handleViewCustomer = (customerId: string) => {
        router.push(`/restaurant/clients/${customerId}`);
    };
    
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(customer =>
            (customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            customer.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const translations = {
        title: { fr: "Fichier Clients", en: "Customer File" },
        description: { fr: "Consultez et gérez les informations de vos clients.", en: "View and manage your customer information." },
        searchPlaceholder: { fr: "Rechercher par nom, tél...", en: "Search by name, phone..." },
        filters: { fr: "Filtres", en: "Filters" },
        clientList: { fr: "Liste de vos clients", en: "Your customer list" },
        client: { fr: "Client", en: "Customer" },
        contact: { fr: "Contact", en: "Contact" },
        status: { fr: "Statut", en: "Status" },
        totalSpent: { fr: "Total Dépensé", en: "Total Spent" },
        lastOrder: { fr: "Dernière Commande", en: "Last Order" },
        actions: { fr: "Actions", en: "Actions" },
        anonymousClient: { fr: "Client Anonyme", en: "Anonymous Customer" },
        loyal: { fr: "Fidèle", en: "Loyal" },
        new: { fr: "Nouveau", en: "New" },
        vip: { fr: "VIP", en: "VIP" },
    };
    
    const translateStatus = (status: Customer['status']) => {
        switch(status) {
            case 'Fidèle': return t(translations.loyal);
            case 'Nouveau': return t(translations.new);
            case 'VIP': return t(translations.vip);
            default: return status;
        }
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                    <p className="text-muted-foreground">{t(translations.description)}</p>
                </div>
                <div className="flex items-center gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t(translations.searchPlaceholder)} 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        {t(translations.filters)}
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t(translations.clientList)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t(translations.client)}</TableHead>
                                <TableHead>{t(translations.contact)}</TableHead>
                                <TableHead>{t(translations.status)}</TableHead>
                                <TableHead>{t(translations.totalSpent)}</TableHead>
                                <TableHead>{t(translations.lastOrder)}</TableHead>
                                <TableHead className="text-right">{t(translations.actions)}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleViewCustomer(customer.id)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {(customer.firstName ? customer.firstName.charAt(0) : '') + (customer.lastName ? customer.lastName.charAt(0) : '') || 'CL'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p>{customer.firstName} {customer.lastName || t(translations.anonymousClient)}</p>
                                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.email || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}>{translateStatus(customer.status)}</Badge>
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
