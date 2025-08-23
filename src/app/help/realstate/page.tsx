'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  ArrowLeft,
  Calendar,
  Key,
  CreditCard,
  Settings,
  Users,
  Clock,
  MessageCircle,
  Camera,
  Shield,
  Star,
  BarChart3,
  Bell,
  Smartphone,
  TrendingUp,
  Headphones,
  ExternalLink,
  CheckCircle2,
  PlayCircle,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Bath,
  Bed
} from 'lucide-react';

const guides = [
  {
    title: 'Gestion Multi-Propriétés',
    description: 'Organisation de votre portefeuille immobilier',
    icon: Home,
    color: 'from-green-500 to-green-600',
    steps: [
      'Ajout et configuration des biens',
      'Profils de propriétés détaillés',
      'Photos et visites virtuelles',
      'Zonage et réglementations'
    ]
  },
  {
    title: 'Réservations & Check-in',
    description: 'Automatisation de l\'accueil voyageurs',
    icon: Key,
    color: 'from-blue-500 to-blue-600',
    steps: [
      'Calendrier de disponibilités',
      'Processus check-in automatisé',
      'Codes d\'accès intelligents',
      'Instructions personnalisées'
    ]
  },
  {
    title: 'Tarification Dynamique',
    description: 'Optimisation des revenus locatifs',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    steps: [
      'Algorithme de prix intelligent',
      'Saisonnalité et événements',
      'Concurrence et market data',
      'Yield management avancé'
    ]
  },
  {
    title: 'Conciergerie Digitale',
    description: 'Services et assistance 24/7',
    icon: MessageCircle,
    color: 'from-orange-500 to-orange-600',
    steps: [
      'Chat automatisé multilingue',
      'Recommandations locales',
      'Services à la demande',
      'Support d\'urgence'
    ]
  },
  {
    title: 'Maintenance & Ménage',
    description: 'Coordination des prestations',
    icon: Calendar,
    color: 'from-red-500 to-red-600',
    steps: [
      'Planning équipes ménage',
      'Contrôles qualité',
      'Maintenance préventive',
      'Inventaire et remplacements'
    ]
  },
  {
    title: 'Analytics Immobilier',
    description: 'Performances et rentabilité',
    icon: BarChart3,
    color: 'from-cyan-500 to-cyan-600',
    steps: [
      'Taux d\'occupation optimaux',
      'Revenue per available room',
      'Satisfaction clients',
      'Benchmarking marché'
    ]
  }
];

const quickStart = [
  {
    step: 1,
    title: 'Ajouter vos propriétés',
    description: 'Configuration complète de vos biens',
    action: '/activity/realstate'
  },
  {
    step: 2,
    title: 'Connecter vos canaux',
    description: 'Airbnb, Booking.com, sites directs',
    action: null
  },
  {
    step: 3,
    title: 'Configurer le check-in',
    description: 'Automatisation de l\'accueil',
    action: null
  },
  {
    step: 4,
    title: 'Activer la conciergerie',
    description: 'Assistant IA pour vos voyageurs',
    action: null
  }
];

const realstateFeatures = [
  'Synchronisation multi-plateformes automatisée',
  'Check-in/out sans contact avec codes',
  'Conciergerie IA multilingue 24/7',
  'Nettoyage programmé automatiquement',
  'Tarification dynamique intelligente',
  'Gestion des incidents et maintenance'
];

export default function RealstateHelpPage() {
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
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Guide Immobilier & Hébergement</h1>
                  <p className="text-gray-300">Solutions pour Airbnb, locations saisonnières et gestion immobilière</p>
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
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      {item.action && (
                        <Link href={item.action}>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
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
                  <Key className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Spécial Immobilier</h3>
                </div>
                <div className="space-y-3">
                  {realstateFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
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
            <h2 className="text-4xl font-bold text-white mb-4">Guides Spécialisés Immobilier</h2>
            <p className="text-xl text-gray-300">Maximisez la rentabilité de vos biens immobiliers</p>
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
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span className="text-gray-300 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full mt-6 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl">
                  Voir le guide complet
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Property Management Features */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Home className="h-6 w-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Outils de Gestion Immobilière</h2>
                <Home className="h-6 w-6 text-green-400" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Bed className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Multi-Logements</h3>
                <p className="text-gray-400 text-sm">Gestion centralisée de tout votre portefeuille</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Camera className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Inspections</h3>
                <p className="text-gray-400 text-sm">Photos et rapports d'état automatisés</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Coffee className="h-8 w-8 text-orange-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Services Premium</h3>
                <p className="text-gray-400 text-sm">Petit-déjeuner, spa, conciergerie</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Wifi className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">IoT Connect</h3>
                <p className="text-gray-400 text-sm">Objets connectés et domotique</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Star className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Super Host</h3>
                <p className="text-gray-400 text-sm">Optimisation pour les certifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Ressources Immobilières</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Headphones className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Support Airbnb</h3>
                <p className="text-gray-400 text-sm mb-4">Expertise spécialisée locations courte durée</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Headphones className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Masterclass Hosting</h3>
                <p className="text-gray-400 text-sm mb-4">Formation pour devenir super host</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Calendar className="h-4 w-4 mr-2" />
                  S'inscrire
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <MessageCircle className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Réseau Hosts</h3>
                <p className="text-gray-400 text-sm mb-4">Communauté des propriétaires Kalliky</p>
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