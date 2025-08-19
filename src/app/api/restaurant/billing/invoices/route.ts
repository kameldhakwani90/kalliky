import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// GET - Récupérer les factures
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Récupérer l'utilisateur avec son business
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                businesses: {
                    include: {
                        invoices: {
                            orderBy: {
                                createdAt: 'desc'
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const business = user.businesses[0];
        if (!business) {
            return NextResponse.json({ invoices: [] });
        }

        // Combiner les factures locales avec celles de Stripe
        const localInvoices = business.invoices.map(invoice => ({
            id: invoice.invoiceNumber,
            date: invoice.createdAt,
            amount: invoice.amount, // Déjà en centimes
            status: invoice.status === 'paid' ? 'Payée' : 'En attente',
            stripeInvoiceId: invoice.stripeInvoiceId,
            pdfUrl: invoice.stripeInvoiceId ? `https://dashboard.stripe.com/test/invoices/${invoice.stripeInvoiceId}` : null
        }));

        // Récupérer également les factures directement depuis Stripe si l'utilisateur a un stripeCustomerId
        let stripeInvoices: any[] = [];
        if (user.stripeCustomerId) {
            try {
                const stripeInvoiceList = await stripe.invoices.list({
                    customer: user.stripeCustomerId,
                    limit: 50,
                    status: 'paid'
                });

                stripeInvoices = stripeInvoiceList.data.map(invoice => ({
                    id: invoice.number || invoice.id,
                    date: new Date(invoice.created * 1000),
                    amount: invoice.amount_paid,
                    status: 'Payée',
                    stripeInvoiceId: invoice.id,
                    pdfUrl: invoice.hosted_invoice_url || invoice.invoice_pdf
                }));
            } catch (stripeError) {
                console.error('Error fetching Stripe invoices:', stripeError);
                // Continue avec les factures locales seulement
            }
        }

        // Combiner et dédupliquer les factures
        const allInvoices = [...localInvoices];
        
        // Ajouter les factures Stripe qui ne sont pas déjà en local
        stripeInvoices.forEach(stripeInvoice => {
            const existsInLocal = localInvoices.some(local => local.stripeInvoiceId === stripeInvoice.stripeInvoiceId);
            if (!existsInLocal) {
                allInvoices.push(stripeInvoice);
            }
        });

        // Trier par date (plus récent en premier)
        allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({ invoices: allInvoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}