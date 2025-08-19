// ============================================================================
// API DOWNLOAD EXPORTS - Téléchargement des fichiers d'export
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ExportService } from '@/lib/export-service';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

// GET - Télécharger un fichier d'export
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Rate limiting pour téléchargements
    const rateLimitResult = await rateLimitMiddleware(request, 'API_DEFAULT');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
    
    const { filename } = params;
    
    // Validation du nom de fichier
    if (!filename) {
      return NextResponse.json(
        { error: 'Nom de fichier requis' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Décoder le nom de fichier
    const decodedFilename = decodeURIComponent(filename);
    
    // Validation sécurisée du nom de fichier (pas de path traversal)
    if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nom de fichier invalide' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Vérifier que le fichier a une extension valide
    const validExtensions = ['.csv', '.xlsx', '.pdf'];
    const hasValidExtension = validExtensions.some(ext => decodedFilename.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    console.log(`📥 Demande téléchargement: ${decodedFilename}`);
    
    // Récupérer le fichier depuis Redis
    const fileResult = await ExportService.getTemporaryFile(decodedFilename);
    
    if (!fileResult.success) {
      console.log(`❌ Fichier non trouvé: ${decodedFilename}`);
      return NextResponse.json(
        { error: fileResult.error || 'Fichier non trouvé ou expiré' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    // Déterminer si le contenu est en base64
    let fileContent: Buffer;
    const contentType = fileResult.contentType || 'application/octet-stream';
    
    try {
      if (contentType.includes('excel') || contentType.includes('pdf')) {
        // Fichiers binaires stockés en base64
        fileContent = Buffer.from(fileResult.content!, 'base64');
      } else {
        // Fichiers texte (CSV)
        fileContent = Buffer.from(fileResult.content!, 'utf-8');
      }
    } catch (error) {
      console.error('❌ Erreur décodage fichier:', error);
      return NextResponse.json(
        { error: 'Erreur lors du décodage du fichier' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Téléchargement démarré: ${decodedFilename} (${fileContent.length} bytes)`);
    
    // Créer la réponse avec les headers appropriés
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${decodedFilename}"`,
        'Content-Length': fileContent.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...rateLimitResult.headers
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Erreur téléchargement export:', error);
    
    return NextResponse.json(
      { error: 'Erreur serveur lors du téléchargement' },
      { status: 500 }
    );
  }
}