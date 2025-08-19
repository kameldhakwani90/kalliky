// ============================================================================
// API EXPORTS - Génération d'exports de données
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ExportRequest } from '@/lib/export-service';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { prisma } from '@/lib/prisma';

// POST - Générer un export
export async function POST(request: NextRequest) {
  try {
    // Rate limiting spécial pour les exports (plus restrictif)
    const rateLimitResult = await rateLimitMiddleware(request, 'API_HEAVY');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Les exports sont limités à 10 par minute.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
    
    const body = await request.json();
    
    // Validation stricte du body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const { businessId, storeId, type, format, dateRange, filters, columns } = body;
    
    // Validations des paramètres requis
    if (!businessId || typeof businessId !== 'string' || !/^[0-9a-f-]{36}$/i.test(businessId)) {
      return NextResponse.json(
        { error: 'businessId valide requis' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    if (storeId && (typeof storeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(storeId))) {
      return NextResponse.json(
        { error: 'Format storeId invalide' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const validTypes = ['calls', 'orders', 'customers', 'analytics', 'revenue'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type invalide. Valeurs autorisées: ${validTypes.join(', ')}` },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const validFormats = ['csv', 'excel', 'pdf'];
    if (!format || !validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Format invalide. Valeurs autorisées: ${validFormats.join(', ')}` },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Validation des dates
    if (!dateRange || typeof dateRange !== 'object') {
      return NextResponse.json(
        { error: 'Plage de dates requise' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const { from, to } = dateRange;
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Dates de début et fin requises' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Format de date invalide' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    if (fromDate > toDate) {
      return NextResponse.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Limite de 1 an maximum
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      return NextResponse.json(
        { error: 'La plage de dates ne peut pas dépasser 1 an' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Vérifier que le business existe et appartient à l'utilisateur
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        stores: storeId ? {
          where: { id: storeId }
        } : undefined
      }
    });
    
    if (!business) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    if (storeId && business.stores && business.stores.length === 0) {
      return NextResponse.json(
        { error: 'Boutique non trouvée dans cette entreprise' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    // TODO: Vérifier l'autorisation utilisateur
    // const userId = await getUserFromRequest(request);
    // if (business.ownerId !== userId) {
    //   return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    // }
    
    // Construire la requête d'export
    const exportRequest: ExportRequest = {
      businessId,
      storeId,
      type,
      format,
      dateRange: {
        from: fromDate,
        to: toDate
      },
      filters: filters || {},
      columns: columns || undefined
    };
    
    // Générer l'export
    console.log(`📊 Début génération export: ${type} (${format}) pour business ${businessId}`);
    
    const result = await ExportService.generateExport(exportRequest);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Erreur lors de la génération de l\'export'
        },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    console.log(`✅ Export généré avec succès: ${result.filename}`);
    
    return NextResponse.json({
      success: true,
      message: 'Export généré avec succès',
      data: {
        downloadUrl: result.downloadUrl,
        filename: result.filename,
        metadata: result.metadata
      }
    }, { headers: rateLimitResult.headers });
    
  } catch (error) {
    console.error('❌ Erreur génération export:', error);
    
    // Gestion d'erreurs spécifiques
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Format JSON invalide' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération de l\'export' },
      { status: 500 }
    );
  }
}