import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Configuration des services de notification
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// POST - Envoyer une notification
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      type, 
      storeId, 
      customerId, 
      orderId, 
      callLogId,
      channels, 
      templateId, 
      data 
    } = await request.json();

    if (!type || !storeId || !channels?.length) {
      return NextResponse.json({ error: 'type, storeId et channels requis' }, { status: 400 });
    }

    // Récupérer le store et ses paramètres de notification
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      },
      include: {
        business: {
          include: {
            owner: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    const settings = store.settings as any || {};
    const notificationSettings = settings.notifications || {};

    // Récupérer les informations du client si fourni
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId: store.business.id
        }
      });
    }

    const results = [];

    // Traiter chaque canal de notification
    for (const channel of channels) {
      try {
        let result;
        
        switch (channel) {
          case 'email':
            result = await sendEmailNotification(store, customer, type, templateId, data, notificationSettings);
            break;
          case 'sms':
            result = await sendSMSNotification(store, customer, type, templateId, data, notificationSettings);
            break;
          case 'webhook':
            result = await sendWebhookNotification(store, customer, type, templateId, data, notificationSettings);
            break;
          case 'push':
            result = await sendPushNotification(store, customer, type, templateId, data, notificationSettings);
            break;
          default:
            result = { success: false, error: `Canal ${channel} non supporté` };
        }

        results.push({ channel, ...result });

      } catch (error: any) {
        results.push({ 
          channel, 
          success: false, 
          error: error.message 
        });
      }
    }

    // Enregistrer l'historique des notifications
    if (callLogId || orderId) {
      await logNotification(storeId, customerId, orderId, callLogId, type, channels, results);
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur lors de l\'envoi de notification' 
    }, { status: 500 });
  }
}

async function sendEmailNotification(store: any, customer: any, type: string, templateId: string, data: any, settings: any) {
  if (!settings.email?.enabled) {
    return { success: false, error: 'Notifications email désactivées' };
  }

  const template = getEmailTemplate(type, templateId);
  const emailContent = renderTemplate(template, { store, customer, data });

  // Déterminer le destinataire
  let toEmail = settings.email?.defaultRecipient || store.business.owner.email;
  if (customer?.email && (type === 'order_confirmation' || type === 'customer_message')) {
    toEmail = customer.email;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@pixigrad.com',
    to: toEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    return { success: true, recipient: toEmail };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendSMSNotification(store: any, customer: any, type: string, templateId: string, data: any, settings: any) {
  if (!settings.sms?.enabled) {
    return { success: false, error: 'Notifications SMS désactivées' };
  }

  // Intégration avec un service SMS (ex: Twilio, OVH, etc.)
  const template = getSMSTemplate(type, templateId);
  const smsContent = renderTemplate(template, { store, customer, data });

  // Déterminer le destinataire
  let toPhone = settings.sms?.defaultRecipient || store.business.phoneNumbers[0]?.number;
  if (customer?.phone && (type === 'order_confirmation' || type === 'customer_message')) {
    toPhone = customer.phone;
  }

  // TODO: Implémenter l'envoi SMS réel
  console.log('📱 SMS à envoyer:', { to: toPhone, message: smsContent.text });
  
  return { success: true, recipient: toPhone, message: 'SMS simulé (intégration à implémenter)' };
}

async function sendWebhookNotification(store: any, customer: any, type: string, templateId: string, data: any, settings: any) {
  if (!settings.webhook?.enabled || !settings.webhook?.url) {
    return { success: false, error: 'Webhook non configuré' };
  }

  const payload = {
    timestamp: new Date().toISOString(),
    store: {
      id: store.id,
      name: store.name
    },
    customer: customer ? {
      id: customer.id,
      phone: customer.phone,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    } : null,
    type,
    data
  };

  try {
    const response = await fetch(settings.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kalliky-Signature': generateWebhookSignature(payload, settings.webhook.secret)
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    return { success: true, url: settings.webhook.url, status: response.status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendPushNotification(store: any, customer: any, type: string, templateId: string, data: any, settings: any) {
  if (!settings.push?.enabled) {
    return { success: false, error: 'Notifications push désactivées' };
  }

  // TODO: Implémenter les notifications push (Firebase, etc.)
  console.log('🔔 Push notification à envoyer:', { store: store.name, type, data });
  
  return { success: true, message: 'Push notification simulée (intégration à implémenter)' };
}

function getEmailTemplate(type: string, templateId?: string) {
  const templates = {
    order_received: {
      subject: 'Nouvelle commande reçue - {{store.name}}',
      html: `
        <h2>Nouvelle commande reçue</h2>
        <p>Une nouvelle commande a été passée via l'agent IA.</p>
        <p><strong>Client:</strong> {{customer.phone}}</p>
        <p><strong>Montant:</strong> {{data.total}}€</p>
        <p><strong>Type:</strong> {{data.serviceType}}</p>
        {{#if data.items}}
        <h3>Détails de la commande:</h3>
        <ul>
        {{#each data.items}}
          <li>{{quantity}}x {{productName}} - {{totalPrice}}€</li>
        {{/each}}
        </ul>
        {{/if}}
      `,
      text: 'Nouvelle commande reçue de {{customer.phone}} pour {{data.total}}€'
    },
    call_missed: {
      subject: 'Appel manqué - {{store.name}}',
      html: `
        <h2>Appel manqué</h2>
        <p>Un appel n'a pas pu être traité par l'agent IA.</p>
        <p><strong>Numéro:</strong> {{customer.phone}}</p>
        <p><strong>Heure:</strong> {{data.timestamp}}</p>
        <p><strong>Raison:</strong> {{data.reason}}</p>
      `,
      text: 'Appel manqué de {{customer.phone}} à {{data.timestamp}}'
    },
    system_error: {
      subject: 'Erreur système - {{store.name}}',
      html: `
        <h2>Erreur système détectée</h2>
        <p>Une erreur s'est produite dans le système IA.</p>
        <p><strong>Type:</strong> {{data.errorType}}</p>
        <p><strong>Message:</strong> {{data.message}}</p>
        <p><strong>Heure:</strong> {{data.timestamp}}</p>
      `,
      text: 'Erreur système: {{data.errorType}} - {{data.message}}'
    }
  };

  return templates[type as keyof typeof templates] || templates.order_received;
}

function getSMSTemplate(type: string, templateId?: string) {
  const templates = {
    order_received: {
      text: '📋 Nouvelle commande {{data.total}}€ de {{customer.phone}} via IA. Détails: {{store.name}}'
    },
    call_missed: {
      text: '📞 Appel manqué de {{customer.phone}} à {{data.timestamp}}. Vérifiez votre système IA.'
    },
    system_error: {
      text: '⚠️ Erreur système IA: {{data.errorType}}. Vérifiez votre configuration.'
    }
  };

  return templates[type as keyof typeof templates] || templates.order_received;
}

function renderTemplate(template: any, context: any): any {
  // Simple template rendering (remplacer par un vrai moteur de template en production)
  let rendered = { ...template };
  
  for (const key in rendered) {
    rendered[key] = rendered[key]
      .replace(/\{\{store\.name\}\}/g, context.store?.name || '')
      .replace(/\{\{customer\.phone\}\}/g, context.customer?.phone || '')
      .replace(/\{\{data\.total\}\}/g, context.data?.total || '')
      .replace(/\{\{data\.serviceType\}\}/g, context.data?.serviceType || '')
      .replace(/\{\{data\.timestamp\}\}/g, context.data?.timestamp || new Date().toLocaleString())
      .replace(/\{\{data\.reason\}\}/g, context.data?.reason || '')
      .replace(/\{\{data\.errorType\}\}/g, context.data?.errorType || '')
      .replace(/\{\{data\.message\}\}/g, context.data?.message || '');
  }
  
  return rendered;
}

function generateWebhookSignature(payload: any, secret: string): string {
  // Génération simple de signature (utiliser crypto.createHmac en production)
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

async function logNotification(storeId: string, customerId?: string, orderId?: string, callLogId?: string, type: string, channels: string[], results: any[]) {
  // TODO: Créer un modèle NotificationLog dans Prisma pour tracer les notifications
  console.log('📝 Notification log:', {
    storeId,
    customerId,
    orderId,
    callLogId,
    type,
    channels,
    results
  });
}

// GET - Récupérer l'historique des notifications
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requis' }, { status: 400 });
    }

    // TODO: Récupérer depuis NotificationLog quand le modèle sera créé
    const mockNotifications = [
      {
        id: '1',
        type: 'order_received',
        channels: ['email', 'sms'],
        timestamp: new Date(),
        success: true,
        recipient: 'restaurant@example.com'
      }
    ];

    return NextResponse.json({ notifications: mockNotifications });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des notifications' 
    }, { status: 500 });
  }
}