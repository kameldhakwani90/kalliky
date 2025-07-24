
'use client';

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, CheckCircle, XCircle, FileUp, Bot, BarChart, FileText, Phone, CreditCard, Users, History, BrainCircuit, Lightbulb, BadgeEuro } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const invoices = [
    { id: "INV-2024-005", date: "01/05/2024", amount: "329,00€", status: "Payée" },
    { id: "INV-2024-004", date: "01/04/2024", amount: "329,00€", status: "Payée" },
    { id: "INV-2024-003", date: "01/03/2024", amount: "329,00€", status: "Payée" },
];

const starterFeatures = [
    { text: "Appels vocaux automatisés", icon: <Phone/> },
    { text: "Ticket vocal (création auto)", icon: <FileText/> },
    { text: "Paiement par lien Stripe", icon: <CreditCard/> },
    { text: "Historique commandes de base", icon: <History/> },
    { text: "Dashboard commandes & paiements", icon: <BarChart/> },
    { text: "Facturation Stripe auto", icon: <BadgeEuro/> },
    { text: "Menu via Excel (upload)", icon: <FileUp/> },
    { text: "Support par Email", icon: <Users/> },
];

const proFeatures = [
    { text: "Fiche client complète", icon: <History/> },
    { text: "Mémoire IA client (préférences, upsell)", icon: <BrainCircuit/> },
    { text: "Upsell intelligent (basé sur l'historique)", icon: <Lightbulb/> },
    { text: "Dashboard + stats IA usage", icon: <BarChart/> },
    { text: "Support Email prioritaire 24h", icon: <Users/> },
];

const businessFeatures = [
    { text: "Ticket vocal sur mesure", icon: <FileText/> },
    { text: "Paiement via WhatsApp etc.", icon: <CreditCard/> },
    { text: "Historique avec export API/CRM", icon: <History/> },
    { text: "IA dédiée / scénario complexe", icon: <BrainCircuit/> },
    { text: "Suggestion dynamique (météo...)", icon: <Lightbulb/> },
    { text: "Dashboard multi-site", icon: <BarChart/> },
    { text: "Account manager dédié", icon: <Users/> },
];

const plans = [
  {
    name: "Starter",
    price: "129€",
    priceDetails: "/ mois + 10% commission",
    target: "Petit restaurant local",
    features: starterFeatures,
    recommended: false,
  },
  {
    name: "Pro",
    subtitle: "IA + historique",
    price: "329€",
    priceDetails: "/ mois + 1€ / ticket",
    target: "Restaurateurs réguliers ou chaîne",
    features: proFeatures,
    basePlan: "Starter",
    recommended: true,
  },
  {
    name: "Business",
    subtitle: "Sur mesure",
    price: "Sur devis",
    priceDetails: "personnalisé",
    target: "Groupes, franchises, haut volume",
    features: businessFeatures,
    basePlan: "Pro",
    recommended: false,
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
                           <p className="text-lg font-semibold">Plan Pro (IA + historique)</p>
                           <p><span className="text-3xl font-bold">329€</span>/mois</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Votre abonnement sera renouvellé le 1er juin 2024.</p>
                        
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">Changer de plan</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-6xl">
                                <DialogHeader>
                                    <DialogTitle className="text-center text-2xl font-headline">Changer votre abonnement</DialogTitle>
                                    <DialogDescription className="text-center">
                                        Sélectionnez le plan qui correspond le mieux à vos besoins.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid md:grid-cols-3 gap-6 py-6">
                                    {plans.map((plan) => (
                                    <Card 
                                        key={plan.name} 
                                        className={cn(
                                            "cursor-pointer flex flex-col", 
                                            {"border-primary border-2 shadow-lg": selectedPlan === plan.name}
                                        )}
                                        onClick={() => setSelectedPlan(plan.name)}
                                    >
                                        <CardHeader className="text-center">
                                            <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                                            {plan.subtitle && <p className="text-sm font-semibold text-primary">{plan.subtitle}</p>}
                                            <p className="text-muted-foreground text-sm">{plan.target}</p>
                                            <p className="text-3xl font-bold pt-4">{plan.price}<span className="text-base font-normal text-muted-foreground">{plan.priceDetails}</span></p>
                                            {currentPlanName === plan.name && <Badge variant="secondary" className="w-fit mx-auto mt-2">Plan Actuel</Badge>}
                                        </CardHeader>
                                        <CardContent className="flex-1 text-left">
                                            {plan.basePlan && (
                                                <>
                                                    <p className="text-sm font-semibold mb-3">Toutes les fonctionnalités du plan {plan.basePlan}, plus :</p>
                                                    <Separator className="mb-4" />
                                                </>
                                            )}
                                            <ul className="space-y-3 text-sm">
                                                {plan.features.map((feature, i) => (
                                                  <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle className="h-5 w-5 text-green-500 mt-px flex-shrink-0" />
                                                    <span>{feature.text}</span>
                                                  </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" variant={selectedPlan === plan.name ? "default" : "outline"} disabled={currentPlanName === plan.name}>
                                                {currentPlanName === plan.name ? 'Plan Actuel' : (selectedPlan === plan.name ? 'Sélectionné' : 'Choisir')}
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
