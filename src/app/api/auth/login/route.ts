import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 tentatives par minute par IP
    const rateLimitResult = await rateLimitMiddleware(request, 'LOGIN');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
          retryAfter: rateLimitResult.headers['Retry-After']
        },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }
    
    const body = await request.json();
    
    // Validation stricte des inputs
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400 }
      );
    }
    
    const { email, password } = body;
    
    // Validation des types et formats
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Mot de passe requis (minimum 6 caractères)' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Sanitization email
    const sanitizedEmail = email.toLowerCase().trim();

    // Chercher l'utilisateur avec email sanitized
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        businesses: {
          include: {
            stores: {
              include: {
                subscription: true
              }
            },
            phoneNumbers: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cet email. Vérifiez votre adresse email ou créez un compte.' },
        { status: 401, headers: rateLimitResult.headers }
      );
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect. Vérifiez votre mot de passe et réessayez.' },
        { status: 401, headers: rateLimitResult.headers }
      );
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Retourner les infos utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      token,
      user: userWithoutPassword
    }, { headers: rateLimitResult.headers });

    // Définir le cookie auth-token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });

    return response;

  } catch (error) {
    console.error('Erreur login:', error);
    
    // Gestion d'erreurs spécifiques
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Format JSON invalide' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}