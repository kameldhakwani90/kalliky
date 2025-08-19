import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// POST - Créer une session OpenAI Realtime
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, callControlId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requis' }, { status: 400 });
    }

    // Récupérer les paramètres du store et de l'agent IA
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      },
      include: {
        business: true,
        products: {
          include: {
            variations: true,
            compositionSteps: {
              include: {
                options: true
              }
            }
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    const settings = store.settings as any || {};
    const aiAgent = settings.aiAgent;

    if (!aiAgent?.enabled) {
      return NextResponse.json({ error: 'Agent IA non activé' }, { status: 400 });
    }

    // Construire le contexte du catalogue
    const catalogContext = buildCatalogContext(store);
    
    // Construire les instructions système
    const systemInstructions = buildSystemInstructions(aiAgent, store, catalogContext);

    // Créer la session OpenAI Realtime
    const realtimeResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiAgent.plan === 'STARTER' ? 'gpt-4o-mini-realtime-preview' : 'gpt-4o-realtime-preview',
        voice: aiAgent.voice || 'alloy',
        instructions: systemInstructions,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: buildTools(aiAgent),
        tool_choice: 'auto',
        temperature: 0.7,
        max_response_output_tokens: 4096
      })
    });

    if (!realtimeResponse.ok) {
      throw new Error('Erreur lors de la création de la session Realtime');
    }

    const realtimeData = await realtimeResponse.json();

    // Enregistrer la session en base
    await prisma.callLog.create({
      data: {
        storeId,
        phoneNumber: '', // À remplir depuis Telnyx
        duration: 0,
        timestamp: new Date(),
        aiAnalysis: {
          sessionId: realtimeData.id,
          model: aiAgent.plan === 'STARTER' ? 'gpt-4o-mini' : 'gpt-4o',
          voice: aiAgent.voice,
          plan: aiAgent.plan
        }
      }
    });

    return NextResponse.json({
      sessionId: realtimeData.id,
      sessionToken: realtimeData.client_secret?.value,
      websocketUrl: `wss://api.openai.com/v1/realtime/sessions/${realtimeData.id}/ws`,
      model: aiAgent.plan === 'STARTER' ? 'gpt-4o-mini' : 'gpt-4o',
      voice: aiAgent.voice
    });

  } catch (error: any) {
    console.error('Error creating Realtime session:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur lors de la création de la session' 
    }, { status: 500 });
  }
}

function buildCatalogContext(store: any): string {
  const products = store.products || [];
  
  if (products.length === 0) {
    return "Aucun produit disponible dans le catalogue.";
  }

  let context = `Catalogue ${store.name}:\n\n`;
  
  products.forEach((product: any) => {
    context += `**${product.name}**\n`;
    if (product.description) {
      context += `Description: ${product.description}\n`;
    }
    
    // Variations et prix
    if (product.variations && product.variations.length > 0) {
      context += `Variations:\n`;
      product.variations.forEach((variation: any) => {
        const prices = variation.prices as any;
        context += `- ${variation.name}: `;
        if (prices?.dineIn) context += `${prices.dineIn}€ (sur place) `;
        if (prices?.takeaway) context += `${prices.takeaway}€ (à emporter) `;
        if (prices?.delivery) context += `${prices.delivery}€ (livraison)`;
        context += `\n`;
      });
    }
    
    // Composition
    if (product.compositionSteps && product.compositionSteps.length > 0) {
      context += `Composition personnalisable:\n`;
      product.compositionSteps.forEach((step: any) => {
        context += `- ${step.title} ${step.isRequired ? '(obligatoire)' : '(optionnel)'}\n`;
        step.options?.forEach((option: any) => {
          const prices = option.prices as any;
          context += `  • ${option.name}`;
          if (prices?.dineIn && prices.dineIn > 0) {
            context += ` (+${prices.dineIn}€)`;
          }
          context += `\n`;
        });
      });
    }
    
    context += `\n`;
  });
  
  return context;
}

function buildSystemInstructions(aiAgent: any, store: any, catalogContext: string): string {
  let instructions = `Tu es ${aiAgent.name || 'l\'assistant'} de ${store.name}.

CONTEXTE:
${aiAgent.personality || 'Tu es un assistant professionnel et sympathique.'}

${catalogContext}

INSTRUCTIONS:
1. Accueille chaleureusement les clients
2. Prends les commandes de manière claire et précise
3. Propose des suggestions appropriées (upselling)
4. Confirme chaque commande avant finalisation
5. Fournis les informations de livraison/retrait
6. Reste poli et professionnel

RÈGLES:
- Réponds uniquement aux questions liées aux produits et commandes
- Si tu ne connais pas une information, dis-le honnêtement
- Propose toujours des alternatives si un produit n'est pas disponible
- Confirme les prix et options avant finalisation`;

  if (aiAgent.upselling?.enabled) {
    instructions += `\n\nUPSELLING:
- Propose des suggestions pertinentes basées sur la commande
- Mentionne les produits populaires ou en promotion
- Suggère des compléments naturels (boissons, desserts, etc.)`;
  }

  if (aiAgent.features?.multilingual) {
    instructions += `\n\nLANGUES:
- Détecte automatiquement la langue du client
- Réponds dans la même langue (français, anglais, arabe)
- Adapte ton niveau de langage au client`;
  }

  return instructions;
}

function buildTools(aiAgent: any): any[] {
  const tools = [
    {
      type: 'function',
      name: 'create_order',
      description: 'Créer une commande avec les produits sélectionnés',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                productName: { type: 'string' },
                quantity: { type: 'integer' },
                variation: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                unitPrice: { type: 'number' },
                totalPrice: { type: 'number' }
              },
              required: ['productName', 'quantity', 'unitPrice', 'totalPrice']
            }
          },
          customerPhone: { type: 'string' },
          customerName: { type: 'string' },
          serviceType: { type: 'string', enum: ['dineIn', 'takeaway', 'delivery'] },
          specialInstructions: { type: 'string' }
        },
        required: ['items', 'customerPhone', 'serviceType']
      }
    },
    {
      type: 'function',
      name: 'get_product_info',
      description: 'Obtenir des informations détaillées sur un produit',
      parameters: {
        type: 'object',
        properties: {
          productName: { type: 'string' }
        },
        required: ['productName']
      }
    }
  ];

  return tools;
}

// GET - Récupérer les sessions actives
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requis' }, { status: 400 });
    }

    // Récupérer les sessions actives des dernières 24h
    const activeSessions = await prisma.callLog.findMany({
      where: {
        storeId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    return NextResponse.json({ sessions: activeSessions });

  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des sessions' 
    }, { status: 500 });
  }
}