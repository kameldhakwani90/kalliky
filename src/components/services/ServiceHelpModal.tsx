'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  Wrench, 
  Calendar,
  Bot,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Euro,
  Link,
  Zap,
  Target,
  Settings,
  Star
} from 'lucide-react';

interface ServiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload?: () => void;
  businessType?: string;
  businessCategory?: string;
}

export default function ServiceHelpModal({ isOpen, onClose, onOpenUpload, businessType, businessCategory }: ServiceHelpModalProps) {
  const [activeSection, setActiveSection] = useState('overview');
  
  // Debug des données reçues
  console.log('🔍 ServiceHelpModal Debug:', {
    businessType,
    businessCategory,
    isOpen
  });

  const sections = [
    { id: 'overview', icon: BookOpen, title: 'Vue d\'ensemble', color: 'from-blue-500 to-blue-600' },
    { id: 'linking', icon: Link, title: 'Services ↔ Produits', color: 'from-green-500 to-green-600' },
    { id: 'employees', icon: Users, title: 'Employés', color: 'from-purple-500 to-purple-600' },
    { id: 'equipment', icon: Wrench, title: 'Équipements', color: 'from-orange-500 to-orange-600' },
    { id: 'reservations', icon: Calendar, title: 'Réservations', color: 'from-pink-500 to-pink-600' },
    { id: 'ai-upload', icon: Bot, title: 'Upload IA', color: 'from-indigo-500 to-indigo-600' }
  ];

  // Configuration spécifique au type de business
  const getBusinessConfig = () => {
    const lowerCategory = businessCategory?.toLowerCase() || '';
    const lowerType = businessType?.toLowerCase() || '';
    
    if (lowerCategory.includes('beauty') || lowerCategory.includes('hairdresser') || lowerType.includes('beaute')) {
      return {
        icon: '💇‍♀️',
        name: 'Salon de Beauté',
        services: [
          'Coupe Femme → 45€ • 45min',
          'Coloration → 85€ • 2h30',
          'Balayage → 120€ • 3h',
          'Soin Visage → 60€ • 1h',
          'Manucure → 35€ • 1h'
        ],
        employees: ['Coiffeuse senior', 'Coloriste', 'Esthéticienne', 'Apprentie'],
        equipment: ['Fauteuil de coiffure', 'Bac à shampoing', 'Séchoir', 'Steamer', 'Cabine UV'],
        specificTips: [
          '🎯 Liez les services complémentaires : "Coupe + Brushing"',
          '⏰ Configurez des créneaux adaptés aux durées (coloration = 3h)',
          '👥 Assignez les spécialités à vos coiffeuses',
          '🎨 Utilisez les ressources pour gérer le matériel (fauteuils, bacs)'
        ]
      };
    }
    
    if (lowerCategory.includes('restaurant') || lowerCategory.includes('food') || lowerType.includes('restaurant')) {
      return {
        icon: '🍽️',
        name: 'Restaurant',
        services: [
          'Menu Dégustation → 65€ • 2h',
          'Brunch Weekend → 28€ • 1h30',
          'Dîner Gastronomique → 45€ • 1h30',
          'Table d\'hôte → 35€ • 1h',
          'Privatisation Salle → 800€ • 4h'
        ],
        employees: ['Chef de cuisine', 'Sous-chef', 'Serveur', 'Sommelier', 'Commis'],
        equipment: ['Table 2 pers', 'Table 4 pers', 'Table 6 pers', 'Cuisine', 'Cave à vin'],
        specificTips: [
          '🍽️ Créez des services par table : "Table 4 personnes - Menu dégustation"',
          '⏰ Gérez les services par créneaux : déjeuner/dîner',
          '👨‍🍳 Assignez le chef et serveur à chaque service',
          '🍷 Utilisez les équipements pour les tables et espaces spéciaux'
        ]
      };
    }
    
    if (lowerCategory.includes('location') || lowerType.includes('location')) {
      return {
        icon: '🚗',
        name: 'Location de Véhicules',
        services: [
          'Location Citadine → 45€/jour',
          'Location SUV → 75€/jour',
          'Location Utilitaire → 60€/jour',
          'Location Prestige → 150€/jour',
          'Location Longue durée → 35€/jour'
        ],
        employees: ['Conseiller location', 'Mécanicien', 'Agent nettoyage'],
        equipment: ['Citadine Peugeot 208', 'SUV BMW X3', 'Utilitaire Ford Transit', 'Tesla Model S'],
        specificTips: [
          '🚗 Créez un service par type de véhicule',
          '📅 Configurez la disponibilité par véhicule',
          '👥 Assignez un conseiller par location',
          '🔧 Gérez l\'état et maintenance de chaque véhicule'
        ]
      };
    }
    
    if (lowerCategory.includes('realstate') || lowerCategory.includes('airbnb') || lowerType.includes('realstate')) {
      return {
        icon: '🏠',
        name: 'Location Saisonnière',
        services: [
          'Studio Centre-ville → 85€/nuit',
          'Appartement 2 pièces → 120€/nuit', 
          'Maison avec jardin → 200€/nuit',
          'Loft de luxe → 300€/nuit',
          'Service ménage → 50€'
        ],
        employees: ['Gestionnaire', 'Femme de ménage', 'Conciergerie'],
        equipment: ['Studio A12', 'Appart B23', 'Maison Villa Rose', 'Loft Panorama'],
        specificTips: [
          '🏠 Créez un service par logement',
          '🗓️ Gérez les disponibilités par calendrier',
          '🧹 Liez le ménage aux services principaux',
          '🔑 Automatisez le check-in/check-out'
        ]
      };
    }
    
    // Configuration par défaut
    return {
      icon: '⚙️',
      name: 'Services Génériques',
      services: [
        'Service Principal → Prix • Durée',
        'Service Complémentaire → Prix • Durée',
        'Service Premium → Prix • Durée'
      ],
      employees: ['Manager', 'Collaborateur', 'Spécialiste'],
      equipment: ['Équipement A', 'Équipement B', 'Outil spécialisé'],
      specificTips: [
        '⚙️ Définissez vos services selon votre activité',
        '👥 Assignez les compétences à votre équipe', 
        '📦 Gérez vos ressources et équipements',
        '💡 Optimisez les liaisons service-produit'
      ]
    };
  };

  const businessConfig = getBusinessConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-2xl border border-white/20 text-white shadow-2xl">
        {/* Header amélioré */}
        <DialogHeader className="border-b border-white/10 pb-6">
          <DialogTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur animate-pulse" />
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl">
                  {businessConfig.icon ? (
                    <div className="text-2xl">{businessConfig.icon}</div>
                  ) : (
                    <Sparkles className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Guide {businessConfig.name}</h2>
                <p className="text-gray-400 text-sm">Configuration spécialisée pour votre activité</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-mono">
                Type: {businessType || 'Non défini'}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Catégorie: {businessCategory || 'Non défini'}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            Guide personnalisé avec conseils pratiques et configuration recommandée
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-[70vh]">
          {/* Navigation latérale magnifique */}
          <div className="w-72 space-y-2 pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 ${
                  activeSection === section.id 
                    ? 'bg-white/20 shadow-lg scale-105' 
                    : 'bg-white/5 hover:bg-white/10 hover:scale-102'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${section.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                <div className="relative flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">{section.title}</div>
                    {activeSection === section.id && (
                      <div className="text-xs text-gray-300 mt-1">Section active</div>
                    )}
                  </div>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <ArrowRight className={`h-4 w-4 text-gray-400 transition-all ${
                    activeSection === section.id ? 'translate-x-1 text-white' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                </div>
              </button>
            ))}
          </div>

          {/* Contenu principal magnifique */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 pr-4">
            
            {/* Vue d'ensemble */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">{businessConfig.icon}</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuration {businessConfig.name}</h2>
                  <p className="text-gray-300">Guide spécialisé pour optimiser la gestion de votre {businessConfig.name.toLowerCase()}</p>
                  
                  {(!businessType && !businessCategory) && (
                    <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-center gap-2 justify-center text-yellow-400 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Type de business non configuré</span>
                      </div>
                      <p className="text-yellow-300 text-sm">
                        Configurez le type de votre business pour obtenir des conseils personnalisés.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30"
                        onClick={() => window.open('/app/manage/' + window.location.pathname.split('/')[3] + '/configuration', '_blank')}
                      >
                        Configurer maintenant
                      </Button>
                    </div>
                  )}
                </div>

                {/* Configuration principale pour ce métier */}
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl p-8 border border-white/10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Services recommandés */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Services à Créer</h3>
                      </div>
                      <div className="space-y-3">
                        {businessConfig.services.map((service, i) => (
                          <div key={i} className="bg-white/10 rounded-xl p-3 border border-white/10">
                            <div className="text-white font-medium">{service}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Équipe recommandée */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">Équipe Type</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {businessConfig.employees.map((emp, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 justify-center py-2">
                            {emp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ressources recommandées */}
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Wrench className="h-5 w-5 text-orange-400" />
                      <h3 className="text-lg font-bold text-white">Ressources & Équipements</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {businessConfig.equipment.map((eq, i) => (
                        <Badge key={i} variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30 justify-center py-2">
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conseils spécifiques au métier */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-yellow-400" />
                    Conseils Spécialisés {businessConfig.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {businessConfig.specificTips.map((tip, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        </div>
                        <p className="text-gray-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Services ↔ Produits */}
            {activeSection === 'linking' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🔗</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Liaison Services ↔ Produits</h2>
                  <p className="text-gray-300">Optimisez vos coûts et votre facturation</p>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    Cas d'Usage Recommandés
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">💇‍♀️</div>
                        <div>
                          <h4 className="font-bold text-white">Salon de Coiffure</h4>
                          <p className="text-gray-400 text-sm">Liaison produits-services pour calcul précis</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                          <div className="font-medium text-blue-300 mb-2">Service "Coloration"</div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between text-gray-300">
                              <span>Base service</span>
                              <span>45,00€</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                          <div className="font-medium text-green-300 mb-2">Produits Liés</div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between text-gray-300">
                              <span>Teinture blonde</span>
                              <span>8,50€</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                              <span>Shampoing premium</span>
                              <span>3,00€</span>
                            </div>
                            <div className="border-t border-gray-600 pt-1 mt-2">
                              <div className="flex justify-between text-white font-medium">
                                <span>Total</span>
                                <span>56,50€</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Avantages de la Liaison
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4">
                          <Euro className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <div className="font-medium text-white">Facturation Précise</div>
                          <div className="text-sm text-gray-400 mt-1">Coût réel service + produits</div>
                        </div>
                        <div className="text-center p-4">
                          <Settings className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <div className="font-medium text-white">Gestion Stock</div>
                          <div className="text-sm text-gray-400 mt-1">Déduction automatique</div>
                        </div>
                        <div className="text-center p-4">
                          <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                          <div className="font-medium text-white">Rentabilité</div>
                          <div className="text-sm text-gray-400 mt-1">Suivi coûts par service</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employés */}
            {activeSection === 'employees' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">👥</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Gestion Intelligente des Employés</h2>
                  <p className="text-gray-300">Optimisez les compétences et la planification</p>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Configuration Employé</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-4">Profil Complet</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                          <Users className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="font-medium text-white">Marie Dupont</div>
                            <div className="text-sm text-gray-400">Coiffeuse Senior</div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white/5 rounded-xl">
                          <div className="font-medium text-purple-300 mb-2">Spécialités</div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className="bg-purple-500/20 text-purple-300">Coupe</Badge>
                            <Badge className="bg-purple-500/20 text-purple-300">Coloration</Badge>
                            <Badge className="bg-purple-500/20 text-purple-300">Brushing</Badge>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white/5 rounded-xl">
                          <div className="font-medium text-green-300 mb-2">Disponibilité</div>
                          <div className="text-sm text-gray-300">Lun-Ven : 9h-18h</div>
                          <div className="text-sm text-gray-300">Samedi : 9h-16h</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-4">Impact Réservations</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="font-medium text-green-300">Assignation Automatique</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            Service "Coloration" → Employés qualifiés uniquement
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-blue-400" />
                            <span className="font-medium text-blue-300">Planning Optimisé</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            Créneaux libres calculés automatiquement
                          </div>
                        </div>
                        
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Euro className="h-5 w-5 text-purple-400" />
                            <span className="font-medium text-purple-300">Coût par Service</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            Calcul rentabilité selon tarif employé
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Équipements */}
            {activeSection === 'equipment' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🛠️</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Gestion Intelligente des Équipements</h2>
                  <p className="text-gray-300">Optimisez l'utilisation et le partage</p>
                </div>

                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl p-8 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Individuels
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                          <div className="font-medium text-green-300">Fauteuil #1</div>
                          <div className="text-sm text-gray-400">Usage exclusif</div>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                          <div className="font-medium text-green-300">Cabine UV #2</div>
                          <div className="text-sm text-gray-400">Réservation bloquante</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        Partagés
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                          <div className="font-medium text-orange-300">Stérilisateur</div>
                          <div className="text-sm text-gray-400">Planning partagé</div>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                          <div className="font-medium text-orange-300">Lave-tête</div>
                          <div className="text-sm text-gray-400">Rotation clients</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Consommables
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <div className="font-medium text-blue-300">Serviettes</div>
                          <div className="text-sm text-gray-400">Stock suivi</div>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <div className="font-medium text-blue-300">Gants</div>
                          <div className="text-sm text-gray-400">Décompte auto</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-white/5 rounded-2xl">
                    <h4 className="font-bold text-white mb-4">Planning Équipement Partagé</h4>
                    <div className="bg-black/20 rounded-xl p-4">
                      <div className="font-medium text-yellow-300 mb-3">Table de Massage - Mardi 15 Nov</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 bg-green-500/20 rounded">
                          <span className="text-green-300">9h-10h30</span>
                          <span className="text-white">Massage Marie (Client A)</span>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-500/20 rounded">
                          <span className="text-blue-300">11h-12h30</span>
                          <span className="text-white">Massage Paul (Client B)</span>
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-500/20 rounded">
                          <span className="text-gray-300">14h-15h30</span>
                          <span className="text-gray-300">LIBRE</span>
                          <div className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Réservations */}
            {activeSection === 'reservations' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">📅</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Réservations Intelligentes</h2>
                  <p className="text-gray-300">Automatisation complète du processus</p>
                </div>

                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-3xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Processus Automatique</h3>
                  
                  <div className="space-y-6">
                    {[
                      {
                        step: '1',
                        title: 'Client Choisit',
                        content: 'Service "Soin visage 1H + Manucure 30min"',
                        color: 'from-blue-500 to-blue-600',
                        icon: Target
                      },
                      {
                        step: '2',
                        title: 'Système Calcule',
                        content: 'Durée : 1H30 • Ressources : Esthéticienne + Cabine • Prix : 90€',
                        color: 'from-green-500 to-green-600',
                        icon: Settings
                      },
                      {
                        step: '3',
                        title: 'Vérification',
                        content: 'Marie libre 14h-15h30 ✓ • Cabine #2 disponible ✓ • Produits en stock ✓',
                        color: 'from-purple-500 to-purple-600',
                        icon: CheckCircle
                      },
                      {
                        step: '4',
                        title: 'Réservation Confirmée',
                        content: 'Bloc automatique : Marie + Cabine #2 • Stock réservé',
                        color: 'from-pink-500 to-pink-600',
                        icon: Calendar
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-2xl font-bold text-white">{item.step}</span>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <item.icon className="h-5 w-5 text-white" />
                            <h4 className="font-bold text-white">{item.title}</h4>
                          </div>
                          <p className="text-gray-300">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <h4 className="font-bold text-red-300 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Gestion des Conflits
                    </h4>
                    <div className="text-gray-300">
                      Si équipement occupé → Le système propose automatiquement :
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Autre créneau disponible</li>
                        <li>Autre employé qualifié</li>
                        <li>Équipement alternatif compatible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload IA */}
            {activeSection === 'ai-upload' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🤖</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upload IA - Mode d'Emploi</h2>
                  <p className="text-gray-300">Créez vos services automatiquement depuis un document</p>
                </div>

                <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-3xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Structure Idéale</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-green-300 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Document Recommandé
                      </h4>
                      
                      <div className="bg-black/20 rounded-xl p-4 font-mono text-sm">
                        <div className="text-yellow-300 font-bold mb-2">COIFFURE FEMME</div>
                        <div className="text-gray-300 space-y-1">
                          <div>Coupe + Brushing 1H           45€</div>
                          <div>Coloration complète 2H30      85€</div>
                          <div>Mèches + Coupe 2H             75€</div>
                        </div>
                        
                        <div className="text-yellow-300 font-bold mb-2 mt-4">SOINS ESTHÉTIQUE</div>
                        <div className="text-gray-300 space-y-1">
                          <div>Soin visage hydratant 1H      65€</div>
                          <div>Épilation sourcils 20min      15€</div>
                          <div>Manucure complète 45min       35€</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Résultat IA
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                          <div className="font-medium text-green-300">✅ 6 services créés</div>
                          <div className="text-sm text-gray-400">Avec durées et prix exacts</div>
                        </div>
                        
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <div className="font-medium text-blue-300">✅ 2 catégories organisées</div>
                          <div className="text-sm text-gray-400">Coiffure & Esthétique</div>
                        </div>
                        
                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <div className="font-medium text-purple-300">✅ Employés suggérés</div>
                          <div className="text-sm text-gray-400">Coiffeuse, Esthéticienne</div>
                        </div>
                        
                        <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                          <div className="font-medium text-orange-300">✅ Équipements recommandés</div>
                          <div className="text-sm text-gray-400">Fauteuil, Bac, Cabine</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={() => {
                        onClose();
                        onOpenUpload?.();
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Bot className="h-6 w-6 mr-3" />
                      Essayer l'Upload IA
                      <ArrowRight className="h-6 w-6 ml-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="border-t border-white/10 pt-6 flex justify-between items-center">
          <div className="text-gray-400 text-sm">
            💡 Conseil : Commencez par configurer vos employés et équipements pour optimiser les réservations
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Fermer
            </Button>
            <Button 
              onClick={() => {
                onClose();
                onOpenUpload?.();
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Bot className="h-4 w-4 mr-2" />
              Upload IA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}