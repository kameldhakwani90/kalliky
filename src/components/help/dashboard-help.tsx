// ============================================================================
// DASHBOARD HELP - Définitions d'aide pour le tableau de bord
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useHelp, HelpTip } from './help-provider';

export function DashboardHelp() {
  const { registerTip, unregisterTip } = useHelp();

  useEffect(() => {
    const tips: HelpTip[] = [
      {
        id: 'revenue-metric',
        title: 'Revenus en temps réel',
        content: 'Vos revenus d\'aujourd\'hui comparés à hier. Les données se mettent à jour automatiquement à chaque nouvelle commande validée.',
        category: 'info',
        target: '[data-onboarding="metrics-cards"] > div:first-child',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'orders-metric',
        title: 'Nombre de commandes',
        content: 'Total des commandes reçues aujourd\'hui. Inclut toutes les commandes, même celles en cours de préparation.',
        category: 'info',
        target: '[data-onboarding="metrics-cards"] > div:nth-child(2)',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'calls-metric',
        title: 'Appels téléphoniques',
        content: 'Nombre d\'appels reçus aujourd\'hui via votre assistant IA. Chaque appel enrichit automatiquement votre base clients.',
        category: 'feature',
        target: '[data-onboarding="metrics-cards"] > div:nth-child(3)',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'conversion-metric',
        title: 'Taux de conversion',
        content: 'Pourcentage d\'appels qui se transforment en commandes. Un indicateur clé de performance de votre IA.',
        category: 'tip',
        target: '[data-onboarding="metrics-cards"] > div:nth-child(4)',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'live-calls-panel',
        title: 'Monitoring des appels actifs',
        content: 'Surveillez en temps réel tous les appels en cours. Vous pouvez voir le sentiment client et intervenir si nécessaire.',
        category: 'feature',
        target: '[data-onboarding="live-calls"]',
        position: 'right',
        trigger: 'hover'
      },
      {
        id: 'ai-performance-panel',
        title: 'Performances de l\'IA',
        content: 'Statistiques détaillées sur l\'efficacité de votre assistant : résolution automatique, temps de réponse, satisfaction.',
        category: 'feature',
        target: '[data-onboarding="ai-performance"]',
        position: 'left',
        trigger: 'hover'
      },
      {
        id: 'revenue-chart',
        title: 'Tendance des revenus',
        content: 'Évolution de vos revenus sur 7 jours. Identifiez les tendances et les jours les plus performants.',
        category: 'info',
        target: '[data-onboarding="revenue-chart"]',
        position: 'top',
        trigger: 'hover'
      },
      {
        id: 'top-products-list',
        title: 'Produits stars',
        content: 'Vos produits les plus vendus ce mois. Utilisez ces données pour optimiser votre stock et vos promotions.',
        category: 'tip',
        target: '[data-onboarding="top-products"]',
        position: 'top',
        trigger: 'hover'
      },
      {
        id: 'activity-feed',
        title: 'Journal d\'activité',
        content: 'Flux en temps réel de toutes les activités : nouvelles commandes, appels, inscriptions clients, etc.',
        category: 'info',
        target: '[data-onboarding="activity-feed"]',
        position: 'right',
        trigger: 'hover'
      },
      {
        id: 'customer-segments',
        title: 'Segmentation automatique',
        content: 'L\'IA classe automatiquement vos clients : Nouveaux (1er contact), Réguliers (fidèles), VIP (gros volumes).',
        category: 'feature',
        target: '[data-onboarding="customer-segments"]',
        position: 'left',
        trigger: 'hover'
      },
      {
        id: 'export-button',
        title: 'Export des données',
        content: 'Téléchargez un rapport Excel complet avec toutes vos métriques. Parfait pour vos analyses et présentations.',
        category: 'tip',
        target: 'button:has([data-icon="download"])',
        position: 'bottom',
        trigger: 'hover',
        persistent: true
      },
      {
        id: 'refresh-button',
        title: 'Actualisation manuelle',
        content: 'Forcez la mise à jour des données. Les données se rafraîchissent automatiquement toutes les 30 secondes.',
        category: 'info',
        target: 'button:has([data-icon="refresh"])',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'subscription-badge',
        title: 'Votre abonnement',
        content: 'Votre plan d\'abonnement actuel. Upgrade pour débloquer plus de fonctionnalités et augmenter vos limites.',
        category: 'info',
        target: '.badge',
        position: 'bottom',
        trigger: 'hover'
      }
    ];

    // Enregistrer tous les tips
    tips.forEach(tip => registerTip(tip));

    // Nettoyer au démontage
    return () => {
      tips.forEach(tip => unregisterTip(tip.id));
    };
  }, [registerTip, unregisterTip]);

  return null; // Ce composant n'affiche rien, il enregistre juste les tips
}

export function ClientsHelp() {
  const { registerTip, unregisterTip } = useHelp();

  useEffect(() => {
    const tips: HelpTip[] = [
      {
        id: 'client-search-bar',
        title: 'Recherche intelligente',
        content: 'Recherchez par numéro de téléphone, nom ou prénom. La recherche est instantanée et insensible à la casse.',
        category: 'tip',
        target: '[data-onboarding="client-search"]',
        position: 'bottom',
        trigger: 'focus'
      },
      {
        id: 'client-stats-cards',
        title: 'Vue d\'ensemble clients',
        content: 'Métriques clés de votre base clients : total, identifiés vs anonymes, clients VIP à privilégier.',
        category: 'info',
        target: '[data-onboarding="client-stats"]',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'client-filter-tabs',
        title: 'Filtres de segmentation',
        content: 'Filtrez rapidement vos clients : Tous, Identifiés (nom connu), Anonymes (numéro seulement).',
        category: 'tip',
        target: '[data-onboarding="client-tabs"]',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        id: 'client-status-badge',
        title: 'Statuts automatiques',
        content: 'L\'IA attribue des statuts basés sur l\'historique : Nouveau (1er appel), Fidèle (multiples appels/commandes), VIP (montants élevés).',
        category: 'feature',
        target: 'tbody tr:first-child .badge',
        position: 'right',
        trigger: 'hover',
        persistent: true
      },
      {
        id: 'phone-formatting',
        title: 'Numéros formatés',
        content: 'Les numéros de téléphone sont automatiquement formatés au format français pour une meilleure lisibilité.',
        category: 'info',
        target: 'tbody tr:first-child td:nth-child(2)',
        position: 'right',
        trigger: 'hover'
      },
      {
        id: 'call-count-badge',
        title: 'Compteur d\'appels',
        content: 'Nombre total d\'appels reçus de ce client. Plus le nombre est élevé, plus le client est engagé.',
        category: 'tip',
        target: 'tbody tr:first-child .badge:has(.phone-call)',
        position: 'left',
        trigger: 'hover'
      }
    ];

    tips.forEach(tip => registerTip(tip));

    return () => {
      tips.forEach(tip => unregisterTip(tip.id));
    };
  }, [registerTip, unregisterTip]);

  return null;
}