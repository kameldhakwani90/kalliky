'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '129',
    period: '/ mois + 10% commission',
    description: 'Petit restaurant local',
    popular: false,
    features: [
      '🤖 Agent IA basique (GPT-4o-mini)',
      '📞 1 appel simultané + 1 en file',
      '🎙️ 1 voix standard (homme ou femme)',
      '📝 Prise de commande simple',
      '💳 Paiement par lien Stripe',
      '📊 Dashboard basique',
      '📧 Notifications email',
      '📂 Import menu (Excel/Photo)',
      '⚡ Temps de réponse ~1s',
      '🛡️ Détection spam basique'
    ],
    cta: 'Commencer Gratuitement',
    highlight: false
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '329',
    period: '/ mois + 1€ / commande',
    description: 'Restaurants avec volume',
    popular: true,
    features: [
      '✨ Agent IA Premium (OpenAI Realtime)',
      '📞 6 appels simultanés + 10 en file',
      '🎙️ 3 voix au choix (H/F/Neutre)',
      '⚡ Latence ultra-faible (<200ms)',
      '💰 Vente additionnelle (+25% panier)',
      '🌍 Multi-langue (FR/EN/AR)',
      '👤 Mémoire client (préférences)',
      '📊 Analytics complets',
      '📱 SMS + Email notifications',
      '🎯 Scripts IA par produit',
      '⭐ Produits vedettes',
      '🔗 Associations produits',
      '🛡️ Détection spam avancée',
      '⚡ Support prioritaire'
    ],
    cta: 'Essayer Pro',
    highlight: true
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 'Sur devis',
    period: '+ 0.90€ / commande',
    description: 'Chaînes & franchises',
    popular: false,
    features: [
      '👑 Tout du plan Pro +',
      '📞 10 appels simultanés + 15 en file',
      '🎤 Voix clonée (votre voix)',
      '🧪 Tests A/B automatiques',
      '🏷️ White-label complet',
      '🔌 API webhooks custom',
      '📈 Analytics prédictifs IA',
      '🎯 Machine learning personnalisé',
      '🔄 Intégrations CRM/ERP',
      '📊 Dashboard multi-sites',
      '👨‍💼 Account manager dédié',
      '🎓 Formation équipe',
      '📞 Support 24/7',
      '🚀 SLA garanti 99.9%'
    ],
    cta: 'Nous Contacter',
    highlight: false
  }
];

export function PricingSection() {
  const { language } = useLanguage();
  
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

  return (
    <section id="pricing" className="relative py-32 bg-gray-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gray-400/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
              <span className="text-white font-medium">{language === 'fr' ? 'Tarification' : 'Pricing'}</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              {language === 'fr' ? 'Choisissez Votre' : 'Choose Your'}
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                {language === 'fr' ? 'Plan Parfait' : 'Perfect Plan'}
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Des tarifs transparents pour tous les besoins. Commencez gratuitement, 
              évoluez selon votre croissance.
            </p>

            <motion.div variants={itemVariants} className="mt-8">
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-2 font-medium">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                14 jours gratuits • Sans engagement
              </Badge>
            </motion.div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                whileHover={{ 
                  scale: plan.highlight ? 1.03 : 1.02, 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-white text-black px-4 py-2 font-semibold shadow-xl">
                      <Star className="h-4 w-4 mr-1" />
                      Le Plus Populaire
                    </Badge>
                  </div>
                )}

                <div className={`relative h-full backdrop-blur-md rounded-3xl border transition-all duration-500 overflow-hidden ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/20 shadow-2xl' 
                    : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20'
                }`}>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Header */}
                  <div className="relative z-10 p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-6">{plan.description}</p>
                    
                    <div className="mb-8">
                      {plan.price === 'Sur mesure' ? (
                        <div className="text-3xl font-bold text-white">Sur mesure</div>
                      ) : (
                        <div className="flex items-baseline justify-center">
                          <span className="text-5xl font-bold text-white">{plan.price}€</span>
                          <span className="text-gray-400 ml-2">{plan.period}</span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link href="/signup">
                      <Button 
                        size="lg" 
                        className={`w-full mb-8 font-semibold transition-all duration-200 ${
                          plan.highlight 
                            ? 'bg-white text-black hover:bg-gray-100 shadow-xl hover:shadow-2xl' 
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/30'
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>

                  {/* Features */}
                  <div className="relative z-10 px-8 pb-8">
                    <div className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center mt-20"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Questions sur nos tarifs ?</h3>
              <p className="text-gray-400 mb-6">
                Notre équipe est là pour vous aider à choisir le plan parfait pour votre entreprise.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Configuration gratuite</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Migration de données incluse</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Support technique expert</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                  Planifier une démo personnalisée
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}