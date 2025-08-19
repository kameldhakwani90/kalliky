'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';

export function FooterSection() {
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

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* CTA Section */}
      <section className="py-20 border-b border-white/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold mb-6">
              {t('footer.cta')}
            </motion.h2>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6 group">
                {t('footer.ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-6"
              >
                📞 Planifier un appel
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-4 gap-8"
          >
            {/* Brand */}
            <motion.div variants={itemVariants} className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">Kalliky.ai</span>
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed">
                L'IA conversationnelle qui transforme vos appels en revenus. 
                Automatisez votre prise de commandes, réservations et consultations 24h/7j.
              </p>
              <div className="flex gap-3">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Github className="h-4 w-4" />
                </motion.a>
              </div>
            </motion.div>

            {/* Solutions */}
            <motion.div variants={itemVariants}>
              <h3 className="font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">🍕 Restaurants</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">🚗 Location</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">⚖️ Cabinets</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">💆 Services</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">🏥 Santé</Link></li>
              </ul>
            </motion.div>

            {/* Ressources */}
            <motion.div variants={itemVariants}>
              <h3 className="font-semibold mb-4">Ressources</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">📚 Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">🎓 Guides</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">📊 Études de cas</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">🔧 API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">💬 Support</Link></li>
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div variants={itemVariants}>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:contact@kalliky.ai" className="hover:text-white transition-colors">
                    contact@kalliky.ai
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+33123456789" className="hover:text-white transition-colors">
                    +33 1 23 45 67 89
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>
                    123 Avenue des Champs-Élysées<br />
                    75008 Paris, France
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div>
              © 2024 Kalliky.ai. Tous droits réservés.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Conditions d'utilisation
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}