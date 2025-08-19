import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requis' },
        { status: 400 }
      );
    }

    // Dates pour les calculs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Stats du mois en cours
    const currentMonthOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: startOfMonth }
      }
    });

    // Stats du mois dernier
    const lastMonthOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });

    // Calculs
    const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
      : 0;

    const totalOrders = currentMonthOrders.length;
    const lastMonthOrdersCount = lastMonthOrders.length;
    const ordersGrowth = lastMonthOrdersCount > 0
      ? ((totalOrders - lastMonthOrdersCount) / lastMonthOrdersCount * 100)
      : 0;

    const avgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lastMonthAvgBasket = lastMonthOrdersCount > 0 
      ? lastMonthRevenue / lastMonthOrdersCount 
      : 0;
    const basketGrowth = lastMonthAvgBasket > 0
      ? ((avgBasket - lastMonthAvgBasket) / lastMonthAvgBasket * 100)
      : 0;

    // Clients uniques
    const uniqueCustomers = await prisma.customer.count({
      where: {
        businessId,
        lastSeen: { gte: startOfMonth }
      }
    });

    const lastMonthUniqueCustomers = await prisma.customer.count({
      where: {
        businessId,
        lastSeen: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });

    const customersGrowth = lastMonthUniqueCustomers > 0
      ? ((uniqueCustomers - lastMonthUniqueCustomers) / lastMonthUniqueCustomers * 100)
      : 0;

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        growth: revenueGrowth,
        formatted: `${totalRevenue.toFixed(2)}€`
      },
      orders: {
        total: totalOrders,
        growth: ordersGrowth
      },
      avgBasket: {
        value: avgBasket,
        growth: basketGrowth,
        formatted: `${avgBasket.toFixed(2)}€`
      },
      customers: {
        unique: uniqueCustomers,
        growth: customersGrowth
      }
    });

  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}