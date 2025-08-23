'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Database, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
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
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">RGPD & Confidentialité</h1>
              <p className="text-gray-600 mt-2">Politique de protection des données personnelles</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            <strong>Dernière mise à jour :</strong> 23/08/2025
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="prose prose-gray prose-lg max-w-none">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <UserCheck className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-green-800 font-semibold mb-2">Notre engagement</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  OrderSpot.pro respecte votre vie privée et s'engage à protéger vos données personnelles 
                  conformément au Règlement Général sur la Protection des Données (RGPD).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Eye className="h-6 w-6 text-blue-600" />
                1. Responsable du traitement
              </h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  OrderSpot.pro, société par actions simplifiée au capital de [MONTANT] euros, 
                  immatriculée au RCS de [VILLE] sous le numéro [NUMERO], dont le siège social 
                  est situé [ADRESSE COMPLETE].
                </p>
                <div className="space-y-2">
                  <p className="text-gray-700"><strong>Contact DPO :</strong> privacy@orderspot.pro</p>
                  <p className="text-gray-700"><strong>Téléphone :</strong> [NUMERO]</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Database className="h-6 w-6 text-purple-600" />
                2. Données collectées
              </h2>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">📝 Données d'inscription</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Nom et prénom</li>
                    <li>• Adresse email professionnelle</li>
                    <li>• Numéro de téléphone</li>
                    <li>• Nom de l'entreprise</li>
                    <li>• Adresse de l'établissement</li>
                    <li>• Informations de paiement (via Stripe)</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-purple-900 mb-3">📊 Données d'utilisation</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Enregistrements d'appels (avec consentement)</li>
                    <li>• Données de commandes et réservations</li>
                    <li>• Métriques d'utilisation du service</li>
                    <li>• Logs de connexion et d'activité</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Vos droits RGPD</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <p className="text-blue-900 font-semibold mb-4">Vous disposez des droits suivants :</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Accès :</strong> Obtenir une copie de vos données</li>
                    <li>• <strong>Rectification :</strong> Corriger des données inexactes</li>
                    <li>• <strong>Effacement :</strong> Supprimer vos données</li>
                  </ul>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Portabilité :</strong> Récupérer vos données</li>
                    <li>• <strong>Opposition :</strong> Vous opposer au traitement</li>
                    <li>• <strong>Limitation :</strong> Limiter certains traitements</li>
                  </ul>
                </div>
                <p className="text-blue-900 mt-4 font-medium">
                  <strong>Pour exercer vos droits :</strong> privacy@orderspot.pro
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Contact et réclamation</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <p className="text-gray-700 mb-4">
                  Pour toute question relative à cette politique ou pour exercer vos droits :
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-gray-700"><strong>Email :</strong> privacy@orderspot.pro</p>
                  <p className="text-gray-700"><strong>Courrier :</strong> OrderSpot.pro - DPO, [ADRESSE COMPLETE]</p>
                </div>
                <p className="text-gray-700">
                  Vous pouvez également introduire une réclamation auprès de la CNIL : 
                  <a href="https://www.cnil.fr" className="text-blue-600 underline ml-1">www.cnil.fr</a>
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}