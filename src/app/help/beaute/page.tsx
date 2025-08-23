'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Scissors, 
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Bell,
  Settings,
  Smartphone,
  Star,
  MessageCircle,
  Clock,
  Package,
  TrendingUp,
  Shield,
  Headphones,
  ExternalLink,
  CheckCircle2,
  PlayCircle,
  Gift,
  UserCheck,
  Sparkles,
  Heart,
  Camera
} from 'lucide-react';

const guides = [
  {
    title: 'Gestion des Rendez-vous',
    description: 'Planification et organisation optimales',
    icon: Calendar,
    color: 'from-pink-500 to-pink-600',
    steps: [
      'Configuration du calendrier',
      'Créneaux et disponibilités',
      'Réservations en ligne',
      'Rappels automatiques'
    ]
  },
  {
    title: 'Services & Prestations',
    description: 'Catalogue de vos services beauté',
    icon: Sparkles,
    color: 'from-purple-500 to-purple-600',
    steps: [
      'Création du catalogue services',
      'Tarification dynamique',
      'Durées et ressources',
      'Packages et formules'
    ]
  },
  {
    title: 'Gestion Clientèle',
    description: 'Fidélisation et suivi personnalisé',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    steps: [
      'Fiches clients détaillées',
      'Historique des prestations',
      'Préférences et notes',
      'Programme de fidélité'
    ]
  },
  {
    title: 'Personnel & Ressources',
    description: 'Organisation de votre équipe',
    icon: UserCheck,
    color: 'from-green-500 to-green-600',
    steps: [
      'Planning des collaborateurs',
      'Spécialisations par praticien',
      'Gestion des congés',
      'Matériel et équipements'
    ]
  },
  {
    title: 'Marketing & Communication',
    description: 'Promotion et relation client',
    icon: MessageCircle,
    color: 'from-orange-500 to-orange-600',
    steps: [
      'Campagnes SMS et email',
      'Offres promotionnelles',
      'Programme de parrainage',
      'Avis et témoignages'
    ]
  },
  {
    title: 'Analytics Beauté',
    description: 'Performances et insights métier',
    icon: TrendingUp,
    color: 'from-red-500 to-red-600',
    steps: [
      'Chiffre d\'affaires par service',
      'Taux de fréquentation',
      'Performance des praticiens',
      'Analyse saisonnière'
    ]
  }
];

const quickStart = [
  {
    step: 1,
    title: 'Configurer votre salon',
    description: 'Informations générales et horaires',
    action: '/activity/beaute'
  },
  {
    step: 2,
    title: 'Créer vos services',
    description: 'Catalogue complet de vos prestations',
    action: null
  },
  {
    step: 3,
    title: 'Ajouter votre équipe',
    description: 'Praticiens et leurs spécialisations',
    action: null
  },
  {
    step: 4,
    title: 'Activer les réservations',
    description: 'Prise de RDV en ligne et par téléphone',
    action: null
  }
];

const beautyFeatures = [
  'Prise de RDV 24h/24 automatisée',
  'Gestion des annulations et reports',
  'Rappels clients personnalisés',
  'Carnet d\'adresses intelligent',
  'Calcul automatique du CA',
  'Photos avant/après intégrées'
];

export default function BeauteHelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="relative overflow-hidden">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <Link 
                href="/help"
                className="p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg">
                  <Scissors className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Guide Beauté & Bien-être</h1>
                  <p className="text-gray-300">Solutions pour salons, spas et centres esthétiques</p>
                </div>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <PlayCircle className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Démarrage Rapide</h3>
                </div>
                <div className="space-y-4">
                  {quickStart.map((item) => (
                    <div key={item.step} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      {item.action && (
                        <Link href={item.action}>
                          <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-6 w-6 text-pink-400" />
                  <h3 className="text-xl font-semibold text-white">Spécial Beauté</h3>
                </div>
                <div className="space-y-3">
                  {beautyFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-pink-400 rounded-full" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guides Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Guides Spécialisés</h2>
            <p className="text-xl text-gray-300">Maîtrisez la gestion complète de votre établissement beauté</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide, idx) => (
              <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 bg-gradient-to-br ${guide.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <guide.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{guide.title}</h3>
                    <p className="text-gray-400 text-sm">{guide.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {guide.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                      <span className="text-gray-300 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full mt-6 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl">
                  Voir le guide détaillé
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Beauty-specific Features */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="backdrop-blur-xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-pink-400" />
                <h2 className="text-2xl font-bold text-white">Fonctionnalités Exclusives Beauté</h2>
                <Sparkles className="h-6 w-6 text-pink-400" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Camera className="h-8 w-8 text-pink-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Photos Avant/Après</h3>
                <p className="text-gray-400 text-sm">Galerie intégrée pour valoriser vos résultats</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Gift className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Cartes Cadeaux</h3>
                <p className="text-gray-400 text-sm">Système complet de bons et cartes cadeaux</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Star className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Programme VIP</h3>
                <p className="text-gray-400 text-sm">Fidélisation avancée pour vos meilleurs clients</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Bell className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Rappels Beauté</h3>
                <p className="text-gray-400 text-sm">Notifications personnalisées pour les soins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Ressources Beauté</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Headphones className="h-8 w-8 text-pink-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Support Spécialisé</h3>
                <p className="text-gray-400 text-sm mb-4">Conseillers experts du secteur beauté</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Headphones className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Users className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Formation Métier</h3>
                <p className="text-gray-400 text-sm mb-4">Modules de formation spécifiques beauté</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Calendar className="h-4 w-4 mr-2" />
                  S'inscrire
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <MessageCircle className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Réseau Beauté</h3>
                <p className="text-gray-400 text-sm mb-4">Communauté des professionnels Kalliky</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Rejoindre
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}