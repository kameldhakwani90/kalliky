'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator,
  TrendingUp,
  Clock,
  Users,
  Euro,
  Zap,
  Target,
  Award
} from 'lucide-react';

interface CalculatorData {
  calls: number;
  revenue: number;
  employees: number;
  hours: number;
}

const sectorConfigs = {
  restaurant: {
    icon: '🍕',
    color: 'bg-orange-500',
    uberCommission: 0.35,
    avgOrderValue: 25,
    missedCallsRate: 0.4,
    employeeCostPerHour: 15,
  },
  rental: {
    icon: '🚗',
    color: 'bg-blue-500',
    uberCommission: 0.25,
    avgOrderValue: 150,
    missedCallsRate: 0.6,
    employeeCostPerHour: 18,
  },
  consultation: {
    icon: '⚖️',
    color: 'bg-purple-500',
    uberCommission: 0.15,
    avgOrderValue: 200,
    missedCallsRate: 0.3,
    employeeCostPerHour: 25,
  }
};

export function ROICalculator() {
  const { t } = useTranslation();
  const [selectedSector, setSelectedSector] = useState<keyof typeof sectorConfigs>('restaurant');
  const [data, setData] = useState<CalculatorData>({
    calls: 50,
    revenue: 15000,
    employees: 2,
    hours: 12
  });

  const config = sectorConfigs[selectedSector];

  // Calculs ROI
  const dailyMissedCalls = data.calls * config.missedCallsRate;
  const dailyRecoveredRevenue = dailyMissedCalls * config.avgOrderValue;
  const monthlyRecoveredRevenue = dailyRecoveredRevenue * 30;
  
  const monthlyEmployeeCost = data.employees * config.employeeCostPerHour * data.hours * 30;
  const monthlyAISavings = monthlyEmployeeCost * 0.7; // 70% d'économie
  
  const monthlyCommissionSavings = data.revenue * config.uberCommission;
  
  const totalMonthlySavings = monthlyRecoveredRevenue + monthlyAISavings + monthlyCommissionSavings;
  const yearlyGain = totalMonthlySavings * 12;
  const planCost = 329; // Plan PRO
  const roi = ((yearlyGain - planCost * 12) / (planCost * 12)) * 100;
  const breakEvenMonths = Math.ceil((planCost * 12) / totalMonthlySavings);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Calculator className="h-5 w-5 text-primary" />
            <span className="text-primary font-medium">ROI Calculator</span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold mb-4">
            {t('calculator.title')}{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('calculator.titleHighlight')}
            </span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('calculator.subtitle')}
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Calculateur */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
              <CardContent className="p-8">
                {/* Sélecteur de secteur */}
                <motion.div variants={itemVariants} className="mb-8">
                  <Label className="text-lg font-semibold mb-4 block">Votre secteur d'activité</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(sectorConfigs).map(([key, config]) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSector(key as keyof typeof sectorConfigs)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          selectedSector === key
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{config.icon}</span>
                        <span className="font-medium">{t(`calculator.sectors.${key}`)}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Inputs */}
                <div className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('calculator.inputs.calls')}: {data.calls}
                    </Label>
                    <Slider
                      value={[data.calls]}
                      onValueChange={(value) => setData({...data, calls: value[0]})}
                      max={200}
                      min={10}
                      step={5}
                      className="mb-2"
                    />
                    <div className="text-xs text-muted-foreground">10 - 200 appels/jour</div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      {t('calculator.inputs.revenue')}: {data.revenue.toLocaleString('fr-FR')}€
                    </Label>
                    <Slider
                      value={[data.revenue]}
                      onValueChange={(value) => setData({...data, revenue: value[0]})}
                      max={100000}
                      min={5000}
                      step={1000}
                      className="mb-2"
                    />
                    <div className="text-xs text-muted-foreground">5 000€ - 100 000€/mois</div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('calculator.inputs.employees')}: {data.employees}
                    </Label>
                    <Slider
                      value={[data.employees]}
                      onValueChange={(value) => setData({...data, employees: value[0]})}
                      max={10}
                      min={1}
                      step={1}
                      className="mb-2"
                    />
                    <div className="text-xs text-muted-foreground">1 - 10 employés</div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('calculator.inputs.hours')}: {data.hours}h/jour
                    </Label>
                    <Slider
                      value={[data.hours]}
                      onValueChange={(value) => setData({...data, hours: value[0]})}
                      max={24}
                      min={8}
                      step={1}
                      className="mb-2"
                    />
                    <div className="text-xs text-muted-foreground">8h - 24h/jour</div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Résultats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="space-y-6"
          >
            {/* Économies mensuelles */}
            <motion.div variants={itemVariants}>
              <Card className="backdrop-blur-sm bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="h-6 w-6" />
                    <span className="font-semibold">{t('calculator.results.monthly')}</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {totalMonthlySavings.toLocaleString('fr-FR')}€
                  </div>
                  <div className="text-green-100 text-sm mt-2">
                    +{((totalMonthlySavings / data.revenue) * 100).toFixed(0)}% vs CA actuel
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Gain annuel */}
            <motion.div variants={itemVariants}>
              <Card className="backdrop-blur-sm bg-gradient-to-br from-blue-500 to-cyan-600 border-0 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Euro className="h-6 w-6" />
                    <span className="font-semibold">{t('calculator.results.yearly')}</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {yearlyGain.toLocaleString('fr-FR')}€
                  </div>
                  <div className="text-blue-100 text-sm mt-2">
                    Économies totales sur 12 mois
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ROI et Break-even */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <Card className="backdrop-blur-sm bg-gradient-to-br from-purple-500 to-violet-600 border-0 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold text-sm">ROI</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {roi.toFixed(0)}%
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="backdrop-blur-sm bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5" />
                      <span className="font-semibold text-sm">Break-even</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {breakEvenMonths} mois
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Comparaison */}
            <motion.div variants={itemVariants}>
              <Card className="backdrop-blur-sm bg-white/80 border-0">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {t('calculator.comparison.title')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">🛵 Uber Eats (35%)</span>
                      <Badge variant="destructive">-{(data.revenue * 0.35).toLocaleString('fr-FR')}€/mois</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600">👨‍💼 Employé 24h</span>
                      <Badge variant="secondary">-{monthlyEmployeeCost.toLocaleString('fr-FR')}€/mois</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">🤖 Notre IA</span>
                      <Badge className="bg-green-600">+{totalMonthlySavings.toLocaleString('fr-FR')}€/mois</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants}>
              <Button size="lg" className="w-full text-lg py-6">
                Demander une démo {sectorConfigs[selectedSector].icon}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}