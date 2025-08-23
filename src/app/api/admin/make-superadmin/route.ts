// API temporaire pour transformer l'utilisateur connecté en SUPERADMIN
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Mettre à jour le rôle de l'utilisateur connecté
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { role: 'SUPER_ADMIN' }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Utilisateur ${updatedUser.email} maintenant SUPERADMIN` 
    });

  } catch (error) {
    console.error('Error making superadmin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}