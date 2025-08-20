import { NextResponse } from 'next/server';
import { settingsService, initializeDefaultSettings } from '@/lib/email';

// GET - Récupérer tous les settings
export async function GET() {
  try {
    // NOTE: initializeDefaultSettings() ne doit être appelé qu'au démarrage
    // pas à chaque requête GET car cela écrase les valeurs personnalisées

    // Récupérer seulement les paramètres applicatifs (pas les secrets .env)
    const [
      companyName, logoUrl, footerText, emailFrom, smtpHost, smtpPort, smtpUser, smtpPass,
      defaultCurrency, defaultLanguage, maintenanceMode, maxStoresPerClient
    ] = await Promise.all([
      settingsService.get('company_name'),
      settingsService.get('email_logo_url'),
      settingsService.get('email_footer_text'),
      settingsService.get('email_from'),
      settingsService.get('smtp_host'),
      settingsService.get('smtp_port'),
      settingsService.get('smtp_user'),
      settingsService.get('smtp_pass'),
      settingsService.get('default_currency'),
      settingsService.get('default_language'),
      settingsService.get('maintenance_mode'),
      settingsService.get('max_stores_per_client')
    ]);

    const settings = {
      company_name: companyName || 'Kalliky',
      email_logo_url: logoUrl || '',
      email_footer_text: footerText || 'Kalliky - Solution IA pour restaurants',
      email_from: emailFrom || 'no-reply@pixigrad.com',
      smtp_host: smtpHost || 'smtp.gmail.com',
      smtp_port: smtpPort || '587',
      smtp_user: smtpUser || '',
      smtp_pass: smtpPass || '',
      default_currency: defaultCurrency || 'EUR',
      default_language: defaultLanguage || 'fr',
      maintenance_mode: maintenanceMode || 'false',
      max_stores_per_client: maxStoresPerClient || '10'
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
  return await saveSettings(request);
}

// PUT - Sauvegarder les settings (alias pour POST)
export async function PUT(request: Request) {
  return await saveSettings(request);
}

// Fonction commune pour sauvegarder les settings
async function saveSettings(request: Request) {
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

    // Sauvegarder chaque setting (seulement si la valeur n'est pas undefined)
    const settingsToSave = [
      { key: 'company_name', value: company_name, description: 'Nom de la société affiché dans les emails' },
      { key: 'email_logo_url', value: email_logo_url, description: 'URL du logo affiché dans les emails' },
      { key: 'email_footer_text', value: email_footer_text, description: 'Texte du footer des emails' },
      { key: 'email_from', value: email_from, description: 'Adresse email d\'expéditeur' },
      { key: 'smtp_host', value: smtp_host, description: 'Serveur SMTP' },
      { key: 'smtp_port', value: smtp_port, description: 'Port SMTP' },
      { key: 'smtp_user', value: smtp_user, description: 'Nom d\'utilisateur SMTP' },
      { key: 'smtp_pass', value: smtp_pass, description: 'Mot de passe SMTP' },
      { key: 'stripe_publishable_key', value: stripe_publishable_key, description: 'Clé publique Stripe' },
      { key: 'stripe_secret_key', value: stripe_secret_key, description: 'Clé secrète Stripe' },
      { key: 'stripe_webhook_secret', value: stripe_webhook_secret, description: 'Secret webhook Stripe' },
      { key: 'telnyx_api_key', value: telnyx_api_key, description: 'Clé API Telnyx' },
      { key: 'telnyx_phone_number_pool_id', value: telnyx_phone_number_pool_id, description: 'ID du pool de numéros Telnyx' },
      { key: 'telnyx_webhook_url', value: telnyx_webhook_url, description: 'URL webhook Telnyx' }
    ];

    await Promise.all(
      settingsToSave
        .filter(setting => setting.value !== undefined && setting.value !== null)
        .map(setting => settingsService.set(setting.key, String(setting.value), setting.description))
    );

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