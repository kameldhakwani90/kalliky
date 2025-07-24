import Link from 'next/link';
import { CheckCircle, XCircle, FileUp, Bot, BarChart, FileText, Phone, CreditCard, Users, History, BrainCircuit, Lightbulb, BadgeEuro } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';

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

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-card p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-3xl font-headline">Rejoignez Kalliky.ai</CardTitle>
            <CardDescription>Commencez en quelques minutes. Choisissez le plan qui vous convient.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.name} className={`flex flex-col ${plan.recommended ? "border-primary border-2 shadow-lg" : ""}`}>
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                  {plan.subtitle && <p className="text-sm font-semibold text-primary">{plan.subtitle}</p>}
                   <p className="text-muted-foreground text-sm">{plan.target}</p>
                  <p className="text-3xl font-bold pt-4">{plan.price}<span className="text-base font-normal text-muted-foreground">{plan.priceDetails}</span></p>
                </CardHeader>
                <CardContent className="flex-1">
                  {plan.basePlan && (
                      <>
                          <p className="text-sm font-semibold mb-3">Toutes les fonctionnalités du plan {plan.basePlan}, plus :</p>
                          <Separator className="mb-4" />
                      </>
                  )}
                  <ul className="space-y-3 text-sm text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-px flex-shrink-0" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-4 pt-6 mt-auto">
                   <Button className="w-full" variant={plan.recommended ? "default" : "outline"}>
                    {plan.name === 'Business' ? 'Nous contacter' : 'Choisir ce plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
           <CardFooter className="flex-col gap-4 pt-6 border-t mt-6">
            <div className="w-full max-w-md mx-auto space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="nom@exemple.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" required />
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href="/restaurant/dashboard">Créer mon compte et continuer</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        <div className="mt-4 text-center text-sm">
          Déjà un compte ?{' '}
          <Link href="/login" className="underline text-primary">
            Connectez-vous
          </Link>
        </div>
      </div>
    </div>
  );
}
