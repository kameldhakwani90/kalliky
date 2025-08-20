'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, ArrowLeft, Star, Phone, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TELNYX_COUNTRIES, POPULAR_COUNTRIES, OTHER_COUNTRIES, getTelnyxCountry, formatCountryPrice } from '@/lib/constants/countries';

// IMPORTANT: NE PAS CHANGER LES PRIX OU FONCTIONNALITÉS - SEULEMENT LE DESIGN
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
  storeCountry: string; // NOUVEAU: Pays pour numéro Telnyx
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
    storeCountry: 'FR', // France par défaut
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
          !formData.businessName || !formData.storeName || !formData.storeAddress || !formData.storePhone || !formData.storeCountry) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

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
            country: formData.storeCountry,
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container max-w-7xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {step === 1 ? (
                <>
                  Choisissez Votre
                  <br />
                  <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                    Plan Parfait
                  </span>
                </>
              ) : (
                <>
                  Créez Votre
                  <br />
                  <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                    Compte
                  </span>
                </>
              )}
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {step === 1 
                ? 'Commencez votre essai gratuit de 14 jours. Sans engagement.' 
                : `Plan ${selectedPlan?.name} sélectionné - Finalisez votre inscription`}
            </p>
          </motion.div>

          {/* Step 1: Choose Plan */}
          {step === 1 && (
            <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative"
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-white text-black px-4 py-2 font-semibold rounded-full shadow-xl flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {plan.subtitle || 'Recommandé'}
                      </div>
                    </div>
                  )}

                  <div 
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`relative h-full backdrop-blur-md rounded-3xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                      plan.recommended 
                        ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/20 shadow-2xl' 
                        : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Header */}
                    <div className="relative z-10 p-8 text-center">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-400 mb-6">{plan.target}</p>
                      
                      <div className="mb-8">
                        <div className="text-4xl font-bold">{plan.price}</div>
                        <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                      </div>

                      <Button 
                        className={`w-full mb-8 font-semibold transition-all duration-200 ${
                          plan.recommended 
                            ? 'bg-white text-black hover:bg-gray-100' 
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        {plan.id === 'BUSINESS' ? 'Nous contacter' : 'Choisir ce plan'}
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="relative z-10 px-8 pb-8">
                      <div className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-sm text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {plan.blockedFeatures && plan.blockedFeatures.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                          <div className="space-y-2">
                            {plan.blockedFeatures.map((feature, i) => (
                              <div key={i} className="flex items-start gap-2 opacity-50">
                                <span className="text-sm text-gray-500">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 2: Create Account */}
          {step === 2 && (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="max-w-2xl mx-auto"
            >
              <motion.div variants={itemVariants}>
                <div className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-white">Informations personnelles</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-gray-300">Prénom</Label>
                          <Input
                            id="firstName"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-gray-300">Nom</Label>
                          <Input
                            id="lastName"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-gray-300">Nom de la société</Label>
                        <Input
                          id="businessName"
                          required
                          placeholder="Ex: SARL Mario & Fils"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          value={formData.businessName}
                          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email professionnel</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-300">Téléphone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            placeholder="+33 6 12 34 56 78"
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                          <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-gray-300">Langue préférée</Label>
                        <Select 
                          value={formData.language} 
                          onValueChange={(value) => setFormData({...formData, language: value})}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Sélectionnez votre langue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    {/* Business Info */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-white">Configuration de votre activité</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="storeName" className="text-gray-300">Nom de la boutique</Label>
                          <Input
                            id="storeName"
                            required
                            placeholder="Ex: Pizzeria Mario"
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            value={formData.storeName}
                            onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="storeAddress" className="text-gray-300">Adresse complète</Label>
                          <Input
                            id="storeAddress"
                            required
                            placeholder="123 rue de la République, 75001 Paris"
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            value={formData.storeAddress}
                            onChange={(e) => setFormData({...formData, storeAddress: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="storeCountry" className="text-gray-300 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Pays pour numéro virtuel
                            </Label>
                            <Select 
                              value={formData.storeCountry} 
                              onValueChange={(value) => setFormData({...formData, storeCountry: value})}
                            >
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Choisir un pays" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Pays populaires */}
                                {POPULAR_COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{country.flag}</span>
                                      <span>{country.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                                <div className="border-t my-1"></div>
                                {/* Autres pays */}
                                {OTHER_COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{country.flag}</span>
                                      <span>{country.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="storePhone" className="text-gray-300">Votre numéro de téléphone</Label>
                            <Input
                              id="storePhone"
                              type="tel"
                              required
                              placeholder="+33 1 23 45 67 89"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              value={formData.storePhone}
                              onChange={(e) => setFormData({...formData, storePhone: e.target.value})}
                            />
                          </div>
                        </div>

                        {/* Info sur le numéro virtuel */}
                        {formData.storeCountry && (
                          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <Phone className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-green-100 font-medium mb-2">
                                  📞 Numéro virtuel {getTelnyxCountry(formData.storeCountry)?.name} {getTelnyxCountry(formData.storeCountry)?.flag}
                                </p>
                                <p className="text-green-200 text-sm mb-2">
                                  Un numéro de téléphone virtuel sera automatiquement attribué. <strong>Les appels ne sont généralement pas facturés</strong> car inclus dans la plupart des abonnements.
                                </p>
                                <div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                                  <p className="text-green-100 text-xs leading-relaxed">
                                    ⚠️ <strong>Important :</strong> Vérifiez que votre pays/opérateur choisi correspond bien à celui de vos clients. En cas d'erreur, des frais pourraient s'appliquer. La plupart des opérateurs incluent les appels vers les numéros locaux, sauf certaines lignes prépayées.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <Label className="text-gray-300">Services inclus</Label>
                          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
                            <p className="text-green-400 font-medium mb-4 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Tous les services sont inclus dans votre abonnement
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🍽️</span>
                                <div>
                                  <span className="text-white font-medium">Vente de Produits</span>
                                  <p className="text-green-300 text-sm">Restaurant, boulangerie, café, fast-food...</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">📅</span>
                                <div>
                                  <span className="text-white font-medium">Réservations</span>
                                  <p className="text-green-300 text-sm">Tables, chambres, créneaux, événements...</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">👨‍⚖️</span>
                                <div>
                                  <span className="text-white font-medium">Consultations</span>
                                  <p className="text-green-300 text-sm">Avocat, médecin, conseiller, coach...</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-green-300 text-sm mt-4">
                              💡 Vous pourrez activer/désactiver chaque service selon vos besoins après inscription
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    {/* Plan Summary */}
                    <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg">Plan {selectedPlan?.name}</p>
                          <p className="text-2xl font-bold text-white">{selectedPlan?.price}</p>
                          <p className="text-gray-400">{selectedPlan?.description}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        ✅ 14 jours d'essai gratuit • Résiliation à tout moment
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(1)}
                        disabled={loading}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-white text-black hover:bg-gray-100 font-semibold" 
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continuer vers le paiement
                      </Button>
                    </div>
                  </form>
                </div>

                <p className="text-center text-sm text-gray-400 mt-6">
                  En continuant, vous acceptez nos{' '}
                  <a href="#" className="text-white underline hover:no-underline">conditions d'utilisation</a>{' '}
                  et notre{' '}
                  <a href="#" className="text-white underline hover:no-underline">politique de confidentialité</a>.
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}