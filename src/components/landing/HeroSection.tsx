'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, Phone, Globe, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HeroSection() {
  const { t } = useTranslation();
  
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: number;
    top: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    setParticles([...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    })));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
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

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Background Video Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-blue-900/30 to-purple-900/50 z-10" />
        {/* Placeholder for video background */}
        <div className="w-full h-full bg-gradient-to-br from-gray-800 via-blue-800 to-purple-800 opacity-50" />
        
        {/* Animated particles */}
        <div className="absolute inset-0 z-5">
          {particles.length > 0 && particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 z-20 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-6 py-2 text-sm">
              <span className="mr-2">🚀</span>
              IA conversationnelle nouvelle génération
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            {t('hero.title')}{' '}
            <motion.span 
              className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {t('hero.titleHighlight')}
            </motion.span>
            <br />
            {t('hero.titleEnd')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-gray-100 group">
              {t('hero.cta')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm group"
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">{t('hero.stats.conversion')}</div>
              <div className="text-gray-300 text-sm">Taux de conversion</div>
            </motion.div>

            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20"
              style={{ animationDelay: '2s' }}
            >
              <Phone className="h-8 w-8 text-blue-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">{t('hero.stats.availability')}</div>
              <div className="text-gray-300 text-sm">Sans interruption</div>
            </motion.div>

            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20"
              style={{ animationDelay: '4s' }}
            >
              <Globe className="h-8 w-8 text-purple-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">{t('hero.stats.languages')}</div>
              <div className="text-gray-300 text-sm">Support multilingue</div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}