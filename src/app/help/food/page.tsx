'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ChefHat, 
  ArrowLeft,
  Phone,
  Menu,
  ShoppingCart,
  Clock,
  Users,
  BarChart3,
  Bell,
  Settings,
  Smartphone,
  Truck,
  CreditCard,
  Star,
  MessageCircle,
  Calendar,
  Package,
  TrendingUp,
  Shield,
  Headphones,
  ExternalLink,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';

const guides = [
  {
    title: 'Configuration des Services',
    description: 'Paramétrage de vos services et créneaux',
    icon: Menu,
    color: 'from-green-500 to-green-600',
    steps: [
      'Création et configuration des services',
      'Définition des créneaux horaires',
      'Gestion des ressources et équipements',
      'Options additionnelles et personnalisations'
    ],
    href: '/help/food/services'
  },
  {
    title: 'Gestion des Employés',
    description: 'Organisation de votre équipe',
    icon: Users,
    color: 'from-orange-500 to-orange-600',
    steps: [
      'Ajout et configuration des employés',
      'Attribution des rôles et permissions',
      'Gestion des horaires de travail',
      'Suivi des performances'
    ],
    href: '/help/food/employees'
  },
  {
    title: 'Configuration Équipements',
    description: 'Paramétrage des ressources matérielles',
    icon: Settings,
    color: 'from-purple-500 to-purple-600',
    steps: [
      'Configuration des imprimantes',
      'Paramètres des terminaux de paiement',
      'Gestion des stocks et inventaire',
      'Maintenance et surveillance'
    ],
    href: '/help/food/equipment'
  },
  {
    title: 'Configuration IA',
    description: 'Intelligence artificielle et automatisation',
    icon: MessageCircle,
    color: 'from-cyan-500 to-cyan-600',
    steps: [
      'Upload et analyse de documents avec IA',
      'Configuration de l\'assistant intelligent',
      'Automatisation des processus',
      'Optimisation par IA'
    ],
    href: '/help/food/ai-config'
  }
];

const quickStart = [
  {
    step: 1,
    title: 'Créer votre restaurant',
    description: 'Configuration rapide en 5 minutes',
    action: '/activity/food'
  },
  {
    step: 2,
    title: 'Uploader votre menu',
    description: 'Notre IA analyse automatiquement votre carte',
    action: null
  },
  {
    step: 3,
    title: 'Configurer votre numéro',
    description: 'Liaison téléphonique en 1 clic',
    action: null
  },
  {
    step: 4,
    title: 'Tester le système',
    description: 'Simulation de commande complète',
    action: null
  }
];

export default function FoodHelpPage() {
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
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Configuration Activité</h1>
                  <p className="text-gray-300">Guide de configuration pour votre restaurant sur Kalliky</p>
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
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      {item.action && (
                        <Link href={item.action}>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
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
                  <CheckCircle2 className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Avantages Clés</h3>
                </div>
                <div className="space-y-3">
                  {[
                    'Réduction de 40% des erreurs de commande',
                    'Augmentation de 25% du panier moyen',
                    'Automatisation de 80% des tâches répétitives',
                    'Support multilingue automatique',
                    'Integration avec tous les services de livraison'
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-gray-300">{benefit}</span>
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
            <h2 className="text-4xl font-bold text-white mb-4">Guides Détaillés</h2>
            <p className="text-xl text-gray-300">Maîtrisez tous les aspects de votre solution Kalliky</p>
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
                
                <Link href={guide.href}>
                  <Button className="w-full mt-6 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl">
                    Voir le guide complet
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Ressources Complémentaires</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Phone className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Support Technique</h3>
                <p className="text-gray-400 text-sm mb-4">Assistance 7j/7 pour tous vos problèmes techniques</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Headphones className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Calendar className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Formation Personnalisée</h3>
                <p className="text-gray-400 text-sm mb-4">Sessions de formation adaptées à votre équipe</p>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Calendar className="h-4 w-4 mr-2" />
                  Réserver
                </Button>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Users className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Communauté</h3>
                <p className="text-gray-400 text-sm mb-4">Échangez avec d'autres restaurateurs Kalliky</p>
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