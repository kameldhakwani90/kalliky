'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Star } from 'lucide-react';

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '129€',
    period: '/mois + 10% commission',
    description: 'Parfait pour démarrer',
    popular: false,
    features: [
      'Appels vocaux automatisés',
      'Ticket vocal (création auto)',
      'Paiement par lien Stripe',
      'Historique commandes de base',
      'Dashboard commandes & paiements',
      'Facturation Stripe auto',
      'Menu via Excel (upload)',
      'Support par Email'
    ],
    cta: 'Commencer',
    highlight: false
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '329€',
    period: '/mois + 1€ / ticket',
    description: 'IA + historique complet',
    popular: true,
    features: [
      'Toutes les fonctionnalités Starter',
      'Fiche client complète',
      'Mémoire IA client (préférences, upsell)',
      'Upsell intelligent (basé sur l\'historique)',
      'Gestion avancée des signalements',
      'Dashboard + stats IA usage',
      'Support Email prioritaire 24h',
      'Intégrations avancées'
    ],
    cta: 'Commencer',
    highlight: true
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 'Sur devis',
    period: 'personnalisé',
    description: 'Solutions sur mesure',
    popular: false,
    features: [
      'Toutes les fonctionnalités Pro',
      'Ticket vocal sur mesure',
      'Paiement via WhatsApp etc.',
      'Historique avec export API/CRM',
      'IA dédiée / scénario complexe',
      'Suggestion dynamique (météo...)',
      'Dashboard multi-site',
      'Account manager dédié'
    ],
    cta: 'Nous contacter',
    highlight: false
  }
];

export function PricingSection() {
  const { t } = useTranslation();

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
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-white font-medium">Tarifs</span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold mb-4">
            {t('pricing.title')}
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('pricing.trial')} • Sans engagement
            </Badge>
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className={`relative h-full backdrop-blur-sm border-0 ${
                plan.highlight 
                  ? 'bg-gradient-to-br from-white/20 to-white/10 border-2 border-purple-400/50 shadow-2xl shadow-purple-500/25' 
                  : 'bg-white/10 border border-white/20'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-gray-300 text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="pt-4">
                    <div className="text-4xl font-bold text-white">{plan.price}</div>
                    <div className="text-gray-300 text-sm">{plan.period}</div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-200 text-sm">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button 
                    size="lg" 
                    className={`w-full ${
                      plan.highlight 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {plan.cta}
                    {plan.highlight && <Zap className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="text-center mt-16"
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <p className="text-gray-300">
              🎯 Tous les plans incluent : SSL gratuit, mises à jour automatiques, support technique
            </p>
            <p className="text-gray-400 text-sm">
              💳 Paiement sécurisé • 🔄 Changement de plan à tout moment • ❌ Résiliation sans frais
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}