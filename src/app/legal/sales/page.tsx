'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Receipt, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function SalesPage() {
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
    <div className="container mx-auto px-6 py-16">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto"
      >
        <motion.div variants={itemVariants} className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Conditions Générales de Vente</h1>
              <p className="text-gray-600 mt-2">Conditions commerciales et de facturation</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            <strong>Dernière mise à jour :</strong> 23/08/2025
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="prose prose-gray prose-lg max-w-none">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Receipt className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-purple-800 font-semibold mb-2">Conditions commerciales</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Ces conditions régissent la vente des services OrderSpot.pro, 
                  complétant les Conditions Générales d'Utilisation.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 : Informations société */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Informations société</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Raison sociale :</h4>
                  <p className="text-gray-700">OrderSpot.pro SAS</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Capital social :</h4>
                  <p className="text-gray-700">[MONTANT] euros</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">RCS :</h4>
                  <p className="text-gray-700">[VILLE] [NUMERO]</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">SIRET :</h4>
                  <p className="text-gray-700">[NUMERO SIRET]</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Services et tarifs */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Services et tarifs</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">📞 Service d'assistant vocal IA</h4>
                <p className="text-gray-700 mb-4">
                  Assistant intelligent pour la prise de commandes téléphoniques automatisée.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <div className="font-semibold text-gray-900">Plan Starter</div>
                    <div className="text-gray-600">[PRIX]/mois</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="font-semibold text-gray-900">Plan Pro</div>
                    <div className="text-gray-600">[PRIX]/mois</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="font-semibold text-gray-900">Plan Business</div>
                    <div className="text-gray-600">[PRIX]/mois</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Modalités de paiement */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Modalités de paiement</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Receipt className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Facturation mensuelle</h4>
                    <p className="text-gray-700 text-sm">Prélèvement automatique le 1er de chaque mois</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Moyens de paiement acceptés</h4>
                    <p className="text-gray-700 text-sm">Carte bancaire, virement SEPA</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Résiliation</h4>
                    <p className="text-gray-700 text-sm">Sans engagement, résiliation à tout moment avec préavis de 30 jours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 : Garanties et responsabilité */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Garanties et responsabilité</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Disponibilité du service</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    OrderSpot.pro s'engage à fournir un service disponible 99,9% du temps. 
                    En cas d'indisponibilité dépassant ce seuil, un avoir proportionnel sera accordé.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 : Contact */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Contact</h2>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Pour toute question relative aux présentes conditions :
              </p>
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Email :</strong> contact@orderspot.pro</p>
                <p className="text-gray-700"><strong>Téléphone :</strong> [NUMERO]</p>
                <p className="text-gray-700"><strong>Adresse :</strong> [ADRESSE COMPLETE]</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}