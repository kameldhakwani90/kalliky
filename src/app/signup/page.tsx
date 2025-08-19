'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '129€',
    priceValue: 129,
    description: '/ mois + 10% commission',
    target: 'Petit restaurant local',
    features: [
      '🤖 Agent IA basique (GPT-4o-mini)',
      '📞 1 appel simultané + 1 en file',
      '🎙️ 1 voix standard (homme ou femme)',
      '📝 Prise de commande simple',
      '💳 Paiement par lien Stripe',
      '📊 Dashboard basique',
      '📧 Notifications email',
      '📂 Import menu (Excel/Photo)',
      '⚡ Temps de réponse ~1s',
      '🛡️ Détection spam basique',
    ],
    blockedFeatures: [
      '❌ Personnalisation voix',
      '❌ Vente additionnelle IA',
      '❌ Multi-langue',
      '❌ Scripts personnalisés',
      '❌ Appels simultanés multiples',
    ],
    recommended: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
  },
  {
    id: 'PRO',
    name: 'Pro',
    subtitle: 'IA Premium',
    price: '329€',
    priceValue: 329,
    description: '/ mois + 1€ / commande',
    target: 'Restaurants avec volume',
    features: [
      '✨ Agent IA Premium (OpenAI Realtime)',
      '📞 6 appels simultanés + 10 en file',
      '🎙️ 3 voix au choix (H/F/Neutre)',
      '⚡ Latence ultra-faible (<200ms)',
      '💰 Vente additionnelle (+25% panier)',
      '🌍 Multi-langue (FR/EN/AR)',
      '👤 Mémoire client (préférences)',
      '📊 Analytics complets',
      '📱 SMS + Email notifications',
      '🎯 Scripts IA par produit',
      '⭐ Produits vedettes',
      '🔗 Associations produits',
      '🛡️ Détection spam avancée',
      '⚡ Support prioritaire',
    ],
    blockedFeatures: [
      '❌ Voix clonée custom',
      '❌ Tests A/B',
      '❌ White-label',
      '❌ API webhooks',
    ],
    recommended: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_BASE_PRICE_ID
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    subtitle: 'Sur mesure',
    price: 'Sur devis',
    priceValue: 800,
    description: '+ 0.90€ / commande',
    target: 'Chaînes & franchises',
    features: [
      '👑 Tout du plan Pro +',
      '📞 10 appels simultanés + 15 en file',
      '🎤 Voix clonée (votre voix)',
      '🧪 Tests A/B automatiques',
      '🏷️ White-label complet',
      '🔌 API webhooks custom',
      '📈 Analytics prédictifs IA',
      '🎯 Machine learning personnalisé',
      '🔄 Intégrations CRM/ERP',
      '📊 Dashboard multi-sites',
      '👨‍💼 Account manager dédié',
      '🎓 Formation équipe',
      '📞 Support 24/7',
      '🚀 SLA garanti 99.9%',
    ],
    blockedFeatures: [],
    recommended: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID
  },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  selectedPlan: string;
  language: string;
  // Champs boutique
  storeName: string;
  storeAddress: string;
  storePhone: string;
  // Services multi-métiers
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Choose plan, 2: Create account
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    selectedPlan: 'PRO',
    language: 'fr',
    // Champs boutique
    storeName: '',
    storeAddress: '',
    storePhone: '',
    // Services multi-métiers (tous activés par défaut)
    hasProducts: true,
    hasReservations: true,
    hasConsultations: true
  });

  const handlePlanSelect = (planId: string) => {
    if (planId === 'BUSINESS') {
      // Pour le plan Business, rediriger vers un formulaire de contact
      window.location.href = 'mailto:contact@kalliky.com?subject=Demande Plan Business';
      return;
    }
    setFormData({ ...formData, selectedPlan: planId });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation des champs obligatoires
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || 
          !formData.businessName || !formData.storeName || !formData.storeAddress || !formData.storePhone) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Tous les services sont inclus par défaut
      // Pas besoin de validation car tous sont activés

      // Créer directement la session Stripe avec toutes les données
      const checkoutResponse = await fetch('/api/stripe/checkout-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Données utilisateur
          userData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            language: formData.language
          },
          // Données business
          businessData: {
            name: formData.businessName,
            type: 'PRODUCTS'
          },
          // Données boutique
          storeData: {
            name: formData.storeName,
            address: formData.storeAddress,
            phone: formData.storePhone,
            hasProducts: formData.hasProducts,
            hasReservations: formData.hasReservations,
            hasConsultations: formData.hasConsultations
          },
          // Plan sélectionné
          plan: formData.selectedPlan
        })
      });

      if (!checkoutResponse.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const { sessionUrl } = await checkoutResponse.json();

      // Rediriger vers Stripe Checkout
      window.location.href = sessionUrl;

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {step === 1 ? 'Choisissez votre plan' : 'Créez votre compte'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {step === 1 
              ? 'Commencez votre essai gratuit de 14 jours'
              : `Plan ${selectedPlan?.name} sélectionné`}
          </p>
        </div>

        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={cn(
                  "relative cursor-pointer hover:shadow-lg transition-all",
                  plan.recommended && "border-primary border-2 shadow-lg"
                )}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Recommandé
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.subtitle && (
                    <p className="text-sm font-semibold text-primary">{plan.subtitle}</p>
                  )}
                  <p className="text-muted-foreground text-sm">{plan.target}</p>
                  <div className="pt-4">
                    <p className="text-3xl font-bold">{plan.price}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                    {plan.blockedFeatures && plan.blockedFeatures.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        {plan.blockedFeatures.map((feature, i) => (
                          <li key={`blocked-${i}`} className="flex items-start gap-2 opacity-60">
                            <span className="text-xs">{feature}</span>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.recommended ? 'default' : 'outline'}
                  >
                    {plan.id === 'BUSINESS' ? 'Nous contacter' : 'Choisir ce plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  Créez votre compte pour continuer vers le paiement
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nom de la société</Label>
                    <Input
                      id="businessName"
                      required
                      placeholder="Ex: SARL Mario & Fils"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      placeholder="+33 6 12 34 56 78"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Langue préférée</Label>
                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => setFormData({...formData, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Section Activité */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configuration de votre activité</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nom de la boutique</Label>
                      <Input
                        id="storeName"
                        required
                        placeholder="Ex: Pizzeria Mario"
                        value={formData.storeName}
                        onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeAddress">Adresse complète</Label>
                      <Input
                        id="storeAddress"
                        required
                        placeholder="123 rue de la République, 75001 Paris"
                        value={formData.storeAddress}
                        onChange={(e) => setFormData({...formData, storeAddress: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storePhone">Téléphone boutique</Label>
                      <Input
                        id="storePhone"
                        type="tel"
                        required
                        placeholder="+33 1 23 45 67 89"
                        value={formData.storePhone}
                        onChange={(e) => setFormData({...formData, storePhone: e.target.value})}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Services inclus</Label>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 font-medium mb-3">
                          ✅ Tous les services sont inclus dans votre abonnement
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">🍽️</span>
                            <span className="text-sm">
                              <strong>Vente de Produits</strong> - Restaurant, boulangerie, café, fast-food...
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">📅</span>
                            <span className="text-sm">
                              <strong>Réservations</strong> - Tables, chambres, créneaux, événements...
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">👨‍⚖️</span>
                            <span className="text-sm">
                              <strong>Consultations</strong> - Avocat, médecin, conseiller, coach...
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-green-700 mt-3">
                          💡 Vous pourrez activer/désactiver chaque service selon vos besoins après inscription
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-2">Plan sélectionné : {selectedPlan?.name}</p>
                    <p className="text-2xl font-bold">{selectedPlan?.price}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlan?.description}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continuer vers le paiement
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-4">
              En continuant, vous acceptez nos{' '}
              <a href="#" className="underline">conditions d'utilisation</a>{' '}
              et notre{' '}
              <a href="#" className="underline">politique de confidentialité</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}