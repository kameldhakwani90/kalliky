

'use client';

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, CheckCircle, XCircle, FileUp, Bot, BarChart, FileText, Phone, CreditCard, Users, History, BrainCircuit, Lightbulb, BadgeEuro, Flag, ArrowRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const invoices = [
    { id: "INV-2024-005", date: new Date("2024-05-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
    { id: "INV-2024-004", date: new Date("2024-04-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
    { id: "INV-2024-003", date: new Date("2024-03-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
];

const starterFeatures = [
    { text: "Appels vocaux automatisés" },
    { text: "Ticket vocal (création auto)" },
    { text: "Paiement par lien Stripe" },
    { text: "Historique commandes de base" },
    { text: "Dashboard commandes & paiements" },
    { text: "Facturation Stripe auto" },
    { text: "Menu via Excel (upload)" },
    { text: "Support par Email" },
];

const proFeatures = [
    { text: "Fiche client complète" },
    { text: "Mémoire IA client (préférences, upsell)" },
    { text: "Upsell intelligent (basé sur l'historique)" },
    { text: "Gestion avancée des signalements" },
    { text: "Dashboard + stats IA usage" },
    { text: "Support Email prioritaire 24h" },
];

const businessFeatures = [
    { text: "Ticket vocal sur mesure" },
    { text: "Paiement via WhatsApp etc." },
    { text: "Historique avec export API/CRM" },
    { text: "IA dédiée / scénario complexe" },
    { text: "Suggestion dynamique (météo...)" },
    { text: "Dashboard multi-site" },
    { text: "Account manager dédié" },
];

const plans = [
  {
    name: "Starter",
    price: "129€",
    priceValue: 129,
    priceDetails: "/ mois + 10% commission",
    target: "Petit restaurant local",
    features: starterFeatures,
    recommended: false,
    buttonText: "Choisir"
  },
  {
    name: "Pro",
    subtitle: "IA + historique",
    price: "329€",
    priceValue: 329,
    priceDetails: "/ mois + 1€ / ticket",
    target: "Restaurateurs réguliers ou chaîne",
    features: proFeatures,
    basePlan: "Starter",
    recommended: true,
    buttonText: "Plan Actuel"
  },
  {
    name: "Business",
    subtitle: "Sur mesure",
    price: "Sur devis",
    priceValue: 800, // Example value for proration calculation
    priceDetails: "personnalisé",
    target: "Groupes, franchises, haut volume",
    features: businessFeatures,
    basePlan: "Pro",
    recommended: false,
    buttonText: "Nous contacter"
  },
];


const currentPlanName = "Pro";


export default function BillingPage() {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedPlanName, setSelectedPlanName] = useState<string>(currentPlanName);
    const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);

    const handleSavePayment = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Simulating saving new card...");
        // Here you would normally send the data to your payment provider (Stripe)
        setIsUpdatePaymentOpen(false);
    }
    
    const selectedPlan = plans.find(p => p.name === selectedPlanName);
    const currentPlan = plans.find(p => p.name === currentPlanName);

    const daysInMonth = 30;
    const daysRemaining = 15;
    const proratedCost = selectedPlan && currentPlan ? (((selectedPlan.priceValue - currentPlan.priceValue) / daysInMonth) * daysRemaining) : 0;


    return (
        <div className="space-y-6">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">Facturation et Abonnement</h1>
                <p className="text-muted-foreground">Gérez votre plan et consultez votre historique de facturation pour le service Kalliky.ai.</p>
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
                        
                        <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
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
                                            {"border-primary border-2 shadow-lg": selectedPlanName === plan.name}
                                        )}
                                        onClick={() => setSelectedPlanName(plan.name)}
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
                                            <Button className="w-full" variant={selectedPlanName === plan.name ? (plan.name === "Business" ? 'default' : 'secondary') : "outline"} disabled={currentPlanName === plan.name}>
                                                {currentPlanName === plan.name ? 'Plan Actuel' : (selectedPlanName === plan.name ? 'Sélectionné' : 'Choisir')}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                    ))}
                                </div>
                                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full border-t pt-4">
                                     <div className="text-xs text-muted-foreground text-center sm:text-left">
                                         En continuant, vous acceptez nos <a href="#" className="underline">CGV</a>, <a href="#" className="underline">CGU</a> et notre <a href="#" className="underline">Politique de Confidentialité (RGPD)</a>.
                                     </div>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button disabled={selectedPlanName === currentPlanName}>
                                                Confirmer le changement
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmation du changement de plan</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Vous êtes sur le point de passer du plan <span className="font-bold">{currentPlan?.name}</span> au plan <span className="font-bold">{selectedPlan?.name}</span>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                             <div className="my-4 p-4 bg-muted rounded-md text-sm space-y-2">
                                                 <div className="flex justify-between">
                                                    <span>Changement de plan</span>
                                                    <span className="font-medium">{currentPlan?.name} <ArrowRight className="inline h-3 w-3 mx-1"/> {selectedPlan?.name}</span>
                                                 </div>
                                                 <div className="flex justify-between">
                                                    <span className="flex items-center">Ajustement au prorata <Info className="h-3 w-3 ml-1.5 cursor-help" /></span>
                                                    <span className="font-medium">{proratedCost.toFixed(2)}€</span>
                                                 </div>
                                                 <Separator />
                                                  <div className="flex justify-between font-bold text-base">
                                                    <span>Total facturé aujourd'hui</span>
                                                    <span>{proratedCost.toFixed(2)}€</span>
                                                 </div>
                                                  <Separator />
                                                 <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Prochain prélèvement le 01/07/2024</span>
                                                    <span>{selectedPlan?.priceValue.toFixed(2)}€</span>
                                                 </div>
                                             </div>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => setIsChangePlanOpen(false)}>Confirmer et Payer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Moyen de Paiement</CardTitle>
                         <CardDescription>La carte utilisée pour votre abonnement Kalliky.ai.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 38 24" fill="none"><path d="M34.95 4.5h-32A2.95 2.95 0 0 0 0 7.45v13.1A2.95 2.95 0 0 0 2.95 23.5h32A2.95 2.95 0 0 0 37.95 20.55V7.45A2.95 2.95 0 0 0 34.95 4.5Zm-28.5 13.1a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Zm10.41 0a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Z" fill="#242328"/><path d="M2.95.5h32A2.95 2.95 0 0 1 37.95 3.45v1.05h-38V3.45A2.95 2.95 0 0 1 2.95.5Z" fill="#242328"/></svg>
                            <div>
                                <p className="font-semibold">Visa se terminant par 4242</p>
                                <p className="text-sm text-muted-foreground">Expire le 12/26</p>
                            </div>
                        </div>
                         <Dialog open={isUpdatePaymentOpen} onOpenChange={setIsUpdatePaymentOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">Mettre à jour</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={handleSavePayment}>
                                <DialogHeader>
                                <DialogTitle>Mettre à jour votre moyen de paiement</DialogTitle>
                                <DialogDescription>
                                    Saisissez les informations de votre nouvelle carte. Votre prochain prélèvement utilisera ce moyen de paiement.
                                </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                        <Label htmlFor="card-name">Nom sur la carte</Label>
                                        <Input id="card-name" placeholder="Ex: Jean Dupont" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-number">Numéro de carte</Label>
                                        <Input id="card-number" placeholder="0000 0000 0000 0000" required/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="card-expiry">Expiration (MM/AA)</Label>
                                            <Input id="card-expiry" placeholder="MM/AA" required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="card-cvc">CVC</Label>
                                            <Input id="card-cvc" placeholder="123" required/>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex-col gap-y-2 sm:flex-row sm:justify-between sm:items-center">
                                <p className="text-xs text-muted-foreground text-center sm:text-left">
                                    Paiements sécurisés par <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">Stripe</a>.
                                </p>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsUpdatePaymentOpen(false)}>Annuler</Button>
                                    <Button type="submit">Enregistrer</Button>
                                </div>
                                </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
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
                                    <TableCell>{format(invoice.date, "dd/MM/yyyy")}</TableCell>
                                    <TableCell>{(invoice.amount / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</TableCell>
                                    <TableCell>
                                        <Badge className={invoice.status === "Payée" ? "bg-green-100 text-green-800" : ""}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
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
