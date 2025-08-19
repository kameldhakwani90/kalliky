'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Home, MapPin, Globe } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/landing/Navigation';
import { FooterSection } from '@/components/landing/FooterSection';
import { VideoSection } from '@/components/landing/VideoSection';

export default function LocationPage() {
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
      emoji: "🏠",
      title: "Visites Automatiques",
      description: "Votre IA programme les visites, donne les infos du bien et confirme la présence",
      details: [
        "Infos détaillées du bien en temps réel",
        "Créneaux de visite disponibles",
        "Confirmation par SMS/Email",
        "Questions fréquentes automatiques"
      ]
    },
    {
      emoji: "🌍",
      title: "Multilingue International", 
      description: "Clients étrangers, expatriés, investisseurs... L'IA parle leur langue",
      details: [
        "Français, Anglais, Espagnol, Italien",
        "Détection automatique de la langue",
        "Vocabulaire immobilier spécialisé",
        "Clients internationaux 24h/24"
      ]
    },
    {
      emoji: "📋",
      title: "Pré-qualification Automatique",
      description: "L'IA qualifie vos prospects : budget, critères, urgence, financement",
      details: [
        "Budget et critères de recherche",
        "Situation financière générale",
        "Urgence et timing déménagement", 
        "Fiche prospect complète générée"
      ]
    },
    {
      emoji: "🔄",
      title: "Suivi Prospects Avancé",
      description: "Relance automatique, rappels, nouvelles opportunités selon profil client",
      details: [
        "Relance prospects non convertis",
        "Alertes biens correspondants",
        "Suivi pipeline automatique",
        "Score de conversion IA"
      ]
    }
  ];

  const comparison = {
    traditional: [
      { point: "Assistant(e) immobilier", cost: "1200€/mois" },
      { point: "Appels ratés weekend/soir", cost: "40% prospects perdus" },
      { point: "Qualification manuelle", cost: "2h/prospect" },
      { point: "Suivi prospects Excel", cost: "Oublis fréquents" }
    ],
    orderspot: [
      { point: "OrderSpot IA 24h/24", cost: "329€/mois" },
      { point: "Zéro appel raté", cost: "+80% prospects" },
      { point: "Pré-qualification auto", cost: "5 min/prospect" },
      { point: "CRM intelligent intégré", cost: "Zéro oubli" }
    ]
  };

  const testimonials = [
    {
      name: "Laurent, Agence Premium",
      location: "Nice",
      quote: "Mes clients anglais appellent la nuit pour visiter. L'IA gère tout en anglais parfait !",
      revenue: "De 15 ventes/mois à 28 ventes/mois",
      savings: "Plus d'assistante = 871€ économisés/mois"
    },
    {
      name: "Amélie, Century 21", 
      location: "Paris",
      quote: "L'IA pré-qualifie mes prospects. Je ne perds plus de temps avec des visiteurs non sérieux !",
      revenue: "Taux de conversion : +65%",
      savings: "Gain de temps : 15h/semaine"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-6 py-3 text-sm font-medium rounded-full">
                🏠 Spécial Agences Immobilières
              </Badge>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              Votre Agence
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                Ne Rate Plus Jamais
              </span>
              <br />
              Un Prospect
            </motion.h1>

            <motion.p variants={itemVariants} className="text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              L'IA qui programme vos visites 24h/24, pré-qualifie vos prospects automatiquement
              et parle toutes les langues pour vos clients internationaux.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="text-xl px-16 py-8 bg-blue-500 text-white hover:bg-blue-600 group font-bold rounded-full">
                  🏡 15 Jours Gratuits
                  <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-xl px-16 py-8 text-white hover:bg-white/10 border border-white/20 rounded-full">
                📞 Voir une Démo Live
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">+80%</div>
                <div className="text-gray-400">Prospects captés</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">5min</div>
                <div className="text-gray-400">Pré-qualification</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">4</div>
                <div className="text-gray-400">Langues parlées</div>
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
                <span className="bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                  Pour Votre Agence
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-500"
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

      {/* Before/After Comparison */}
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
                Méthode Traditionnelle
                <br />
                <span className="text-red-400">vs</span>
                <br />
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  OrderSpot IA
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Traditional */}
              <motion.div variants={itemVariants} className="backdrop-blur-md bg-red-500/10 rounded-3xl border border-red-500/20 p-8">
                <h3 className="text-3xl font-bold text-red-400 mb-8 text-center">📞 MÉTHODE CLASSIQUE</h3>
                <div className="space-y-6">
                  {comparison.traditional.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-300">{item.point}</span>
                      <span className="text-red-400 font-semibold">{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center p-4 bg-red-500/20 rounded-xl">
                  <p className="text-red-400 font-bold text-xl">Coût : 1200€/mois + prospects perdus</p>
                </div>
              </motion.div>

              {/* OrderSpot */}
              <motion.div variants={itemVariants} className="backdrop-blur-md bg-green-500/10 rounded-3xl border border-green-500/20 p-8">
                <h3 className="text-3xl font-bold text-green-400 mb-8 text-center">🤖 ORDERSPOT IA</h3>
                <div className="space-y-6">
                  {comparison.orderspot.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-300">{item.point}</span>
                      <span className="text-green-400 font-semibold">{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center p-4 bg-green-500/20 rounded-xl">
                  <p className="text-green-400 font-bold text-xl">Coût : 329€/mois + 80% prospects en plus !</p>
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="text-center mt-12">
              <div className="backdrop-blur-md bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl border border-green-500/30 p-6">
                <p className="text-3xl font-bold text-white">
                  💰 Économisez 871€/mois et captez 80% de prospects en plus !
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
                <span className="bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                  Agents Immobiliers
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
                    <div className="bg-blue-500/20 rounded-xl p-4">
                      <p className="text-blue-400 font-semibold">💰 Économies</p>
                      <p className="text-white font-bold">{testimonial.savings}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
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
              <div className="backdrop-blur-md bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-3xl border border-blue-500/30 p-16">
                <h2 className="text-6xl md:text-7xl font-black text-white mb-4">
                  15 JOURS
                </h2>
                <h3 className="text-4xl font-bold text-blue-400 mb-6">
                  GRATUIT
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  <span className="font-semibold">10 appels offerts</span> • <span className="font-semibold">3 minutes max par appel</span>
                  <br />
                  Testez sans risque avec vos vrais prospects immobiliers !
                </p>
                
                <Link href="/signup">
                  <Button size="lg" className="text-2xl px-20 py-10 bg-blue-500 text-white hover:bg-blue-600 group font-bold rounded-full shadow-2xl">
                    🏡 Démarrer Mon Agence IA
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