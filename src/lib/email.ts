import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import WelcomeEmail from '../../emails/welcome-email';
import PasswordResetEmail from '../../emails/password-reset-email';
import TrialWarningEmail from '../../emails/trial-warning-email';
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

export interface TrialWarningEmailData {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  callsUsed: number;
  callsRemaining: number;
  daysRemaining: number;
}

export interface TrialBlockedEmailData {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  totalCallsUsed: number;
}

export interface TrialDeletionWarningEmailData {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  daysUntilDeletion: number;
}

export interface AccountDeletedEmailData {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  deletionDate: string;
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

  // Utiliser .env comme fallback si les settings DB sont vides
  const finalSmtpUser = (smtpUser && smtpUser.trim() !== '') ? smtpUser : process.env.SMTP_USER;
  const finalSmtpPass = (smtpPass && smtpPass.trim() !== '') ? smtpPass : process.env.SMTP_PASS;

  const port = parseInt(smtpPort || '587');
  const secure = port === 465; // SSL pour port 465, STARTTLS pour 587

  return nodemailer.createTransport({
    host: smtpHost || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: finalSmtpUser,
      pass: finalSmtpPass
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
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
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
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
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

  async sendTrialWarningEmail(data: TrialWarningEmailData): Promise<boolean> {
    try {
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      const emailHtml = render(TrialWarningEmail({
        ...data,
        logoUrl: logoUrl || undefined,
        companyName: companyName || 'Kalliky',
        footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      }));

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
        to: data.email,
        subject: `⚠️ Période d'essai bientôt terminée - ${data.restaurantName}`,
        html: emailHtml
      });

      console.log('✅ Email d\'avertissement trial envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email avertissement trial:', error);
      return false;
    }
  },

  async sendTrialBlockedEmail(data: TrialBlockedEmailData): Promise<boolean> {
    try {
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      // const emailHtml = render(TrialBlockedEmail({
      //   ...data,
      //   logoUrl: logoUrl || undefined,
      //   companyName: companyName || 'Kalliky',
      //   footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      // }));
      const emailHtml = '<p>Email temporairement désactivé</p>';

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
        to: data.email,
        subject: `🔒 Service suspendu - ${data.restaurantName}`,
        html: emailHtml
      });

      console.log('✅ Email de blocage trial envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email blocage trial:', error);
      return false;
    }
  },

  async sendTrialDeletionWarningEmail(data: TrialDeletionWarningEmailData): Promise<boolean> {
    try {
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      // const emailHtml = render(TrialDeletionWarningEmail({
      //   ...data,
      //   logoUrl: logoUrl || undefined,
      //   companyName: companyName || 'Kalliky',
      //   footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      // }));
      const emailHtml = '<p>Email temporairement désactivé</p>';

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
        to: data.email,
        subject: `🚨 URGENT - Compte supprimé dans ${data.daysUntilDeletion} jours`,
        html: emailHtml
      });

      console.log('✅ Email d\'avertissement suppression envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email avertissement suppression:', error);
      return false;
    }
  },

  async sendAccountDeletedEmail(data: AccountDeletedEmailData): Promise<boolean> {
    try {
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      // const emailHtml = render(AccountDeletedEmail({
      //   ...data,
      //   logoUrl: logoUrl || undefined,
      //   companyName: companyName || 'Kalliky',
      //   footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      // }));
      const emailHtml = '<p>Email temporairement désactivé</p>';

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
        to: data.email,
        subject: `Compte supprimé - ${data.restaurantName}`,
        html: emailHtml
      });

      console.log('✅ Email de confirmation suppression envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email confirmation suppression:', error);
      return false;
    }
  },

  // Fonction de test pour preview
  async sendPasswordResetCodeEmail(email: string, code: string, firstName?: string, userLanguage?: string): Promise<boolean> {
    try {
      // Récupérer les settings personnalisés
      const [logoUrl, companyName, footerText, emailFrom] = await Promise.all([
        settingsService.get('email_logo_url'),
        settingsService.get('company_name'),
        settingsService.get('email_footer_text'),
        settingsService.get('email_from')
      ]);

      // Template HTML personnalisé pour le code de réinitialisation
      const emailHtml = this.generatePasswordResetCodeHTML(code, firstName, {
        logoUrl: logoUrl || undefined,
        companyName: companyName || 'Kalliky',
        footerText: footerText || 'Kalliky - Solution IA pour restaurants',
        language: userLanguage
      });

      const transporter = await createTransporter();
      
      const result = await transporter.sendMail({
        from: emailFrom || process.env.EMAIL_FROM || 'no-reply@pixigrad.com',
        to: email,
        subject: `Code de réinitialisation - ${companyName || 'Kalliky'}`,
        html: emailHtml
      });

      console.log('✅ Email code réinitialisation envoyé:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email code reset:', error);
      // Mode développement - afficher dans les logs
      console.log('\n📧 ===== EMAIL CODE RÉINITIALISATION (MODE DEV) =====');
      console.log(`📧 À: ${email}`);
      console.log(`👤 Nom: ${firstName || 'Utilisateur'}`);
      console.log(`🔢 Code: ${code}`);
      console.log('=================================================\n');
      return true; // Retourner true en mode développement
    }
  },

  generatePasswordResetCodeHTML(code: string, firstName?: string, settings?: { logoUrl?: string; companyName?: string; footerText?: string; language?: string }): string {
    const companyName = settings?.companyName || 'Kalliky';
    const logoUrl = settings?.logoUrl;
    const footerText = settings?.footerText || 'Kalliky - Solution IA pour restaurants';
    const isEnglish = settings?.language === 'en';

    // Traductions
    const t = {
      title: isEnglish ? 'Password Reset' : 'Code de réinitialisation',
      greeting: isEnglish ? 'Hello' : 'Bonjour',
      message: isEnglish 
        ? 'You requested to reset your password. Use the verification code below to continue.'
        : 'Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code de vérification ci-dessous pour continuer.',
      codeLabel: isEnglish ? 'Verification code' : 'Code de vérification',
      codeHint: isEnglish ? 'Valid for 15 minutes' : 'Ce code expire dans 15 minutes',
      instructionsTitle: isEnglish ? 'How to proceed:' : 'Comment procéder :',
      instructions: isEnglish
        ? '1. Return to the reset screen<br>2. Enter the 6-digit code above<br>3. Choose your new password'
        : '1. Retournez à l\'écran de réinitialisation<br>2. Saisissez le code à 6 chiffres ci-dessus<br>3. Choisissez votre nouveau mot de passe',
      warningTitle: isEnglish ? 'Important' : 'Important',
      warning: isEnglish
        ? 'If you did not request this reset, ignore this email. Your current password remains unchanged.'
        : 'Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.',
      support: isEnglish ? 'Have questions? Contact our support team.' : 'Vous avez des questions ? Contactez notre équipe support.',
      help: isEnglish ? 'Help' : 'Aide',
      privacy: isEnglish ? 'Privacy' : 'Confidentialité',
      terms: isEnglish ? 'Terms' : 'Conditions'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code de réinitialisation</title>
        <style>
          body {
            background-color: #f6f9fc;
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
            margin: 0;
            padding: 20px 0;
          }
          .container {
            background-color: #ffffff;
            margin: 40px auto;
            padding: 0;
            max-width: 600px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            padding: 32px 40px 24px;
            border-bottom: 1px solid #e6ebf1;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #32325d;
            margin: 0;
          }
          .logo img {
            max-width: 120px;
            height: auto;
          }
          .content {
            padding: 32px 40px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #32325d;
            margin-bottom: 24px;
            line-height: 1.4;
          }
          .paragraph {
            font-size: 16px;
            line-height: 1.6;
            color: #525f7f;
            margin-bottom: 16px;
          }
          .code-box {
            background-color: #f6f9fc;
            border: 1px solid #e6ebf1;
            border-radius: 6px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
          }
          .code-title {
            font-size: 18px;
            font-weight: bold;
            color: #32325d;
            margin-bottom: 16px;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #5469d4;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
            margin: 16px 0;
          }
          .code-hint {
            font-size: 14px;
            color: #6b7c93;
            margin-top: 8px;
          }
          .instructions {
            background-color: #f6f9fc;
            border: 1px solid #e6ebf1;
            border-left: 4px solid #5469d4;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
          }
          .instructions-title {
            font-size: 16px;
            font-weight: bold;
            color: #32325d;
            margin-bottom: 12px;
          }
          .instructions-text {
            font-size: 14px;
            color: #525f7f;
            line-height: 1.5;
            margin: 0;
          }
          .warning {
            background-color: #fff5f5;
            border: 1px solid #fed7d7;
            border-left: 4px solid #fc8181;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
          }
          .warning-text {
            font-size: 14px;
            color: #742a2a;
            margin: 0;
          }
          .footer {
            background-color: #f6f9fc;
            padding: 24px 40px;
            border-top: 1px solid #e6ebf1;
            border-radius: 0 0 8px 8px;
          }
          .footer-text {
            font-size: 14px;
            color: #6b7c93;
            text-align: center;
            margin-bottom: 8px;
          }
          .footer-links {
            font-size: 14px;
            color: #6b7c93;
            text-align: center;
          }
          .footer-link {
            color: #6b7c93;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : `<div class="logo">${companyName}</div>`}
          </div>
          
          <div class="content">
            <div class="title">${t.title}</div>
            
            <div class="paragraph">
              ${t.greeting} ${firstName || (isEnglish ? 'User' : 'Utilisateur')},
            </div>
            
            <div class="paragraph">
              ${t.message}
            </div>
            
            <div class="code-box">
              <div class="code-title">${t.codeLabel}</div>
              <div class="code">${code}</div>
              <div class="code-hint">${t.codeHint}</div>
            </div>

            <div class="instructions">
              <div class="instructions-title">${t.instructionsTitle}</div>
              <div class="instructions-text">
                ${t.instructions}
              </div>
            </div>
            
            <div class="warning">
              <div class="warning-text">
                <strong>${t.warningTitle} :</strong> ${t.warning}
              </div>
            </div>

            <div class="paragraph">
              ${t.support}
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              <strong>${footerText}</strong>
            </div>
            <div class="footer-links">
              <a href="#" class="footer-link">${t.help}</a> •
              <a href="#" class="footer-link">${t.privacy}</a> •
              <a href="#" class="footer-link">${t.terms}</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

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
        value: 'no-reply@pixigrad.com',
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