

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Filter, Eye, MessageSquare, User, Store, Calendar, Edit, Phone, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ReportStatus = 'Ouvert' | 'En cours' | 'Résolu';

type Call = {
    id: string;
    date: string;
    duration: string;
    type: 'Commande' | 'Info' | 'Signalement';
    transcript: string;
    audioUrl?: string;
};

type Report = {
    id: string;
    date: string;
    reason: string;
    status: ReportStatus;
    details: string;
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    storeId: string;
    call?: Call;
};

const initialReports: Report[] = [
    {
        id: 'rep-1',
        date: '16/05/2024',
        reason: 'Retard de livraison',
        status: 'Résolu',
        details: 'La commande #987 a été livrée avec 30 minutes de retard. Un geste commercial (boisson offerte sur la prochaine commande) a été fait.',
        customer: { id: 'cust-1', name: 'Alice Martin', phone: '0612345678' },
        storeId: 'store-1',
        call: { id: 'call-2', date: "15/05/2024 - 12:10", duration: "4m 10s", type: 'Commande', transcript: "Bonjour, je voudrais passer la commande #987...", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    },
    {
        id: 'rep-2',
        date: '29/05/2024',
        reason: 'Erreur dans la commande',
        status: 'Ouvert',
        details: 'Le client a reçu une Pizza Regina au lieu d\'une 4 Fromages. Commande #1028.',
        customer: { id: 'cust-3', name: 'Carole Leblanc', phone: '0611223344' },
        storeId: 'store-3',
    },
    {
        id: 'rep-3',
        date: '30/05/2024',
        reason: 'Problème de paiement',
        status: 'En cours',
        details: 'Le paiement par lien n\'a pas fonctionné pour la commande #1031. Le client a dû payer en espèces à la livraison.',
        customer: { id: 'cust-2', name: 'Bob Dupont', phone: '0787654321' },
        storeId: 'store-2',
    }
];

const availableStores = [
    { id: "store-1", name: "Le Gourmet Parisien - Centre" },
    { id: "store-2", name: "Le Gourmet Parisien - Montmartre"},
    { id: "store-3", name: "Pizzeria Bella - Bastille" },
];

const getStoreName = (id: string) => availableStores.find(s => s.id === id)?.name || 'N/A';

const statusStyles: Record<ReportStatus, string> = {
    'Ouvert': 'bg-red-100 text-red-800',
    'En cours': 'bg-yellow-100 text-yellow-800',
    'Résolu': 'bg-green-100 text-green-800',
};


export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleViewReport = (report: Report) => {
        setSelectedReport(report);
        setIsDialogOpen(true);
    };
    
    const handleStatusChange = (newStatus: ReportStatus) => {
        if (!selectedReport) return;
        const updatedReport = { ...selectedReport, status: newStatus };
        setSelectedReport(updatedReport);
        setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
    }


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Signalements</h1>
                    <p className="text-muted-foreground">Consultez et traitez les réclamations et retours de vos clients.</p>
                </div>
                 <div className="flex items-center gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher un signalement..." className="pl-10" />
                    </div>
                     <Select>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Toutes les boutiques" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les boutiques</SelectItem>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="Ouvert">Ouvert</SelectItem>
                            <SelectItem value="En cours">En cours</SelectItem>
                            <SelectItem value="Résolu">Résolu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des signalements</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Boutique</TableHead>
                                <TableHead>Raison</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow key={report.id} className="cursor-pointer" onClick={() => handleViewReport(report)}>
                                    <TableCell className="font-medium">
                                        <p>{report.customer.name}</p>
                                        <p className="text-xs text-muted-foreground">{report.customer.phone}</p>
                                    </TableCell>
                                    <TableCell>{getStoreName(report.storeId)}</TableCell>
                                    <TableCell>{report.reason}</TableCell>
                                    <TableCell>{report.date}</TableCell>
                                    <TableCell>
                                        <Badge className={statusStyles[report.status]}>{report.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewReport(report); }}>
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            {selectedReport && (
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Détail du Signalement</DialogTitle>
                            <DialogDescription>
                                Signalement n°{selectedReport.id} - {selectedReport.reason}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                           <div className="md:col-span-2 space-y-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{selectedReport.details}</p>
                                    </CardContent>
                                </Card>

                                {selectedReport.call && (
                                     <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center gap-2"><PlayCircle className="h-4 w-4"/> Échange téléphonique lié</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <audio controls className="w-full h-10" src={selectedReport.call.audioUrl} />
                                            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-md line-clamp-2">
                                                {selectedReport.call.transcript}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                 <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Edit className="h-4 w-4"/> Notes internes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea placeholder="Ajouter une note pour le suivi..."/>
                                    </CardContent>
                                </Card>
                           </div>
                           <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Statut du ticket</Label>
                                    <Select value={selectedReport.status} onValueChange={(value: ReportStatus) => handleStatusChange(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ouvert">Ouvert</SelectItem>
                                            <SelectItem value="En cours">En cours</SelectItem>
                                            <SelectItem value="Résolu">Résolu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4"/> Client</CardTitle>
                                    </CardHeader>
                                     <CardContent>
                                        <p className="font-medium">{selectedReport.customer.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedReport.customer.phone}</p>
                                        <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                                            <Link href={`/restaurant/clients/${selectedReport.customer.id}`}>
                                                Voir la fiche client
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4"/> Boutique</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-medium">{getStoreName(selectedReport.storeId)}</p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4"/> Date</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-medium">{selectedReport.date}</p>
                                    </CardContent>
                                </Card>
                           </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Fermer</Button>
                            <Button>Enregistrer les modifications</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
