'use client';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, CheckCircle, ArrowRight, Info, Loader2, Building, Euro, TrendingUp, CreditCard, Plus, Trash2, StopCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "sonner";
import PlanChangeModal from '@/components/billing/PlanChangeModal';
import CancelSubscriptionModal from '@/components/billing/CancelSubscriptionModal';

interface ActivityBilling {
  storeId: string;
  storeName: string;
  businessName: string;
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
  status: string;
  baseCost: number;
  usage: {
    orderCount: number;
    totalRevenue: number;
    commissionAmount: number;
  };
  totalCost: number;
  isActive: boolean;
}

interface ConsolidatedBilling {
  totalActivities: number;
  totalBaseCost: number;
  totalUsageCost: number;
  totalAmount: number;
  activities: ActivityBilling[];
  period: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  stripeInvoiceId: string;
  pdfUrl?: string;
}

export default function BillingPage() {
  const { t } = useLanguage();
  const [billingData, setBillingData] = useState<ConsolidatedBilling | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [planChangeModal, setPlanChangeModal] = useState<{
    isOpen: boolean;
    storeId: string;
    storeName: string;
    currentPlan: 'STARTER' | 'PRO' | 'BUSINESS';
  }>({ isOpen: false, storeId: '', storeName: '', currentPlan: 'STARTER' });
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    storeId: string;
    storeName: string;
    plan: 'STARTER' | 'PRO' | 'BUSINESS';
  }>({ isOpen: false, storeId: '', storeName: '', plan: 'STARTER' });

  const translations = {
    title: { fr: "Facturation et Abonnements", en: "Billing and Subscriptions" },
    description: { fr: "Gérez vos abonnements et consultez vos factures", en: "Manage your subscriptions and view your invoices" },
    currentBilling: { fr: "Facturation Actuelle", en: "Current Billing" },
    period: { fr: "Période", en: "Period" },
    activities: { fr: "Activités", en: "Activities" },
    baseCost: { fr: "Coût de base", en: "Base cost" },
    usage: { fr: "Usage", en: "Usage" },
    total: { fr: "Total", en: "Total" },
    payNow: { fr: "Payer maintenant", en: "Pay now" },
    activity: { fr: "Activité", en: "Activity" },
    plan: { fr: "Plan", en: "Plan" },
    orders: { fr: "commandes", en: "orders" },
    revenue: { fr: "CA", en: "Revenue" },
    commission: { fr: "Commission", en: "Commission" },
    perOrder: { fr: "par commande", en: "per order" },
    active: { fr: "Actif", en: "Active" },
    inactive: { fr: "Inactif", en: "Inactive" },
    loading: { fr: "Chargement...", en: "Loading..." },
    noActivities: { fr: "Aucune activité", en: "No activities" },
    createActivity: { fr: "Créer une activité", en: "Create activity" },
    paymentMethods: { fr: "Moyens de paiement", en: "Payment methods" },
    paymentMethodsDescription: { fr: "Gérez vos cartes bancaires enregistrées", en: "Manage your saved payment cards" },
    addCard: { fr: "Ajouter une carte", en: "Add card" },
    defaultCard: { fr: "Carte par défaut", en: "Default card" },
    expires: { fr: "Expire", en: "Expires" },
    remove: { fr: "Supprimer", en: "Remove" },
    noCards: { fr: "Aucune carte enregistrée", en: "No saved cards" },
    addFirstCard: { fr: "Ajoutez votre première carte pour simplifier vos futurs paiements", en: "Add your first card to simplify future payments" },
    invoiceHistory: { fr: "Historique des factures", en: "Invoice history" },
    invoiceHistoryDescription: { fr: "Consultez et téléchargez vos factures", en: "View and download your invoices" },
    invoiceNumber: { fr: "N° Facture", en: "Invoice #" },
    date: { fr: "Date", en: "Date" },
    amount: { fr: "Montant", en: "Amount" },
    status: { fr: "Statut", en: "Status" },
    actions: { fr: "Actions", en: "Actions" },
    download: { fr: "Télécharger", en: "Download" },
    paid: { fr: "Payée", en: "Paid" },
    pending: { fr: "En attente", en: "Pending" },
    noInvoices: { fr: "Aucune facture", en: "No invoices" },
    noInvoicesDescription: { fr: "Vos factures apparaîtront ici une fois vos premiers paiements effectués", en: "Your invoices will appear here once your first payments are made" },
    overview: { fr: "Vue d'ensemble", en: "Overview" },
    subscriptions: { fr: "Abonnements", en: "Subscriptions" },
    invoices: { fr: "Factures", en: "Invoices" },
    paymentMethodsTab: { fr: "Moyens de paiement", en: "Payment methods" },
  };

  useEffect(() => {
    loadBillingData();
    loadPaymentMethods();
    loadInvoices();
  }, []);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les activités
      const activitiesResponse = await fetch('/api/restaurant/activities');
      if (!activitiesResponse.ok) throw new Error('Erreur lors du chargement des activités');
      
      const data = await activitiesResponse.json();
      // L'API retourne { stores, activities }, récupérer les stores qui contiennent les activités
      const activities = data.stores || [];
      setActivities(activities);
      
      // Récupérer l'usage du mois en cours
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const usageResponse = await fetch(`/api/restaurant/usage?period=${currentPeriod}`);
      let usageData = [];
      
      if (usageResponse.ok) {
        usageData = await usageResponse.json();
      } else {
        console.warn('Aucune donnée d\'usage trouvée, utilisation de valeurs par défaut');
      }

      // Construire les données de facturation
      const activityBilling: ActivityBilling[] = [];
      let totalBaseCost = 0;
      let totalUsageCost = 0;

      for (const store of activities) {
        if (store.subscription) {
          const settings = store.settings ? (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) : {};
          // Chercher les données d'usage pour ce store
          const usageRecord = usageData.find((u: any) => u.storeId === store.id);
          const usage = usageRecord ? {
            orderCount: usageRecord.orderCount || 0,
            totalRevenue: usageRecord.totalRevenue || 0,
            commissionAmount: usageRecord.commissionAmount || 0
          } : {
            orderCount: 0,
            totalRevenue: 0,
            commissionAmount: 0
          };

          // Calculer les coûts selon le plan
          let baseCost = 0;
          let usageCost = 0;

          switch (store.subscription.plan) {
            case 'STARTER':
              baseCost = 129;
              usageCost = usage.commissionAmount; // 10% du CA
              break;
            case 'PRO':
              baseCost = 329;
              usageCost = usage.orderCount * 1; // 1€ par commande
              break;
            case 'BUSINESS':
              baseCost = 800;
              usageCost = 0; // Pas de frais d'usage
              break;
          }

          totalBaseCost += baseCost;
          totalUsageCost += usageCost;

          activityBilling.push({
            storeId: store.id,
            storeName: store.name,
            businessName: store.name, // Utiliser le nom du store comme nom de business
            plan: store.subscription.plan,
            status: store.subscription.status,
            baseCost,
            usage: {
              orderCount: usage.orderCount,
              totalRevenue: usage.totalRevenue,
              commissionAmount: usage.commissionAmount
            },
            totalCost: baseCost + usageCost,
            isActive: store.isActive && store.subscription.isActive
          });
        }
      }

      setBillingData({
        totalActivities: activityBilling.length,
        totalBaseCost,
        totalUsageCost,
        totalAmount: totalBaseCost + totalUsageCost,
        activities: activityBilling,
        period: format(new Date(), 'MMMM yyyy')
      });

    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Erreur lors du chargement des données de facturation');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsPaymentLoading(true);
      
      const response = await fetch('/api/stripe/checkout-consolidated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Erreur lors du paiement');
      setIsPaymentLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingPaymentMethods(true);
      const response = await fetch('/api/stripe/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const response = await fetch('/api/restaurant/billing/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleAddCard = async () => {
    // Créer une session Setup Intent pour ajouter une nouvelle carte
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const { setupUrl } = await response.json();
        window.location.href = setupUrl;
      }
    } catch (error) {
      console.error('Error creating setup intent:', error);
      toast.error('Erreur lors de l\'ajout de la carte');
    }
  };

  const handleOpenPlanChangeModal = (storeId: string, storeName: string, currentPlan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    setPlanChangeModal({
      isOpen: true,
      storeId,
      storeName,
      currentPlan
    });
  };

  const handleOpenCancelModal = (storeId: string, storeName: string, plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    setCancelModal({
      isOpen: true,
      storeId,
      storeName,
      plan
    });
  };

  const handlePlanChange = async (newPlan: string) => {
    try {
      const response = await fetch('/api/restaurant/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storeId: planChangeModal.storeId,
          newPlan 
        })
      });

      if (response.ok) {
        const isUpgrade = newPlan > planChangeModal.currentPlan;
        toast.success(
          isUpgrade 
            ? '🚀 Upgrade effectué avec succès ! Les nouvelles fonctionnalités sont disponibles immédiatement.'
            : '✅ Changement de plan effectué avec succès.'
        );
        setPlanChangeModal({ isOpen: false, storeId: '', storeName: '', currentPlan: 'STARTER' });
        // Recharger les données
        await loadBillingData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors du changement de plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Erreur lors du changement de plan');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/restaurant/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: cancelModal.storeId })
      });

      if (response.ok) {
        toast.success('Abonnement arrêté avec succès');
        setCancelModal({ isOpen: false, storeId: '', storeName: '', plan: 'STARTER' });
        // Recharger les données
        await loadBillingData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de l\'arrêt de l\'abonnement');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Erreur lors de l\'arrêt de l\'abonnement');
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      });

      if (response.ok) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
        toast.success('Carte supprimée avec succès');
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error removing card:', error);
      toast.error('Erreur lors de la suppression de la carte');
    }
  };

  const getCardBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'text-blue-600';
      case 'mastercard': return 'text-red-600';
      case 'amex': return 'text-green-600';
      default: return 'text-gray-300';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-green-100 text-green-700';
      case 'PRO': return 'bg-blue-100 text-blue-700';
      case 'BUSINESS': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t(translations.loading)}</span>
        </div>
      </div>
    );
  }

  // Afficher les activités sans abonnement aussi
  const hasActivitiesWithSubscriptions = billingData && billingData.activities.length > 0;
  const allActivities = activities || [];


  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Apple Style */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 backdrop-blur-xl mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{t(translations.title)}</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">{t(translations.description)}</p>
        </div>

        {/* Onglets avec style Apple */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/5/10 p-1 text-white backdrop-blur-xl border border-white/20 shadow-lg">
              <TabsTrigger 
                value="overview" 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-2 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/5/20 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-white/10 hover:bg-white/5/10 hover:text-white"
              >
                <TrendingUp className="h-4 w-4" />
                {t(translations.overview)}
              </TabsTrigger>
              <TabsTrigger 
                value="subscriptions" 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-2 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/5/20 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-white/10 hover:bg-white/5/10 hover:text-white"
              >
                <Building className="h-4 w-4" />
                {t(translations.subscriptions)}
              </TabsTrigger>
              <TabsTrigger 
                value="invoices" 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-2 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/5/20 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-white/10 hover:bg-white/5/10 hover:text-white"
              >
                <Download className="h-4 w-4" />
                {t(translations.invoices)}
              </TabsTrigger>
              <TabsTrigger 
                value="payment-methods" 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-2 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/5/20 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-white/10 hover:bg-white/5/10 hover:text-white"
              >
                <CreditCard className="h-4 w-4" />
                {t(translations.paymentMethodsTab)}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenu des onglets */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">
            
            {/* Vue d'ensemble - Statistiques toujours visibles */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden hover:-translate-y-1">
                <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg">
                    <Building className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {allActivities.length}
                  </div>
                  <div className="text-sm text-gray-300 font-medium">Boutiques créées</div>
                </CardContent>
              </Card>

              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 overflow-hidden hover:-translate-y-1">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"></div>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 shadow-lg">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {billingData?.totalActivities || 0}
                  </div>
                  <div className="text-sm text-gray-300 font-medium">Avec abonnement</div>
                </CardContent>
              </Card>

              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden hover:-translate-y-1">
                <div className="h-1 w-full bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"></div>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mb-4 shadow-lg">
                    <Euro className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {billingData?.totalAmount ? billingData.totalAmount.toFixed(0) : '0'}€
                  </div>
                  <div className="text-sm text-gray-300 font-medium">Facturation mensuelle</div>
                </CardContent>
              </Card>

              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 overflow-hidden hover:-translate-y-1">
                <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 mb-4 shadow-lg">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {invoices.length}
                  </div>
                  <div className="text-sm text-gray-300 font-medium">Factures émises</div>
                </CardContent>
              </Card>
            </div>

            {/* Section principale selon le statut */}
            {hasActivitiesWithSubscriptions ? (
              // Avec abonnements actifs
              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Euro className="h-6 w-6 text-white" />
                    </div>
                    {t(translations.currentBilling)} - {billingData?.period}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    {billingData?.totalActivities} {t(translations.activities)} actives • Prochaine facturation le {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-white/5/5 rounded-2xl border border-white/10">
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-white">
                        {billingData?.totalAmount.toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-300 font-medium">
                        Total mensuel TTC • {billingData?.totalBaseCost.toFixed(0)}€ fixe + {billingData?.totalUsageCost.toFixed(0)}€ usage
                      </div>
                    </div>
                    <Button 
                      onClick={handlePayment}
                      disabled={isPaymentLoading}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-2xl px-8 py-3"
                    >
                      {isPaymentLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      <Euro className="mr-2 h-5 w-5" />
                      {t(translations.payNow)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : allActivities.length === 0 ? (
              // Aucune boutique - invite à créer
              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-6">
                    <Building className="h-10 w-10 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white">
                      Créez votre première boutique
                    </h3>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      Commencez par créer votre première boutique pour pouvoir gérer vos abonnements et suivre votre facturation.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = '/app/stores?action=new'}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-2xl px-8 py-3"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Créer ma première boutique
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Sans abonnements - encourager l'activation
              <Card className="group backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-6">
                    <Building className="h-10 w-10 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white">
                      Activez vos abonnements
                    </h3>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      Vous avez {allActivities.length} boutique{allActivities.length > 1 ? 's' : ''} créée{allActivities.length > 1 ? 's' : ''} prête{allActivities.length > 1 ? 's' : ''} à être activée{allActivities.length > 1 ? 's' : ''}.
                      Choisissez un plan d'abonnement pour commencer à recevoir des appels et gérer votre activité.
                    </p>
                  </div>
                  
                  {allActivities.length > 0 && (
                    <div className="bg-white/5/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="font-semibold text-white mb-4">Vos boutiques disponibles :</h4>
                      <div className="grid gap-3 max-w-2xl mx-auto">
                        {allActivities.slice(0, 3).map((store: any, index: number) => (
                          <div key={store.id} className="flex items-center justify-between bg-white/5/10 rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <Building className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{store.name}</p>
                                <p className="text-sm text-gray-300">{store.address}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/50 rounded-full">
                              Inactif
                            </Badge>
                          </div>
                        ))}
                        {allActivities.length > 3 && (
                          <p className="text-sm text-gray-400 mt-2">
                            +{allActivities.length - 3} autre{allActivities.length - 3 > 1 ? 's' : ''} boutique{allActivities.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => window.location.href = '/app/stores?action=new'}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-2xl px-8 py-3"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    {allActivities.length > 0 ? 'Configurer mes abonnements' : 'Créer ma première boutique'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Si aucune boutique du tout */}
            {allActivities.length === 0 && (
              <Card className="backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-6">
                    <Building className="h-10 w-10 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white">
                      Aucune boutique créée
                    </h3>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      Créez votre première boutique pour pouvoir souscrire à un abonnement et commencer à recevoir des appels.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = '/app/stores?action=new'}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-2xl px-8 py-3"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Créer ma première boutique
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Boutiques sans abonnement avec style Apple */}
            {allActivities.length > 0 && !hasActivitiesWithSubscriptions && (
              <Card className="backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Building className="h-5 w-5 text-orange-400" />
                    Boutiques disponibles
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Vos boutiques créées qui n'ont pas encore d'abonnement actif
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {allActivities.map((store: any) => (
                        <Card key={store.id} className="backdrop-blur-xl bg-white/5/5 border-white/10 rounded-xl">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-white">{store.name}</h3>
                                <p className="text-sm text-gray-300">{store.address}</p>
                                <p className="text-sm text-gray-400">{store.serviceType}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/50 rounded-full px-3 py-1">
                                  Pas d'abonnement
                                </Badge>
                                <Button 
                                  size="sm"
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 rounded-xl"
                                  onClick={() => window.location.href = '/app/stores?action=new'}
                                >
                                  Souscrire un plan
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Facturation consolidée avec style Apple */}
            {hasActivitiesWithSubscriptions && billingData && (
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 rounded-2xl border-0 hover:shadow-apple-lg transition-smooth hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    <Euro className="h-5 w-5 text-blue-600" />
                    {t(translations.currentBilling)} - {billingData.period}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {billingData.totalActivities} {t(translations.activities)} • {t(translations.total)} : {billingData.totalAmount.toFixed(2)}€
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Statistiques avec cartes animées */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="backdrop-blur-xl bg-white/10 border-white/20 rounded-xl border-0 hover:shadow-apple-lg transition-smooth hover-lift">
                      <CardContent className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-3">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">{billingData.totalActivities}</div>
                        <div className="text-sm text-gray-300 font-medium">{t(translations.activities)}</div>
                      </CardContent>
                    </Card>
                    <Card className="backdrop-blur-xl bg-white/10 border-white/20 rounded-xl border-0 hover:shadow-apple-lg transition-smooth hover-lift">
                      <CardContent className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-3">
                          <Euro className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{billingData.totalBaseCost.toFixed(2)}€</div>
                        <div className="text-sm text-gray-300 font-medium">{t(translations.baseCost)}</div>
                      </CardContent>
                    </Card>
                    <Card className="backdrop-blur-xl bg-white/10 border-white/20 rounded-xl border-0 hover:shadow-apple-lg transition-smooth hover-lift">
                      <CardContent className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 mb-3">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{billingData.totalUsageCost.toFixed(2)}€</div>
                        <div className="text-sm text-gray-300 font-medium">{t(translations.usage)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Détail par activité avec table moderne */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Détail par activité</h3>
                    <div className="bg-white/5 rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="font-semibold text-gray-300">{t(translations.activity)}</TableHead>
                            <TableHead className="font-semibold text-gray-300">{t(translations.plan)}</TableHead>
                            <TableHead className="font-semibold text-gray-300">{t(translations.baseCost)}</TableHead>
                            <TableHead className="font-semibold text-gray-300">{t(translations.usage)}</TableHead>
                            <TableHead className="text-right font-semibold text-gray-300">{t(translations.total)}</TableHead>
                            <TableHead className="text-center font-semibold text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {billingData.activities.map((activity) => (
                            <TableRow key={activity.storeId} className="hover:bg-gray-50/30 transition-colors duration-200">
                              <TableCell>
                                <div>
                                  <div className="font-medium text-white">{activity.storeName}</div>
                                  <div className="text-sm text-gray-500">{activity.businessName}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(getPlanColor(activity.plan), "rounded-full px-2.5 py-1 font-medium")}>
                                  {activity.plan}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-white">{activity.baseCost.toFixed(2)}€</TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-300">
                                  {activity.plan === 'PRO' && (
                                    <div>{activity.usage.orderCount} {t(translations.orders)} × 1€</div>
                                  )}
                                  {activity.plan === 'STARTER' && (
                                    <div>{activity.usage.totalRevenue.toFixed(2)}€ × 10%</div>
                                  )}
                                  {activity.plan === 'BUSINESS' && (
                                    <div className="text-gray-500">Inclus</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-white">
                                {activity.totalCost.toFixed(2)}€
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenPlanChangeModal(activity.storeId, activity.storeName, activity.plan)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 rounded-xl"
                                  >
                                    <RefreshCw className="mr-1 h-3 w-3" />
                                    Changer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenCancelModal(activity.storeId, activity.storeName, activity.plan)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
                                  >
                                    <StopCircle className="mr-1 h-3 w-3" />
                                    Arrêter
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Separator className="my-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  
                  {/* Section paiement avec style Apple */}
                  <div className="flex justify-between items-center p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl border border-gray-200/50">
                    <div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{billingData.totalAmount.toFixed(2)}€</div>
                      <div className="text-sm text-gray-300 font-medium">Total TTC</div>
                    </div>
                    <Button 
                      onClick={handlePayment}
                      disabled={isPaymentLoading}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-xl px-8"
                    >
                      {isPaymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t(translations.payNow)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Section Historique des factures avec style Apple */}
            <Card className="backdrop-blur-xl bg-white/5/10 border-white/20 rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Download className="h-5 w-5 text-emerald-400" />
                  {t(translations.invoiceHistory)}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t(translations.invoiceHistoryDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInvoices ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 mb-6">
                      <Download className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{t(translations.noInvoices)}</h3>
                    <p className="text-gray-300 max-w-md mx-auto">{t(translations.noInvoicesDescription)}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                              <TableHead className="font-semibold text-gray-300">{t(translations.invoiceNumber)}</TableHead>
                              <TableHead className="font-semibold text-gray-300">{t(translations.date)}</TableHead>
                              <TableHead className="font-semibold text-gray-300">{t(translations.amount)}</TableHead>
                              <TableHead className="font-semibold text-gray-300">{t(translations.status)}</TableHead>
                              <TableHead className="text-right font-semibold text-gray-300">{t(translations.actions)}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.map((invoice) => (
                              <TableRow key={invoice.id} className="hover:bg-emerald-50/20 transition-colors duration-200">
                                <TableCell className="font-medium text-white">
                                  {invoice.id}
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  {format(new Date(invoice.date), 'dd/MM/yy')}
                                </TableCell>
                                <TableCell className="font-medium text-white">
                                  {(invoice.amount / 100).toFixed(2)}€
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={invoice.status === 'Payée' ? 'default' : 'secondary'}
                                    className={cn(
                                      "rounded-full px-2.5 py-1 font-medium",
                                      invoice.status === 'Payée' 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-amber-100 text-amber-700'
                                    )}
                                  >
                                    {invoice.status === 'Payée' ? t(translations.paid) : t(translations.pending)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {invoice.status === 'Payée' && invoice.pdfUrl && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800 transition-all duration-300 rounded-xl font-medium"
                                      onClick={() => {
                                        if (invoice.pdfUrl) {
                                          window.open(invoice.pdfUrl, '_blank');
                                        }
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      {t(translations.download)}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Section Moyens de paiement avec style Apple */}
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 rounded-2xl border-0 hover:shadow-apple-lg transition-smooth hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  {t(translations.paymentMethods)}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t(translations.paymentMethodsDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPaymentMethods ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mb-6">
                      <CreditCard className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{t(translations.noCards)}</h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">{t(translations.addFirstCard)}</p>
                    <Button 
                      onClick={handleAddCard}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t(translations.addCard)}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-white">Cartes enregistrées</h4>
                      <Button 
                        variant="outline" 
                        onClick={handleAddCard}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-2xl px-6"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t(translations.addCard)}
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {paymentMethods.map((card) => (
                        <Card key={card.id} className="backdrop-blur-xl bg-white/10 border-white/20 rounded-xl border-0 hover:shadow-apple-lg transition-smooth hover-lift">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
                                  <CreditCard className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-white capitalize">{card.brand}</span>
                                    <span className="text-gray-200 font-mono text-lg">•••• {card.last4}</span>
                                    {card.isDefault && (
                                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/50 rounded-full px-2 py-0.5 text-xs font-medium">
                                        {t(translations.defaultCard)}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-300 font-medium">
                                    {t(translations.expires)} {card.expMonth.toString().padStart(2, '0')}/{card.expYear.toString().slice(-2)}
                                  </span>
                                </div>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveCard(card.id)}
                                className="text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors duration-200 rounded-xl bg-red-500/5 border border-red-500/20"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t(translations.remove)}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de changement de plan */}
        <PlanChangeModal
          isOpen={planChangeModal.isOpen}
          onClose={() => setPlanChangeModal({ isOpen: false, storeId: '', storeName: '', currentPlan: 'STARTER' })}
          currentPlan={planChangeModal.currentPlan}
          storeName={planChangeModal.storeName}
          storeId={planChangeModal.storeId}
          onConfirm={handlePlanChange}
        />

        {/* Modal d'arrêt d'abonnement */}
        <CancelSubscriptionModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, storeId: '', storeName: '', plan: 'STARTER' })}
          storeName={cancelModal.storeName}
          storeId={cancelModal.storeId}
          plan={cancelModal.plan}
          onConfirm={handleCancelSubscription}
        />
      </div>
    </div>
  );
}