// ============================================================================
// COMPOSANT ADMIN - Gestionnaire des échecs Telnyx et remboursements
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CreditCard,
  CheckCircle,
  Clock,
  DollarSign,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Banknote
} from 'lucide-react';

interface TelnyxFailure {
  id: string;
  businessId: string;
  storeId: string;
  storeName: string;
  country: string;
  error: string;
  timestamp: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  hasActiveSubscription: boolean;
  subscriptionId?: string;
  needsRefund: boolean;
}

interface RefundActivity {
  id: string;
  type: 'REFUND' | 'ERROR';
  title: string;
  description: string;
  amount?: number;
  createdAt: string;
  store: {
    name: string;
    business: {
      owner: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
  metadata: any;
  status: string;
  refundId?: string;
  requiresIntervention?: boolean;
}

interface TelnyxFailuresData {
  stats: {
    totalFailures: number;
    pendingRefunds: number;
    completedRefunds: number;
    totalRefundAmount: number;
  };
  failures: TelnyxFailure[];
  refunds: RefundActivity[];
}

export default function TelnyxFailuresManager() {
  const [data, setData] = useState<TelnyxFailuresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [selectedFailure, setSelectedFailure] = useState<TelnyxFailure | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/telnyx-failures');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefund = async (subscriptionId: string, reason: string) => {
    if (!subscriptionId || !reason.trim()) return;

    setProcessing(subscriptionId);
    try {
      const response = await fetch('/api/admin/telnyx-failures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId,
          reason,
          type: 'full'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Remboursement effectué avec succès (ID: ${result.refundId})`);
        setRefundReason('');
        setSelectedFailure(null);
        fetchData(); // Recharger les données
      } else {
        alert(`Erreur remboursement: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur remboursement:', error);
      alert('Erreur lors du remboursement');
    } finally {
      setProcessing(null);
    }
  };

  const handleResolveFailure = async (failureId: string, resolution: string) => {
    try {
      const response = await fetch('/api/admin/telnyx-failures', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          failureId,
          resolution
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Échec marqué comme résolu');
        fetchData();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur résolution:', error);
      alert('Erreur lors de la résolution');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'FR': '🇫🇷',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'ES': '🇪🇸',
      'IT': '🇮🇹',
      'CA': '🇨🇦',
      'AU': '🇦🇺'
    };
    return flags[countryCode] || '🌍';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des données Telnyx...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Erreur lors du chargement des données</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs totaux</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalFailures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remboursements en attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.stats.pendingRefunds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remboursements effectués</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.completedRefunds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant remboursé</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.stats.totalRefundAmount.toFixed(2)}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Échecs d'attribution récents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Échecs d'attribution Telnyx
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.failures.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun échec d'attribution récent</p>
          ) : (
            <div className="space-y-4">
              {data.failures.map((failure) => (
                <div key={failure.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getCountryFlag(failure.country)}</span>
                        <strong>{failure.storeName}</strong>
                        <Badge variant={failure.hasActiveSubscription ? "default" : "secondary"}>
                          {failure.hasActiveSubscription ? "Abonnement actif" : "Pas d'abonnement"}
                        </Badge>
                        {failure.needsRefund && (
                          <Badge variant="destructive">Remboursement requis</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {failure.owner.firstName} {failure.owner.lastName}
                          </div>
                          <div className="mt-1">{failure.owner.email}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(failure.timestamp)}
                          </div>
                          <div className="mt-1 text-red-600">{failure.error}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {failure.needsRefund && failure.subscriptionId && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setSelectedFailure(failure)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Rembourser
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Remboursement manuel</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p><strong>Boutique:</strong> {failure.storeName}</p>
                                <p><strong>Client:</strong> {failure.owner.firstName} {failure.owner.lastName}</p>
                                <p><strong>Erreur:</strong> {failure.error}</p>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Motif du remboursement:
                                </label>
                                <Textarea
                                  placeholder="Expliquez la raison du remboursement..."
                                  value={refundReason}
                                  onChange={(e) => setRefundReason(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFailure(null);
                                    setRefundReason('');
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => failure.subscriptionId && handleManualRefund(failure.subscriptionId, refundReason)}
                                  disabled={!refundReason.trim() || processing === failure.subscriptionId}
                                >
                                  {processing === failure.subscriptionId ? 'Traitement...' : 'Confirmer le remboursement'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const resolution = prompt('Résolution appliquée:');
                          if (resolution) {
                            handleResolveFailure(failure.id, resolution);
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Résoudre
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des remboursements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Historique des remboursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.refunds.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun remboursement enregistré</p>
          ) : (
            <div className="space-y-3">
              {data.refunds.map((refund) => (
                <div key={refund.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={refund.type === 'REFUND' ? 'default' : 'destructive'}>
                          {refund.type === 'REFUND' ? 'Remboursement' : 'Erreur'}
                        </Badge>
                        <span className="font-medium">{refund.title}</span>
                        {refund.amount && (
                          <span className="text-green-600 font-bold">{refund.amount.toFixed(2)}€</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{refund.description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {refund.store?.business.owner.firstName} {refund.store?.business.owner.lastName} - {formatDate(refund.createdAt)}
                        {refund.refundId && (
                          <span className="ml-2">ID: {refund.refundId}</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Badge variant={
                        refund.status === 'COMPLETED' ? 'default' :
                        refund.requiresIntervention ? 'destructive' : 'secondary'
                      }>
                        {refund.status === 'COMPLETED' ? 'Complété' :
                         refund.requiresIntervention ? 'Intervention requise' : 'En cours'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}