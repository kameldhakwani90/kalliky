// ============================================================================
// TELNYX SERVICE - Gestion automatique des numéros virtuels
// ============================================================================

import { prisma } from './prisma';

interface TelnyxNumberSearchResult {
  id: string;
  phone_number: string;
  record_type: string;
  region_information: Array<{
    region_type: string;
    region_name: string;
  }>;
  cost_information: {
    monthly_cost: string;
    upfront_cost: string;
  };
}

interface TelnyxVoiceApp {
  id: string;
  friendly_name: string;
  webhook_event_url: string;
  webhook_event_failover_url?: string;
}

export class TelnyxService {
  private apiKey: string;
  private baseUrl = 'https://api.telnyx.com/v2';
  
  constructor() {
    this.apiKey = process.env.TELNYX_API_KEY!;
    if (!this.apiKey) {
      throw new Error('TELNYX_API_KEY is required');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telnyx API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // Rechercher des numéros disponibles par pays
  async searchAvailableNumbers(countryCode: string, limit = 10): Promise<TelnyxNumberSearchResult[]> {
    const params = new URLSearchParams({
      'filter[country_code]': countryCode,
      'filter[features]': 'voice',
      'filter[limit]': limit.toString(),
      'filter[national_destination_code]': '1', // Pour numéros locaux
    });

    const response = await this.makeRequest(`/available_phone_numbers?${params}`);
    return response.data || [];
  }

  // Acheter un numéro
  async purchaseNumber(phoneNumberId: string, voiceAppId?: string): Promise<any> {
    const body: any = {
      phone_number_id: phoneNumberId,
    };

    if (voiceAppId) {
      body.connection_id = voiceAppId;
    }

    return this.makeRequest('/phone_numbers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Créer une Voice Application
  async createVoiceApp(name: string, webhookUrl: string): Promise<TelnyxVoiceApp> {
    const body = {
      friendly_name: name,
      webhook_event_url: webhookUrl,
      webhook_event_failover_url: `${webhookUrl}/failover`,
      webhook_api_version: '2',
      webhook_timeout_secs: 25,
    };

    const response = await this.makeRequest('/texml_applications', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response.data;
  }

  // Configurer un numéro avec Voice App
  async configureNumber(phoneNumber: string, voiceAppId: string): Promise<any> {
    return this.makeRequest(`/phone_numbers/${phoneNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({
        connection_id: voiceAppId,
        webhook_event_url: process.env.NEXT_PUBLIC_APP_URL + '/api/telnyx/webhooks',
      }),
    });
  }

  // Suspendre un numéro
  async suspendNumber(phoneNumber: string): Promise<any> {
    return this.makeRequest(`/phone_numbers/${phoneNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'disabled',
      }),
    });
  }

  // Réactiver un numéro
  async reactivateNumber(phoneNumber: string): Promise<any> {
    return this.makeRequest(`/phone_numbers/${phoneNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'active',
      }),
    });
  }

  // Supprimer un numéro
  async releaseNumber(phoneNumber: string): Promise<any> {
    return this.makeRequest(`/phone_numbers/${phoneNumber}`, {
      method: 'DELETE',
    });
  }

  // Obtenir les prix par pays
  getCountryPrice(countryCode: string): number {
    const prices: Record<string, number> = {
      'FR': parseFloat(process.env.TELNYX_FR_PRICE || '1.00'),
      'US': parseFloat(process.env.TELNYX_US_PRICE || '1.00'),
      'GB': parseFloat(process.env.TELNYX_GB_PRICE || '1.20'),
      'DE': parseFloat(process.env.TELNYX_DE_PRICE || '1.50'),
      'ES': parseFloat(process.env.TELNYX_ES_PRICE || '1.50'),
      'IT': parseFloat(process.env.TELNYX_IT_PRICE || '1.50'),
      'CA': parseFloat(process.env.TELNYX_CA_PRICE || '1.00'),
      'AU': parseFloat(process.env.TELNYX_AU_PRICE || '1.50'),
    };

    return prices[countryCode] || parseFloat(process.env.TELNYX_DEFAULT_PRICE || '1.50');
  }
}

// ============================================================================
// SERVICE AUTO-PURCHASE POUR NOUVELLES BOUTIQUES
// ============================================================================

export class TelnyxAutoPurchaseService {
  private telnyx: TelnyxService;

  constructor() {
    this.telnyx = new TelnyxService();
  }

  // Acheter automatiquement un numéro pour une nouvelle boutique
  async purchaseNumberForStore(businessId: string, storeId: string, countryCode: string): Promise<string> {
    try {
      console.log(`🔄 Auto-purchase numéro pour ${countryCode} - Business: ${businessId}`);

      // 1. Vérifier si auto-purchase est activé
      if (process.env.TELNYX_AUTO_PURCHASE !== 'true') {
        throw new Error('Auto-purchase désactivé');
      }

      // 2. Créer une Voice App pour cette boutique
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      if (!store) throw new Error('Store not found');

      const voiceAppName = `Kalliky-${store.name}-${countryCode}`;
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/webhooks`;
      
      const voiceApp = await this.telnyx.createVoiceApp(voiceAppName, webhookUrl);
      console.log(`✅ Voice App créée: ${voiceApp.id}`);

      // 3. Rechercher des numéros disponibles
      const availableNumbers = await this.telnyx.searchAvailableNumbers(countryCode, 5);
      if (availableNumbers.length === 0) {
        throw new Error(`Aucun numéro ${countryCode} disponible`);
      }

      const selectedNumber = availableNumbers[0];
      console.log(`📞 Numéro sélectionné: ${selectedNumber.phone_number}`);

      // 4. Acheter le numéro
      const purchaseResult = await this.telnyx.purchaseNumber(selectedNumber.id, voiceApp.id);
      console.log(`✅ Numéro acheté: ${purchaseResult.data.phone_number}`);

      // 5. Sauvegarder en base
      const phoneNumber = await prisma.phoneNumber.create({
        data: {
          number: purchaseResult.data.phone_number,
          telnyxId: purchaseResult.data.id,
          businessId,
          country: countryCode,
          status: 'ACTIVE',
          monthlyPrice: this.telnyx.getCountryPrice(countryCode),
          telnyxConfig: {
            voiceAppId: voiceApp.id,
            voiceAppName: voiceAppName,
            webhookUrl: webhookUrl,
          },
        },
      });

      console.log(`💾 Numéro sauvegardé en DB: ${phoneNumber.id}`);
      return purchaseResult.data.phone_number;

    } catch (error) {
      console.error('❌ Erreur auto-purchase:', error);
      
      // Sauvegarder l'erreur en DB
      await prisma.phoneNumber.create({
        data: {
          number: `ERROR_${Date.now()}`,
          telnyxId: `ERROR_${Date.now()}`,
          businessId,
          country: countryCode,
          status: 'ERROR',
          monthlyPrice: 0,
          telnyxConfig: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  }

  // Suspendre numéro pour non-paiement
  async suspendNumberForBusiness(businessId: string): Promise<void> {
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { businessId, status: 'ACTIVE' },
    });

    for (const phoneNumber of phoneNumbers) {
      try {
        await this.telnyx.suspendNumber(phoneNumber.number);
        await prisma.phoneNumber.update({
          where: { id: phoneNumber.id },
          data: { 
            status: 'SUSPENDED',
            suspendedAt: new Date(),
          },
        });
        console.log(`⏸️ Numéro suspendu: ${phoneNumber.number}`);
      } catch (error) {
        console.error(`❌ Erreur suspension ${phoneNumber.number}:`, error);
      }
    }
  }

  // Réactiver numéros après paiement
  async reactivateNumbersForBusiness(businessId: string): Promise<void> {
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { businessId, status: 'SUSPENDED' },
    });

    for (const phoneNumber of phoneNumbers) {
      try {
        await this.telnyx.reactivateNumber(phoneNumber.number);
        await prisma.phoneNumber.update({
          where: { id: phoneNumber.id },
          data: { 
            status: 'ACTIVE',
            suspendedAt: null,
          },
        });
        console.log(`▶️ Numéro réactivé: ${phoneNumber.number}`);
      } catch (error) {
        console.error(`❌ Erreur réactivation ${phoneNumber.number}:`, error);
      }
    }
  }

  // Annuler définitivement les numéros
  async cancelNumbersForBusiness(businessId: string): Promise<void> {
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { businessId, status: { in: ['ACTIVE', 'SUSPENDED'] } },
    });

    for (const phoneNumber of phoneNumbers) {
      try {
        await this.telnyx.releaseNumber(phoneNumber.number);
        await prisma.phoneNumber.update({
          where: { id: phoneNumber.id },
          data: { 
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
        console.log(`❌ Numéro annulé: ${phoneNumber.number}`);
      } catch (error) {
        console.error(`❌ Erreur annulation ${phoneNumber.number}:`, error);
      }
    }
  }
}

// Export des instances
export const telnyxService = new TelnyxService();
export const telnyxAutoPurchase = new TelnyxAutoPurchaseService();