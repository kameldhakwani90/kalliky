import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId requis' 
      }, { status: 400 });
    }

    // Récupérer la session d'upload
    const uploadSession = await prisma.menuUploadSession.findFirst({
      where: {
        id: sessionId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      },
      include: {
        store: true
      }
    });

    if (!uploadSession) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    if (uploadSession.aiProcessingStatus !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Session déjà traitée ou en cours de traitement' 
      }, { status: 400 });
    }

    // Mettre à jour le statut à "PROCESSING"
    await prisma.menuUploadSession.update({
      where: { id: sessionId },
      data: { 
        aiProcessingStatus: 'PROCESSING',
        processingStartedAt: new Date()
      }
    });

    try {
      // Construire le chemin du fichier
      // Le fichier est sauvegardé avec un timestamp au moment de l'upload
      const uploadDir = path.join(process.cwd(), 'uploads', 'menus');
      
      // Chercher le fichier correspondant à cette session
      const files = fs.readdirSync(uploadDir);
      const sessionFile = files.find(file => file.includes(uploadSession.originalFileName));
      
      if (!sessionFile) {
        throw new Error('Fichier correspondant non trouvé');
      }
      
      const filePath = path.join(uploadDir, sessionFile);

      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new Error('Fichier non trouvé');
      }

      // Préparer le contenu pour OpenAI
      let aiResponse;
      
      if (uploadSession.fileType === 'application/pdf') {
        // Pour les PDF, nous utiliserons un service de conversion ou OCR
        // Pour l'instant, on simule une réponse
        aiResponse = await processImageWithOpenAI(filePath, uploadSession.fileType);
      } else {
        // Pour les images
        aiResponse = await processImageWithOpenAI(filePath, uploadSession.fileType);
      }

      // Parser la réponse JSON de l'IA
      const menuData = JSON.parse(aiResponse);
      
      // Créer les produits dans la base de données
      const createdProducts = [];
      
      for (const item of menuData.items || []) {
        const product = await prisma.product.create({
          data: {
            storeId: uploadSession.storeId,
            name: item.name,
            description: item.description || '',
            category: item.category || 'Général',
            sourceType: 'AI_GENERATED',
            sourceConfidence: item.confidence || 0.8,
            hasComposition: item.hasComposition || false,
            originalComposition: item.composition || null,
            aiDescription: item.aiDescription || null,
            aiKeywords: item.keywords || [],
            menuUploadSessionId: sessionId,
            status: 'DRAFT',
            popularity: 0
          }
        });

        // Créer les variations si fournies
        if (item.variations && item.variations.length > 0) {
          await prisma.productVariation.createMany({
            data: item.variations.map((v: any, index: number) => ({
              productId: product.id,
              name: v.name || `Variation ${index + 1}`,
              type: v.type || 'SIZE',
              value: v.value || '',
              prices: v.prices || { 'dine-in': v.price || 0 },
              isVisible: true,
              isDefault: index === 0,
              order: index
            }))
          });
        }

        // Créer la composition si fournie
        if (item.composition && item.composition.length > 0) {
          for (const [stepIndex, step] of item.composition.entries()) {
            const compositionStep = await prisma.compositionStep.create({
              data: {
                productId: product.id,
                title: step.title,
                isRequired: step.isRequired || false,
                selectionType: step.selectionType || 'SINGLE',
                order: stepIndex,
                aiGenerated: true
              }
            });

            if (step.options && step.options.length > 0) {
              await prisma.compositionOption.createMany({
                data: step.options.map((option: any, optionIndex: number) => ({
                  stepId: compositionStep.id,
                  name: option.name,
                  prices: option.prices || { 'dine-in': option.price || 0 },
                  isVisible: true,
                  order: optionIndex,
                  aiGenerated: true
                }))
              });
            }
          }
        }

        createdProducts.push(product);
      }

      // Mettre à jour la session avec les résultats
      await prisma.menuUploadSession.update({
        where: { id: sessionId },
        data: {
          aiProcessingStatus: 'COMPLETED',
          overallConfidence: menuData.overallConfidence || 0.8,
          productsCreatedCount: createdProducts.length,
          componentsCreated: menuData.componentsCreated || 0,
          componentCategoriesCreated: menuData.categoriesCreated || 0,
          needsReview: menuData.needsReview || false,
          completedAt: new Date(),
          aiResponse: menuData
        }
      });

      return NextResponse.json({
        success: true,
        sessionId,
        status: 'COMPLETED',
        productsCreated: createdProducts.length,
        confidence: menuData.overallConfidence || 0.8,
        needsReview: menuData.needsReview || false,
        message: `Traitement terminé. ${createdProducts.length} produit(s) créé(s).`
      });

    } catch (processingError) {
      console.error('Error processing with AI:', processingError);
      
      // Marquer la session comme échouée
      await prisma.menuUploadSession.update({
        where: { id: sessionId },
        data: {
          aiProcessingStatus: 'FAILED',
          errorMessage: (processingError as Error).message,
          completedAt: new Date()
        }
      });

      return NextResponse.json({
        success: false,
        error: 'Erreur lors du traitement IA',
        details: (processingError as Error).message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in process-menu API:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du traitement du menu' 
    }, { status: 500 });
  }
}

async function processImageWithOpenAI(filePath: string, fileType: string): Promise<string> {
  try {
    // Lire le fichier et le convertir en base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    const prompt = `
Analysez cette image de menu de restaurant et extrayez les informations des produits au format JSON structuré.

Retournez un JSON avec cette structure exacte :
{
  "items": [
    {
      "name": "Nom du produit",
      "description": "Description détaillée",
      "category": "Catégorie (ex: Entrées, Plats, Desserts, Boissons)",
      "price": 12.50,
      "confidence": 0.9,
      "hasComposition": false,
      "composition": [],
      "variations": [
        {
          "name": "Taille",
          "type": "SIZE",
          "value": "Moyenne",
          "price": 12.50
        }
      ],
      "keywords": ["burger", "viande", "fromage"],
      "aiDescription": "Description générée par l'IA"
    }
  ],
  "overallConfidence": 0.85,
  "needsReview": false,
  "categoriesCreated": 4,
  "componentsCreated": 0
}

Règles importantes :
1. Extrayez TOUS les produits visibles
2. Identifiez les catégories logiques
3. Pour les prix, utilisez le format numérique (ex: 12.50)
4. Si un produit a plusieurs tailles/variations, créez des variations
5. Confidence entre 0 et 1 (qualité de l'extraction)
6. needsReview = true si des informations sont incertaines
7. hasComposition = true pour produits personnalisables (burgers, pizzas, etc.)
8. Composition pour les étapes de personnalisation

Analysez maintenant cette image de menu :
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${fileType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Aucune réponse de l\'IA');
    }

    // Nettoyer la réponse pour extraire le JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format JSON non trouvé dans la réponse IA');
    }

    return jsonMatch[0];

  } catch (error) {
    console.error('Error processing with OpenAI:', error);
    throw new Error(`Erreur OpenAI: ${(error as Error).message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId requis' 
      }, { status: 400 });
    }

    // Récupérer le statut de la session
    const uploadSession = await prisma.menuUploadSession.findFirst({
      where: {
        id: sessionId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      },
      select: {
        id: true,
        aiProcessingStatus: true,
        overallConfidence: true,
        productsCreatedCount: true,
        componentsCreated: true,
        componentCategoriesCreated: true,
        needsReview: true,
        errorMessage: true,
        createdAt: true,
        processingStartedAt: true,
        completedAt: true
      }
    });

    if (!uploadSession) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    return NextResponse.json({
      sessionId,
      status: uploadSession.aiProcessingStatus,
      confidence: uploadSession.overallConfidence,
      productsCreated: uploadSession.productsCreatedCount,
      componentsCreated: uploadSession.componentsCreated,
      categoriesCreated: uploadSession.componentCategoriesCreated,
      needsReview: uploadSession.needsReview,
      errorMessage: uploadSession.errorMessage,
      timestamps: {
        created: uploadSession.createdAt,
        started: uploadSession.processingStartedAt,
        completed: uploadSession.completedAt
      }
    });

  } catch (error) {
    console.error('Error fetching processing status:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du statut' 
    }, { status: 500 });
  }
}