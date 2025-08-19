'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { 
  Brain, 
  Phone, 
  Globe, 
  BarChart3, 
  Shield, 
  Zap, 
  Clock, 
  HeadphonesIcon,
  MessageSquare,
  TrendingUp,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export function FeaturesSection() {
  const { language } = useLanguage();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
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
      icon: Brain,
      title: "IA Conversationnelle Avancée",
      description: "Notre IA comprend le contexte et l'intention de vos clients pour des conversations naturelles et efficaces",
      benefits: ["Compréhension naturelle", "Réponses contextuelles", "Apprentissage continu"]
    },
    {
      icon: Phone,
      title: "Intégration Téléphonique",
      description: "Recevez vos appels directement sur votre numéro existant ou obtenez un nouveau numéro dédié",
      benefits: ["Numéro dédié inclus", "Intégration simple", "Qualité HD"]
    },
    {
      icon: Globe,
      title: "Support Multilingue",
      description: "Servez vos clients dans leur langue préférée avec une IA qui parle français, anglais et bien plus",
      benefits: ["15+ langues", "Détection automatique", "Accent naturel"]
    },
    {
      icon: BarChart3,
      title: "Analytics en Temps Réel",
      description: "Suivez les performances, conversions et satisfaction client avec des tableaux de bord détaillés",
      benefits: ["Métriques temps réel", "ROI transparent", "Rapports détaillés"]
    },
    {
      icon: Shield,
      title: "Sécurité & Conformité",
      description: "Protection des données clients avec chiffrement de bout en bout et conformité RGPD",
      benefits: ["Chiffrement AES-256", "RGPD compliant", "Données en Europe"]
    },
    {
      icon: Zap,
      title: "Installation Ultra-Rapide",
      description: "Configurez votre assistant IA en moins de 5 minutes, sans compétences techniques requises",
      benefits: ["Setup 5 minutes", "Zéro code", "Support inclus"]
    }
  ];

  return (
    <section id="features" className="relative py-32 bg-gradient-to-b from-black to-gray-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
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
              <Sparkles className="h-5 w-5 text-white" />
              <span className="text-white font-medium">{language === 'fr' ? 'Fonctionnalités Avancées' : 'Advanced Features'}</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              {language === 'fr' ? 'Technologie de' : 'Next Generation'}
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                {language === 'fr' ? 'Nouvelle Génération' : 'Technology'}
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {language === 'fr' 
                ? 'Découvrez comment notre IA révolutionne la relation client avec des fonctionnalités conçues pour maximiser vos conversions et satisfaire vos clients'
                : 'Discover how our AI revolutionizes customer relationships with features designed to maximize your conversions and satisfy your customers'
              }
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="group"
              >
                <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 p-8 overflow-hidden">
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Icon */}
                  <div className="relative z-10 mb-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors duration-300">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Clock className="h-8 w-8 text-white" />
                <h3 className="text-3xl font-bold text-white">Prêt en 5 Minutes</h3>
              </div>
              
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Pas de configuration compliquée. Connectez votre numéro, 
                personnalisez votre IA et commencez à recevoir des appels.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                  <span className="text-gray-300 font-medium">Créez votre compte</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                  <span className="text-gray-300 font-medium">Configurez votre IA</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                  <span className="text-gray-300 font-medium">Recevez vos appels</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}