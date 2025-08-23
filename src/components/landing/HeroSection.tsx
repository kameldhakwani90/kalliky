'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Phone, Bot, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

export function HeroSection() {
  const { t, language } = useLanguage();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  console.log('HeroSection language:', language);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background with wave effect */}
      <div className="absolute inset-0">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
        
        {/* Interactive wave effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
          }}
        />
        
        {/* Static wave patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
      </div>

      <div className="container mx-auto px-6 z-20 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-6xl mx-auto"
        >

          {/* Main Title */}
          <motion.div variants={itemVariants} className="mb-8 mt-16 md:mt-20 lg:mt-24">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-6 leading-[0.9] tracking-tight">
              <span className="block">OrderSpot.pro</span>
              <motion.span 
                className="block bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                IA Commande
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-2xl md:text-3xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            {t({ fr: 'Votre assistant IA qui prend les commandes par téléphone, augmente votre panier moyen et fonctionne 24h/24. Fini les appels ratés !', en: 'Your AI assistant that takes phone orders, increases your average basket and works 24/7. No more missed calls!' })}
          </motion.p>

          {/* Key Benefits */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="font-medium">{t({ fr: '24/7 Disponible', en: '24/7 Available' })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="font-medium">{t({ fr: 'Multilingue', en: 'Multilingual' })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="font-medium">{t({ fr: 'Prêt en 5 minutes', en: 'Ready in 5 minutes' })}</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Link href="/plans">
              <Button size="lg" className="text-lg px-12 py-6 bg-white text-black hover:bg-gray-100 group font-semibold rounded-full transition-all duration-300 shadow-2xl hover:shadow-white/25">
                {t({ fr: 'Voir nos Plans', en: 'View Plans' })}
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="ghost"
              className="text-lg px-12 py-6 text-white hover:bg-white/10 backdrop-blur-sm group font-semibold rounded-full border border-white/20 transition-all duration-300"
            >
              <Play className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
              {t({ fr: 'Voir la Démo', en: 'See Demo' })}
            </Button>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}