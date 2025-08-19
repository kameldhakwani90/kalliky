'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Bot, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  const navItems = [
    { name: t({ fr: 'Fonctionnalités', en: 'Features' }), href: '#features' },
    { name: t({ fr: 'Métiers', en: 'Industries' }), href: '#metiers', dropdown: [
      { name: t({ fr: '🍕 Restaurant', en: '🍕 Restaurant' }), href: '/food' },
      { name: t({ fr: '💇‍♀️ Salon Beauté', en: '💇‍♀️ Beauty Salon' }), href: '/beaute' },
      { name: t({ fr: '🏠 Agence Immobilier', en: '🏠 Real Estate Agency' }), href: '/location' },
      { name: t({ fr: '🏨 Maison d\'Hôtes', en: '🏨 Guest House' }), href: '/airbnb' },
    ]},
    { name: t({ fr: 'Tarifs', en: 'Pricing' }), href: '#pricing' },
    { name: t({ fr: 'Contact', en: 'Contact' }), href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg"
            >
              <Bot className="h-6 w-6 text-black" />
            </motion.div>
            <span className="text-2xl font-bold text-white tracking-tight">
              OrderSpot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                {item.dropdown ? (
                  <>
                    <button className="text-gray-300 hover:text-white transition-colors duration-200 font-medium relative flex items-center gap-1">
                      {item.name}
                      <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full" />
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      {item.dropdown.map((subItem) => (
                        <Link key={subItem.name} href={subItem.href}>
                          <div className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm">
                            {subItem.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium relative"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button 
                onClick={() => {
                  const newLang = language === 'fr' ? 'en' : 'fr';
                  console.log('Changing language from', language, 'to', newLang);
                  setLanguage(newLang);
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium">{language.toUpperCase()}</span>
              </button>
            </div>
            
            <Link href="/login">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-white/10 font-medium"
              >
                {t({ fr: 'Connexion', en: 'Login' })}
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-black hover:bg-gray-100 font-semibold px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl">
                {language === 'fr' ? 'Essayer Gratuitement' : 'Try for Free'}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-b-2xl"
            >
              <div className="py-6 space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className="block w-full text-left px-6 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="border-t border-white/10 pt-4 mt-6 px-6 space-y-3">
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                      {t({ fr: 'Connexion', en: 'Login' })}
                    </Button>
                  </Link>
                  <Link href="/signup" className="block">
                    <Button className="w-full bg-white text-black hover:bg-gray-100 font-semibold">
                      {t({ fr: 'Essayer Gratuitement', en: 'Try for Free' })}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}