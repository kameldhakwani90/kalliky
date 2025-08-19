'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle,
  Calendar,
  StopCircle,
  Info,
  PhoneOff,
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, addMonths, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  storeId: string;
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
  onConfirm: () => void;
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  storeName,
  storeId,
  plan,
  onConfirm
}: CancelSubscriptionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const today = new Date();
  const endOfCurrentPeriod = endOfMonth(today);
  const nextMonth = addMonths(today, 1);
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
            <StopCircle className="h-6 w-6" />
            Arrêter l'abonnement
          </DialogTitle>
          <DialogDescription>
            Confirmez l'arrêt de l'abonnement pour <strong>{storeName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avertissement principal */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="font-semibold text-red-800 mb-2">
                ⚠️ Cette action aura les conséquences suivantes :
              </div>
              <ul className="space-y-2 text-sm text-red-700">
                <li className="flex items-start gap-2">
                  <PhoneOff className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Le numéro de téléphone sera <strong>supprimé définitivement</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <StopCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>La réception IA sera <strong>désactivée</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>La facturation sera <strong>arrêtée</strong> à la fin de la période</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Informations sur la période restante */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Service disponible jusqu'au :
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">Fin de période payée :</span>
                      <Badge variant="outline" className="bg-white">
                        {format(endOfCurrentPeriod, 'dd MMMM yyyy', { locale: fr })}
                      </Badge>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          Vous pourrez continuer à utiliser le service jusqu'à cette date
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ce qui sera conservé / perdu */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800 text-sm">Conservé</span>
                </div>
                <ul className="space-y-1 text-xs text-green-700">
                  <li>• Historique des commandes</li>
                  <li>• Données clients</li>
                  <li>• Configuration boutique</li>
                  <li>• Statistiques</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-800 text-sm">Perdu</span>
                </div>
                <ul className="space-y-1 text-xs text-red-700">
                  <li>• Numéro de téléphone</li>
                  <li>• Réception IA active</li>
                  <li>• Notifications automatiques</li>
                  <li>• Nouveaux appels</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Information de réactivation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Réactivation possible :</strong> Vous pourrez réactiver votre abonnement à tout moment, 
              mais un <strong>nouveau numéro de téléphone</strong> sera attribué.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm} 
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? "Arrêt en cours..." : "Confirmer l'arrêt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}