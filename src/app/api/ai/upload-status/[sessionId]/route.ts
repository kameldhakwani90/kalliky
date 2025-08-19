import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    // Récupérer la session d'upload avec les détails
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
            name: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            status: true,
            hasComposition: true,
            sourceType: true,
            sourceConfidence: true
          }
        }
      }
    });

    if (!uploadSession) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Calculer le pourcentage de progression basé sur le statut
    const getProgressPercentage = (status: string) => {
      switch (status) {
        case 'PENDING': return 0;
        case 'EXTRACTING_TEXT': return 15;
        case 'ANALYZING_STRUCTURE': return 30;
        case 'DETECTING_COMPOSITIONS': return 50;
        case 'CREATING_COMPONENTS': return 70;
        case 'ASSEMBLING_PRODUCTS': return 85;
        case 'COMPLETED': return 100;
        case 'FAILED': return 0;
        case 'NEEDS_REVIEW': return 90;
        default: return 0;
      }
    };

    // Déterminer la phase actuelle
    const getCurrentPhase = (status: string) => {
      const phases: Record<string, string> = {
        'PENDING': 'En attente de traitement',
        'EXTRACTING_TEXT': 'Extraction du texte',
        'ANALYZING_STRUCTURE': 'Analyse de la structure',
        'DETECTING_COMPOSITIONS': 'Détection des compositions',
        'CREATING_COMPONENTS': 'Création de la bibliothèque de composants',
        'ASSEMBLING_PRODUCTS': 'Assemblage des produits',
        'COMPLETED': 'Traitement terminé',
        'FAILED': 'Échec du traitement',
        'NEEDS_REVIEW': 'Révision requise'
      };
      return phases[status] || 'Phase inconnue';
    };

    const response = {
      sessionId: uploadSession.id,
      status: uploadSession.aiProcessingStatus,
      progress: getProgressPercentage(uploadSession.aiProcessingStatus),
      currentPhase: getCurrentPhase(uploadSession.aiProcessingStatus),
      
      // Données extraites
      extractedText: uploadSession.extractedText ? 
        uploadSession.extractedText.substring(0, 500) + '...' : null,
      
      // Composants détectés (aperçu)
      detectedComponents: uploadSession.detectedComponents ? 
        JSON.parse(uploadSession.detectedComponents as string) : null,
      
      // Statistiques de création
      componentsCreated: uploadSession.componentsCreated,
      componentCategoriesCreated: uploadSession.componentCategoriesCreated,
      productsCreatedCount: uploadSession.productsCreatedCount,
      productsWithComposition: uploadSession.productsWithComposition,
      
      // Métadonnées
      overallConfidence: uploadSession.overallConfidence,
      needsReview: uploadSession.needsReview,
      reviewNotes: uploadSession.reviewNotes,
      
      // Fichier original
      originalFileName: uploadSession.originalFileName,
      fileType: uploadSession.fileType,
      fileSize: uploadSession.fileSize,
      
      // Horodatage
      createdAt: uploadSession.createdAt,
      completedAt: uploadSession.completedAt,
      
      // Store info
      store: uploadSession.store,
      
      // Produits créés (aperçu)
      productsPreview: uploadSession.products.slice(0, 5),
      totalProducts: uploadSession.products.length,
      
      // Temps estimé restant
      estimatedTimeRemaining: uploadSession.aiProcessingStatus === 'COMPLETED' ? null :
        uploadSession.aiProcessingStatus === 'FAILED' ? null :
        '1-3 minutes'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching upload status:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du statut' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await request.json();
    const { status, notes } = body;

    // Vérifier que la session existe et appartient à l'utilisateur
    const uploadSession = await prisma.menuUploadSession.findFirst({
      where: {
        id: sessionId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!uploadSession) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Mettre à jour la session
    const updatedSession = await prisma.menuUploadSession.update({
      where: { id: sessionId },
      data: {
        ...(status && { aiProcessingStatus: status }),
        ...(notes && { reviewNotes: notes }),
        ...(status === 'COMPLETED' && !uploadSession.completedAt && { 
          completedAt: new Date() 
        })
      }
    });

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('Error updating upload session:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de la session' 
    }, { status: 500 });
  }
}