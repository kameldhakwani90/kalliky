'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface StoreData {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
  productsConfig?: any;
  reservationsConfig?: any;
  consultationsConfig?: any;
  settings?: any;
  business: {
    id: string;
    name: string;
    phoneNumbers?: Array<{
      id: string;
      number: string;
      telnyxId: string;
      status: string;
      country: string;
      monthlyPrice: number;
      purchaseDate: string;
      telnyxConfig?: any;
    }>;
  };
}

export default function UnifiedManagementPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}`);
      
      if (!response.ok) {
        throw new Error('Store not found');
      }
      
      const data = await response.json();
      setStore(data);
    } catch (error) {
      console.error('Error fetching store:', error);
      setError(error instanceof Error ? error.message : 'Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (updates: any) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update store');
      }

      const updatedStore = await response.json();
      setStore(updatedStore);
      toast.success('Configuration mise à jour avec succès');
      return updatedStore;
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Erreur</p>
                <p className="text-sm text-muted-foreground">
                  {error || 'Boutique introuvable'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/app/stores')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux boutiques
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const phoneNumber = store.business.phoneNumbers?.[0]?.number || null;
  const phoneNumberData = store.business.phoneNumbers?.[0] || null;

  // Configuration cards avec descriptions et statuts - style Apple avec emojis
  const configurationCards = [
    {
      id: 'catalogue',
      title: 'Catalogue Produits',
      description: 'Gérez vos produits, prix et catégories',
      emoji: '🛍️',
      color: 'from-blue-500 to-blue-600',
      available: true,
      count: store.productsConfig?.products?.length || 0,
      status: store.hasProducts ? 'Configuré' : 'À configurer'
    },
    {
      id: 'services',
      title: 'Services & Réservations',
      description: 'Configurez vos services et créneaux',
      emoji: '📅',
      color: 'from-green-500 to-green-600',
      available: true,
      count: store.reservationsConfig?.services?.length || 0,
      status: store.hasReservations ? 'Configuré' : 'À configurer'
    },
    {
      id: 'consultations',
      title: 'Consultations',
      description: 'Gestion des consultations privées',
      emoji: '👨‍⚕️',
      color: 'from-purple-500 to-purple-600',
      available: false,
      count: 0,
      status: 'Prochainement'
    },
    {
      id: 'employees',
      title: 'Employés',
      description: 'Gérez votre équipe et leurs accès',
      emoji: '👥',
      color: 'from-orange-500 to-orange-600',
      available: true,
      count: 0, // À récupérer depuis la DB
      status: 'Configuré'
    },
    {
      id: 'equipment',
      title: 'Équipements',
      description: 'Imprimantes et terminaux de paiement',
      emoji: '🖨️',
      color: 'from-gray-500 to-gray-600',
      available: true,
      count: 0, // À récupérer depuis la DB
      status: 'Configuré'
    },
    {
      id: 'ai-config',
      title: 'Configuration IA',
      description: 'Assistant vocal et prompts intelligents',
      emoji: '🤖',
      color: 'from-indigo-500 to-indigo-600',
      available: true,
      count: 0,
      status: store.settings?.aiAgent ? 'Configuré' : 'À configurer'
    },
    {
      id: 'call-forwarding',
      title: 'Renvoi d\'appel',
      description: 'Configuration des transferts d\'appels',
      emoji: '📞',
      color: 'from-teal-500 to-teal-600',
      available: true,
      count: 0,
      status: phoneNumberData?.status === 'ACTIVE' ? 'Configuré' : 'À configurer'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Alertes email, SMS et WhatsApp',
      emoji: '🔔',
      color: 'from-yellow-500 to-yellow-600',
      available: true,
      count: 0,
      status: store.settings?.notifications?.enabled ? 'Configuré' : 'À configurer'
    },
    {
      id: 'configuration',
      title: 'Configuration Générale',
      description: 'Paramètres boutique et business',
      emoji: '⚙️',
      color: 'from-red-500 to-red-600',
      available: true,
      count: 0,
      status: 'Configuré'
    }
  ];

  // Filtrer les cards selon le terme de recherche
  const filteredCards = configurationCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateToConfig = (configId: string) => {
    router.push(`/app/manage/${storeId}/${configId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects - style Apple */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gray-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header - style Apple noir */}
        <header className="backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl p-6 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/app/stores')}
                className="flex items-center gap-2 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-white">{store.name}</h1>
                  <Badge variant={store.isActive ? "default" : "secondary"} className="rounded-full bg-green-500/20 text-green-300 border-green-500/30">
                    {store.isActive ? "🟢 Actif" : "🔴 Inactif"}
                  </Badge>
                  {phoneNumberData && (
                    <Badge 
                      variant="secondary"
                      className="flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-300 border-blue-500/30"
                    >
                      📞 {phoneNumberData.status === 'ACTIVE' ? 'Telnyx Connecté' : phoneNumberData.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-300">
                    📍 {store.address}
                  </p>
                  {phoneNumberData && (
                    <p className="text-gray-400 text-sm">
                      📞 {phoneNumberData.number} ({phoneNumberData.country})
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Barre de recherche style Apple */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une configuration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition-all w-64"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Titre section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Configuration de {store.name}
          </h2>
          <p className="text-gray-400 text-lg">
            {filteredCards.length} modules de configuration disponibles
          </p>
        </div>

        {/* Grille de configuration style Apple avec emojis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className={`group cursor-pointer transition-all duration-500 hover:scale-[1.02] border-0 backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl overflow-hidden h-48 relative ${
                !card.available ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-2xl hover:bg-white/20'
              }`}
              onClick={() => card.available && navigateToConfig(card.id)}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
              
              <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {card.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {card.title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ${
                    !card.available ? 'opacity-50' : ''
                  }`} />
                </div>

                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary"
                    className={`text-xs rounded-full ${
                      card.status === 'Configuré' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                      card.status === 'Prochainement' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                      'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}
                  >
                    {card.status}
                  </Badge>
                  {card.count > 0 && (
                    <Badge variant="secondary" className="rounded-full text-xs bg-white/10 text-white border-white/20">
                      {card.count} éléments
                    </Badge>
                  )}
                </div>

                {!card.available && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚧</div>
                      <div className="text-amber-300 text-sm font-medium">En développement</div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}