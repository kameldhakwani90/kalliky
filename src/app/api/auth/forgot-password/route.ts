import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSecureToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendResetEmail(email: string, code: string, firstName?: string) {
  try {
    return await emailService.sendPasswordResetCodeEmail(email, code, firstName);
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        error: 'Email requis' 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Pour des raisons de sécurité, on retourne toujours success
      // même si l'utilisateur n'existe pas
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, un code de réinitialisation a été envoyé.'
      });
    }

    // Supprimer les anciens tokens non utilisés
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } }
        ]
      }
    });

    // Générer nouveau token et code
    const token = generateSecureToken();
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Créer le token de réinitialisation
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        code,
        expiresAt,
        used: false
      }
    });

    // Envoyer l'email
    const emailSent = await sendResetEmail(user.email, code, user.firstName);

    return NextResponse.json({
      success: true,
      emailSent,
      message: 'Un code de réinitialisation a été envoyé à votre email.',
      resetToken: token // Nécessaire pour l'étape suivante
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}