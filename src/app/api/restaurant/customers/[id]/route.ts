import { NextRequest, NextResponse } from 'next/server';

// GET - Version simplifiée pour les démos
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Données mock pour les démos
    const mockCustomers: Record<string, any> = {
      'demo-1': {
        id: 'demo-1',
        phone: '+33612345678',
        firstName: 'Sophie',
        lastName: 'Martin',
        email: null,
        status: 'Fidèle',
        avgBasket: '25.50€',
        totalSpent: '245.50€',
        orderCount: 12,
        exchangeCount: 0,
        callCount: 8,
        firstSeen: '2024-01-15',
        lastSeen: '2024-08-17',
        history: [
          {
            id: 'CMD-001',
            type: 'order',
            date: '2024-08-17',
            items: [
              {
                name: 'Pain Tradition',
                quantity: 2,
                finalPrice: 1.20,
                customizations: [
                  { type: 'add', name: 'Beurre extra', price: 0.20 }
                ]
              },
              {
                name: 'Croissant',
                quantity: 4,
                finalPrice: 1.10,
                customizations: []
              },
              {
                name: 'Café Expresso',
                quantity: 1,
                finalPrice: 2.50,
                customizations: [
                  { type: 'add', name: 'Sucre de canne', price: 0.00 }
                ]
              }
            ],
            total: 9.30
          },
          {
            id: 'SERV-001',
            type: 'reservation',
            date: '2024-08-17',
            serviceName: 'Consultation Nutrition',
            pricingDetails: [
              { description: 'Consultation de base (1h)', amount: 60.00 },
              { description: 'Plan alimentaire personnalisé', amount: 25.00 },
              { description: 'Suivi pendant 3 mois', amount: 40.00 }
            ],
            total: 125.00
          },
          {
            id: 'CONS-001',
            type: 'consultation',
            date: '2024-08-17',
            serviceName: 'Consultation Juridique - Droit du Travail',
            transcript: 'Mon employeur refuse de me payer mes heures supplémentaires depuis 3 mois. J\'ai des preuves écrites mais il dit que c\'était du bénévolat. Que puis-je faire légalement ?',
            analysis: {
              score: 85,
              summary: 'Cas relevant clairement du droit du travail. Violation des dispositions sur les heures supplémentaires.',
              positivePoints: [
                'Domaine d\'expertise : droit du travail',
                'Preuves écrites disponibles',
                'Violation claire du code du travail',
                'Cas récurrent et bien documenté'
              ],
              negativePoints: [
                'Délai de 3 mois déjà écoulé',
                'Nécessite action rapide',
                'Possible conflit d\'interprétation sur le bénévolat'
              ]
            },
            total: 150.00
          },
          {
            id: 'SIGN-001',
            type: 'signalement',
            date: '2024-08-17',
            problemType: 'produit_defectueux',
            urgency: 'eleve',
            title: 'Pain moisi livré ce matin',
            description: 'J\'ai reçu ce matin ma commande de pain tradition mais il y avait des traces de moisissures vertes sur la croûte. C\'est inacceptable pour un produit alimentaire !',
            status: 'en_cours',
            assignedTo: 'Équipe Qualité',
            actionsRequired: [
              'Vérification stock restant',
              'Remboursement immédiat',
              'Investigation fournisseur',
              'Nettoyage zone stockage'
            ],
            actionsTaken: [
              'Commande remboursée intégralement',
              'Stock vérifié - 2 autres pains concernés retirés'
            ],
            deadline: '2024-08-18',
            total: 0.00,
            refundAmount: 2.40
          },
          {
            id: 'SIGN-002', 
            type: 'signalement',
            date: '2024-08-16',
            problemType: 'service_insatisfaisant',
            urgency: 'moyen',
            title: 'Retard consultation nutrition',
            description: 'Ma consultation était prévue à 14h mais j\'ai attendu 45 minutes. Aucune excuse ni explication. Service client à revoir.',
            status: 'resolu',
            assignedTo: 'Manager Planning',
            actionsRequired: [
              'Excuse formelle client',
              'Réorganisation planning',
              'Formation équipe ponctualité'
            ],
            actionsTaken: [
              'Appel d\'excuse personnel effectué',
              'Consultation offerte en compensation',
              'Planning réorganisé pour éviter surcharge'
            ],
            deadline: '2024-08-17',
            total: 0.00,
            compensationOffered: 'Consultation gratuite prochaine fois'
          }
        ],
        orderHistory: [],
        exchangeHistory: [],
        callHistory: [
          {
            id: 'call-1',
            type: 'call',
            date: '2024-08-17',
            duration: '3:24',
            callType: 'INFO',
            audioUrl: '/demo-audio.mp3',
            transcript: 'Transcription complète de l\'appel disponible...'
          }
        ],
        aiConversations: [
          {
            id: 'ai-1',
            callId: 'call-1',
            messages: [
              {
                role: 'assistant',
                content: 'Bonjour, Les Coutumes à votre service.',
                timestamp: '2024-08-17T14:30:00Z'
              },
              {
                role: 'user',
                content: 'Je voudrais commander 2 pains.',
                timestamp: '2024-08-17T14:30:15Z'
              }
            ],
            extractedInfo: {
              intent: 'order',
              satisfaction: 9
            },
            aiAnalysis: {
              sentiment: 'positive',
              satisfaction: 9,
              summary: 'Commande de produits'
            }
          }
        ],
        business: {
          id: 'demo-business',
          name: 'Les Coutumes',
          type: 'PRODUCTS'
        }
      },
      'cust-1': {
        id: 'cust-1',
        phone: '+33612345678',
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice.martin@email.com',
        status: 'Fidèle',
        avgBasket: '54.50€',
        totalSpent: '54.50€',
        orderCount: 2,
        exchangeCount: 0,
        callCount: 3,
        firstSeen: '2024-05-15',
        lastSeen: '2024-05-30',
        history: [],
        orderHistory: [],
        exchangeHistory: [],
        callHistory: [],
        aiConversations: [],
        business: {
          id: 'demo-business',
          name: 'Les Coutumes',
          type: 'PRODUCTS'
        }
      }
    };

    const customer = mockCustomers[id] || mockCustomers['demo-1'];
    
    return NextResponse.json(customer);

  } catch (error) {
    console.error('Mock API Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}