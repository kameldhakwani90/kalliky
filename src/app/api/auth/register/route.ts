import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { validatePasswordStrength } from '@/lib/password-utils';

const prisma = new PrismaClient();

// Fonction de validation email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fonction de sanitization
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 100); // Limite à 100 caractères
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 inscriptions par 5 minutes par IP
    const rateLimitResult = await rateLimitMiddleware(request, 'REGISTER');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Trop de tentatives d\'inscription. Réessayez dans quelques minutes.',
          retryAfter: rateLimitResult.headers['Retry-After']
        },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }
    
    const body = await request.json();
    
    // Validation stricte du format
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      businessName,
      businessType,
      plan = 'STARTER'
    } = body;

    // Validation stricte des champs requis
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email valide requis' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Validation de la force du mot de passe
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Le mot de passe ne répond pas aux exigences de sécurité. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
          feedback: passwordValidation.feedback 
        },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    if (!firstName || typeof firstName !== 'string') {
      return NextResponse.json(
        { error: 'Prénom requis' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    if (!lastName || typeof lastName !== 'string') {
      return NextResponse.json(
        { error: 'Nom de famille requis' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Sanitization des inputs
    const sanitizedData = {
      email: email.toLowerCase().trim(),
      firstName: sanitizeString(firstName),
      lastName: sanitizeString(lastName),
      phone: phone ? sanitizeString(phone) : null,
      businessName: businessName ? sanitizeString(businessName) : null,
      businessType: businessType ? sanitizeString(businessType) : null
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur et le business en une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email: sanitizedData.email,
          password: hashedPassword,
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          phone: sanitizedData.phone,
          role: UserRole.CLIENT
        }
      });

      // Si un business est fourni, le créer
      if (sanitizedData.businessName) {
        const business = await tx.business.create({
          data: {
            name: sanitizedData.businessName,
            type: sanitizedData.businessType || 'PRODUCTS',
            ownerId: user.id
          }
        });

        // Créer la souscription
        await tx.subscription.create({
          data: {
            businessId: business.id,
            plan: plan as SubscriptionPlan,
            status: 'trial',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        });
      }

      return user;
    });

    // Retourner l'utilisateur créé (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = result;

    return NextResponse.json({
      message: 'Inscription réussie',
      user: userWithoutPassword
    }, { status: 201, headers: rateLimitResult.headers });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}