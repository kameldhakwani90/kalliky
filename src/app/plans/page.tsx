'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft, Star, Phone, Info } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Plans identiques à ceux de signup
const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '129€',
    priceValue: 129,
    description: '/ mois + 10% commission',
    target: 'Petit restaurant local',
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
      '🛡️ Détection spam basique',
    ],
    blockedFeatures: [
      '❌ Personnalisation voix',
      '❌ Vente additionnelle IA',
      '❌ Multi-langue',
      '❌ Scripts personnalisés',
      '❌ Appels simultanés multiples',
    ],
    recommended: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
  },
  {
    id: 'PRO',
    name: 'Pro',
    subtitle: 'IA Premium',
    price: '329€',
    priceValue: 329,
    description: '/ mois + 1€ / commande',
    target: 'Restaurants avec volume',
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
      '⚡ Support prioritaire',
    ],
    blockedFeatures: [
      '❌ Voix clonée custom',
      '❌ Tests A/B',
      '❌ White-label',
      '❌ API webhooks',
    ],
    recommended: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_BASE_PRICE_ID
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    subtitle: 'Sur mesure',
    price: 'Sur devis',
    priceValue: 800,
    description: '+ 0.90€ / commande',
    target: 'Chaînes & franchises',
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
      '🚀 SLA garanti 99.9%',
    ],
    blockedFeatures: [],
    recommended: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID
  },
];

export default function PlansPage() {
  const router = useRouter();

  const handlePlanSelect = (planId: string) => {
    if (planId === 'BUSINESS') {
      // Pour le plan Business, rediriger vers un formulaire de contact
      window.location.href = 'mailto:contact@kalliky.com?subject=Demande Plan Business&body=Bonjour,\n\nJe souhaite obtenir plus d\'informations sur le plan Business de Kalliky.\n\nCordialement';
      return;
    }
    
    // Rediriger vers signup avec le plan sélectionné
    router.push(`/signup?plan=${planId.toLowerCase()}`);
  };

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
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container max-w-7xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Choisissez Votre
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Plan Parfait
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Commencez votre essai gratuit de 14 jours. Sans engagement.
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="flex justify-center items-center gap-8 mb-12 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>Support français</span>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative"
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-white text-black px-4 py-2 font-semibold rounded-full shadow-xl flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {plan.subtitle || 'Recommandé'}
                    </div>
                  </div>
                )}

                <div 
                  className={`relative h-full backdrop-blur-md rounded-3xl border transition-all duration-500 overflow-hidden ${
                    plan.recommended 
                      ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/20 shadow-2xl' 
                      : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Header */}
                  <div className="relative z-10 p-8 text-center">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-6">{plan.target}</p>
                    
                    <div className="mb-8">
                      <div className="text-4xl font-bold">{plan.price}</div>
                      <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                    </div>

                    <Button 
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`w-full mb-8 font-semibold transition-all duration-200 ${
                        plan.recommended 
                          ? 'bg-white text-black hover:bg-gray-100' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      {plan.id === 'BUSINESS' ? 'Nous contacter' : 'Commencer l\'essai gratuit'}
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="relative z-10 px-8 pb-8">
                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-sm text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {plan.blockedFeatures && plan.blockedFeatures.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="space-y-2">
                          {plan.blockedFeatures.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2 opacity-50">
                              <span className="text-sm text-gray-500">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* FAQ or additional info */}
          <motion.div variants={itemVariants} className="mt-16 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Questions fréquentes</h2>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">L'essai est-il vraiment gratuit ?</h3>
                  <p className="text-gray-400">Oui, vous avez 14 jours complets pour tester toutes les fonctionnalités. Aucune carte bancaire requise.</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Puis-je changer de plan ?</h3>
                  <p className="text-gray-400">Vous pouvez passer à un plan supérieur à tout moment. Le changement est immédiat.</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Comment fonctionne la commission ?</h3>
                  <p className="text-gray-400">Elle s'applique uniquement sur les commandes réussies. Pas de commande = pas de commission.</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Le support est-il inclus ?</h3>
                  <p className="text-gray-400">Oui, support par email inclus. Le plan Pro bénéficie d'un support prioritaire.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <p className="text-gray-400 mb-4">Une question ? Nous sommes là pour vous aider</p>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => window.location.href = 'mailto:contact@kalliky.com?subject=Question sur les plans'}
            >
              Nous contacter
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}