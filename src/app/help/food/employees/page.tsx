'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ArrowLeft,
  Shield,
  Clock,
  Star,
  UserPlus,
  Settings,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award
} from 'lucide-react';

const examples = [
  {
    title: "Restaurant Le Gourmet",
    type: "Restaurant gastronomique",
    employees: [
      {
        name: "Marie Dubois",
        role: "Chef de Cuisine",
        permissions: ["Gestion menu", "Supervision équipe", "Validation commandes"],
        schedule: "Mardi-Samedi 14h-23h",
        specialties: ["Cuisine française", "Pâtisserie"]
      },
      {
        name: "Jean Martin",
        role: "Serveur Senior",
        permissions: ["Prise commandes", "Service clientèle", "Gestion caisse"],
        schedule: "Mercredi-Dimanche 18h-24h",
        specialties: ["Vins", "Service premium"]
      },
      {
        name: "Sophie Laurent",
        role: "Commis de Cuisine",
        permissions: ["Préparation ingrédients", "Nettoyage"],
        schedule: "Lundi-Vendredi 10h-18h",
        specialties: ["Préparations froides", "Entrées"]
      }
    ]
  },
  {
    title: "Pizzeria Napoli",
    type: "Restauration rapide",
    employees: [
      {
        name: "Antonio Rossi",
        role: "Pizzaiolo",
        permissions: ["Préparation pizzas", "Gestion four", "Supervision apprentis"],
        schedule: "Tous les jours 11h-22h",
        specialties: ["Pâte traditionnelle", "Pizzas napolitaines"]
      },
      {
        name: "Clara Moreau",
        role: "Responsable Livraisons",
        permissions: ["Coordination livraisons", "Gestion livreurs", "Suivi commandes"],
        schedule: "Mardi-Dimanche 18h-23h",
        specialties: ["Logistique", "Service client"]
      }
    ]
  }
];

const roles = [
  {
    title: "Chef de Cuisine",
    icon: Award,
    color: "from-red-500 to-red-600",
    permissions: [
      "Gestion complète du menu",
      "Supervision de l'équipe cuisine",
      "Validation des commandes spéciales",
      "Gestion des stocks et approvisionnements",
      "Formation du personnel"
    ],
    responsibilities: [
      "Création et mise à jour des recettes",
      "Contrôle qualité des préparations",
      "Gestion des allergènes et régimes spéciaux",
      "Optimisation des coûts matières"
    ]
  },
  {
    title: "Serveur",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    permissions: [
      "Prise de commandes",
      "Service clientèle",
      "Gestion des réservations",
      "Encaissement",
      "Communication cuisine-salle"
    ],
    responsibilities: [
      "Accueil et conseil clientèle",
      "Présentation des plats et suggestions",
      "Gestion des réclamations niveau 1",
      "Mise à jour des disponibilités"
    ]
  },
  {
    title: "Commis",
    icon: UserPlus,
    color: "from-green-500 to-green-600",
    permissions: [
      "Préparation des ingrédients",
      "Assistance en cuisine",
      "Nettoyage et rangement",
      "Réception des livraisons"
    ],
    responsibilities: [
      "Préparations de base",
      "Maintien de la propreté",
      "Contrôle des températures",
      "Support logistique"
    ]
  }
];

const scheduleTemplates = [
  {
    name: "Horaires Restaurant Classique",
    description: "Service midi et soir",
    shifts: [
      { time: "10h00-15h00", role: "Service midi", staff: "2 serveurs + 1 chef" },
      { time: "18h00-23h00", role: "Service soir", staff: "3 serveurs + 1 chef + 1 commis" },
      { time: "14h00-16h00", role: "Pause/Préparation", staff: "1 commis" }
    ]
  },
  {
    name: "Horaires Restauration Rapide",
    description: "Service continu",
    shifts: [
      { time: "11h00-14h00", role: "Rush midi", staff: "2 cuisiniers + 1 caissier" },
      { time: "14h00-18h00", role: "Après-midi", staff: "1 cuisinier + 1 caissier" },
      { time: "18h00-22h00", role: "Rush soir", staff: "2 cuisiniers + 2 caissiers" }
    ]
  }
];

export default function EmployeesHelpPage() {
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
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Gestion des Employés</h1>
                  <p className="text-gray-300">Organisation et configuration de votre équipe restaurant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          
          {/* Rôles et Permissions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Rôles et Permissions</h2>
            <div className="grid lg:grid-cols-3 gap-8">
              {roles.map((role, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 bg-gradient-to-br ${role.color} rounded-2xl shadow-lg`}>
                      <role.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{role.title}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Permissions
                      </h4>
                      <div className="space-y-2">
                        {role.permissions.map((perm, permIdx) => (
                          <div key={permIdx} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-gray-300 text-sm">{perm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Responsabilités
                      </h4>
                      <div className="space-y-2">
                        {role.responsibilities.map((resp, respIdx) => (
                          <div key={respIdx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2" />
                            <span className="text-gray-400 text-sm">{resp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exemples Concrets */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Exemples d'Organisation d'Équipe</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {examples.map((example, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{example.title}</h3>
                    <p className="text-gray-400">{example.type}</p>
                  </div>
                  
                  <div className="space-y-6">
                    {example.employees.map((employee, empIdx) => (
                      <div key={empIdx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">{employee.name}</h4>
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                            {employee.role}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Horaires
                            </p>
                            <p className="text-gray-300">{employee.schedule}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-400 mb-2 flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              Spécialités
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {employee.specialties.map((spec, specIdx) => (
                                <span key={specIdx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-gray-400 mb-2 text-sm">Permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {employee.permissions.map((perm, permIdx) => (
                              <span key={permIdx} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates d'Horaires */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Templates d'Horaires</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {scheduleTemplates.map((template, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="h-6 w-6 text-blue-400" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                      <p className="text-gray-400">{template.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {template.shifts.map((shift, shiftIdx) => (
                      <div key={shiftIdx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-orange-300">{shift.time}</span>
                          <span className="text-gray-400 text-sm">{shift.role}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{shift.staff}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonnes Pratiques */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Bonnes Pratiques</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  À Faire
                </h3>
                <div className="space-y-3">
                  {[
                    "Définir clairement les rôles et responsabilités",
                    "Mettre en place des formations régulières",
                    "Utiliser des codes couleur pour les permissions",
                    "Planifier les horaires à l'avance",
                    "Créer des binômes pour la polyvalence",
                    "Suivre les performances individuelles",
                    "Organiser des réunions d'équipe hebdomadaires"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  À Éviter
                </h3>
                <div className="space-y-3">
                  {[
                    "Donner trop de permissions à un débutant",
                    "Ne pas documenter les procédures",
                    "Ignorer les retours du personnel",
                    "Planifier des horaires trop serrés",
                    "Négliger la formation continue",
                    "Ne pas avoir de remplaçants formés",
                    "Oublier de mettre à jour les permissions"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}