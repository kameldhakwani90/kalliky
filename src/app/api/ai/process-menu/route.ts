import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import fs from 'fs';
import { unlink } from 'fs/promises';
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

    // Récupérer la session d'upload avec les settings du store
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
        store: {
          select: {
            id: true,
            name: true,
            settings: true,
            businessCategory: true
          }
        }
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

    // Mettre à jour le statut à "EXTRACTING_TEXT"
    await prisma.menuUploadSession.update({
      where: { id: sessionId },
      data: { 
        aiProcessingStatus: 'EXTRACTING_TEXT'
      }
    });

    try {
      // Construire le chemin du fichier
      // Le fichier est sauvegardé avec un timestamp au moment de l'upload
      const uploadDir = path.join(process.cwd(), 'uploads', 'menus');
      
      console.log('🔍 Searching for file in directory:', uploadDir);
      console.log('🔍 Original filename from session:', uploadSession.originalFileName);
      
      // Chercher le fichier correspondant à cette session
      const files = fs.readdirSync(uploadDir);
      console.log('🔍 Available files in directory:', files);
      
      const sessionFile = files.find(file => file.includes(uploadSession.originalFileName));
      console.log('🔍 Found session file:', sessionFile);
      
      if (!sessionFile) {
        console.error('❌ File not found! Available files:', files);
        console.error('❌ Looking for filename containing:', uploadSession.originalFileName);
        throw new Error(`Fichier correspondant non trouvé. Fichiers disponibles: ${files.join(', ')}`);
      }
      
      const filePath = path.join(uploadDir, sessionFile);
      console.log('📂 Full file path:', filePath);

      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new Error('Fichier non trouvé');
      }

      // Préparer le contenu pour OpenAI
      let aiResponse;
      
      if (uploadSession.fileType === 'application/pdf') {
        // Pour les PDF, nous utiliserons un service de conversion ou OCR
        // Pour l'instant, on simule une réponse
        aiResponse = await processImageWithOpenAI(filePath, uploadSession.fileType, uploadSession.store);
      } else {
        // Pour les images
        aiResponse = await processImageWithOpenAI(filePath, uploadSession.fileType, uploadSession.store);
      }

      // Parser la réponse JSON de l'IA
      const menuData = JSON.parse(aiResponse);
      
      // 1. Créer les catégories de composants automatiquement
      const componentCategories = new Map();
      if (menuData.componentLibrary && menuData.componentLibrary.length > 0) {
        const uniqueCategories = [...new Set(menuData.componentLibrary.map((comp: any) => comp.category))];
        
        for (const categoryName of uniqueCategories) {
          try {
            const category = await prisma.componentCategory.create({
              data: {
                storeId: uploadSession.storeId,
                name: categoryName,
                description: `Catégorie créée automatiquement par l'IA`,
                aiGenerated: true,
                frequency: 0,
                order: 0
              }
            });
            componentCategories.set(categoryName, category.id);
          } catch (error) {
            // Catégorie peut-être déjà existante, on la récupère
            const existingCategory = await prisma.componentCategory.findFirst({
              where: {
                storeId: uploadSession.storeId,
                name: categoryName
              }
            });
            if (existingCategory) {
              componentCategories.set(categoryName, existingCategory.id);
            }
          }
        }
      }

      // 2. Créer les composants automatiquement
      const createdComponents = new Map();
      if (menuData.componentLibrary && menuData.componentLibrary.length > 0) {
        for (const comp of menuData.componentLibrary) {
          try {
            // Vérifier si le composant existe déjà
            const existingComponent = await prisma.component.findFirst({
              where: {
                storeId: uploadSession.storeId,
                categoryId: componentCategories.get(comp.category),
                name: comp.name
              }
            });

            if (existingComponent) {
              console.log(`✅ Component ${comp.name} already exists, using existing one`);
              createdComponents.set(comp.name, existingComponent.id);
            } else {
              const component = await prisma.component.create({
                data: {
                  storeId: uploadSession.storeId,
                  categoryId: componentCategories.get(comp.category),
                  name: comp.name,
                  description: `Composant créé automatiquement par l'IA`,
                  aliases: comp.aliases || [],
                  defaultPrices: { price: comp.defaultPrice || 0 },
                  aiExtracted: true,
                  aiConfidence: 0.8,
                  usageCount: 0
                }
              });
              createdComponents.set(comp.name, component.id);
              console.log(`✅ Created new component: ${comp.name}`);
            }
          } catch (error) {
            console.error(`❌ Error creating component ${comp.name}:`, error);
          }
        }
      }
      
      // 3. Créer les produits dans la base de données
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
            isCustomizable: item.isCustomizable || false,
            sizeConstraints: item.sizeConstraints || null,
            buildingSteps: item.buildingSteps || null,
            originalComposition: item.composition ? JSON.stringify(item.composition) : null,
            aiDescription: item.aiDescription || null,
            aiKeywords: item.keywords || [],
            menuUploadSessionId: sessionId,
            status: 'DRAFT',
            popularity: 0
          }
        });

        // Créer les variations si fournies, sinon créer une variation par défaut avec le prix
        if (item.variations && item.variations.length > 0) {
          await prisma.productVariation.createMany({
            data: item.variations.map((v: any, index: number) => ({
              productId: product.id,
              name: v.name || `Variation ${index + 1}`,
              type: v.type || 'SIZE',
              value: v.value || '',
              prices: v.prices || { 'dine-in': v.price || 0 },
              constraints: v.constraints || null,
              isVisible: true,
              isDefault: index === 0,
              order: index
            }))
          });
        } else if (item.price) {
          // Créer une variation par défaut avec le prix du produit
          await prisma.productVariation.create({
            data: {
              productId: product.id,
              name: 'Prix standard',
              type: 'CUSTOM',
              value: 'Standard',
              prices: { 
                'dine-in': item.price,
                'takeaway': item.price,
                'delivery': item.price
              },
              isVisible: true,
              isDefault: true,
              order: 0
            }
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
                selectionType: (step.selectionType || 'single').toUpperCase() as any,
                order: stepIndex,
                aiGenerated: true
              }
            });

            if (step.options && step.options.length > 0) {
              for (const [optionIndex, option] of step.options.entries()) {
                const linkedComponentId = createdComponents.get(option.name) || null;
                
                await prisma.compositionOption.create({
                  data: {
                    stepId: compositionStep.id,
                    name: option.name,
                    prices: option.prices || { 'dine-in': option.price || 0 },
                    isVisible: true,
                    order: optionIndex,
                    linkedComponentId: linkedComponentId,
                    aiGenerated: true
                  }
                });
              }
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
          componentsCreated: createdComponents.size,
          componentCategoriesCreated: componentCategories.size,
          componentLibraryCreated: createdComponents.size > 0,
          needsReview: menuData.needsReview || false,
          completedAt: new Date(),
          extractedProducts: menuData.items || [],
          detectedComponents: menuData.componentLibrary || [],
          compositionAnalysis: menuData  // Stocker la réponse complète de l'IA ici
        }
      });

      // Supprimer le fichier après traitement réussi
      try {
        const uploadDir = path.join(process.cwd(), 'uploads', 'menus');
        
        // Le fichier est nommé avec un timestamp, on doit le retrouver
        // Chercher tous les fichiers qui se terminent par le nom original
        const files = fs.readdirSync(uploadDir);
        const fileToDelete = files.find(f => f.endsWith(uploadSession.originalFileName));
        
        if (fileToDelete) {
          const filePath = path.join(uploadDir, fileToDelete);
          await unlink(filePath);
          console.log(`✅ Fichier supprimé après traitement: ${fileToDelete}`);
        }
      } catch (fileError) {
        console.error('❌ Erreur lors de la suppression du fichier:', fileError);
        // Ne pas faire échouer le traitement si la suppression échoue
      }

      return NextResponse.json({
        success: true,
        sessionId,
        status: 'COMPLETED',
        productsCreated: createdProducts.length,
        componentsCreated: createdComponents.size,
        categoriesCreated: componentCategories.size,
        confidence: menuData.overallConfidence || 0.8,
        needsReview: menuData.needsReview || false,
        message: `Traitement terminé. ${createdProducts.length} produit(s), ${createdComponents.size} composant(s) et ${componentCategories.size} catégorie(s) créé(s). Fichier supprimé automatiquement.`
      });

    } catch (processingError) {
      console.error('Error processing with AI:', processingError);
      
      // Marquer la session comme échouée
      await prisma.menuUploadSession.update({
        where: { id: sessionId },
        data: {
          aiProcessingStatus: 'FAILED',
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

async function getAIPrompt(store: any): Promise<string> {
  const businessCategory = store.businessCategory || 'RESTAURANT';
  console.log('📝 Looking for AI prompt for category:', businessCategory);
  
  try {
    // Récupérer le prompt configuré dans l'admin pour cette catégorie
    const categoryConfig = await prisma.businessCategoryConfig.findFirst({
      where: { 
        category: businessCategory,
        isActive: true 
      },
      select: {
        menuExtractionPrompt: true,
        displayName: true
      }
    });
    
    if (categoryConfig?.menuExtractionPrompt) {
      console.log('✅ Using admin-configured menu extraction prompt for:', businessCategory, '-', categoryConfig.displayName);
      return categoryConfig.menuExtractionPrompt;
    }
  } catch (error) {
    console.error('❌ Error fetching category config:', error);
  }
  
  // Prompt par défaut si pas de configuration trouvée
  console.log('⚠️ Using default prompt for category:', businessCategory);
  return `
ANALYSEZ L'INTÉGRALITÉ DE L'IMAGE DE MENU FOURNIE - EXTRAYEZ TOUS LES PRODUITS VISIBLES !

Cette image contient un menu complet avec PLUSIEURS catégories et PLUSIEURS produits par catégorie.
Vous devez extraire ABSOLUMENT TOUS les produits visibles avec leurs prix exacts.

INSTRUCTIONS CRITIQUES :
- Extrayez TOUS les produits, pas juste 2-3 exemples
- Respectez les catégories exactes du menu
- Copiez les NOMS EXACTS des produits  
- Copiez les PRIX EXACTS visibles
- Si un produit a des ingrédients listés, créez sa composition complète`;
}

async function processImageWithOpenAI(filePath: string, fileType: string, store: any): Promise<string> {
  try {
    console.log('🤖 Processing image with OpenAI');
    console.log('📂 File path:', filePath);
    console.log('📄 File type:', fileType);
    
    // Lire le fichier et le convertir en base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    console.log('📊 File size:', fileBuffer.length, 'bytes');
    console.log('🔤 Base64 length:', base64Image.length, 'characters');
    console.log('🔤 Base64 preview (first 100 chars):', base64Image.substring(0, 100));
    
    // Récupérer le prompt personnalisé ou par défaut
    const basePrompt = await getAIPrompt(store);
    
    const prompt = `${basePrompt}

Retournez un JSON avec cette structure exacte :
{
  "componentLibrary": [
    {
      "name": "Sauce tomate",
      "category": "Sauces",
      "defaultPrice": 0.50,
      "aliases": ["tomate", "sauce rouge"]
    },
    {
      "name": "Mozzarella",
      "category": "Fromages", 
      "defaultPrice": 2.00,
      "aliases": ["fromage", "mozza"]
    }
  ],
  "items": [
    {
      "name": "Nom du produit",
      "description": "Description détaillée",
      "category": "Catégorie (ex: Entrées, Plats, Desserts, Boissons)",
      "price": 12.50,
      "confidence": 0.9,
      "hasComposition": true,
      "composition": [
        {
          "title": "Base",
          "isRequired": true,
          "selectionType": "single",
          "options": [
            {
              "name": "Sauce tomate",
              "price": 0.50
            },
            {
              "name": "Mozzarella", 
              "price": 2.00
            }
          ]
        }
      ],
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
  "componentsCreated": 15
}

Règles CRITIQUES :
1. Si vous voyez des ingrédients listés (ex: "Sauce tomate, Mozzarella, Basilic"), créez AUTOMATIQUEMENT :
   - Les composants dans componentLibrary avec prix estimés logiques
   - Les étapes de composition correspondantes
   - Marquez hasComposition: true
2. Estimez des prix logiques pour les composants (sauce: 0.5€, fromage: 2€, viande: 4€, etc.)
3. Créez des catégories logiques de composants (Sauces, Fromages, Viandes, Légumes, etc.)
4. Pour chaque produit avec ingrédients visibles, créez au minimum une étape "Ingrédients" avec tous les composants
5. Utilisez des alias pour faciliter la recherche (ex: "mozza" pour "Mozzarella")
6. Extrayez TOUS les produits visibles avec leurs compositions détaillées
7. Confidence entre 0 et 1 (qualité de l'extraction)
8. needsReview = true si des informations sont incertaines

RAPPEL CRITIQUE: 
- Je veux voir TOUS les produits du menu, pas juste 2-3 exemples
- Un menu complet peut avoir 20-50 produits ou plus - extrayez-les TOUS
- Organisez par catégories exactes (respectez l'organisation du menu)
- Chaque produit doit avoir son prix exact
- Si vous voyez "Classic 1.00€", "Poulet 1.50€", "Saumon 1.50€" → créez ces 3 produits séparés

Analysez maintenant cette image de menu et créez un catalogue complet avec TOUS les produits visibles :
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
      max_tokens: 8000,
      temperature: 0.1
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Aucune réponse de l\'IA');
    }

    console.log('🤖 OpenAI raw response:', aiResponse);

    // Nettoyer la réponse pour extraire le JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in AI response:', aiResponse);
      throw new Error('Format JSON non trouvé dans la réponse IA');
    }

    console.log('✅ Extracted JSON:', jsonMatch[0]);
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
        createdAt: true,
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
      timestamps: {
        created: uploadSession.createdAt,
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