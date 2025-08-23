'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';

export function FooterSection() {
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
    <footer id="contact" className="bg-black text-white">
      {/* CTA Section */}
      <section className="py-24 border-b border-white/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-bold mb-8">
              Prêt à Révolutionner
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Votre Entreprise ?
              </span>
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Rejoignez les restaurateurs qui ont déjà boosté leurs ventes avec OrderSpot.pro
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/plans">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-12 py-6 group font-semibold rounded-full">
                  Voir nos Plans
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="ghost"
                className="border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-12 py-6 rounded-full"
              >
                Planifier une Démo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Content */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-4 gap-12"
          >
            {/* Brand */}
            <motion.div variants={itemVariants} className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Bot className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold">OrderSpot.pro</span>
              </Link>
              
              <p className="text-gray-400 leading-relaxed">
                L'assistant IA qui transforme chaque appel en vente. 
                Automatisez vos commandes et boostez votre chiffre d'affaires.
              </p>
              
              <div className="flex gap-4">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </motion.a>
              </div>
            </motion.div>

            {/* Produit */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-semibold mb-6">Produit</h3>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/plans" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Intégrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Sécurité</Link></li>
              </ul>
            </motion.div>

            {/* Solutions */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-semibold mb-6">Solutions</h3>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Restaurants</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">E-commerce</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Consultations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Réservations</Link></li>
              </ul>
            </motion.div>

            {/* Support */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-semibold mb-6">Support</h3>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <a href="mailto:contact@kalliky.com" className="flex items-center gap-3 hover:text-white transition-colors">
                    <Mail className="h-4 w-4" />
                    contact@kalliky.com
                  </a>
                </li>
                <li>
                  <a href="tel:+33123456789" className="flex items-center gap-3 hover:text-white transition-colors">
                    <Phone className="h-4 w-4" />
                    +33 1 23 45 67 89
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>
                    Paris, France<br />
                    Disponible dans le monde entier
                  </span>
                </li>
              </ul>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Centre d'aide →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              © 2025 OrderSpot.pro. Tous droits réservés.
            </div>
            
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                RGPD & Confidentialité
              </Link>
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Conditions Générales d'Utilisation
              </Link>
              <Link href="/legal/sales" className="hover:text-white transition-colors">
                Conditions Générales de Vente
              </Link>
              <Link href="/legal/mentions" className="hover:text-white transition-colors">
                Mentions Légales
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                RGPD
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}