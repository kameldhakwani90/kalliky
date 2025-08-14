

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Filter, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

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
    { id: 'cust-1', phone: "06 12 34 56 78", firstName: "Alice", lastName: "Martin", email: "alice.martin@email.com", status: "Fidèle", totalSpent: "54.50€", lastSeen: "30/05/2024" },
    { id: 'cust-2', phone: "07 87 65 43 21", firstName: "Bob", lastName: "Dupont", status: "Nouveau", totalSpent: "18.00€", lastSeen: "30/05/2024" },
    { id: 'cust-4', phone: "06 99 88 77 66", firstName: "Client", lastName: "Anonyme", status: "Nouveau", totalSpent: "55.20€", lastSeen: "29/05/2024" },
    { id: 'cust-5', phone: "06 11 22 33 44", firstName: "Carlos", lastName: "Sainz", status: "Nouveau", totalSpent: "1900.00€", lastSeen: "30/05/2024" },
    { id: 'cust-6', phone: "06 88 77 66 55", firstName: "Lando", lastName: "Norris", status: "Nouveau", totalSpent: "950.00€", lastSeen: "31/05/2024" },
    { id: 'cust-7', phone: "01 23 45 67 89", firstName: "Mme.", lastName: "Lefevre", status: "Nouveau", totalSpent: "0€", lastSeen: "30/05/2024" },
    { id: 'cust-8', phone: "01 98 76 54 32", firstName: "M.", lastName: "Bernard", status: "Nouveau", totalSpent: "0€", lastSeen: "29/05/2024" },
    { id: 'cust-9', phone: "07 55 66 77 88", firstName: "Claire", lastName: "Chazal", status: "Nouveau", totalSpent: "250.00€", lastSeen: "31/05/2024" },
];

const ITEMS_PER_PAGE = 10;

export default function ClientsPage() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
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

    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    const translations = {
        title: { fr: "Fichier Clients", en: "Customer File" },
        description: { fr: "Consultez et gérez les informations de vos clients.", en: "View and manage your customer information." },
        searchPlaceholder: { fr: "Rechercher par nom, tél...", en: "Search by name, phone..." },
        chooseDate: { fr: "Choisir une date", en: "Choose a date" },
        clientList: { fr: "Liste de vos clients", en: "Your customer list" },
        client: { fr: "Client", en: "Customer" },
        contact: { fr: "Contact", en: "Contact" },
        status: { fr: "Statut", en: "Status" },
        totalSpent: { fr: "Total Dépensé", en: "Total Spent" },
        lastOrder: { fr: "Dernière Visite", en: "Last Visit" },
        actions: { fr: "Actions", en: "Actions" },
        anonymousClient: { fr: "Client Anonyme", en: "Anonymous Customer" },
        loyal: { fr: "Fidèle", en: "Loyal" },
        new: { fr: "Nouveau", en: "New" },
        vip: { fr: "VIP", en: "VIP" },
        previous: { fr: "Précédent", en: "Previous" },
        next: { fr: "Suivant", en: "Next" },
        pageOf: { fr: "Page {current} sur {total}", en: "Page {current} of {total}" },
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
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                    <p className="text-muted-foreground">{t(translations.description)}</p>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>{t(translations.clientList)}</CardTitle>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                           <div className="relative flex-1 w-full">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input 
                                   placeholder={t(translations.searchPlaceholder)} 
                                   className="pl-10"
                                   value={searchTerm}
                                   onChange={(e) => setSearchTerm(e.target.value)}
                               />
                           </div>
                           <Popover>
                               <PopoverTrigger asChild>
                                   <Button variant={"outline"} className="w-full sm:w-[240px] justify-start text-left font-normal">
                                       <CalendarIcon className="mr-2 h-4 w-4" />
                                       {date ? format(date, "PPP") : <span>{t(translations.chooseDate)}</span>}
                                   </Button>
                               </PopoverTrigger>
                               <PopoverContent className="w-auto p-0" align="start">
                                   <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                               </PopoverContent>
                           </Popover>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t(translations.client)}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t(translations.contact)}</TableHead>
                                    <TableHead>{t(translations.status)}</TableHead>
                                    <TableHead className="hidden sm:table-cell">{t(translations.totalSpent)}</TableHead>
                                    <TableHead className="hidden lg:table-cell">{t(translations.lastOrder)}</TableHead>
                                    <TableHead className="text-right">{t(translations.actions)}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCustomers.map((customer) => (
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
                                                    <p className="text-xs text-muted-foreground md:hidden">{customer.email || customer.phone}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{customer.email || customer.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}>{translateStatus(customer.status)}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{customer.totalSpent}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{customer.lastSeen}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer.id); }}>
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-muted-foreground">
                            {t(translations.pageOf).replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString())}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                {t(translations.previous)}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                {t(translations.next)}
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
