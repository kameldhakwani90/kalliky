'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, ArrowLeft, Star, Phone, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TELNYX_COUNTRIES, POPULAR_COUNTRIES, OTHER_COUNTRIES, getTelnyxCountry, formatCountryPrice } from '@/lib/constants/countries';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/lib/password-utils';

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

// Types d'activité avec icônes
const businessCategories = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: '🍕', description: 'Restaurant, fast-food, brasserie' },
  { value: 'BEAUTY', label: 'Salon de beauté', icon: '💄', description: 'Instituts de beauté, soins esthétiques' },
  { value: 'HAIRDRESSER', label: 'Coiffeur', icon: '✂️', description: 'Salons de coiffure, barbiers' },
  { value: 'HEALTH', label: 'Santé', icon: '🏥', description: 'Cliniques, cabinets médicaux' },
  { value: 'AUTOMOTIVE', label: 'Automobile', icon: '🚗', description: 'Garages, concessionnaires' },
  { value: 'PROFESSIONAL', label: 'Services pro', icon: '💼', description: 'Conseils, expertise, consulting' },
  { value: 'ENTERTAINMENT', label: 'Divertissement', icon: '🎭', description: 'Loisirs, spectacles, événements' },
  { value: 'RETAIL', label: 'Commerce', icon: '🛒', description: 'Boutiques, magasins, vente' },
  { value: 'SERVICES', label: 'Services', icon: '🔧', description: 'Réparations, maintenance' },
  { value: 'MEDICAL', label: 'Médical', icon: '⚕️', description: 'Médecins, spécialistes' },
  { value: 'LEGAL', label: 'Juridique', icon: '⚖️', description: 'Avocats, notaires, huissiers' },
  { value: 'FITNESS', label: 'Fitness', icon: '💪', description: 'Salles de sport, coaching' },
  { value: 'EDUCATION', label: 'Éducation', icon: '📚', description: 'Écoles, formations, cours' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚛', description: 'Logistique, livraison' },
  { value: 'IMMOBILIER', label: 'Immobilier', icon: '🏠', description: 'Agences, gestion locative' }
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
  businessCategory: string; // NOUVEAU: Type d'activité
  // Services multi-métiers
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
  // Acceptation légale
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PRO');
  const { toast } = useToast();
  
  // Récupérer le plan depuis l'URL
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      // Normaliser le nom du plan (STARTER, PRO, BUSINESS)
      const normalizedPlan = planParam.toUpperCase();
      const validPlans = ['STARTER', 'PRO', 'BUSINESS'];
      if (validPlans.includes(normalizedPlan)) {
        setSelectedPlanId(normalizedPlan);
      }
    }
  }, [searchParams]);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    selectedPlan: selectedPlanId,
    language: 'fr',
    // Champs boutique
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeCountry: 'FR', // France par défaut
    businessCategory: '', // Type d'activité à sélectionner
    // Services multi-métiers (tous activés par défaut)
    hasProducts: true,
    hasReservations: true,
    hasConsultations: true,
    // Acceptation légale
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false
  });

  // Synchroniser le plan sélectionné avec formData
  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedPlan: selectedPlanId }));
  }, [selectedPlanId]);

  const handleChangePlan = () => {
    // Rediriger vers la page des plans (à créer)
    router.push('/plans');
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

      // Validation de la force du mot de passe
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        throw new Error('Le mot de passe ne répond pas aux exigences de sécurité. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      }

      // Validation de l'acceptation des conditions légales
      if (!formData.acceptTerms || !formData.acceptPrivacy) {
        throw new Error('Vous devez accepter les conditions d\'utilisation et la politique de confidentialité');
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
            businessCategory: formData.businessCategory,
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
      toast({
        title: "Erreur",
        description: error.message || 'Une erreur est survenue',
        variant: "destructive"
      });
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
              Créez Votre
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Compte
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Plan {selectedPlan?.name} sélectionné - Finalisez votre inscription
            </p>
          </motion.div>

          {/* Selected Plan Card */}
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-8">
            <div className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Plan {selectedPlan?.name}</p>
                    <p className="text-2xl font-bold text-white">{selectedPlan?.price}</p>
                    <p className="text-gray-400">{selectedPlan?.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangePlan}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  Changer
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                ✅ 14 jours d'essai gratuit • Résiliation à tout moment
              </p>
            </div>
          </motion.div>

          {/* Create Account Form */}
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
                            minLength={8}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            placeholder="Minimum 8 caractères"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                          />
                          <PasswordStrengthIndicator 
                            password={formData.password} 
                            showFeedback={true} 
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
                          <Label htmlFor="businessCategory" className="text-gray-300">Type d'activité</Label>
                          <Select 
                            value={formData.businessCategory} 
                            onValueChange={(value) => setFormData({...formData, businessCategory: value})}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Sélectionnez votre secteur d'activité" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{category.label}</span>
                                      <span className="text-xs text-gray-500">{category.description}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

                        {/* Info discrète sur les opérateurs */}
                        {formData.storeCountry && (
                          <div className="text-xs text-gray-400 mt-2">
                            La plupart des opérateurs incluent les appels vers les numéros locaux, sauf certaines lignes prépayées (ex: Lycamobile, Lebara).
                          </div>
                        )}

                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    {/* Acceptation légale */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">Acceptation des conditions</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="acceptTerms"
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) => 
                              setFormData({...formData, acceptTerms: checked === true})
                            }
                            className="mt-1 border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                          />
                          <div className="flex-1">
                            <label htmlFor="acceptTerms" className="text-sm text-gray-300 cursor-pointer">
                              J'accepte les{' '}
                              <Link href="/legal/terms" target="_blank" className="text-blue-400 underline hover:no-underline">
                                Conditions Générales d'Utilisation
                              </Link>{' '}
                              et les{' '}
                              <Link href="/legal/sales" target="_blank" className="text-blue-400 underline hover:no-underline">
                                Conditions Générales de Vente
                              </Link>{' '}
                              <span className="text-red-400">*</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="acceptPrivacy"
                            checked={formData.acceptPrivacy}
                            onCheckedChange={(checked) => 
                              setFormData({...formData, acceptPrivacy: checked === true})
                            }
                            className="mt-1 border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                          />
                          <div className="flex-1">
                            <label htmlFor="acceptPrivacy" className="text-sm text-gray-300 cursor-pointer">
                              J'accepte la{' '}
                              <Link href="/legal/privacy" target="_blank" className="text-blue-400 underline hover:no-underline">
                                Politique de Confidentialité (RGPD)
                              </Link>{' '}
                              et consens au traitement de mes données personnelles{' '}
                              <span className="text-red-400">*</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="acceptMarketing"
                            checked={formData.acceptMarketing}
                            onCheckedChange={(checked) => 
                              setFormData({...formData, acceptMarketing: checked === true})
                            }
                            className="mt-1 border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                          />
                          <div className="flex-1">
                            <label htmlFor="acceptMarketing" className="text-sm text-gray-300 cursor-pointer">
                              J'accepte de recevoir des communications marketing et des offres commerciales 
                              d'OrderSpot.pro (optionnel)
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-blue-300 text-xs leading-relaxed">
                          <strong>Protection de vos données :</strong> Vos données sont chiffrées, stockées en Europe (RGPD), 
                          et ne sont jamais vendues à des tiers. Vous pouvez exercer vos droits (accès, rectification, suppression) 
                          à tout moment via privacy@orderspot.pro
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    {/* Actions */}
                    <div className="flex gap-4 pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleChangePlan}
                        disabled={loading}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Changer de plan
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

              </motion.div>
            </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}