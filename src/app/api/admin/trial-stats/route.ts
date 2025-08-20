import { NextRequest, NextResponse } from 'next/server';
import { TrialUsageService } from '@/lib/trial-usage';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    // Récupérer les statistiques trial
    const stats = await TrialUsageService.getTrialStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Erreur GET trial stats:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}