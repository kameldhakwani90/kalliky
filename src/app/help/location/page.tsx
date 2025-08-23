'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  ArrowLeft,
  Calendar,
  Car,
  CreditCard,
  Settings,
  Package,
  Clock,
  Users,
  Shield,
  Truck,
  Wrench,
  BarChart3,
  Bell,
  Smartphone,
  MessageCircle,
  TrendingUp,
  Headphones,
  ExternalLink,
  CheckCircle2,
  PlayCircle,
  Key,
  FileText,
  Camera,
  MapIcon
} from 'lucide-react';

const guides = [
  {
    title: 'Gestion du Parc',
    description: 'Inventaire et maintenance de vos équipements',
    icon: Package,
    color: 'from-blue-500 to-blue-600',
    steps: [
      'Catalogage des équipements',
      'États et disponibilités',
      'Planning de maintenance',
      'Historique des locations'
    ]
  },
  {
    title: 'Réservations & Planning',
    description: 'Organisation optimale des locations',
    icon: Calendar,
    color: 'from-green-500 to-green-600',
    steps: [
      'Calendrier de disponibilités',
      'Réservations multi-canaux',
      'Gestion des conflits',
      'Prolongations et modifications'
    ]
  },
  {
    title: 'Tarification Dynamique',
    description: 'Optimisation des prix selon la demande',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    steps: [
      'Grilles tarifaires flexibles',
      'Prix selon la saison',
      'Remises et promotions',
      'Facturation automatisée'
    ]
  },
  {
    title: 'Contrats & Documents',
    description: 'Gestion documentaire complète',
    icon: FileText,
    color: 'from-orange-500 to-orange-600',
    steps: [
      'Modèles de contrats',
      'Signatures électroniques',
      'États des lieux',
      'Assurances et cautions'
    ]
  },
  {
    title: 'Logistique & Livraison',
    description: 'Transport et mise à disposition',
    icon: Truck,
    color: 'from-red-500 to-red-600',
    steps: [
      'Zones de livraison',
      'Planning des tournées',
      'Suivi GPS temps réel',
      'Preuves de livraison'
    ]
  },
  {
    title: 'Maintenance & SAV',
    description: 'Suivi technique et interventions',
    icon: Wrench,
    color: 'from-cyan-500 to-cyan-600',
    steps: [
      'Planning de maintenance',
      'Interventions d\'urgence',
      'Pièces détachées',
      'Historique technique'
    ]
  }
];

const quickStart = [
  {
    step: 1,
    title: 'Configurer votre activité',
    description: 'Informations générales et zones de service',
    action: '/activity/location'
  },
  {
    step: 2,
    title: 'Ajouter vos équipements',
    description: 'Catalogue complet de votre parc',
    action: null
  },
  {
    step: 3,
    title: 'Définir vos tarifs',
    description: 'Grilles de prix et conditions',
    action: null
  },
  {
    step: 4,
    title: 'Activer les réservations',
    description: 'Mise en ligne de votre système',
    action: null
  }
];

const locationFeatures = [
  'Planning de réservation intelligent',
  'Gestion des cautions automatisée',
  'Contrats et états des lieux numériques',
  'Suivi GPS des équipements',
  'Maintenance préventive programmée',
  'Facturation avec récurrence'
];

export default function LocationHelpPage() {
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
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Guide Location & Services</h1>
                  <p className="text-gray-300">Solutions pour location d'équipements et services logistiques</p>
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
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      {item.action && (
                        <Link href={item.action}>
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
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
                  <Car className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Spécial Location</h3>
                </div>
                <div className="space-y-3">
                  {locationFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
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
            <h2 className="text-4xl font-bold text-white mb-4">Guides Spécialisés Location</h2>
            <p className="text-xl text-gray-300">Optimisez la gestion complète de votre parc d'équipements</p>
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
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <span className="text-gray-300 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full mt-6 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl">
                  Consulter le guide
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Location-specific Features */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Key className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Fonctionnalités Exclusives Location</h2>
                <Key className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <MapIcon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Suivi GPS</h3>
                <p className="text-gray-400 text-sm">Localisation temps réel de vos équipements</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Camera className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">États des Lieux</h3>
                <p className="text-gray-400 text-sm">Photos et rapports automatisés</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Shield className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Assurance Intégrée</h3>
                <p className="text-gray-400 text-sm">Gestion des sinistres et couvertures</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Clock className="h-8 w-8 text-orange-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Maintenance Prédictive</h3>
                <p className="text-gray-400 text-sm">Alertes basées sur l'utilisation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Ressources Location</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Headphones className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Support Technique</h3>
                <p className="text-gray-400 text-sm mb-4">Assistance spécialisée location</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Headphones className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Formation Logistique</h3>
                <p className="text-gray-400 text-sm mb-4">Modules spécialisés gestion de parc</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Calendar className="h-4 w-4 mr-2" />
                  Planning
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <MessageCircle className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Réseau Location</h3>
                <p className="text-gray-400 text-sm mb-4">Communauté des loueurs Kalliky</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Participer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}