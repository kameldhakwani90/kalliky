
'use client';

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, CheckCircle, Zap, Shield, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

const invoices = [
    { id: "INV-2024-005", date: "01/05/2024", amount: "99,00€", status: "Payée" },
    { id: "INV-2024-004", date: "01/04/2024", amount: "99,00€", status: "Payée" },
    { id: "INV-2024-003", date: "01/03/2024", amount: "49,00€", status: "Payée" },
];

const plans = [
  {
    name: "Starter",
    price: "49€",
    icon: <Coffee className="h-6 w-6 mb-2" />,
    features: [
      "Tableau de bord",
      "Gestion des commandes",
      "Support email",
    ],
  },
  {
    name: "Pro",
    price: "99€",
    icon: <Zap className="h-6 w-6 mb-2" />,
    features: [
      "Fonctionnalités Starter",
      "Synchronisation IA du menu",
      "Support prioritaire",
    ],
    recommended: true,
  },
  {
    name: "Business",
    price: "149€",
    icon: <Shield className="h-6 w-6 mb-2" />,
    features: [
      "Fonctionnalités Pro",
      "Accès API",
      "Analyses avancées",
    ],
  },
];

const currentPlanName = "Pro";


export default function BillingPage() {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedPlan, setSelectedPlan] = useState<string>(currentPlanName);

    return (
        <div className="space-y-6">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">Facturation et Abonnement</h1>
                <p className="text-muted-foreground">Gérez votre plan et consultez votre historique de facturation.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Votre Abonnement Actuel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-baseline">
                           <p className="text-lg font-semibold">Plan Pro</p>
                           <p><span className="text-3xl font-bold">99€</span>/mois</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Votre abonnement sera renouvellé le 1er juin 2024.</p>
                        
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">Changer de plan</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle className="text-center text-2xl font-headline">Changer votre abonnement</DialogTitle>
                                    <DialogDescription className="text-center">
                                        Sélectionnez le plan qui correspond le mieux à vos besoins.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid md:grid-cols-3 gap-6 text-center py-6">
                                    {plans.map((plan) => (
                                    <Card 
                                        key={plan.name} 
                                        className={cn(
                                            "cursor-pointer flex flex-col", 
                                            {"border-primary border-2 shadow-lg": selectedPlan === plan.name}
                                        )}
                                        onClick={() => setSelectedPlan(plan.name)}
                                    >
                                        <CardHeader>
                                        {plan.icon}
                                        <CardTitle className="font-headline">{plan.name}</CardTitle>
                                        <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
                                        {currentPlanName === plan.name && <Badge variant="secondary" className="w-fit mx-auto">Plan Actuel</Badge>}
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start text-left gap-2">
                                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" variant={selectedPlan === plan.name ? "default" : "outline"} disabled={currentPlanName === plan.name}>
                                                {selectedPlan === plan.name ? 'Sélectionné' : 'Choisir'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                    ))}
                                </div>
                                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full border-t pt-4">
                                    <div className="text-xs text-muted-foreground text-center sm:text-left">
                                        En continuant, vous acceptez nos <Link href="#" className="underline">Conditions Générales de Vente</Link> et <Link href="#" className="underline">d'Utilisation</Link>.
                                    </div>
                                    <Button disabled={selectedPlan === currentPlanName}>
                                        Confirmer le changement
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Moyen de Paiement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 38 24" fill="none"><path d="M34.95 4.5h-32A2.95 2.95 0 0 0 0 7.45v13.1A2.95 2.95 0 0 0 2.95 23.5h32A2.95 2.95 0 0 0 37.95 20.55V7.45A2.95 2.95 0 0 0 34.95 4.5Zm-28.5 13.1a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Zm10.41 0a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Z" fill="#242328"/><path d="M2.95.5h32A2.95 2.95 0 0 1 37.95 3.45v1.05h-38V3.45A2.95 2.95 0 0 1 2.95.5Z" fill="#242328"/></svg>
                            <div>
                                <p className="font-semibold">Visa se terminant par 4242</p>
                                <p className="text-sm text-muted-foreground">Expire le 12/26</p>
                            </div>
                        </div>
                         <Button variant="outline" className="w-full">Mettre à jour</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Historique des Factures</CardTitle>
                        <CardDescription>Retrouvez toutes vos factures pour votre abonnement Kalliky.ai.</CardDescription>
                    </div>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className="w-[240px] justify-start text-left font-normal"
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Choisir une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Facture N°</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Télécharger</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge className={invoice.status === "Payée" ? "bg-green-100 text-green-800" : ""}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
