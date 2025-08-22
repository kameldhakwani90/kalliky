import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
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

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storeId = formData.get('storeId') as string;
    const autoProcess = formData.get('autoProcess') === 'true';

    if (!file || !storeId) {
      return NextResponse.json({ 
        error: 'Fichier et storeId requis' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur a accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Valider le type de fichier
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Type de fichier non supporté. Utilisez PDF, JPEG, PNG, Excel ou CSV.' 
      }, { status: 400 });
    }

    // Valider la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Fichier trop volumineux. Taille maximale: 10MB.' 
      }, { status: 400 });
    }

    // Créer le répertoire d'upload s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'uploads', 'menus');
    await mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Créer la session d'upload dans la base de données
    const menuUploadSession = await prisma.menuUploadSession.create({
      data: {
        storeId,
        originalFileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        aiProcessingStatus: 'PENDING',
        needsReview: false
      }
    });

    // Si autoProcess est activé, déclencher le traitement en arrière-plan
    if (autoProcess) {
      // Déclencher le traitement IA en arrière-plan
      try {
        // Faire un appel à l'API de traitement en arrière-plan
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api/ai/process-menu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({ sessionId: menuUploadSession.id })
        }).catch(error => {
          console.error('Background processing error:', error);
        });
        
        console.log(`Auto-processing started for session ${menuUploadSession.id}`);
      } catch (error) {
        console.error('Error starting background processing:', error);
      }
    }

    return NextResponse.json({
      sessionId: menuUploadSession.id,
      status: menuUploadSession.aiProcessingStatus,
      estimatedTime: autoProcess ? '2-5 minutes' : null,
      message: autoProcess 
        ? 'Upload réussi. Traitement IA en cours...' 
        : 'Upload réussi. Utilisez l\'API de traitement pour analyser le menu.'
    });

  } catch (error) {
    console.error('Error uploading menu:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload du menu' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ 
        error: 'storeId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Récupérer les sessions d'upload pour ce store
    const uploadSessions = await prisma.menuUploadSession.findMany({
      where: {
        storeId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        originalFileName: true,
        fileType: true,
        fileSize: true,
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

    return NextResponse.json({
      sessions: uploadSessions
    });

  } catch (error) {
    console.error('Error fetching upload sessions:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des sessions' 
    }, { status: 500 });
  }
}