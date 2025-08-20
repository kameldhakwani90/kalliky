import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import jwt from 'jsonwebtoken';
import { settingsService } from '@/lib/email';

// Import des templates
import WelcomeEmail from '../../../../../../../emails/welcome-email';
import TrialWarningEmail from '../../../../../../../emails/trial-warning-email';
import PasswordResetEmail from '../../../../../../../emails/password-reset-email';
import TrialBlockedEmail from '../../../../../../../emails/trial-blocked-email';
import TrialDeletionWarningEmail from '../../../../../../../emails/trial-deletion-warning-email';
import AccountDeletedEmail from '../../../../../../../emails/account-deleted-email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return new NextResponse('Accès admin requis', { status: 403 });
    }

    const { template } = await params;

    // Récupérer les données de branding depuis la base
    const [companyName, logoUrl, footerText] = await Promise.all([
      settingsService.get('company_name'),
      settingsService.get('email_logo_url'),
      settingsService.get('email_footer_text')
    ]);

    // Données de test pour les templates avec branding réel
    const testData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@exemple.com',
      restaurantName: 'Restaurant de Démo',
      company: 'Restaurant de Démo',
      plan: 'STARTER',
      tempPassword: 'demo123',
      callsUsed: 8,
      callsRemaining: 2,
      daysRemaining: 3,
      totalCallsUsed: 10,
      daysUntilDeletion: 3,
      deletionDate: new Date().toLocaleDateString('fr-FR'),
      logoUrl: logoUrl || undefined,
      companyName: companyName || 'Orderspot',
      footerText: footerText || 'Orderspot.pro - Solution IA pour restaurants'
    };

    let emailHtml: string;

    switch (template) {
      case 'welcome':
        emailHtml = await render(WelcomeEmail(testData));
        break;
      
      case 'trial_warning':
        emailHtml = await render(TrialWarningEmail(testData));
        break;
      
      case 'trial_blocked':
        emailHtml = await render(TrialBlockedEmail(testData));
        break;
      
      case 'trial_deletion':
        emailHtml = await render(TrialDeletionWarningEmail(testData));
        break;
      
      case 'account_deleted':
        emailHtml = await render(AccountDeletedEmail(testData));
        break;
      
      default:
        return new NextResponse('Template non trouvé', { status: 404 });
    }

    // Retourner le HTML avec les headers appropriés
    return new NextResponse(emailHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Erreur preview email template:', error);
    
    const errorHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #dc2626; margin-bottom: 10px;">❌ Erreur de Preview</h2>
            <p style="color: #991b1b;">${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}