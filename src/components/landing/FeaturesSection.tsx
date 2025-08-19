'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, 
  Car, 
  Scale, 
  Zap, 
  Clock, 
  TrendingUp,
  Users,
  Globe,
  Shield,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    key: 'restaurant',
    icon: Utensils,
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50',
    video: '/api/placeholder/600/400', // Placeholder pour vidéo
    image: '/api/placeholder/600/400',
    benefits: [
      { icon: TrendingUp, text: '0% commission vs 35% Uber' },
      { icon: Clock, text: 'Économie employé nuit/weekend' },
      { icon: Zap, text: 'Menu intelligent' }
    ]
  },
  {
    key: 'rental',
    icon: Car,
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    video: '/api/placeholder/600/400',
    image: '/api/placeholder/600/400',
    benefits: [
      { icon: Clock, text: 'Disponibilité 24h/7j' },
      { icon: Users, text: 'Réduction no-show 80%' },
      { icon: Zap, text: 'Planning automatique' }
    ]
  },
  {
    key: 'consultation',
    icon: Scale,
    color: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-50',
    video: '/api/placeholder/600/400',
    image: '/api/placeholder/600/400',
    benefits: [
      { icon: Shield, text: 'Filtrage prospects' },
      { icon: TrendingUp, text: '+200% rendez-vous qualifiés' },
      { icon: Zap, text: 'Facturation auto' }
    ]
  }
];

export function FeaturesSection() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-primary font-medium">Fonctionnalités</span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold mb-4">
            {t('features.title')}{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('features.titleHighlight')}
            </span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </motion.p>
        </motion.div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Content */}
              <motion.div
                variants={itemVariants}
                className={index % 2 === 1 ? 'lg:col-start-2' : ''}
              >
                <div className="space-y-6">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold">{t(`features.${feature.key}.title`)}</h3>
                      <Badge className="mt-2">{feature.key === 'restaurant' ? '🍕' : feature.key === 'rental' ? '🚗' : '⚖️'}</Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t(`features.${feature.key}.description`)}
                  </p>

                  {/* Benefits */}
                  <div className="space-y-4">
                    {feature.benefits.map((benefit, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                          <benefit.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium">{benefit.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button size="lg" className="group">
                    Voir la démo {feature.key === 'restaurant' ? '🍕' : feature.key === 'rental' ? '🚗' : '⚖️'}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>

              {/* Media */}
              <motion.div
                variants={cardVariants}
                className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}
              >
                <Card className="overflow-hidden border-0 shadow-2xl">
                  <CardContent className="p-0">
                    {/* Video placeholder avec overlay play */}
                    <div className="relative group cursor-pointer">
                      <div className={`w-full h-80 ${feature.bgColor} flex items-center justify-center relative overflow-hidden`}>
                        {/* Placeholder pour image/vidéo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                        
                        {/* Play button overlay */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="relative z-10 w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:bg-white transition-colors"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <ArrowRight className="h-8 w-8 text-gray-700 ml-1" />
                          </motion.div>
                        </motion.div>

                        {/* Feature preview elements */}
                        <div className="absolute top-4 left-4 right-4">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="font-medium">IA Active</span>
                            </div>
                            <div className="text-muted-foreground">
                              {feature.key === 'restaurant' && "🎤 'Bonjour, que puis-je prendre comme commande?'"}
                              {feature.key === 'rental' && "🎤 'Quelle voiture souhaitez-vous réserver?'"}
                              {feature.key === 'consultation' && "🎤 'Quel type de consultation vous intéresse?'"}
                            </div>
                          </div>
                        </div>

                        {/* Bottom stats */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-green-600">+340%</div>
                              <div className="text-xs text-muted-foreground">Conversions</div>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-blue-600">24/7</div>
                              <div className="text-xs text-muted-foreground">Disponible</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}