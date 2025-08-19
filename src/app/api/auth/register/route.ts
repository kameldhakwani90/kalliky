import { NextResponse } from 'next/server';
import { PrismaClient, UserRole, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      businessName,
      businessType,
      plan = 'STARTER'
    } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur et le business en une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: UserRole.CLIENT
        }
      });

      // Si un business est fourni, le créer
      if (businessName) {
        const business = await tx.business.create({
          data: {
            name: businessName,
            type: businessType || 'PRODUCTS',
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
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}