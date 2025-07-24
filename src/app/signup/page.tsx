import Link from 'next/link';
import { CheckCircle, Zap, Shield, Coffee } from 'lucide-react';

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

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-card p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-3xl font-headline">Rejoignez Kalliky.ai</CardTitle>
            <CardDescription>Commencez en quelques minutes. Choisissez le plan qui vous convient.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-center">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.recommended ? "border-primary border-2 shadow-lg" : ""}>
                <CardHeader>
                  {plan.icon}
                  <CardTitle className="font-headline">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.recommended ? "default" : "outline"}>
                    Choisir ce plan
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
