'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Phone, TrendingUp, Clock, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/landing/Navigation';
import { FooterSection } from '@/components/landing/FooterSection';
import { VideoSection } from '@/components/landing/VideoSection';

export default function RestaurantPage() {
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

  const features = [
    {
      emoji: "📞",
      title: "Prise de Commande Automatique",
      description: "Votre IA prend toutes les commandes, même aux heures de pointe. Fini les appels ratés !",
      details: [
        "Comprend tous vos plats et prix",
        "Gère les modifications et allergies", 
        "Confirme l'adresse de livraison",
        "Propose créneaux de livraison disponibles"
      ]
    },
    {
      emoji: "💰",
      title: "Vente Additionnelle Intelligente",
      description: "+25% de panier moyen grâce aux suggestions automatiques de votre IA",
      details: [
        "\"Une boisson avec votre pizza ?\"",
        "\"Nos desserts du jour sont délicieux\"",
        "Propose les menus complets automatiquement",
        "Suggest les accompagnements populaires"
      ]
    },
    {
      emoji: "🌙",
      title: "24h/24 Même Fermé",
      description: "Vos clients peuvent commander pour le lendemain, même restaurant fermé",
      details: [
        "Pré-commandes pour le lendemain",
        "Informe des horaires d'ouverture",
        "Prend les réservations de tables",
        "Collecte les demandes spéciales"
      ]
    },
    {
      emoji: "🗣️",
      title: "Multilingue",
      description: "Servez vos clients en français, anglais, arabe selon votre quartier",
      details: [
        "Détecte la langue automatiquement",
        "Traduit votre menu en temps réel",
        "Accent naturel par langue",
        "Idéal quartiers multiculturels"
      ]
    }
  ];

  const comparison = {
    competitors: [
      { name: "Uber Eats", commission: "30%", setup: "Complexe", control: "❌", cost: "42€ sur 100€" },
      { name: "Deliveroo", commission: "30%", setup: "Complexe", control: "❌", cost: "45€ sur 100€" },
      { name: "Just Eat", commission: "14%", setup: "Moyen", control: "❌", cost: "20€ sur 100€" }
    ],
    orderspot: {
      name: "OrderSpot",
      commission: "10% (Starter) / 1€ par commande (Pro)",
      setup: "5 minutes",
      control: "✅ Total",
      cost: "10€ sur 100€ (Starter)"
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="bg-orange-500/20 border border-orange-500/30 text-orange-400 px-6 py-3 text-sm font-medium rounded-full">
                🍕 Spécial Restaurants
              </Badge>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              Votre Restaurant
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Ne Rate Plus Jamais
              </span>
              <br />
              Un Appel
            </motion.h1>

            <motion.p variants={itemVariants} className="text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              L'IA qui prend vos commandes 24h/24, augmente votre panier moyen de 25% 
              et coûte 3x moins cher qu'Uber Eats. Parfait pour restaurants, pizzerias, fast-food.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="text-xl px-16 py-8 bg-orange-500 text-white hover:bg-orange-600 group font-bold rounded-full">
                  🚀 15 Jours Gratuits
                  <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-xl px-16 py-8 text-white hover:bg-white/10 border border-white/20 rounded-full">
                📞 Voir une Démo Live
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <Link href="/help/food">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl px-6 py-3">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Guide Complet Restaurant
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">0</div>
                <div className="text-gray-400">Appels ratés</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">+25%</div>
                <div className="text-gray-400">Panier moyen</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">24h/24</div>
                <div className="text-gray-400">Même fermé</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <VideoSection />

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl font-bold text-white mb-8">
                Comment Ça Marche
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Concrètement
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8 hover:border-orange-500/30 transition-all duration-500"
                >
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{feature.emoji}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                  
                  <ul className="space-y-3">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-32 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl font-bold text-white mb-8">
                Pourquoi Payer 30% à Uber Eats
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                  Quand Vous Pouvez Payer 10% ?
                </span>
              </h2>
            </motion.div>

            <motion.div variants={itemVariants} className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-6 text-white font-semibold">Service</th>
                      <th className="text-left p-6 text-white font-semibold">Commission</th>
                      <th className="text-left p-6 text-white font-semibold">Installation</th>
                      <th className="text-left p-6 text-white font-semibold">Contrôle</th>
                      <th className="text-left p-6 text-white font-semibold">Coût sur 100€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.competitors.map((comp, index) => (
                      <tr key={comp.name} className="border-b border-white/5">
                        <td className="p-6 text-gray-300">{comp.name}</td>
                        <td className="p-6 text-red-400 font-semibold">{comp.commission}</td>
                        <td className="p-6 text-gray-300">{comp.setup}</td>
                        <td className="p-6">{comp.control}</td>
                        <td className="p-6 text-red-400 font-semibold">{comp.cost}</td>
                      </tr>
                    ))}
                    <tr className="bg-purple-500/20 border border-purple-500/30">
                      <td className="p-6 text-white font-bold">{comparison.orderspot.name}</td>
                      <td className="p-6 text-purple-400 font-bold">{comparison.orderspot.commission}</td>
                      <td className="p-6 text-purple-400 font-bold">{comparison.orderspot.setup}</td>
                      <td className="p-6 text-purple-400 font-bold">{comparison.orderspot.control}</td>
                      <td className="p-6 text-purple-400 font-bold">{comparison.orderspot.cost}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-purple-500/10 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  💰 Économisez jusqu'à 32€ sur chaque 100€ de vente !
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-t from-black to-gray-950">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants}>
              <div className="backdrop-blur-md bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl border border-orange-500/30 p-16">
                <h2 className="text-6xl md:text-7xl font-black text-white mb-4">
                  15 JOURS
                </h2>
                <h3 className="text-4xl font-bold text-orange-400 mb-6">
                  GRATUIT
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  <span className="font-semibold">10 appels offerts</span> • <span className="font-semibold">3 minutes max par appel</span>
                  <br />
                  Comme un restaurateur bac-10, vous verrez la différence dès le premier appel !
                </p>
                
                <Link href="/signup">
                  <Button size="lg" className="text-2xl px-20 py-10 bg-orange-500 text-white hover:bg-orange-600 group font-bold rounded-full shadow-2xl">
                    🍕 Démarrer Mon Essai Restaurant
                    <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-400 mt-6">
                  Installation en 5 minutes • Aucune carte bancaire • Support inclus
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}