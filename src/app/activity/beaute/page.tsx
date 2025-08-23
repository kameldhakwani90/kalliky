'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Clock, Calendar, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/landing/Navigation';
import { FooterSection } from '@/components/landing/FooterSection';
import { VideoSection } from '@/components/landing/VideoSection';

export default function BeautePage() {
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
      emoji: "📅",
      title: "Gestion RDV Automatique", 
      description: "Votre IA gère tous les rendez-vous en temps réel, propose les créneaux libres instantanément",
      details: [
        "Consulte l'agenda en temps réel",
        "Propose créneaux disponibles",
        "Confirme et enregistre le RDV", 
        "Envoie SMS de confirmation"
      ]
    },
    {
      emoji: "💆‍♀️",
      title: "Vente Soins Complémentaires",
      description: "+40% de CA grâce aux suggestions automatiques de soins et produits",
      details: [
        "\"Un soin visage avec votre coupe ?\"",
        "Propose manucure avec pédicure",
        "Suggère produits de soin à domicile",
        "Packages fidélité automatiques"
      ]
    },
    {
      emoji: "🌙", 
      title: "24h/24 Même Fermé",
      description: "Vos clients prennent RDV la nuit, les week-ends, pendant vos vacances",
      details: [
        "Prise RDV nocturne",
        "Weekend et jours fériés",
        "Pendant vos congés",
        "Rappels automatiques"
      ]
    },
    {
      emoji: "👥",
      title: "Fini la Secrétaire",
      description: "Plus besoin de secrétaire ou d'assistant(e). L'IA gère tout professionnellement",
      details: [
        "Accueil professionnel 24h/24",
        "Gestion annulations/reports",
        "Informations prestations",
        "Suivi clients réguliers"
      ]
    }
  ];

  const comparison = {
    before: [
      { point: "Secrétaire à temps partiel", cost: "800€/mois" },
      { point: "Appels ratés le soir/weekend", cost: "30% clients perdus" },
      { point: "Pas de vente additionnelle", cost: "Manque à gagner" },
      { point: "Gestion manuelle agenda", cost: "Erreurs doublons" }
    ],
    after: [
      { point: "OrderSpot IA 24h/24", cost: "129€/mois" },
      { point: "Zéro appel raté", cost: "+60% RDV" },
      { point: "Vente automatique soins", cost: "+40% panier" },
      { point: "Agenda synchronisé", cost: "Zéro erreur" }
    ]
  };

  const testimonials = [
    {
      name: "Sophie, Salon Zen Beauty",
      location: "Lyon",
      quote: "Avant je ratais tous les appels le soir. Maintenant mes clients prennent RDV jusqu'à 23h !",
      revenue: "De 60 RDV/semaine à 95 RDV/semaine",
      savings: "Plus de secrétaire = 671€ économisés/mois"
    },
    {
      name: "Karim, Barbier Chic", 
      location: "Marseille",
      quote: "L'IA propose automatiquement la barbe avec la coupe. Mon CA a explosé !",
      revenue: "Panier moyen : +18€ par client",
      savings: "Fonctionne même dimanche fermé"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="bg-pink-500/20 border border-pink-500/30 text-pink-400 px-6 py-3 text-sm font-medium rounded-full">
                💇‍♀️ Spécial Salons Beauté
              </Badge>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              Votre Salon Ne Rate
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                Plus Jamais Un RDV
              </span>
              <br />
              Même Fermé
            </motion.h1>

            <motion.p variants={itemVariants} className="text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              L'IA qui gère vos rendez-vous 24h/24, propose automatiquement vos soins complémentaires
              et remplace votre secrétaire pour 5x moins cher.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/plans">
                <Button size="lg" className="text-xl px-16 py-8 bg-pink-500 text-white hover:bg-pink-600 group font-bold rounded-full">
                  💅 Voir nos Plans
                  <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-xl px-16 py-8 text-white hover:bg-white/10 border border-white/20 rounded-full">
                📞 Voir une Démo Live
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <Link href="/help/beaute">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl px-6 py-3">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Guide Complet Beauté & Bien-être
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">24h/24</div>
                <div className="text-gray-400">Prise de RDV</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">+60%</div>
                <div className="text-gray-400">RDV en plus</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">671€</div>
                <div className="text-gray-400">Économisés/mois</div>
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
                <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                  Pour Votre Salon
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8 hover:border-pink-500/30 transition-all duration-500"
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
                Avant vs Après
                <br />
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  OrderSpot
                </span>
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Before */}
              <motion.div variants={itemVariants} className="backdrop-blur-md bg-red-500/10 rounded-3xl border border-red-500/20 p-8">
                <h3 className="text-3xl font-bold text-red-400 mb-8 text-center">❌ AVANT</h3>
                <div className="space-y-6">
                  {comparison.before.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-300">{item.point}</span>
                      <span className="text-red-400 font-semibold">{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center p-4 bg-red-500/20 rounded-xl">
                  <p className="text-red-400 font-bold text-xl">Coût total : 800€/mois + clients perdus</p>
                </div>
              </motion.div>

              {/* After */}
              <motion.div variants={itemVariants} className="backdrop-blur-md bg-green-500/10 rounded-3xl border border-green-500/20 p-8">
                <h3 className="text-3xl font-bold text-green-400 mb-8 text-center">✅ APRÈS</h3>
                <div className="space-y-6">
                  {comparison.after.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-300">{item.point}</span>
                      <span className="text-green-400 font-semibold">{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center p-4 bg-green-500/20 rounded-xl">
                  <p className="text-green-400 font-bold text-xl">Coût total : 129€/mois + 60% RDV en plus !</p>
                </div>
              </motion.div>
            </div>
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
                <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                  Salons Clients
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
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
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
              <div className="backdrop-blur-md bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl border border-pink-500/30 p-16">
                <h2 className="text-6xl md:text-7xl font-black text-white mb-4">
                  15 JOURS
                </h2>
                <h3 className="text-4xl font-bold text-pink-400 mb-6">
                  GRATUIT
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  <span className="font-semibold">10 appels offerts</span> • <span className="font-semibold">3 minutes max par appel</span>
                  <br />
                  Testez sans risque, vos clients adoreront prendre RDV à toute heure !
                </p>
                
                <Link href="/plans">
                  <Button size="lg" className="text-2xl px-20 py-10 bg-pink-500 text-white hover:bg-pink-600 group font-bold rounded-full shadow-2xl">
                    💅 Voir nos Plans Beauté
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