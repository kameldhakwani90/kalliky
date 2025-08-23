'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Building } from 'lucide-react';

export default function MentionsPage() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Mentions Légales</h1>
              <p className="text-gray-600 mt-2">Informations légales sur OrderSpot.pro</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            <strong>Dernière mise à jour :</strong> 23/08/2025
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Éditeur du site</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Raison sociale :</strong> [RAISON SOCIALE]</p>
              <p><strong>Forme juridique :</strong> [FORME JURIDIQUE]</p>
              <p><strong>Capital social :</strong> [MONTANT] euros</p>
              <p><strong>RCS :</strong> [VILLE] [NUMERO]</p>
              <p><strong>SIRET :</strong> [NUMERO SIRET]</p>
              <p><strong>Adresse :</strong> [ADRESSE COMPLETE]</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email :</strong> contact@orderspot.pro</p>
              <p><strong>Téléphone :</strong> [NUMERO]</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hébergement</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Hébergeur :</strong> [NOM HEBERGEUR]</p>
              <p><strong>Adresse :</strong> [ADRESSE HEBERGEUR]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}