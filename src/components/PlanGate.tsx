'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Sparkles, Crown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanGateProps {
  feature: string;
  requiredPlan: 'STARTER' | 'PRO' | 'BUSINESS';
  children: ReactNode;
  currentPlan?: 'STARTER' | 'PRO' | 'BUSINESS';
  showLock?: boolean;
  customMessage?: string;
}

const PLAN_HIERARCHY = {
  STARTER: 1,
  PRO: 2,
  BUSINESS: 3,
};

const FEATURE_NAMES: Record<string, string> = {
  'voice-selection': 'Sélection de voix',
  'upselling': 'Vente additionnelle intelligente',
  'multi-language': 'Support multi-langue',
  'ai-scripts': 'Scripts IA personnalisés',
  'featured-products': 'Produits vedettes',
  'product-associations': 'Associations de produits',
  'voice-cloning': 'Clonage de voix',
  'ab-testing': 'Tests A/B automatiques',
  'white-label': 'White-label',
  'api-access': 'Accès API',
  'advanced-analytics': 'Analytics avancés',
  'custom-prompts': 'Prompts personnalisés',
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  'voice-selection': 'Choisissez parmi 3 voix professionnelles pour votre agent IA',
  'upselling': 'Augmentez votre panier moyen de 25% avec des suggestions intelligentes',
  'multi-language': 'Servez vos clients en français, anglais et arabe',
  'ai-scripts': 'Créez des scripts de vente personnalisés pour chaque produit',
  'featured-products': 'Mettez en avant vos best-sellers automatiquement',
  'product-associations': 'Suggérez des produits complémentaires intelligemment',
  'voice-cloning': 'Créez une voix unique à partir de votre propre voix',
  'ab-testing': 'Optimisez automatiquement vos scripts de vente',
  'white-label': 'Personnalisez complètement l\'interface à votre marque',
  'api-access': 'Intégrez avec vos systèmes existants',
  'advanced-analytics': 'Analysez en détail les performances de votre IA',
  'custom-prompts': 'Personnalisez complètement le comportement de l\'IA',
};

const PLAN_BENEFITS = {
  PRO: [
    '✨ Agent IA Premium (OpenAI Realtime)',
    '🎙️ 3 voix professionnelles au choix',
    '💰 Vente additionnelle intelligente (+25% panier)',
    '🌍 Multi-langue (FR/EN/AR)',
    '📊 Analytics complets',
    '📱 Notifications SMS + Email',
    '⚡ Support prioritaire',
  ],
  BUSINESS: [
    '🎯 Tout du plan Pro +',
    '🎤 Voix clonée sur-mesure',
    '🧪 Tests A/B automatiques',
    '🏷️ White-label complet',
    '🔌 API webhooks personnalisés',
    '📈 Analytics prédictifs avec IA',
    '👨‍💼 Account manager dédié',
    '🎓 Formation personnalisée',
  ],
};

export function PlanGate({
  feature,
  requiredPlan,
  children,
  currentPlan = 'STARTER', // À récupérer depuis le contexte/API
  showLock = true,
  customMessage,
}: PlanGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  const hasAccess = PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];

  const handleUpgrade = () => {
    // Rediriger vers la page de mise à niveau
    router.push(`/settings/subscription?upgrade=${requiredPlan}`);
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  const featureName = FEATURE_NAMES[feature] || feature;
  const featureDescription = FEATURE_DESCRIPTIONS[feature] || customMessage || 
    `Cette fonctionnalité nécessite le plan ${requiredPlan}`;

  const getPlanIcon = () => {
    switch (requiredPlan) {
      case 'PRO':
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case 'BUSINESS':
        return <Crown className="h-5 w-5 text-purple-500" />;
      default:
        return <Lock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanPrice = () => {
    switch (requiredPlan) {
      case 'PRO':
        return '329€/mois + 1€/commande';
      case 'BUSINESS':
        return 'Sur devis + 0.90€/commande';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="relative">
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
        {showLock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-lg"
              onClick={() => setShowUpgradeModal(true)}
            >
              {getPlanIcon()}
              <span>Débloquer</span>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {getPlanIcon()}
              <DialogTitle className="text-xl">
                Fonctionnalité {requiredPlan === 'BUSINESS' ? 'Business' : 'Pro'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              <span className="font-semibold text-foreground">{featureName}</span>
              <br />
              <span className="text-sm">{featureDescription}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg">
                  Plan {requiredPlan === 'BUSINESS' ? 'Business' : 'Pro'}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {getPlanPrice()}
                </span>
              </div>
              
              <div className="space-y-2">
                {PLAN_BENEFITS[requiredPlan]?.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {requiredPlan === 'PRO' && currentPlan === 'STARTER' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Passez au Pro aujourd'hui
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Agent IA Premium avec latence &lt;200ms pour des conversations naturelles
                    </p>
                  </div>
                </div>
              </div>
            )}

            {requiredPlan === 'BUSINESS' && (
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      Solution sur-mesure
                    </p>
                    <p className="text-purple-700 dark:text-purple-300 mt-1">
                      Contactez-nous pour une démonstration personnalisée
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Plus tard
            </Button>
            <Button onClick={handleUpgrade}>
              {requiredPlan === 'BUSINESS' ? 'Demander un devis' : 'Passer au Pro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook pour récupérer le plan actuel
export function useUserPlan() {
  // TODO: Implémenter la récupération du plan depuis le contexte ou l'API
  // Pour l'instant on retourne STARTER par défaut
  return 'STARTER' as 'STARTER' | 'PRO' | 'BUSINESS';
}