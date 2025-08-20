'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Building,
  Phone,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';

interface BusinessParameter {
  id: string;
  businessId: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  category: 'trial' | 'billing' | 'communication' | 'features';
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusinessInfo {
  id: string;
  name: string;
  ownerId: string;
  type: string;
  createdAt: string;
  owner: {
    email: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    stores: number;
    orders: number;
  };
}

interface BusinessParametersData {
  businesses: BusinessInfo[];
  parameters: Record<string, BusinessParameter[]>;
  defaultParameters: BusinessParameter[];
}

const DEFAULT_PARAMETERS = [
  {
    key: 'trial_calls_limit',
    value: '10',
    type: 'number' as const,
    description: 'Nombre maximum d\'appels en période d\'essai',
    category: 'trial' as const,
    isEditable: true
  },
  {
    key: 'trial_duration_days',
    value: '15',
    type: 'number' as const,
    description: 'Durée de la période d\'essai en jours',
    category: 'trial' as const,
    isEditable: true
  },
  {
    key: 'warning_calls_threshold',
    value: '8',
    type: 'number' as const,
    description: 'Seuil d\'appels pour déclencher l\'email d\'avertissement',
    category: 'trial' as const,
    isEditable: true
  },
  {
    key: 'warning_days_threshold',
    value: '3',
    type: 'number' as const,
    description: 'Seuil de jours restants pour déclencher l\'avertissement',
    category: 'trial' as const,
    isEditable: true
  },
  {
    key: 'deletion_delay_days',
    value: '5',
    type: 'number' as const,
    description: 'Délai avant suppression définitive après blocage',
    category: 'trial' as const,
    isEditable: true
  },
  {
    key: 'auto_telnyx_blocking',
    value: 'true',
    type: 'boolean' as const,
    description: 'Bloquer automatiquement les numéros Telnyx en fin de trial',
    category: 'communication' as const,
    isEditable: true
  },
  {
    key: 'billing_currency',
    value: 'EUR',
    type: 'string' as const,
    description: 'Devise par défaut pour la facturation',
    category: 'billing' as const,
    isEditable: true
  },
  {
    key: 'ai_model_default',
    value: 'gpt-4',
    type: 'string' as const,
    description: 'Modèle IA par défaut pour les nouveaux restaurants',
    category: 'features' as const,
    isEditable: true
  }
];

export default function BusinessParametersManager() {
  const [data, setData] = useState<BusinessParametersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingParam, setEditingParam] = useState<BusinessParameter | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchBusinessParameters = async () => {
    try {
      const response = await fetch('/api/admin/business-parameters');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erreur récupération paramètres business:', error);
      setError('Impossible de charger les paramètres business');
    } finally {
      setLoading(false);
    }
  };

  const saveParameter = async (businessId: string, param: Partial<BusinessParameter>) => {
    try {
      const response = await fetch('/api/admin/business-parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId,
          ...param
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      await fetchBusinessParameters();
      setEditingParam(null);
    } catch (error) {
      console.error('Erreur sauvegarde paramètre:', error);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const deleteParameter = async (businessId: string, paramId: string) => {
    try {
      const response = await fetch(`/api/admin/business-parameters/${paramId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      await fetchBusinessParameters();
    } catch (error) {
      console.error('Erreur suppression paramètre:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const resetToDefaults = async (businessId: string) => {
    try {
      const response = await fetch('/api/admin/business-parameters/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ businessId })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      await fetchBusinessParameters();
    } catch (error) {
      console.error('Erreur reset paramètres:', error);
      setError('Erreur lors de la réinitialisation');
    }
  };

  useEffect(() => {
    fetchBusinessParameters();
  }, []);

  const getCategoryBadge = (category: string) => {
    const colors = {
      trial: 'bg-blue-100 text-blue-800',
      billing: 'bg-green-100 text-green-800',
      communication: 'bg-purple-100 text-purple-800',
      features: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {category}
    </Badge>;
  };

  const formatValue = (value: string, type: string) => {
    switch (type) {
      case 'boolean':
        return value === 'true' ? '✅ Activé' : '❌ Désactivé';
      case 'number':
        return `${value}`;
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement paramètres business...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Paramètres Business
          </h2>
          <p className="text-muted-foreground">
            Configuration et paramétrage des fonctionnalités par restaurant
          </p>
        </div>
        <Button onClick={fetchBusinessParameters} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Business</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.businesses.length || 0}</div>
            <p className="text-xs text-muted-foreground">Restaurants enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paramètres Custom</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(data?.parameters || {}).reduce((acc, params) => acc + params.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Configurations spécifiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paramètres Défaut</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{DEFAULT_PARAMETERS.length}</div>
            <p className="text-xs text-muted-foreground">Templates disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boutiques Actives</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.businesses.reduce((acc, b) => acc + b._count.stores, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Stores configurés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des Business */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurants et Paramètres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.businesses.map((business) => (
              <Card key={business.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {business.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {business.owner.firstName} {business.owner.lastName} • {business.owner.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {business._count.stores} boutique(s) • {business._count.orders} commande(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Paramètres
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Paramètres - {business.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Paramètres existants */}
                          {data.parameters[business.id] && (
                            <div>
                              <h4 className="font-medium mb-2">Paramètres Configurés</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Paramètre</TableHead>
                                    <TableHead>Valeur</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {data.parameters[business.id].map((param) => (
                                    <TableRow key={param.id}>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium">{param.key}</p>
                                          <p className="text-xs text-muted-foreground">{param.description}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {formatValue(param.value, param.type)}
                                      </TableCell>
                                      <TableCell>
                                        {getCategoryBadge(param.category)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="ghost">
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => deleteParameter(business.id, param.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Paramètres par défaut disponibles */}
                          <div>
                            <h4 className="font-medium mb-2">Paramètres Disponibles</h4>
                            <div className="grid gap-2 md:grid-cols-2">
                              {DEFAULT_PARAMETERS.map((defaultParam) => {
                                const exists = data.parameters[business.id]?.some(
                                  p => p.key === defaultParam.key
                                );
                                return (
                                  <div key={defaultParam.key} 
                                    className={`p-3 border rounded-lg ${exists ? 'bg-gray-50' : ''}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-sm">{defaultParam.key}</p>
                                        <p className="text-xs text-muted-foreground">{defaultParam.description}</p>
                                        <p className="text-xs font-mono">{formatValue(defaultParam.value, defaultParam.type)}</p>
                                      </div>
                                      <div>
                                        {getCategoryBadge(defaultParam.category)}
                                        {!exists && (
                                          <Button 
                                            size="sm" 
                                            className="ml-2"
                                            onClick={() => saveParameter(business.id, defaultParam)}
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Ajouter
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t">
                            <Button 
                              variant="outline"
                              onClick={() => resetToDefaults(business.id)}
                            >
                              Réinitialiser aux Défauts
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Aperçu des paramètres configurés */}
                {data.parameters[business.id] && (
                  <div className="flex flex-wrap gap-2">
                    {data.parameters[business.id].slice(0, 5).map((param) => (
                      <Badge key={param.id} variant="secondary" className="text-xs">
                        {param.key}: {formatValue(param.value, param.type)}
                      </Badge>
                    ))}
                    {data.parameters[business.id].length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{data.parameters[business.id].length - 5} autres
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <X className="h-4 w-4 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}