'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutGrid, 
  Users, 
  Settings, 
  ShoppingBag,
  Bell,
  LogOut,
  ArrowRight,
  Activity,
  TrendingUp,
  Phone
} from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { authService } from '@/services/auth.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';

// Types pour les stats
interface HomeStats {
  revenue: { total: number; growth: number };
  calls: { total: number; growth: number };
  customers: { total: number; growth: number };
  stores: { active: number; growth: number };
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch des données réelles
  const fetchHomeStats = async () => {
    try {
      const response = await fetch('/api/restaurant/home-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur fetch home stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeStats();
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut" }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const navigationCards = [
    {
      title: 'Tableau de bord',
      subtitle: 'Analytics et métriques',
      description: 'Vue d\'ensemble de vos performances',
      emoji: '💰',
      href: '/app/dashboard',
      gradient: 'from-gray-600 to-gray-500',
      stats: loading ? 'Chargement...' : `€${stats?.revenue?.total?.toLocaleString('fr-FR') || 0} ce mois`,
      growth: stats?.revenue?.growth || 0
    },
    {
      title: 'Activité',
      subtitle: 'Commandes et appels',
      description: 'Suivi en temps réel des activités',
      emoji: '🔥',
      href: '/app/activity',
      gradient: 'from-gray-600 to-gray-500',
      stats: loading ? 'Chargement...' : `${stats?.calls?.total || 0} appels cette semaine`,
      growth: stats?.calls?.growth || 0
    },
    {
      title: 'Clients',
      subtitle: 'Gestion client',
      description: 'Base de données clients et historique',
      emoji: '👥',
      href: '/app/clients',
      gradient: 'from-gray-600 to-gray-500',
      stats: loading ? 'Chargement...' : `${stats?.customers?.total?.toLocaleString('fr-FR') || 0} clients enregistrés`,
      growth: stats?.customers?.growth || 0
    },
    {
      title: 'Gestion',
      subtitle: 'Configuration',
      description: 'Boutiques, produits et paramètres',
      emoji: '⚙️',
      href: '/app/stores',
      gradient: 'from-gray-600 to-gray-500',
      stats: loading ? 'Chargement...' : `${stats?.stores?.active || 0} boutiques actives`,
      growth: stats?.stores?.growth || 0
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gray-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }} />
      </div>

      {/* Content */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 pt-6"
      >

        {/* Welcome Section */}
        <div className="px-6 py-8">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Bienvenue sur OrderSpot
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Votre plateforme de gestion restaurant avec IA. Choisissez une section pour commencer.
            </p>
          </motion.div>

          {/* Navigation Cards */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {navigationCards.map((card, index) => (
                <motion.div
                  key={card.href}
                  variants={cardVariants}
                  whileHover="hover"
                  className="group cursor-pointer"
                  onClick={() => router.push(card.href)}
                >
                  <Card className="backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl overflow-hidden h-48 relative group-hover:shadow-2xl transition-all duration-500">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
                    
                    <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                            {card.emoji}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">
                              {card.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">
                              {card.subtitle}
                            </p>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {card.description}
                            </p>
                          </div>
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">
                          {card.stats}
                        </span>
                        {!loading && card.growth !== undefined && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-sm font-medium">
                              {card.growth > 0 ? '+' : ''}{card.growth.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Stats - Style Apple avec données utiles */}
          <motion.div variants={itemVariants} className="mt-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-500/20 group hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-3">📞</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {loading ? '...' : stats?.calls?.total?.toLocaleString('fr-FR') || 0}
                </div>
                <div className="text-green-300 text-sm font-medium">Appels reçus ce mois</div>
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-6 border border-blue-500/20 group hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-3">💰</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {loading ? '...' : `€${stats?.revenue?.total?.toLocaleString('fr-FR') || 0}`}
                </div>
                <div className="text-blue-300 text-sm font-medium">Chiffre d'affaires</div>
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl p-6 border border-orange-500/20 group hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-3">👥</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {loading ? '...' : stats?.customers?.total?.toLocaleString('fr-FR') || 0}
                </div>
                <div className="text-orange-300 text-sm font-medium">Nouveaux clients</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}