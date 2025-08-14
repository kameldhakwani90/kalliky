

'use client';

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, CheckCircle, ArrowRight, Info, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";

const invoices = [
    { id: "INV-2024-005", date: new Date("2024-05-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
    { id: "INV-2024-004", date: new Date("2024-04-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
    { id: "INV-2024-003", date: new Date("2024-03-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
    { id: "INV-2024-002", date: new Date("2024-02-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
    { id: "INV-2024-001", date: new Date("2024-01-01"), amount: 32900, status: "Payée", pdfUrl: "#" },
];

const starterFeatures = [
    { text: {fr: "Appels vocaux automatisés", en: "Automated voice calls"} },
    { text: {fr: "Ticket vocal (création auto)", en: "Voice ticket (auto creation)"} },
    { text: {fr: "Paiement par lien Stripe", en: "Stripe payment link"} },
    { text: {fr: "Historique commandes de base", en: "Basic order history"} },
    { text: {fr: "Dashboard commandes & paiements", en: "Orders & payments dashboard"} },
    { text: {fr: "Facturation Stripe auto", en: "Auto Stripe billing"} },
    { text: {fr: "Menu via Excel (upload)", en: "Menu via Excel (upload)"} },
    { text: {fr: "Support par Email", en: "Email Support"} },
];

const proFeatures = [
    { text: {fr: "Fiche client complète", en: "Complete customer file"} },
    { text: {fr: "Mémoire IA client (préférences, upsell)", en: "Customer AI memory (preferences, upsell)"} },
    { text: {fr: "Upsell intelligent (basé sur l'historique)", en: "Smart upsell (based on history)"} },
    { text: {fr: "Gestion avancée des signalements", en: "Advanced report management"} },
    { text: {fr: "Dashboard + stats IA usage", en: "Dashboard + AI usage stats"} },
    { text: {fr: "Support Email prioritaire 24h", en: "24h Priority Email Support"} },
];

const businessFeatures = [
    { text: {fr: "Ticket vocal sur mesure", en: "Custom voice ticket"} },
    { text: {fr: "Paiement via WhatsApp etc.", en: "Payment via WhatsApp etc."} },
    { text: {fr: "Historique avec export API/CRM", en: "History with API/CRM export"} },
    { text: {fr: "IA dédiée / scénario complexe", en: "Dedicated AI / complex scenario"} },
    { text: {fr: "Suggestion dynamique (météo...)", en: "Dynamic suggestion (weather...)"} },
    { text: {fr: "Dashboard multi-site", en: "Multi-site dashboard"} },
    { text: {fr: "Account manager dédié", en: "Dedicated account manager"} },
];

const plans = [
  {
    name: "Starter",
    price: "129€",
    priceValue: 129,
    priceDetails: {fr: "/ mois + 10% commission", en: "/ month + 10% commission"},
    target: {fr: "Petit restaurant local", en: "Small local restaurant"},
    features: starterFeatures,
    recommended: false,
    buttonText: {fr: "Choisir", en: "Choose"}
  },
  {
    name: "Pro",
    subtitle: {fr: "IA + historique", en: "AI + history"},
    price: "329€",
    priceValue: 329,
    priceDetails: {fr: "/ mois + 1€ / ticket", en: "/ month + €1 / ticket"},
    target: {fr: "Restaurateurs réguliers ou chaîne", en: "Regular restaurateurs or chain"},
    features: proFeatures,
    basePlan: {fr: "Starter", en: "Starter"},
    recommended: true,
    buttonText: {fr: "Plan Actuel", en: "Current Plan"}
  },
  {
    name: "Business",
    subtitle: {fr: "Sur mesure", en: "Custom"},
    price: {fr: "Sur devis", en: "On quote"},
    priceValue: 800, // Example value for proration calculation
    priceDetails: {fr: "personnalisé", en: "custom"},
    target: {fr: "Groupes, franchises, haut volume", en: "Groups, franchises, high volume"},
    features: businessFeatures,
    basePlan: {fr: "Pro", en: "Pro"},
    recommended: false,
    buttonText: {fr: "Nous contacter", en: "Contact Us"}
  },
];


const currentPlanName = "Pro";
const ITEMS_PER_PAGE = 5;

export default function BillingPage() {
    const { t } = useLanguage();
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedPlanName, setSelectedPlanName] = useState<string>(currentPlanName);
    const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);

    const paginatedInvoices = invoices.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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

    const translations = {
        title: { fr: "Facturation et Abonnement", en: "Billing and Subscription" },
        description: { fr: "Gérez votre plan et consultez votre historique de facturation pour le service Kalliky.ai.", en: "Manage your plan and view your billing history for the Kalliky.ai service." },
        currentSubscription: { fr: "Votre Abonnement Actuel", en: "Your Current Subscription" },
        proPlan: { fr: "Plan Pro (IA + historique)", en: "Pro Plan (AI + history)" },
        renewedOn: { fr: "Votre abonnement sera renouvellé le 1er juin 2024.", en: "Your subscription will be renewed on June 1, 2024." },
        changePlan: { fr: "Changer de plan", en: "Change Plan" },
        paymentMethod: { fr: "Moyen de Paiement", en: "Payment Method" },
        cardDescription: { fr: "La carte utilisée pour votre abonnement Kalliky.ai.", en: "The card used for your Kalliky.ai subscription." },
        cardEndingIn: { fr: "Visa se terminant par 4242", en: "Visa ending in 4242" },
        expires: { fr: "Expire le 12/26", en: "Expires 12/26" },
        update: { fr: "Mettre à jour", en: "Update" },
        invoicesHistory: { fr: "Historique des Factures", en: "Invoices History" },
        invoicesDescription: { fr: "Retrouvez toutes vos factures pour votre abonnement Kalliky.ai.", en: "Find all your invoices for your Kalliky.ai subscription." },
        chooseDate: { fr: "Choisir une date", en: "Choose a date" },
        invoiceNo: { fr: "Facture N°", en: "Invoice No." },
        date: { fr: "Date", en: "Date" },
        amount: { fr: "Montant", en: "Amount" },
        status: { fr: "Statut", en: "Status" },
        download: { fr: "Télécharger", en: "Download" },
        changeSubscription: { fr: "Changer votre abonnement", en: "Change your subscription" },
        selectPlan: { fr: "Sélectionnez le plan qui correspond le mieux à vos besoins.", en: "Select the plan that best suits your needs." },
        currentPlanBadge: { fr: "Plan Actuel", en: "Current Plan" },
        allFeaturesOf: { fr: "Toutes les fonctionnalités du plan", en: "All the features of the plan" },
        selected: { fr: "Sélectionné", en: "Selected" },
        terms: { fr: "En continuant, vous acceptez nos", en: "By continuing, you accept our" },
        tos: { fr: "CGU", en: "TOS" },
        tos_long: { fr: "Conditions Générales d'Utilisation", en: "Terms of Service" },
        privacy: { fr: "Politique de Confidentialité (RGPD)", en: "Privacy Policy (GDPR)" },
        confirmChange: { fr: "Confirmer le changement", en: "Confirm Change" },
        planChangeConfirmation: { fr: "Confirmation du changement de plan", en: "Plan Change Confirmation" },
        aboutToSwitch: { fr: "Vous êtes sur le point de passer du plan", en: "You are about to switch from the" },
        toPlan: { fr: "au plan", en: "to the" },
        planChange: { fr: "Changement de plan", en: "Plan change" },
        proratedAdjustment: { fr: "Ajustement au prorata", en: "Prorated adjustment" },
        totalBilledToday: { fr: "Total facturé aujourd'hui", en: "Total billed today" },
        nextBilling: { fr: "Prochain prélèvement le 01/07/2024", en: "Next billing on 01/07/2024" },
        cancel: { fr: "Annuler", en: "Cancel" },
        confirmAndPay: { fr: "Confirmer et Payer", en: "Confirm and Pay" },
        updatePaymentMethod: { fr: "Mettre à jour votre moyen de paiement", en: "Update your payment method" },
        updatePaymentDescription: { fr: "Saisissez les informations de votre nouvelle carte. Votre prochain prélèvement utilisera ce moyen de paiement.", en: "Enter your new card information. Your next payment will use this payment method." },
        cardName: { fr: "Nom sur la carte", en: "Name on card" },
        cardNamePlaceholder: { fr: "Ex: Jean Dupont", en: "Ex: John Doe" },
        cardNumber: { fr: "Numéro de carte", en: "Card number" },
        cardExpiry: { fr: "Expiration (MM/AA)", en: "Expiration (MM/YY)" },
        cvc: { fr: "CVC", en: "CVC" },
        securePayments: { fr: "Paiements sécurisés par", en: "Secure payments by" },
        save: { fr: "Enregistrer", en: "Save" },
        paid: { fr: "Payée", en: "Paid" },
        previous: { fr: "Précédent", en: "Previous" },
        next: { fr: "Suivant", en: "Next" },
        pageOf: { fr: "Page {current} sur {total}", en: "Page {current} of {total}" },
        searchPlaceholder: { fr: "Rechercher par N°...", en: "Search by No...." },
    };


    return (
        <div className="space-y-6">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                <p className="text-muted-foreground">{t(translations.description)}</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t(translations.currentSubscription)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-baseline">
                           <p className="text-lg font-semibold">{t(translations.proPlan)}</p>
                           <p><span className="text-3xl font-bold">329€</span>/mois</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{t(translations.renewedOn)}</p>
                        
                        <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">{t(translations.changePlan)}</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-6xl">
                                <DialogHeader>
                                    <DialogTitle className="text-center text-2xl font-headline">{t(translations.changeSubscription)}</DialogTitle>
                                    <DialogDescription className="text-center">
                                        {t(translations.selectPlan)}
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
                                            {plan.subtitle && <p className="text-sm font-semibold text-primary">{t(plan.subtitle)}</p>}
                                            <p className="text-muted-foreground text-sm">{t(plan.target)}</p>
                                            <p className="text-3xl font-bold pt-4">{typeof plan.price === 'string' ? plan.price : t(plan.price)}<span className="text-base font-normal text-muted-foreground">{t(plan.priceDetails)}</span></p>
                                            {currentPlanName === plan.name && <Badge variant="secondary" className="w-fit mx-auto mt-2">{t(translations.currentPlanBadge)}</Badge>}
                                        </CardHeader>
                                        <CardContent className="flex-1 text-left">
                                            {plan.basePlan && (
                                                <>
                                                    <p className="text-sm font-semibold mb-3">{t(translations.allFeaturesOf)} {t(plan.basePlan)} :</p>
                                                    <Separator className="mb-4" />
                                                </>
                                            )}
                                            <ul className="space-y-3 text-sm">
                                                {plan.features.map((feature, i) => (
                                                  <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle className="h-5 w-5 text-green-500 mt-px flex-shrink-0" />
                                                    <span>{t(feature.text)}</span>
                                                  </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" variant={selectedPlanName === plan.name ? (plan.name === "Business" ? 'default' : 'secondary') : "outline"} disabled={currentPlanName === plan.name}>
                                                {currentPlanName === plan.name ? t(plan.buttonText) : (selectedPlanName === plan.name ? t(translations.selected) : t(plan.buttonText))}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                    ))}
                                </div>
                                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full border-t pt-4">
                                     <div className="text-xs text-muted-foreground text-center sm:text-left">
                                         {t(translations.terms)} <a href="#" className="underline">CGV</a>, <a href="#" className="underline">{t(translations.tos)}</a> {t({fr: "et notre", en: "and our"})} <a href="#" className="underline">{t(translations.privacy)}</a>.
                                     </div>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button disabled={selectedPlanName === currentPlanName}>
                                                {t(translations.confirmChange)}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t(translations.planChangeConfirmation)}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t(translations.aboutToSwitch)} <span className="font-bold">{currentPlan?.name}</span> {t(translations.toPlan)} <span className="font-bold">{selectedPlan?.name}</span>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                             <div className="my-4 p-4 bg-muted rounded-md text-sm space-y-2">
                                                 <div className="flex justify-between">
                                                    <span>{t(translations.planChange)}</span>
                                                    <span className="font-medium">{currentPlan?.name} <ArrowRight className="inline h-3 w-3 mx-1"/> {selectedPlan?.name}</span>
                                                 </div>
                                                 <div className="flex justify-between">
                                                    <span className="flex items-center">{t(translations.proratedAdjustment)} <Info className="h-3 w-3 ml-1.5 cursor-help" /></span>
                                                    <span className="font-medium">{proratedCost.toFixed(2)}€</span>
                                                 </div>
                                                 <Separator />
                                                  <div className="flex justify-between font-bold text-base">
                                                    <span>{t(translations.totalBilledToday)}</span>
                                                    <span>{proratedCost.toFixed(2)}€</span>
                                                 </div>
                                                  <Separator />
                                                 <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{t(translations.nextBilling)}</span>
                                                    <span>{(selectedPlan?.priceValue ?? 0).toFixed(2)}€</span>
                                                 </div>
                                             </div>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => setIsChangePlanOpen(false)}>{t(translations.confirmAndPay)}</AlertDialogAction>
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
                        <CardTitle>{t(translations.paymentMethod)}</CardTitle>
                         <CardDescription>{t(translations.cardDescription)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 38 24" fill="none"><path d="M34.95 4.5h-32A2.95 2.95 0 0 0 0 7.45v13.1A2.95 2.95 0 0 0 2.95 23.5h32A2.95 2.95 0 0 0 37.95 20.55V7.45A2.95 2.95 0 0 0 34.95 4.5Zm-28.5 13.1a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Zm10.41 0a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Z" fill="#242328"/><path d="M2.95.5h32A2.95 2.95 0 0 1 37.95 3.45v1.05h-38V3.45A2.95 2.95 0 0 1 2.95.5Z" fill="#242328"/></svg>
                            <div>
                                <p className="font-semibold">{t(translations.cardEndingIn)}</p>
                                <p className="text-sm text-muted-foreground">{t(translations.expires)}</p>
                            </div>
                        </div>
                         <Dialog open={isUpdatePaymentOpen} onOpenChange={setIsUpdatePaymentOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">{t(translations.update)}</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={handleSavePayment}>
                                <DialogHeader>
                                <DialogTitle>{t(translations.updatePaymentMethod)}</DialogTitle>
                                <DialogDescription>
                                    {t(translations.updatePaymentDescription)}
                                </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                        <Label htmlFor="card-name">{t(translations.cardName)}</Label>
                                        <Input id="card-name" placeholder={t(translations.cardNamePlaceholder)} required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-number">{t(translations.cardNumber)}</Label>
                                        <Input id="card-number" placeholder="0000 0000 0000 0000" required/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="card-expiry">{t(translations.cardExpiry)}</Label>
                                            <Input id="card-expiry" placeholder="MM/AA" required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="card-cvc">{t(translations.cvc)}</Label>
                                            <Input id="card-cvc" placeholder="123" required/>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex-col gap-y-2 sm:flex-row sm:justify-between sm:items-center">
                                <p className="text-xs text-muted-foreground text-center sm:text-left">
                                    {t(translations.securePayments)} <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">Stripe</a>.
                                </p>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsUpdatePaymentOpen(false)}>{t(translations.cancel)}</Button>
                                    <Button type="submit">{t(translations.save)}</Button>
                                </div>
                                </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>{t(translations.invoicesHistory)}</CardTitle>
                            <CardDescription>{t(translations.invoicesDescription)}</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                           <div className="relative flex-1 w-full">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input placeholder={t(translations.searchPlaceholder)} className="pl-10" />
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t(translations.invoiceNo)}</TableHead>
                                <TableHead>{t(translations.date)}</TableHead>
                                <TableHead>{t(translations.amount)}</TableHead>
                                <TableHead>{t(translations.status)}</TableHead>
                                <TableHead className="text-right">{t(translations.download)}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{format(invoice.date, "dd/MM/yyyy")}</TableCell>
                                    <TableCell>{(invoice.amount / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</TableCell>
                                    <TableCell>
                                        <Badge className={invoice.status === "Payée" ? "bg-green-100 text-green-800" : ""}>
                                            {t(translations.paid)}
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
    )
}
