import { NextResponse } from 'next/server';
import { settingsService, initializeDefaultSettings } from '@/lib/email';

// GET - Récupérer tous les settings
export async function GET() {
  try {
    // Initialiser les settings par défaut si nécessaire
    await initializeDefaultSettings();

    // Récupérer les settings
    const [
      companyName, logoUrl, footerText, emailFrom, smtpHost, smtpPort, smtpUser, smtpPass,
      stripePublishableKey, stripeSecretKey, stripeWebhookSecret,
      telnyxApiKey, telnyxPhoneNumberPoolId, telnyxWebhookUrl
    ] = await Promise.all([
      settingsService.get('company_name'),
      settingsService.get('email_logo_url'),
      settingsService.get('email_footer_text'),
      settingsService.get('email_from'),
      settingsService.get('smtp_host'),
      settingsService.get('smtp_port'),
      settingsService.get('smtp_user'),
      settingsService.get('smtp_pass'),
      settingsService.get('stripe_publishable_key'),
      settingsService.get('stripe_secret_key'),
      settingsService.get('stripe_webhook_secret'),
      settingsService.get('telnyx_api_key'),
      settingsService.get('telnyx_phone_number_pool_id'),
      settingsService.get('telnyx_webhook_url')
    ]);

    const settings = {
      company_name: companyName || 'Kalliky',
      email_logo_url: logoUrl || '',
      email_footer_text: footerText || 'Kalliky - Solution IA pour restaurants',
      email_from: emailFrom || 'noreply@kalliky.com',
      smtp_host: smtpHost || 'smtp.gmail.com',
      smtp_port: smtpPort || '587',
      smtp_user: smtpUser || '',
      smtp_pass: smtpPass || '',
      stripe_publishable_key: stripePublishableKey || '',
      stripe_secret_key: stripeSecretKey || '',
      stripe_webhook_secret: stripeWebhookSecret || '',
      telnyx_api_key: telnyxApiKey || '',
      telnyx_phone_number_pool_id: telnyxPhoneNumberPoolId || '',
      telnyx_webhook_url: telnyxWebhookUrl || ''
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erreur GET settings:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder les settings
export async function POST(request: Request) {
  try {
    const { 
      company_name, 
      email_logo_url, 
      email_footer_text, 
      email_from, 
      smtp_host, 
      smtp_port, 
      smtp_user, 
      smtp_pass,
      stripe_publishable_key,
      stripe_secret_key,
      stripe_webhook_secret,
      telnyx_api_key,
      telnyx_phone_number_pool_id,
      telnyx_webhook_url
    } = await request.json();

    // Sauvegarder chaque setting
    await Promise.all([
      settingsService.set('company_name', company_name, 'Nom de la société affiché dans les emails'),
      settingsService.set('email_logo_url', email_logo_url, 'URL du logo affiché dans les emails'),
      settingsService.set('email_footer_text', email_footer_text, 'Texte du footer des emails'),
      settingsService.set('email_from', email_from, 'Adresse email d\'expéditeur'),
      settingsService.set('smtp_host', smtp_host, 'Serveur SMTP'),
      settingsService.set('smtp_port', smtp_port, 'Port SMTP'),
      settingsService.set('smtp_user', smtp_user, 'Nom d\'utilisateur SMTP'),
      settingsService.set('smtp_pass', smtp_pass, 'Mot de passe SMTP'),
      settingsService.set('stripe_publishable_key', stripe_publishable_key, 'Clé publique Stripe'),
      settingsService.set('stripe_secret_key', stripe_secret_key, 'Clé secrète Stripe'),
      settingsService.set('stripe_webhook_secret', stripe_webhook_secret, 'Secret webhook Stripe'),
      settingsService.set('telnyx_api_key', telnyx_api_key, 'Clé API Telnyx'),
      settingsService.set('telnyx_phone_number_pool_id', telnyx_phone_number_pool_id, 'ID du pool de numéros Telnyx'),
      settingsService.set('telnyx_webhook_url', telnyx_webhook_url, 'URL webhook Telnyx')
    ]);

    return NextResponse.json({
      message: 'Paramètres sauvegardés avec succès',
      settings: { 
        company_name, 
        email_logo_url, 
        email_footer_text, 
        email_from, 
        smtp_host, 
        smtp_port, 
        smtp_user, 
        smtp_pass,
        stripe_publishable_key,
        stripe_secret_key,
        stripe_webhook_secret,
        telnyx_api_key,
        telnyx_phone_number_pool_id,
        telnyx_webhook_url
      }
    });
  } catch (error) {
    console.error('Erreur POST settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}