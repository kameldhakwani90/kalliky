'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Database, UserCheck, FileText } from 'lucide-react';

export default function RGPDPage() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">RGPD - Protection des Données</h1>
              <p className="text-gray-600 mt-2">Conformité et gestion des données personnelles</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            <strong>Dernière mise à jour :</strong> 23/08/2025
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">🛡️ Vos Droits RGPD</h2>
            <p className="text-gray-700 mb-4">
              En tant qu'utilisateur d'OrderSpot.pro, vous bénéficiez de tous les droits prévus par le RGPD :
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Droit d'accès</h3>
                <p className="text-sm text-gray-600">Demander une copie de toutes vos données</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Droit de rectification</h3>
                <p className="text-sm text-gray-600">Corriger des informations incorrectes</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Droit à l'effacement</h3>
                <p className="text-sm text-gray-600">Demander la suppression de vos données</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Droit de portabilité</h3>
                <p className="text-sm text-gray-600">Récupérer vos données dans un format standard</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-4">📧 Exercer vos droits</h2>
            <p className="text-gray-700 mb-4">Pour toute demande relative à vos données personnelles :</p>
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Email :</strong> privacy@orderspot.pro</p>
              <p className="text-gray-700"><strong>Délai de réponse :</strong> 30 jours maximum</p>
              <p className="text-gray-700"><strong>Coût :</strong> Gratuit (sauf demandes manifestement excessives)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}