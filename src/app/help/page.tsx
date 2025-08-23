'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ChefHat, 
  Scissors, 
  MapPin, 
  Home,
  ArrowRight,
  BookOpen,
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Headphones
} from 'lucide-react';

const sectors = [
  {
    id: 'food',
    title: 'Restauration',
    description: 'Guides complets pour restaurants, cafés, food trucks et services de livraison',
    icon: ChefHat,
    color: 'from-orange-500 to-red-600',
    features: ['Gestion des commandes', 'Menus intelligents', 'Livraisons optimisées', 'Analytics']
  },
  {
    id: 'beaute',
    title: 'Beauté & Bien-être',
    description: 'Solutions pour salons, spas, instituts de beauté et centres de bien-être',
    icon: Scissors,
    color: 'from-pink-500 to-purple-600',
    features: ['Prises de RDV', 'Gestion clientèle', 'Services personnalisés', 'Fidélisation']
  },
  {
    id: 'location',
    title: 'Location & Services',
    description: 'Outils pour location de véhicules, équipements et services à la demande',
    icon: MapPin,
    color: 'from-blue-500 to-cyan-600',
    features: ['Réservations', 'Calendrier partagé', 'Gestion du matériel', 'Facturation']
  },
  {
    id: 'realstate',
    title: 'Immobilier & Hébergement',
    description: 'Gestion complète pour Airbnb, locations saisonnières et immobilier',
    icon: Home,
    color: 'from-green-500 to-emerald-600',
    features: ['Check-in/out', 'Conciergerie', 'Multi-propriétés', 'Tarification dynamique']
  }
];

const generalFeatures = [
  {
    icon: Sparkles,
    title: 'IA Intégrée',
    description: 'Intelligence artificielle pour optimiser vos processus'
  },
  {
    icon: Clock,
    title: '24/7 Disponible',
    description: 'Système automatisé qui fonctionne en continu'
  },
  {
    icon: Users,
    title: 'Multi-utilisateurs',
    description: 'Gestion d\'équipes et de rôles simplifiée'
  },
  {
    icon: TrendingUp,
    title: 'Analytics Avancés',
    description: 'Tableaux de bord et rapports détaillés'
  },
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Protection des données et conformité RGPD'
  },
  {
    icon: Headphones,
    title: 'Support Expert',
    description: 'Accompagnement personnalisé et formation'
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="relative overflow-hidden">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-white">Centre d'aide Kalliky</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">
                Guides par Secteur d'Activité
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Documentation complète et guides pratiques pour optimiser votre activité avec Kalliky
              </p>
            </div>
          </div>
        </div>

        {/* Sectors Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-8">
            {sectors.map((sector) => (
              <Link 
                key={sector.id}
                href={`/help/${sector.id}`}
                className="group"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20">
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${sector.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <sector.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                          {sector.title}
                        </h3>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {sector.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {sector.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            <span className="text-sm text-gray-400">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* General Features */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Fonctionnalités Transversales
              </h2>
              <p className="text-gray-300 text-lg">
                Des outils puissants disponibles pour tous les secteurs d'activité
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generalFeatures.map((feature, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <feature.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-white/20 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Besoin d'aide personnalisée ?
            </h3>
            <p className="text-gray-300 mb-6">
              Notre équipe d'experts est là pour vous accompagner dans la mise en place de votre solution Kalliky
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-8">
                <Headphones className="h-4 w-4 mr-2" />
                Contacter le Support
              </Button>
              <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl px-8">
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation Technique
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}