'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Euro, 
  Info, 
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingUp,
  Building
} from 'lucide-react';
import { format, addMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'STARTER' | 'PRO' | 'BUSINESS';
  storeName: string;
  storeId: string;
  onConfirm: (newPlan: string) => void;
}

const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 99,
    color: 'bg-gray-500',
    features: [
      'Réception IA basique',
      '2 notifications par type',
      'Commission 10% sur ventes',
      'Support email'
    ],
    limits: {
      notifications: 2,
      commission: 10,
      aiLevel: 'Basique'
    }
  },
  PRO: {
    name: 'Pro',
    price: 300,
    color: 'bg-blue-500',
    features: [
      'Réception IA avancée',
      '5 notifications par type',
      'Webhooks N8N inclus',
      '1€ par commande',
      'Support prioritaire'
    ],
    limits: {
      notifications: 5,
      commission: 0,
      perOrder: 1,
      aiLevel: 'Avancée'
    }
  },
  BUSINESS: {
    name: 'Business',
    price: 700,
    color: 'bg-purple-500',
    features: [
      'Réception IA premium',
      'Notifications illimitées',
      'Tous les webhooks',
      'Aucune commission',
      'Support dédié 24/7'
    ],
    limits: {
      notifications: 'Illimité',
      commission: 0,
      aiLevel: 'Premium'
    }
  }
};

export default function PlanChangeModal({
  isOpen,
  onClose,
  currentPlan,
  storeName,
  storeId,
  onConfirm
}: PlanChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const today = new Date();
  const nextMonth = addMonths(today, 1);
  const daysRemaining = differenceInDays(nextMonth, today);
  
  const currentPlanData = PLANS[currentPlan];
  const newPlanData = PLANS[selectedPlan as keyof typeof PLANS];
  
  const isUpgrade = newPlanData.price > currentPlanData.price;
  const isDowngrade = newPlanData.price < currentPlanData.price;
  const priceDifference = newPlanData.price - currentPlanData.price;
  
  // Calcul du prorata pour ce mois
  const dailyRate = currentPlanData.price / 30;
  const creditRemaining = dailyRate * daysRemaining;
  const newDailyRate = newPlanData.price / 30;
  const costRemaining = newDailyRate * daysRemaining;
  const prorataAmount = costRemaining - creditRemaining;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm(selectedPlan);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isUpgrade && <ArrowUpCircle className="h-6 w-6 text-green-500" />}
            {isDowngrade && <ArrowDownCircle className="h-6 w-6 text-orange-500" />}
            {!isUpgrade && !isDowngrade && <Zap className="h-6 w-6 text-blue-500" />}
            Changer de plan - {storeName}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le nouveau plan pour votre boutique
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection du plan */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Choisir un plan</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <div className="grid gap-3">
                {Object.entries(PLANS).map(([key, plan]) => (
                  <Card 
                    key={key} 
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedPlan === key && "ring-2 ring-blue-500",
                      key === currentPlan && "bg-gray-50"
                    )}
                  >
                    <CardContent className="p-4">
                      <label htmlFor={key} className="flex items-start gap-3 cursor-pointer">
                        <RadioGroupItem value={key} id={key} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{plan.name}</span>
                              {key === currentPlan && (
                                <Badge variant="secondary" className="text-xs">
                                  Plan actuel
                                </Badge>
                              )}
                            </div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {plan.price}€<span className="text-sm text-gray-500">/mois</span>
                            </div>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </label>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Informations sur le changement */}
          {selectedPlan !== currentPlan && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Détails du changement
                </h4>

                {/* Type de changement */}
                <Alert className={cn(
                  "border-l-4",
                  isUpgrade ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"
                )}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {isUpgrade ? '🚀 Upgrade' : '⬇️ Downgrade'} : {currentPlanData.name} → {newPlanData.name}
                    </div>
                    {isUpgrade && (
                      <div className="text-sm">
                        <p>✅ Les nouvelles fonctionnalités sont disponibles <strong>immédiatement</strong></p>
                        <p>✅ Vous bénéficiez instantanément des nouvelles limites</p>
                      </div>
                    )}
                    {isDowngrade && (
                      <div className="text-sm">
                        <p>⚠️ Les limitations du plan {newPlanData.name} s'appliquent <strong>immédiatement</strong></p>
                        <p>⚠️ Vérifiez que vos configurations respectent les nouvelles limites</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Calcul financier */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Plan actuel ({currentPlanData.name})</span>
                      <span className="font-medium">{currentPlanData.price}€/mois</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Nouveau plan ({newPlanData.name})</span>
                      <span className="font-medium">{newPlanData.price}€/mois</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Jours restants ce mois</span>
                      <span>{daysRemaining} jours</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Crédit restant (plan actuel)</span>
                      <span className="text-green-600">-{creditRemaining.toFixed(2)}€</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Coût nouveau plan (prorata)</span>
                      <span>+{costRemaining.toFixed(2)}€</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-semibold">
                      <span>À payer aujourd'hui</span>
                      <span className={cn(
                        "text-lg",
                        prorataAmount > 0 ? "text-blue-600" : "text-green-600"
                      )}>
                        {prorataAmount > 0 ? `${prorataAmount.toFixed(2)}€` : 'Crédit appliqué'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Prochaine facturation */}
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">Prochaine facturation</div>
                    <div className="text-sm mt-1">
                      Le {format(nextMonth, 'dd MMMM yyyy', { locale: fr })} : <strong>{newPlanData.price}€</strong>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Avertissements spécifiques */}
                {isDowngrade && selectedPlan === 'STARTER' && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <div className="font-semibold text-orange-800">Limitations du plan Starter</div>
                      <ul className="text-sm mt-2 space-y-1 text-orange-700">
                        <li>• Maximum 2 notifications par type (vous devrez peut-être en supprimer)</li>
                        <li>• Pas d'accès aux webhooks N8N</li>
                        <li>• Commission de 10% sur les ventes</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
          {selectedPlan !== currentPlan && (
            <Button 
              onClick={handleConfirm} 
              disabled={isProcessing}
              className={cn(
                "min-w-[120px]",
                isUpgrade && "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
                isDowngrade && "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              )}
            >
              {isProcessing ? "Traitement..." : `Confirmer ${isUpgrade ? 'l\'upgrade' : 'le downgrade'}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}