import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const period = searchParams.get('period') || 'month';

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requis' },
        { status: 400 }
      );
    }

    const now = new Date();
    const data = [];

    if (period === 'month') {
      // Données des 6 derniers mois
      for (let i = 5; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const orders = await prisma.order.findMany({
          where: {
            businessId,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const revenue = orders.reduce((sum, order) => sum + order.total, 0);
        
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        data.push({
          name: monthNames[startDate.getMonth()],
          revenue: revenue
        });
      }
    } else if (period === 'week') {
      // Données des 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const orders = await prisma.order.findMany({
          where: {
            businessId,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        const revenue = orders.reduce((sum, order) => sum + order.total, 0);
        
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        data.push({
          name: dayNames[date.getDay()],
          revenue: revenue
        });
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur chart dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}