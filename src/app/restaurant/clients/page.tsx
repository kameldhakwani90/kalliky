'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
                </div>
                <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                        <span className="ml-2 text-white">{t(translations.loading)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="container mx-auto px-4 py-6 space-y-8 relative z-10"
            >
                {/* Header */}
                <motion.header variants={itemVariants}>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                        {t(translations.title)}
                    </h1>
                    <p className="text-gray-400 mt-1">{t(translations.subtitle)}</p>
                </motion.header>

                {/* Statistiques */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Total Clients</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-400" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
                        </CardContent>
                    </Card>
                    
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Identifiés</p>
                                    <p className="text-2xl font-bold text-white">{stats.known}</p>
                                </div>
                                <Phone className="h-8 w-8 text-green-400" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
                        </CardContent>
                    </Card>
                    
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Anonymes</p>
                                    <p className="text-2xl font-bold text-white">{stats.anonymous}</p>
                                </div>
                                <UserX className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
                        </CardContent>
                    </Card>
                    
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">VIP</p>
                                    <p className="text-2xl font-bold text-white">{stats.vip}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-purple-400" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Barre de recherche */}
                <motion.div variants={itemVariants}>
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder={t(translations.searchPlaceholder)}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Tabs et tableau */}
                <motion.div variants={itemVariants}>
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl">
                        <CardHeader>
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                                <TabsList className="grid w-full grid-cols-3 bg-white/10 rounded-2xl p-1 border border-white/20">
                                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-400 transition-all">
                                        {t(translations.allClients)} ({stats.total})
                                    </TabsTrigger>
                                    <TabsTrigger value="known" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-400 transition-all">
                                        {t(translations.knownClients)} ({stats.known})
                                    </TabsTrigger>
                                    <TabsTrigger value="anonymous" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-400 transition-all">
                                        {t(translations.anonymousClients)} ({stats.anonymous})
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/20">
                                        <TableHead className="w-[50px] text-gray-300"></TableHead>
                                        <TableHead className="text-gray-300">{t(translations.phoneNumber)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.clientName)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.lastCall)}</TableHead>
                                        <TableHead className="text-center text-gray-300">{t(translations.totalCalls)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.totalSpent)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.status)}</TableHead>
                                        <TableHead className="text-right text-gray-300">{t(translations.action)}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                                                {t(translations.noClients)}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCustomers.map((customer) => (
                                            <TableRow key={customer.id} className="hover:bg-white/5 cursor-pointer border-white/20">
                                                <TableCell>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback 
                                                            className={
                                                                customer.status === 'VIP' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                                                                customer.status === 'Fidèle' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                                                                'bg-white/10 text-gray-300 border border-white/20'
                                                            }
                                                        >
                                                            {getInitials(customer.firstName, customer.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-mono font-medium text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        {formatPhoneNumber(customer.phone)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-white">
                                                    {customer.firstName || customer.lastName ? (
                                                        <span>{customer.firstName} {customer.lastName}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">
                                                            {t(translations.unknownClient)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-400">
                                                    {customer.lastCall ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(customer.lastCall).toLocaleDateString('fr-FR')}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="gap-1 bg-white/10 border-white/20 text-white">
                                                        <PhoneCall className="h-3 w-3" />
                                                        {customer.callCount || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-white">
                                                    {customer.totalSpent}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        className={
                                                            customer.status === 'VIP' ? 'bg-purple-500/20 text-purple-400 border-purple-400/30' :
                                                            customer.status === 'Fidèle' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
                                                            'bg-white/10 text-gray-300 border-white/20'
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
                                                        className="hover:bg-white/20 text-white border border-white/20 rounded-2xl"
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
                </motion.div>
            </motion.div>
        </div>
    );
}