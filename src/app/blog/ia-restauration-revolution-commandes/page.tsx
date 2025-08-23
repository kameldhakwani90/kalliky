'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, Share2, TrendingUp, Users, CheckCircle, Brain, Phone, Smartphone, Target, BarChart3, Award } from 'lucide-react';
// Layout géré par /blog/layout.tsx
import Head from 'next/head';

export default function BlogArticlePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <>
      <Head>
        <title>L'IA transforme la prise de commandes en restauration - Guide complet 2025</title>
        <meta name="description" content="Découvrez comment l'intelligence artificielle révolutionne les prises de commandes téléphoniques en restauration. Avantages, défis et conseils pratiques pour digitaliser votre restaurant." />
        <meta name="keywords" content="IA restauration, intelligence artificielle restaurant, prise commande automatique, digitalisation restaurant, assistant vocal restaurant, technologie restauration 2025" />
        <meta property="og:title" content="L'IA transforme la prise de commandes en restauration - Guide complet 2025" />
        <meta property="og:description" content="Comment l'intelligence artificielle révolutionne la prise de commandes téléphoniques dans les restaurants. Guide pratique et conseils d'experts." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=630&fit=crop&q=90" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://orderspot.pro/blog/ia-restauration-revolution-commandes" />
      </Head>
      
      <div className="container mx-auto px-6 py-16 max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Navigation */}
            <motion.div variants={itemVariants} className="mb-8">
              <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour au blog
              </Link>
            </motion.div>

            {/* Header de l'article */}
            <motion.header variants={itemVariants} className="mb-12">
              {/* Catégorie */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Brain className="h-4 w-4" />
                Technologie & Innovation
              </div>
              
              {/* Titre */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                L'Intelligence Artificielle Transforme la Prise de Commandes en Restauration
              </h1>
              
              {/* Métadonnées */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Équipe Editorial
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  23 août 2025
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  8 min de lecture
                </div>
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <Share2 className="h-4 w-4" />
                  Partager
                </button>
              </div>
            </motion.header>

            {/* Image principale */}
            <motion.div variants={itemVariants} className="mb-10">
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=450&fit=crop&q=90" 
                alt="Restaurant moderne intégrant l'intelligence artificielle pour les commandes téléphoniques" 
                className="w-full h-96 object-cover rounded-xl shadow-lg"
              />
              <p className="text-sm text-gray-500 text-center mt-2">
                L'IA s'impose comme un outil incontournable dans l'industrie de la restauration moderne
              </p>
            </motion.div>

            {/* Contenu de l'article */}
            <motion.article variants={itemVariants} className="prose prose-lg max-w-none">
              <div className="space-y-8">
                
                {/* Introduction */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    <strong>Le secteur de la restauration traverse une révolution technologique majeure.</strong> 
                    Après des décennies de méthodes traditionnelles, l'intelligence artificielle s'impose 
                    désormais comme un levier de croissance essentiel, particulièrement dans la gestion 
                    des commandes téléphoniques.
                  </p>
                </div>

                {/* Les défis actuels */}
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Les défis de la prise de commandes traditionnelle</h2>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Selon une étude menée par la Fédération Française de l'Hôtellerie-Restauration en 2024, 
                    les restaurants français font face à des défis croissants dans la gestion de leurs commandes téléphoniques.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-red-800 mb-4">
                        📞 Problèmes identifiés
                      </h3>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Interruption constante du service en cuisine</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Erreurs de compréhension et de transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Pics de charge difficiles à gérer</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Formation du personnel chronophage</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        📊 Impact mesurable
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Temps consacré au téléphone</span>
                          <span className="font-bold text-gray-900">2-3h/jour</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Taux d'erreur moyen</span>
                          <span className="font-bold text-gray-900">12-15%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Appels en attente (heures de pointe)</span>
                          <span className="font-bold text-gray-900">20-25%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Les solutions IA */}
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">L'IA comme solution moderne</h2>
                  
                  <div className="mb-8">
                    <img 
                      src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=300&fit=crop&q=90" 
                      alt="Interface d'intelligence artificielle pour la gestion des commandes restaurant" 
                      className="w-full h-64 object-cover rounded-xl shadow-md mb-4"
                    />
                    <p className="text-sm text-gray-500 text-center">
                      Les interfaces IA modernes permettent une gestion intuitive et efficace des commandes
                    </p>
                  </div>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Les assistants vocaux intelligents représentent une évolution naturelle dans l'automatisation 
                    des tâches répétitives. Basés sur des technologies de reconnaissance vocale et de traitement 
                    du langage naturel, ils offrent plusieurs avantages concrets.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-8">
                    <h3 className="text-2xl font-bold text-green-800 mb-6">🚀 Avantages de l'automatisation</h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Disponibilité continue</h4>
                        <p className="text-gray-600 text-sm">Service 24h/24, 7j/7 sans interruption</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Précision accrue</h4>
                        <p className="text-gray-600 text-sm">Réduction significative des erreurs</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Libération des équipes</h4>
                        <p className="text-gray-600 text-sm">Focus sur la qualité culinaire</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Considérations pratiques */}
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Mise en œuvre et considérations</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ Points d'attention</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• <strong>Formation du personnel :</strong> Accompagnement nécessaire lors de la transition</li>
                        <li>• <strong>Personnalisation :</strong> Adaptation aux spécificités de chaque établissement</li>
                        <li>• <strong>Sauvegarde humaine :</strong> Maintien d'une option de basculement manuel</li>
                        <li>• <strong>Évolution continue :</strong> Mise à jour régulière des algorithmes</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">🎯 Facteurs de réussite</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Technique</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Infrastructure réseau stable</li>
                            <li>• Intégration avec le système de caisse</li>
                            <li>• Sauvegarde des données</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Organisationnel</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Adhésion de l'équipe</li>
                            <li>• Processus de fallback définis</li>
                            <li>• Suivi des performances</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Perspectives d'avenir */}
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Vers l'avenir : tendances émergentes</h2>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    L'évolution rapide des technologies d'IA ouvre de nouvelles perspectives pour le secteur 
                    de la restauration. Les développements à venir promettent des fonctionnalités encore 
                    plus avancées.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Analyse prédictive</h4>
                        <p className="text-gray-600 text-sm">Anticipation des pics de commandes basée sur l'historique</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Personnalisation avancée</h4>
                        <p className="text-gray-600 text-sm">Reconnaissance des clients fidèles et suggestions personnalisées</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Intégration omnicanale</h4>
                        <p className="text-gray-600 text-sm">Synchronisation entre téléphone, applications et réseaux sociaux</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Conclusion */}
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Conclusion</h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      L'intelligence artificielle ne remplace pas l'expertise humaine dans la restauration, 
                      mais elle libère les équipes des tâches répétitives pour leur permettre de se concentrer 
                      sur l'essentiel : la qualité culinaire et l'expérience client.
                    </p>
                    
                    <p className="text-gray-700 leading-relaxed">
                      Les restaurateurs qui adoptent ces technologies de manière réfléchie et progressive 
                      prennent une longueur d'avance dans un marché de plus en plus concurrentiel. 
                      L'avenir appartient à ceux qui sauront allier tradition culinaire et innovation technologique.
                    </p>
                  </div>
                </section>

                {/* CTA simple */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Vous envisagez la digitalisation de votre restaurant ?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Découvrez les solutions adaptées à votre établissement et obtenez des conseils personnalisés.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/contact">
                      <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        Demander des informations
                      </button>
                    </Link>
                    <Link href="/plans">
                      <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                        Voir les solutions
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Navigation article suivant */}
            <motion.div variants={itemVariants} className="mt-16 pt-8 border-t border-gray-200">
              <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Retour au blog
              </Link>
            </motion.div>
          </motion.div>
        </div>
    </>
  );
}