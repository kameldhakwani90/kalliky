'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, Zap, Calculator } from 'lucide-react';

export function ExamplesSection() {
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

  const examples = [
    {
      emoji: "🍕",
      backgroundImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&q=50&fm=webp",
      title: "Pizzeria Mario",
      subtitle: "Restaurant traditionnel",
      problem: "Perdait 40% des appels aux heures de pointe",
      solution: [
        "IA prend toutes les commandes automatiquement",
        "Propose vente additionnelle : \"Une boisson avec ça ?\"",
        "Intégration directe avec système de caisse"
      ],
      results: {
        before: "80 commandes/jour",
        after: "140 commandes/jour",
        increase: "+75%"
      },
      cost: "Uber Eats : 35% commission = 10€ sur 30€",
      ourCost: "OrderSpot : 0% commission",
      savings: "10€ économisés par commande !"
    },
    {
      emoji: "💇‍♀️",
      backgroundImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&q=50&fm=webp",
      title: "Salon Beauté Zen",
      subtitle: "Salon de coiffure et beauté",
      problem: "Réceptionniste absente, clients perdus",
      solution: [
        "Prise de RDV 24h/24 avec confirmation",
        "Rappels automatiques avant RDV",
        "Propose services complémentaires"
      ],
      results: {
        before: "60 RDV/semaine",
        after: "95 RDV/semaine", 
        increase: "+58%"
      },
      cost: "Secrétaire à temps partiel : 800€/mois",
      ourCost: "OrderSpot : 129€/mois",
      savings: "671€ économisés chaque mois !"
    },
    {
      emoji: "🏠",
      backgroundImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop&q=50&fm=webp",
      title: "Location Vacances Pro",
      subtitle: "Airbnb & maisons d'hôtes",
      problem: "Appels internationaux ratés, barrière langue",
      solution: [
        "IA multilingue (FR/EN/ES/IT)",
        "Gère réservations et questions 24h/24",
        "Envoie confirmations automatiques"
      ],
      results: {
        before: "20 réservations/mois",
        after: "38 réservations/mois",
        increase: "+90%"
      },
      cost: "Booking.com : 15% commission = 75€ sur 500€ séjour",
      ourCost: "OrderSpot : 1€ par réservation",
      savings: "74€ économisés par réservation !"
    }
  ];

  return (
    <section className="relative py-32 bg-gradient-to-b from-black to-gray-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8">
              <TrendingUp className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Exemples Réels</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Comment Nos Clients
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Boostent Leurs Ventes
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Des résultats concrets chez nos clients. Payez moins cher que vos concurrents 
              et gagnez plus avec notre IA qui ne dort jamais.
            </p>
          </motion.div>

          {/* Examples Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {examples.map((example, index) => (
              <motion.div
                key={example.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative"
              >
                <div className="h-full relative rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img 
                      src={example.backgroundImage} 
                      alt={example.title}
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
                  </div>
                  
                  <div className="relative z-10 p-8 backdrop-blur-sm bg-black/30">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="text-6xl mb-4">{example.emoji}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">{example.title}</h3>
                      <p className="text-gray-400">{example.subtitle}</p>
                    </div>

                    {/* Problem */}
                    <div className="mb-6">
                      <h4 className="text-red-500 font-semibold mb-2">❌ Avant :</h4>
                      <p className="text-gray-300 text-sm">{example.problem}</p>
                    </div>

                    {/* Solution */}
                    <div className="mb-6">
                      <h4 className="text-purple-400 font-semibold mb-3">✅ Avec OrderSpot :</h4>
                      <ul className="space-y-2">
                        {example.solution.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle2 className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Results Box */}
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">{example.results.increase}</div>
                        <div className="text-xs text-gray-400 mt-1">croissance ventes</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                        <div>
                          <div className="text-xs text-gray-500">Avant</div>
                          <div className="text-sm font-semibold text-gray-300">{example.results.before}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Après</div>
                          <div className="text-sm font-semibold text-white">{example.results.after}</div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Comparison */}
                    <div className="space-y-3">
                      <div className="text-sm">
                        <div className="text-gray-500">Concurrent :</div>
                        <div className="text-red-400 font-medium">{example.cost}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">OrderSpot :</div>
                        <div className="text-purple-400 font-medium">{example.ourCost}</div>
                      </div>
                      <div className="text-center pt-3 border-t border-white/10">
                        <div className="text-purple-400 font-bold">💰 {example.savings}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trial Section */}
          <motion.div 
            variants={itemVariants}
            className="max-w-4xl mx-auto"
          >
            <div className="backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl p-12 border border-white/20 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Essayez Sans Risque
              </h3>
              <p className="text-xl text-gray-300 mb-8">
                15 jours gratuits • 10 appels inclus • 3 minutes max par appel
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Démarrer l'essai gratuit →
                </button>
                <button className="px-8 py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all duration-300">
                  Voir une démo
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}