// ============================================================================
// DASHBOARD ONBOARDING FLOW - Onboarding pour le tableau de bord
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useOnboarding, OnboardingFlow } from '../onboarding-provider';

export function DashboardOnboardingFlow() {
  const { registerFlow, isFlowCompleted } = useOnboarding();

  useEffect(() => {
    const dashboardFlow: OnboardingFlow = {
      id: 'dashboard-tour',
      title: 'Découverte du tableau de bord',
      description: 'Apprenez à utiliser votre tableau de bord Kalliky',
      autoStart: true,
      steps: [
        {
          id: 'welcome',
          title: 'Bienvenue sur Kalliky! 🎉',
          description: 'Votre tableau de bord vous donne une vue d\'ensemble de votre activité en temps réel. Commençons la visite!',
          target: 'h1', // Le titre principal
          position: 'bottom',
          category: 'introduction',
          skippable: false
        },
        {
          id: 'metrics-overview',
          title: 'Vos métriques clés',
          description: 'Ces cartes affichent vos données en temps réel : revenus, commandes, appels et taux de conversion. Elles se mettent à jour automatiquement.',
          target: '[data-onboarding="metrics-cards"]',
          position: 'bottom',
          category: 'metrics',
          action: () => {
            // Scroller vers les métriques
            const element = document.querySelector('[data-onboarding="metrics-cards"]');
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        {
          id: 'live-calls',
          title: 'Appels en temps réel',
          description: 'Suivez tous vos appels actifs ici. Vous pouvez voir qui appelle, la durée, et si l\'IA gère l\'appel ou si un transfert est nécessaire.',
          target: '[data-onboarding="live-calls"]',
          position: 'right',
          category: 'telephony'
        },
        {
          id: 'ai-performance',
          title: 'Performance de l\'IA',
          description: 'Surveillez les performances de votre assistant IA : taux de résolution, temps de réponse et satisfaction client.',
          target: '[data-onboarding="ai-performance"]',
          position: 'left',
          category: 'ai'
        },
        {
          id: 'revenue-chart',
          title: 'Évolution des revenus',
          description: 'Ce graphique montre l\'évolution de vos revenus sur les 7 derniers jours. Parfait pour identifier les tendances.',
          target: '[data-onboarding="revenue-chart"]',
          position: 'top',
          category: 'analytics'
        },
        {
          id: 'top-products',
          title: 'Produits populaires',
          description: 'Découvrez vos produits les plus vendus ce mois. Utilisez ces données pour optimiser votre offre.',
          target: '[data-onboarding="top-products"]',
          position: 'top',
          category: 'analytics'
        },
        {
          id: 'activity-feed',
          title: 'Activité récente',
          description: 'Toutes les dernières activités de votre business : nouvelles commandes, appels, inscriptions clients...',
          target: '[data-onboarding="activity-feed"]',
          position: 'right',
          category: 'activity'
        },
        {
          id: 'customer-segments',
          title: 'Segments de clientèle',
          description: 'Visualisez la répartition de vos clients : nouveaux, réguliers et VIP. Chaque segment a ses propres stratégies.',
          target: '[data-onboarding="customer-segments"]',
          position: 'left',
          category: 'customers'
        },
        {
          id: 'export-functionality',
          title: 'Exportation des données',
          description: 'Cliquez sur "Exporter" pour télécharger vos données au format Excel. Parfait pour vos rapports et analyses.',
          target: 'button:has([data-icon="download"])',
          position: 'bottom',
          category: 'tools'
        },
        {
          id: 'auto-refresh',
          title: 'Actualisation automatique',
          description: 'Vos données se mettent à jour automatiquement toutes les 30 secondes. Vous pouvez aussi forcer l\'actualisation ici.',
          target: 'button:has([data-icon="refresh"])',
          position: 'bottom',
          category: 'tools'
        },
        {
          id: 'completion',
          title: 'Félicitations! 🎊',
          description: 'Vous connaissez maintenant toutes les fonctionnalités de votre tableau de bord. Explorez les autres sections du menu pour découvrir plus de fonctionnalités.',
          target: 'h1',
          position: 'bottom',
          category: 'completion',
          skippable: false
        }
      ]
    };

    // N'enregistrer que si pas encore complété
    if (!isFlowCompleted('dashboard-tour')) {
      registerFlow(dashboardFlow);
    }
  }, [registerFlow, isFlowCompleted]);

  return null; // Ce composant n'affiche rien, il enregistre juste le flow
}

export function ClientsOnboardingFlow() {
  const { registerFlow, isFlowCompleted } = useOnboarding();

  useEffect(() => {
    const clientsFlow: OnboardingFlow = {
      id: 'clients-tour',
      title: 'Gestion des clients',
      description: 'Découvrez comment gérer vos clients via l\'IA téléphonique',
      steps: [
        {
          id: 'clients-intro',
          title: 'Vos clients par téléphone',
          description: 'Cette page montre tous vos clients identifiés via les appels téléphoniques gérés par l\'IA. Chaque appel enrichit automatiquement la base de données.',
          target: 'h1',
          position: 'bottom',
          category: 'introduction'
        },
        {
          id: 'client-stats',
          title: 'Statistiques clients',
          description: 'Ces métriques vous donnent une vue d\'ensemble : total clients, identifiés vs anonymes, et clients VIP.',
          target: '[data-onboarding="client-stats"]',
          position: 'bottom',
          category: 'metrics'
        },
        {
          id: 'client-search',
          title: 'Recherche de clients',
          description: 'Recherchez rapidement un client par numéro de téléphone, nom ou prénom.',
          target: '[data-onboarding="client-search"]',
          position: 'bottom',
          category: 'search'
        },
        {
          id: 'client-tabs',
          title: 'Filtres de clients',
          description: 'Filtrez vos clients par catégorie : tous, identifiés (avec nom) ou anonymes (numéro seulement).',
          target: '[data-onboarding="client-tabs"]',
          position: 'bottom',
          category: 'filters'
        },
        {
          id: 'client-status',
          title: 'Statuts automatiques',
          description: 'L\'IA attribue automatiquement des statuts basés sur l\'activité : Nouveau (1er appel), Fidèle (appels multiples), VIP (gros montants).',
          target: 'tbody tr:first-child',
          position: 'right',
          category: 'ai-features'
        }
      ]
    };

    if (!isFlowCompleted('clients-tour')) {
      registerFlow(clientsFlow);
    }
  }, [registerFlow, isFlowCompleted]);

  return null;
}