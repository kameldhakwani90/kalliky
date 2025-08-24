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
      secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') || false,
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
    
    // Erreurs Prisma/Base de données
    if (error && typeof error === 'object') {
      const err = error as any;
      
      // Erreur de table manquante (développement)
      if (err.code === 'P2021') {
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.' },
          { status: 503 }
        );
      }
      
      // Erreur de connexion à la base de données
      if (err.code === 'P1001' || err.code === 'P1008' || err.code === 'P1009') {
        return NextResponse.json(
          { error: 'Problème de connexion au service. Veuillez réessayer.' },
          { status: 503 }
        );
      }
      
      // Erreurs de contraintes
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà associée à un compte.' },
          { status: 409 }
        );
      }
      
      // Timeout de la base de données
      if (err.code === 'P2024' || err.message?.includes('timeout')) {
        return NextResponse.json(
          { error: 'Le service met du temps à répondre. Veuillez réessayer.' },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur interne. Nos équipes ont été notifiées.' },
      { status: 500 }
    );
  }
}