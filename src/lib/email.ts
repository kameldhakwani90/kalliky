import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import WelcomeEmail from '../../emails/welcome-email';
import PasswordResetEmail from '../../emails/password-reset-email';
import { prisma } from './prisma';

// Types pour les emails
export interface WelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  plan: string;
  tempPassword: string;
}

export interface PasswordResetEmailData {
  firstName: string;
  email: string;
  resetToken: string;
}

// Service de gestion des settings
export const settingsService = {
  async get(key: string): Promise<string | null> {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key }
      });
      return setting?.value || null;
    } catch (error) {
      console.error(`Erreur récupération setting ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: string, description?: string): Promise<void> {
    try {
      await prisma.settings.upsert({
        where: { key },
        update: { value, description },
        create: { key, value, description }
      });
    } catch (error) {
      console.error(`Erreur sauvegarde setting ${key}:`, error);
      throw error;
    }
  }
};

// Créer le transporteur Nodemailer
async function createTransporter() {
  const [smtpHost, smtpPort, smtpUser, smtpPass] = await Promise.all([
    settingsService.get('smtp_host'),
    settingsService.get('smtp_port'),
    settingsService.get('smtp_user'),
    settingsService.get('smtp_pass')
  ]);

  return nodemailer.createTransporter({
    host: smtpHost || 'smtp.gmail.com',
    port: parseInt(smtpPort || '587'),
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: smtpUser || process.env.SMTP_USER,
      pass: smtpPass || process.env.SMTP_PASS
    }
  });
}

// Service d'envoi d'emails
export const emailService = {
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      // Récupérer les settings personnalisés
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      const emailHtml = render(WelcomeEmail({
        ...data,
        logoUrl: logoUrl || undefined,
        companyName: companyName || 'Kalliky',
        footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      }));

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'noreply@kalliky.com',
        to: data.email,
        subject: `Bienvenue dans ${companyName || 'Kalliky'} !`,
        html: emailHtml
      });

      console.log('✅ Email de bienvenue envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email bienvenue:', error);
      return false;
    }
  },

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      // Récupérer les settings personnalisés
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      const emailHtml = render(PasswordResetEmail({
        ...data,
        logoUrl: logoUrl || undefined,
        companyName: companyName || 'Kalliky',
        footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      }));

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'noreply@kalliky.com',
        to: data.email,
        subject: 'Réinitialisation de votre mot de passe',
        html: emailHtml
      });

      console.log('✅ Email reset mot de passe envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email reset:', error);
      return false;
    }
  },

  // Fonction de test pour preview
  async previewWelcomeEmail(): Promise<string> {
    const [logoUrl, companyName, footerText] = await Promise.all([
      settingsService.get('email_logo_url'),
      settingsService.get('company_name'),
      settingsService.get('email_footer_text')
    ]);

    return render(WelcomeEmail({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@restaurant.com',
      company: 'Restaurant Test',
      plan: 'STARTER',
      tempPassword: 'temp123',
      logoUrl: logoUrl || undefined,
      companyName: companyName || 'Kalliky',
      footerText: footerText || 'Kalliky - Solution IA pour restaurants'
    }));
  }
};

// Initialiser les settings par défaut
export async function initializeDefaultSettings() {
  try {
    const defaultSettings = [
      {
        key: 'company_name',
        value: 'Kalliky',
        description: 'Nom de la société affiché dans les emails'
      },
      {
        key: 'email_logo_url',
        value: '',
        description: 'URL du logo affiché dans les emails (optionnel)'
      },
      {
        key: 'email_footer_text',
        value: 'Kalliky - Solution IA pour restaurants',
        description: 'Texte du footer des emails'
      },
      {
        key: 'email_from',
        value: 'noreply@kalliky.com',
        description: 'Adresse email d\'expéditeur'
      },
      {
        key: 'smtp_host',
        value: 'smtp.gmail.com',
        description: 'Serveur SMTP'
      },
      {
        key: 'smtp_port',
        value: '587',
        description: 'Port SMTP'
      },
      {
        key: 'smtp_user',
        value: '',
        description: 'Nom d\'utilisateur SMTP'
      },
      {
        key: 'smtp_pass',
        value: '',
        description: 'Mot de passe SMTP'
      },
      // Stripe
      {
        key: 'stripe_publishable_key',
        value: '',
        description: 'Clé publique Stripe'
      },
      {
        key: 'stripe_secret_key',
        value: '',
        description: 'Clé secrète Stripe'
      },
      {
        key: 'stripe_webhook_secret',
        value: '',
        description: 'Secret webhook Stripe'
      },
      // Telnyx
      {
        key: 'telnyx_api_key',
        value: '',
        description: 'Clé API Telnyx'
      },
      {
        key: 'telnyx_phone_number_pool_id',
        value: '',
        description: 'ID du pool de numéros Telnyx'
      },
      {
        key: 'telnyx_webhook_url',
        value: '',
        description: 'URL webhook Telnyx'
      }
    ];

    for (const setting of defaultSettings) {
      await settingsService.set(setting.key, setting.value, setting.description);
    }

    console.log('⚙️ Settings par défaut initialisés');
  } catch (error) {
    console.error('❌ Erreur initialisation settings:', error);
  }
}