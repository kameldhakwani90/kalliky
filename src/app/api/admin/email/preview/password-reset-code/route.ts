import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { emailService, settingsService } from '@/lib/email';

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

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer les settings depuis la base de données
    const [logoUrl, companyName, footerText] = await Promise.all([
      settingsService.get('email_logo_url'),
      settingsService.get('company_name'),
      settingsService.get('email_footer_text')
    ]);

    // Générer un aperçu avec des données de test mais les vraies settings
    const previewHtml = emailService.generatePasswordResetCodeHTML(
      '123456',
      'Jean Dupont',
      {
        logoUrl: logoUrl || undefined,
        companyName: companyName || 'Kalliky',
        footerText: footerText || 'Kalliky - Solution IA pour restaurants'
      }
    );

    return new Response(previewHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Erreur preview password reset code email:', error);
    return NextResponse.json({ 
      error: 'Erreur génération preview' 
    }, { status: 500 });
  }
}