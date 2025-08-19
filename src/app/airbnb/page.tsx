'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Home, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/landing/Navigation';
import { FooterSection } from '@/components/landing/FooterSection';
import { VideoSection } from '@/components/landing/VideoSection';

export default function AirbnbPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      emoji: "🌍",
      title: "Réservations Internationales 24h/24",
      description: "Clients du monde entier, fuseaux horaires différents. L'IA ne dort jamais !",
      details: [
        "Français, Anglais, Espagnol, Italien, Allemand",
        "Fonctionne 24h/24 tous fuseaux horaires", 
        "Clients USA, Europe, Asie...",
        "Confirmation instantanée"
      ]
    },
    {
      emoji: "📅",
      title: "Gestion Calendrier Intelligent",
      description: "Synchronisation temps réel avec Airbnb, Booking.com et vos autres plateformes",
      details: [
        "Sync Airbnb, Booking, Expedia...",
        "Évite les double-réservations",
        "Prix dynamiques par saison",
        "Disponibilités temps réel"
      ]
    },
    {
      emoji: "ℹ️",
      title: "Informations Automatiques",
      description: "Check-in, WiFi, recommandations locales... L'IA répond à tout automatiquement",
      details: [
        "Infos check-in/check-out",
        "Codes WiFi et accès", 
        "Restaurants et activités locales",
        "Transports et directions"
      ]
    },
    {
      emoji: "💬",
      title: "Support Client Avancé",
      description: "Gestion réclamations, demandes spéciales, urgences... Même la nuit !",
      details: [
        "Urgences techniques (chauffage, eau...)",
        "Demandes produits manquants",
        "Questions pendant le séjour",
        "Gestion avis et retours"
      ]
    }
  ];

  const comparison = {
    platforms: [
      { name: "Airbnb", commission: "14-16%", availability: "Limité", cost: "80€ sur 500€" },
      { name: "Booking.com", commission: "15%", availability: "Limité", cost: "75€ sur 500€" },
      { name: "Expedia", commission: "18%", availability: "Limité", cost: "90€ sur 500€" }
    ],
    orderspot: {
      name: "OrderSpot Direct",
      commission: "1€ par réservation (Pro)",
      availability: "24h/24 toutes langues",
      cost: "1€ sur 500€ !"
    }
  };

  const testimonials = [
    {
      name: "Pierre, Villa Côte d'Azur",
      location: "Cannes",
      quote: "Mes clients américains réservent la nuit grâce au décalage horaire. Du chiffre en dormant !",
      revenue: "De 12 réservations/mois à 23 réservations/mois",
      savings: "Économie commissions : 1800€/mois vs Booking"
    },
    {
      name: "Isabella, Maison d'Hôtes", 
      location: "Provence",
      quote: "L'IA répond aux questions en italien parfait. Mes clients se sentent comme chez eux !",
      revenue: "Taux occupation : +45%",
      savings: "Plus de gestion nocturne"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 text-sm font-medium rounded-full">
                🏨 Spécial Airbnb & Maisons d'Hôtes
              </Badge>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              Vos Clients du Monde
              <br />
              <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                Réservent 24h/24
              </span>
              <br />
              Dans Leur Langue
            </motion.h1>

            <motion.p variants={itemVariants} className="text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              L'IA qui gère vos réservations internationales 24h/24, répond dans 5 langues
              et coûte 74x moins cher que les commissions Booking.com !
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="text-xl px-16 py-8 bg-yellow-500 text-black hover:bg-yellow-600 group font-bold rounded-full">
                  🌍 15 Jours Gratuits
                  <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-xl px-16 py-8 text-white hover:bg-white/10 border border-white/20 rounded-full">
                📞 Voir une Démo Live
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">5</div>
                <div className="text-gray-400">Langues parlées</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">+90%</div>
                <div className="text-gray-400">Réservations</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">74€</div>
                <div className="text-gray-400">Économisés/résa</div>
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
                Pourquoi OrderSpot
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Révolutionne Airbnb
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8 hover:border-yellow-500/30 transition-all duration-500"
                >
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{feature.emoji}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                  
                  <ul className="space-y-3">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
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

      {/* Commission Comparison */}
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
                Pourquoi Payer 15% de Commission
                <br />
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  Quand Vous Pouvez Payer 1€ ?
                </span>
              </h2>
            </motion.div>

            <motion.div variants={itemVariants} className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-6 text-white font-semibold">Plateforme</th>
                      <th className="text-left p-6 text-white font-semibold">Commission</th>
                      <th className="text-left p-6 text-white font-semibold">Disponibilité</th>
                      <th className="text-left p-6 text-white font-semibold">Coût sur séjour 500€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.platforms.map((platform, index) => (
                      <tr key={platform.name} className="border-b border-white/5">
                        <td className="p-6 text-gray-300">{platform.name}</td>
                        <td className="p-6 text-red-400 font-semibold">{platform.commission}</td>
                        <td className="p-6 text-gray-300">{platform.availability}</td>
                        <td className="p-6 text-red-400 font-semibold">{platform.cost}</td>
                      </tr>
                    ))}
                    <tr className="bg-green-500/20 border border-green-500/30">
                      <td className="p-6 text-white font-bold">{comparison.orderspot.name}</td>
                      <td className="p-6 text-green-400 font-bold">{comparison.orderspot.commission}</td>
                      <td className="p-6 text-green-400 font-bold">{comparison.orderspot.availability}</td>
                      <td className="p-6 text-green-400 font-bold">{comparison.orderspot.cost}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-green-500/10 text-center">
                <p className="text-2xl font-bold text-green-400">
                  💰 Économisez jusqu'à 89€ sur chaque séjour de 500€ !
                </p>
                <p className="text-gray-300 mt-2">
                  Sur 10 réservations/mois = 890€ d'économies mensuelles !
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl font-bold text-white mb-8">
                Témoignages
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Hôtes Airbnb
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8"
                >
                  <div className="mb-6">
                    <div className="text-5xl mb-4">⭐⭐⭐⭐⭐</div>
                    <blockquote className="text-xl text-gray-300 mb-4 italic">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-500/20 rounded-xl p-4">
                      <p className="text-green-400 font-semibold">📈 Résultat</p>
                      <p className="text-white font-bold">{testimonial.revenue}</p>
                    </div>
                    <div className="bg-yellow-500/20 rounded-xl p-4">
                      <p className="text-yellow-400 font-semibold">💰 Économies</p>
                      <p className="text-white font-bold">{testimonial.savings}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{testimonial.name}</p>
                      <p className="text-gray-400 text-sm">{testimonial.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
              <div className="backdrop-blur-md bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-3xl border border-yellow-500/30 p-16">
                <h2 className="text-6xl md:text-7xl font-black text-white mb-4">
                  15 JOURS
                </h2>
                <h3 className="text-4xl font-bold text-yellow-400 mb-6">
                  GRATUIT
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  <span className="font-semibold">10 appels offerts</span> • <span className="font-semibold">3 minutes max par appel</span>
                  <br />
                  Testez avec vos vrais clients internationaux !
                </p>
                
                <Link href="/signup">
                  <Button size="lg" className="text-2xl px-20 py-10 bg-yellow-500 text-black hover:bg-yellow-600 group font-bold rounded-full shadow-2xl">
                    🏨 Démarrer Mon Airbnb IA
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