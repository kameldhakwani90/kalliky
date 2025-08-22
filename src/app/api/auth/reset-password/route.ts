import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { token, code, newPassword } = await request.json();

    if (!token || !code || !newPassword) {
      return NextResponse.json({ 
        error: 'Token, code et nouveau mot de passe requis' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      }, { status: 400 });
    }

    // Vérifier le token et le code
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!resetToken) {
      return NextResponse.json({ 
        error: 'Code invalide ou expiré' 
      }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Marquer le token comme utilisé
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    // Supprimer tous les autres tokens de réinitialisation pour cet utilisateur
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.'
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// API pour vérifier uniquement le code (optionnel)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const code = searchParams.get('code');

    if (!token || !code) {
      return NextResponse.json({ 
        error: 'Token et code requis' 
      }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    return NextResponse.json({
      valid: !!resetToken,
      expired: !resetToken
    });

  } catch (error) {
    console.error('Erreur verify-code:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}