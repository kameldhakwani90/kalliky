'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, Package, Calendar, UserCheck, Users, Wrench, Bot, Phone, Plus, Settings, Search, Bell } from 'lucide-react';
import { toast } from 'sonner';
import CatalogueTab from './CatalogueTab';
import ServicesTab from './ServicesTab';
import ConsultationsTab from './ConsultationsTab';
import EmployeesTab from './EmployeesTab';
import EquipmentTab from './EquipmentTab';
import AIConfigTab from './AIConfigTab';
import CallForwardingTab from './CallForwardingTab';
import NotificationsTab from './NotificationsTab';
import ConfigurationTab from './ConfigurationTab';

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
  const [activeTab, setActiveTab] = useState('catalogue');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 shadow-apple">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/app/stores')}
                className="flex items-center gap-2 rounded-xl border-gray-300 hover:border-gray-400 transition-smooth"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
                  <Badge variant={store.isActive ? "default" : "secondary"} className="rounded-full">
                    {store.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  {phoneNumberData && (
                    <Badge 
                      variant={phoneNumberData.status === 'ACTIVE' ? "default" : "secondary"} 
                      className="flex items-center gap-1 rounded-full"
                    >
                  <Phone className="h-3 w-3" />
                  {phoneNumberData.status === 'ACTIVE' ? 'Telnyx Connecté' : phoneNumberData.status}
                </Badge>
              )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-600">
                    {store.address}
                  </p>
                  {phoneNumberData && (
                    <p className="text-gray-500 text-sm">
                      📞 {phoneNumberData.number} ({phoneNumberData.country})
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 rounded-xl border-gray-300 hover:border-gray-400 transition-smooth"
              >
                <Settings className="h-4 w-4" />
                Paramètres avancés
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs de gestion */}
        <div className="glass-effect rounded-2xl shadow-apple overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="w-full h-auto p-0 bg-transparent rounded-none">
                <TabsTrigger 
                  value="catalogue" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Catalogue
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger 
                  value="consultations" 
                  disabled
                  className="flex-1 opacity-50 cursor-not-allowed rounded-none border-b-2 border-transparent px-6 py-4"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Consultations (Prochainement)
                </TabsTrigger>
                <TabsTrigger 
                  value="employees" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Employés
                </TabsTrigger>
                <TabsTrigger 
                  value="equipment" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Équipements
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-config" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Config IA
                </TabsTrigger>
                <TabsTrigger 
                  value="call-forwarding" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Renvoi d'appel
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="configuration" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-black px-6 py-4 transition-smooth"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="catalogue" className="p-6">
          <CatalogueTab 
            storeId={storeId}
            storeName={store.name}
            config={store.productsConfig}
            onConfigUpdate={(config) => handleConfigUpdate({ productsConfig: config })}
          />
        </TabsContent>

            <TabsContent value="services" className="p-6">
              <ServicesTab
                storeId={storeId}
                storeName={store.name}
                config={store.reservationsConfig}
                onConfigUpdate={(config) => handleConfigUpdate({ reservationsConfig: config })}
              />
            </TabsContent>

            <TabsContent value="consultations" className="p-6">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserCheck className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Consultations - Prochainement</h3>
                <p className="text-gray-600">
                  Cette fonctionnalité sera disponible dans une prochaine mise à jour.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="employees" className="p-6">
              <EmployeesTab
                storeId={storeId}
                storeName={store.name}
              />
            </TabsContent>

            <TabsContent value="equipment" className="p-6">
              <EquipmentTab
                storeId={storeId}
                storeName={store.name}
              />
            </TabsContent>

            <TabsContent value="ai-config" className="p-6">
              <AIConfigTab
                storeId={storeId}
                storeName={store.name}
                settings={store.settings}
                onConfigUpdate={(settings) => handleConfigUpdate({ settings })}
              />
            </TabsContent>

            <TabsContent value="call-forwarding" className="p-6">
              <CallForwardingTab
                storeId={storeId}
                storeName={store.name}
                phoneNumber={phoneNumber}
                settings={store.settings}
                onConfigUpdate={(settings) => handleConfigUpdate({ settings })}
              />
            </TabsContent>

            <TabsContent value="notifications" className="p-6">
              <NotificationsTab
                storeId={storeId}
                storeName={store.name}
                businessId={store.business.id}
              />
            </TabsContent>

            <TabsContent value="configuration" className="p-6">
              <ConfigurationTab
                storeId={storeId}
                storeName={store.name}
                storeData={store}
                onConfigUpdate={handleConfigUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}