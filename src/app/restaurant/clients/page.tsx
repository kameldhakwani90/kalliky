'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Phone, Search, Eye, Calendar, Clock, TrendingUp, Users, PhoneCall, UserX, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Customer = {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    status: 'Nouveau' | 'Fidèle' | 'VIP';
    totalSpent: string;
    orderCount: number;
    lastCall?: string;
    callCount?: number;
};

export default function ClientsPage() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'known' | 'anonymous'>('all');
    const router = useRouter();

    const translations = {
        title: { fr: "Clients par Téléphone", en: "Customers by Phone" },
        subtitle: { fr: "Gestion des contacts via AI Phone Agent", en: "Contact Management via AI Phone Agent" },
        phoneNumber: { fr: "Numéro de Téléphone", en: "Phone Number" },
        clientName: { fr: "Nom du Client", en: "Customer Name" },
        lastCall: { fr: "Dernier Appel", en: "Last Call" },
        totalCalls: { fr: "Appels", en: "Calls" },
        totalSpent: { fr: "Total Dépensé", en: "Total Spent" },
        status: { fr: "Statut", en: "Status" },
        action: { fr: "Action", en: "Action" },
        searchPlaceholder: { fr: "Rechercher par téléphone...", en: "Search by phone..." },
        allClients: { fr: "Tous les Clients", en: "All Customers" },
        knownClients: { fr: "Clients Identifiés", en: "Identified Customers" },
        anonymousClients: { fr: "Clients Anonymes", en: "Anonymous Customers" },
        unknownClient: { fr: "Client Inconnu", en: "Unknown Customer" },
        noClients: { fr: "Aucun client trouvé", en: "No customers found" },
        loading: { fr: "Chargement...", en: "Loading..." },
        viewDetails: { fr: "Voir Détails", en: "View Details" },
        newCaller: { fr: "Nouveau", en: "New" },
        regularCaller: { fr: "Fidèle", en: "Regular" },
        vipCaller: { fr: "VIP", en: "VIP" }
    };

    // Fonction pour formater le numéro de téléphone
    const formatPhoneNumber = (phone: string) => {
        // Retirer tous les espaces et caractères non numériques
        const cleaned = phone.replace(/\D/g, '');
        // Formater en groupes de 2 (format français)
        if (cleaned.startsWith('33')) {
            // Format international
            return `+33 ${cleaned.slice(2).match(/.{1,2}/g)?.join(' ') || cleaned.slice(2)}`;
        } else if (cleaned.startsWith('0')) {
            // Format national
            return cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
        }
        return phone;
    };

    // Fonction pour obtenir les initiales ou un placeholder
    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName && !lastName) return '?';
        const f = firstName?.charAt(0) || '';
        const l = lastName?.charAt(0) || '';
        return (f + l).toUpperCase() || '?';
    };

    // Charger les clients depuis l'API
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('/api/restaurant/customers');
                
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des clients');
                }
                
                const data = await response.json();
                
                // Transformer les données de l'API pour AI Phone Agent
                const transformedCustomers = data.customers.map((customer: any) => ({
                    id: customer.id,
                    phone: customer.phone,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    status: customer.status as 'Nouveau' | 'Fidèle' | 'VIP',
                    totalSpent: customer.totalSpent,
                    orderCount: customer.orderCount,
                    lastCall: customer.lastSeen, // Date du dernier appel/activité
                    callCount: customer.callCount || 0
                }));
                
                setCustomers(transformedCustomers);
                
            } catch (error: any) {
                console.error('Error fetching customers:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    // Filtrer les clients
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = !searchTerm || 
            customer.phone.includes(searchTerm) ||
            customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesTab = 
            activeTab === 'all' ||
            (activeTab === 'known' && (customer.firstName || customer.lastName)) ||
            (activeTab === 'anonymous' && !customer.firstName && !customer.lastName);
        
        return matchesSearch && matchesTab;
    });

    // Statistiques
    const stats = {
        total: customers.length,
        known: customers.filter(c => c.firstName || c.lastName).length,
        anonymous: customers.filter(c => !c.firstName && !c.lastName).length,
        vip: customers.filter(c => c.status === 'VIP').length
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">{t(translations.loading)}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-bold text-gray-900">
                    {t(translations.title)}
                </h1>
                <p className="text-muted-foreground mt-1">{t(translations.subtitle)}</p>
            </header>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass-effect shadow-apple rounded-2xl border-0 hover-lift">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Clients</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="glass-effect shadow-apple rounded-2xl border-0 hover-lift">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Identifiés</p>
                                <p className="text-2xl font-bold">{stats.known}</p>
                            </div>
                            <Phone className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="glass-effect shadow-apple rounded-2xl border-0 hover-lift">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Anonymes</p>
                                <p className="text-2xl font-bold">{stats.anonymous}</p>
                            </div>
                            <UserX className="h-8 w-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="glass-effect shadow-apple rounded-2xl border-0 hover-lift">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">VIP</p>
                                <p className="text-2xl font-bold">{stats.vip}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barre de recherche */}
            <Card className="glass-effect shadow-apple rounded-2xl border-0">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t(translations.searchPlaceholder)}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-xl border-gray-300"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs et tableau */}
            <Card className="glass-effect shadow-apple rounded-2xl border-0">
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                {t(translations.allClients)} ({stats.total})
                            </TabsTrigger>
                            <TabsTrigger value="known" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                {t(translations.knownClients)} ({stats.known})
                            </TabsTrigger>
                            <TabsTrigger value="anonymous" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                {t(translations.anonymousClients)} ({stats.anonymous})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>{t(translations.phoneNumber)}</TableHead>
                                <TableHead>{t(translations.clientName)}</TableHead>
                                <TableHead>{t(translations.lastCall)}</TableHead>
                                <TableHead className="text-center">{t(translations.totalCalls)}</TableHead>
                                <TableHead>{t(translations.totalSpent)}</TableHead>
                                <TableHead>{t(translations.status)}</TableHead>
                                <TableHead className="text-right">{t(translations.action)}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {t(translations.noClients)}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                                        <TableCell>
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback 
                                                    className={
                                                        customer.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                                        customer.status === 'Fidèle' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }
                                                >
                                                    {getInitials(customer.firstName, customer.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {formatPhoneNumber(customer.phone)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {customer.firstName || customer.lastName ? (
                                                <span>{customer.firstName} {customer.lastName}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">
                                                    {t(translations.unknownClient)}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {customer.lastCall ? (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(customer.lastCall).toLocaleDateString('fr-FR')}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="gap-1">
                                                <PhoneCall className="h-3 w-3" />
                                                {customer.callCount || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {customer.totalSpent}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    customer.status === 'VIP' ? 'default' :
                                                    customer.status === 'Fidèle' ? 'secondary' :
                                                    'outline'
                                                }
                                                className={
                                                    customer.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                                    customer.status === 'Fidèle' ? 'bg-green-100 text-green-700' :
                                                    ''
                                                }
                                            >
                                                {customer.status === 'VIP' ? t(translations.vipCaller) :
                                                 customer.status === 'Fidèle' ? t(translations.regularCaller) :
                                                 t(translations.newCaller)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/restaurant/clients/${customer.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}