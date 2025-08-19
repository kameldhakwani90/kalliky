import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export interface NotificationData {
  storeId: string;
  businessId: string;
  activityType: 'ORDER' | 'SERVICE' | 'CONSULTATION' | 'SIGNALEMENT';
  activityId: string;
  data: any;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Configuration email avec Nodemailer
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Méthode principale pour déclencher les notifications
  async triggerNotifications(notificationData: NotificationData): Promise<void> {
    try {
      // Ajouter à la queue via API
      const response = await fetch('/api/restaurant/notifications/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error(`Erreur ajout queue: ${response.statusText}`);
      }

      console.log('Notifications ajoutées à la queue avec succès');
    } catch (error) {
      console.error('Erreur déclenchement notifications:', error);
    }
  }

  // Processeur de queue - traite les notifications en attente
  async processQueue(): Promise<void> {
    try {
      const pendingItems = await prisma.notificationQueueItem.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' }
        ],
        take: 10,
        include: {
          config: true
        }
      });

      for (const item of pendingItems) {
        await this.processNotificationItem(item);
      }
    } catch (error) {
      console.error('Erreur traitement queue:', error);
    }
  }

  // Traite un élément individuel de la queue
  private async processNotificationItem(item: any): Promise<void> {
    try {
      // Marquer comme en cours
      await prisma.notificationQueueItem.update({
        where: { id: item.id },
        data: { 
          status: 'PROCESSING',
          processedAt: new Date()
        }
      });

      let success = false;

      switch (item.actionType) {
        case 'EMAIL':
          success = await this.sendEmail(item);
          break;
        case 'WHATSAPP':
          success = await this.sendWhatsApp(item);
          break;
        case 'PRINT':
          success = await this.printTicket(item);
          break;
        case 'CALENDAR':
          success = await this.createCalendarEvent(item);
          break;
        case 'N8N_WEBHOOK':
          success = await this.sendN8NWebhook(item);
          break;
        case 'SMS':
          success = await this.sendSMS(item);
          break;
        case 'SLACK':
          success = await this.sendSlack(item);
          break;
        default:
          console.warn(`Type d'action non supporté: ${item.actionType}`);
      }

      // Mettre à jour le statut
      await prisma.notificationQueueItem.update({
        where: { id: item.id },
        data: { 
          status: success ? 'COMPLETED' : 'FAILED',
          completedAt: success ? new Date() : undefined,
          error: success ? null : 'Échec envoi notification'
        }
      });

    } catch (error) {
      console.error(`Erreur traitement item ${item.id}:`, error);
      
      await prisma.notificationQueueItem.update({
        where: { id: item.id },
        data: { 
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      });
    }
  }

  // Envoi d'email
  private async sendEmail(item: any): Promise<boolean> {
    try {
      const settings = item.actionSettings;
      const data = item.data;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: settings.to || data.email,
        subject: this.replaceVariables(settings.subject || 'Notification', data),
        html: this.replaceVariables(settings.template || settings.content || 'Notification', data)
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  // Envoi WhatsApp (placeholder - nécessite intégration avec provider)
  private async sendWhatsApp(item: any): Promise<boolean> {
    try {
      // TODO: Intégrer avec provider WhatsApp Business API
      console.log('WhatsApp envoyé (simulation):', item.actionSettings);
      return true;
    } catch (error) {
      console.error('Erreur envoi WhatsApp:', error);
      return false;
    }
  }

  // Impression ticket
  private async printTicket(item: any): Promise<boolean> {
    try {
      const settings = item.actionSettings;
      const data = item.data;

      // TODO: Intégrer avec système d'impression
      console.log('Ticket imprimé (simulation):', {
        printer: settings.printer,
        copies: settings.copies,
        data
      });
      return true;
    } catch (error) {
      console.error('Erreur impression ticket:', error);
      return false;
    }
  }

  // Création événement Google Calendar
  private async createCalendarEvent(item: any): Promise<boolean> {
    try {
      // TODO: Intégrer avec Google Calendar API
      console.log('Événement calendar créé (simulation):', item.actionSettings);
      return true;
    } catch (error) {
      console.error('Erreur création événement calendar:', error);
      return false;
    }
  }

  // Envoi webhook N8N
  private async sendN8NWebhook(item: any): Promise<boolean> {
    try {
      const settings = item.actionSettings;
      const webhookUrl = settings.webhook || settings.url;

      if (!webhookUrl) {
        throw new Error('URL webhook manquante');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: item.activityType,
          activityId: item.activityId,
          data: item.data,
          metadata: item.metadata
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur envoi webhook N8N:', error);
      return false;
    }
  }

  // Envoi SMS
  private async sendSMS(item: any): Promise<boolean> {
    try {
      // TODO: Intégrer avec Telnyx ou autre provider SMS
      console.log('SMS envoyé (simulation):', item.actionSettings);
      return true;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }

  // Envoi Slack
  private async sendSlack(item: any): Promise<boolean> {
    try {
      const settings = item.actionSettings;
      const webhookUrl = settings.webhook;

      if (!webhookUrl) {
        throw new Error('Webhook Slack manquant');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: settings.channel,
          text: this.replaceVariables(settings.message || 'Nouvelle notification', item.data),
          username: 'Kalliky AI'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur envoi Slack:', error);
      return false;
    }
  }

  // Remplacement des variables dans les templates
  private replaceVariables(template: string, data: any): string {
    let result = template;
    
    // Variables courantes
    const variables = {
      '{{clientName}}': data.clientName || data.firstName + ' ' + data.lastName,
      '{{businessName}}': data.businessName,
      '{{total}}': data.total,
      '{{date}}': new Date().toLocaleDateString('fr-FR'),
      '{{time}}': new Date().toLocaleTimeString('fr-FR'),
      '{{orderId}}': data.orderId || data.id,
      '{{urgency}}': data.urgency,
      '{{status}}': data.status
    };

    for (const [variable, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(variable, 'g'), String(value || ''));
    }

    return result;
  }
}

// Instance singleton
export const notificationService = new NotificationService();

// Cron job simulé pour traiter la queue
if (typeof window === 'undefined') {
  setInterval(() => {
    notificationService.processQueue();
  }, 30000); // Traite la queue toutes les 30 secondes
}