'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Menu,
  Clock,
  Users,
  Settings,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  Euro,
  Calendar,
  Star,
  ChefHat,
  Coffee,
  Utensils
} from 'lucide-react';

const serviceExamples = [
  {
    name: 'Restaurant Le Gourmet',
    category: 'Restaurant d\'affaires',
    icon: '🏢',
    services: [
      {
        name: 'Réservation Salle Privée',
        duration: '2-4 heures',
        capacity: 12,
        employees: ['Serveur dédié', 'Chef de rang'],
        requirements: ['Salle privative', 'Système audio/vidéo'],
        options: ['Menu dégustation', 'Accord mets-vins', 'Service traiteur']
      },
      {
        name: 'Réunion d\'Affaires + Repas', 
        duration: '1.5-3 heures',
        capacity: 8,
        employees: ['Serveur discret', 'Sommelier'],
        requirements: ['Table ronde', 'WiFi haut débit', 'Paperboard'],
        options: ['Coffee break', 'Pause déjeuner', 'Menu allégé']
      },
      {
        name: 'Événement Corporate',
        duration: '4-6 heures',
        capacity: 50,
        employees: ['Chef de service', 'Équipe serveurs', 'Coordinateur événement'],
        requirements: ['Espace modulable', 'Matériel événementiel'],
        options: ['Cocktail dînatoire', 'Animation', 'Photographe']
      }
    ]
  },
  {
    name: 'Brasserie du Centre',
    category: 'Brasserie traditionnelle',
    icon: '🍺',
    services: [
      {
        name: 'Table d\'Anniversaire',
        duration: '2-3 heures',
        capacity: 10,
        employees: ['Serveur attitré'],
        requirements: ['Espace décoré', 'Gâteau personnalisé'],
        options: ['Décoration thématique', 'Menu groupe', 'Cadeau surprise']
      },
      {
        name: 'Soirée Dégustation Bières',
        duration: '2 heures',
        capacity: 15,
        employees: ['Maître brasseur', 'Serveur spécialisé'],
        requirements: ['Espace bar', 'Verres dégustation'],
        options: ['Plateau fromages', 'Charcuterie', 'Guide dégustation']
      }
    ]
  },
  {
    name: 'Café Coworking',
    category: 'Café-Bureau',
    icon: '💻',
    services: [
      {
        name: 'Réservation Espace de Travail',
        duration: '2-8 heures',
        capacity: 1,
        employees: ['Hôte d\'accueil'],
        requirements: ['Bureau individuel', 'Connexion WiFi', 'Prises électriques'],
        options: ['Café illimité', 'Imprimante', 'Casier personnel']
      },
      {
        name: 'Salle de Réunion',
        duration: '1-4 heures',
        capacity: 6,
        employees: ['Support technique'],
        requirements: ['Écran de projection', 'Vidéoconférence', 'Tableau blanc'],
        options: ['Service café/thé', 'Collations', 'Assistance technique']
      }
    ]
  }
];

const configSteps = [
  {
    title: 'Création du Service',
    description: 'Définir les informations de base',
    items: [
      'Nom du service (ex: "Pizza Livraison")',
      'Description détaillée',
      'Icône et couleur de catégorie',
      'Prix de base si applicable'
    ]
  },
  {
    title: 'Configuration Temporelle',
    description: 'Définir les créneaux et durées',
    items: [
      'Horaires d\'ouverture du service',
      'Durée moyenne du service',
      'Temps de préparation',
      'Créneaux de réservation'
    ]
  },
  {
    title: 'Ressources & Capacité',
    description: 'Affecter employés et équipements',
    items: [
      'Employés nécessaires',
      'Équipements requis',
      'Capacité maximale',
      'Gestion des files d\'attente'
    ]
  },
  {
    title: 'Options Additionnelles',
    description: 'Personnaliser l\'expérience client',
    items: [
      'Options de personnalisation',
      'Suppléments payants',
      'Accompagnements',
      'Services complémentaires'
    ]
  }
];

export default function ServicesGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="relative overflow-hidden">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <Link 
                href="/help/food"
                className="p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <Menu className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Configuration des Services</h1>
                  <p className="text-gray-300">Guide complet pour paramétrer vos services restaurant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
          
          {/* Étapes de Configuration */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-8">Étapes de Configuration</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {configSteps.map((step, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 mb-4">{step.description}</p>
                  <div className="space-y-2">
                    {step.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Exemples Concrets */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-8">Exemples Concrets de Restaurants</h2>
            <div className="space-y-8">
              {serviceExamples.map((restaurant, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-4xl">{restaurant.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{restaurant.name}</h3>
                      <p className="text-gray-400">{restaurant.category}</p>
                    </div>
                  </div>
                  
                  <div className="grid lg:grid-cols-3 gap-6">
                    {restaurant.services.map((service, serviceIdx) => (
                      <div key={serviceIdx} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Utensils className="h-5 w-5 text-green-400" />
                          </div>
                          <h4 className="font-semibold text-white">{service.name}</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-300">{service.duration}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-orange-400" />
                            <span className="text-gray-300">Capacité: {service.capacity}</span>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-400" />
                              Employés requis
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {service.employees.map((emp, empIdx) => (
                                <span key={empIdx} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                                  {emp}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <Settings className="h-4 w-4 text-cyan-400" />
                              Prérequis
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {service.requirements.map((req, reqIdx) => (
                                <span key={reqIdx} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">
                                  {req}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              Options
                            </h5>
                            <div className="space-y-1">
                              {service.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                                  <span className="text-gray-300 text-xs">{opt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Comment Faire dans Kalliky */}
          <section>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Comment Configurer dans Kalliky</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-400" />
                    Créer un nouveau service
                  </h3>
                  <div className="space-y-3 text-gray-300">
                    <p>1. Allez dans <strong>Services → Ajouter service</strong></p>
                    <p>2. Remplissez les informations de base (nom, description, icône)</p>
                    <p>3. Définissez les créneaux horaires disponibles</p>
                    <p>4. Assignez les employés nécessaires</p>
                    <p>5. Définissez les prérequis et ressources</p>
                    <p>6. Ajoutez les options additionnelles</p>
                    <p>7. Testez la configuration avec une simulation</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-400" />
                    Bonnes Pratiques
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">Utilisez des noms clairs et explicites pour vos services</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">Ajustez la capacité selon vos ressources réelles</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">Testez les créneaux avec des commandes simulées</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">Configurez les options additionnelles pour augmenter le panier moyen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Navigation */}
          <section>
            <div className="flex justify-between">
              <Link href="/help/food">
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au guide principal
                </Button>
              </Link>
              <Link href="/help/food/employees">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Guide Employés
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}