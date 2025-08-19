// ============================================================================
// API CALL TRANSFER - Initie le transfert d'appels vers humains
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { CallForwardingService, CallTransferRequest } from '@/lib/call-forwarding';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { prisma } from '@/lib/prisma';

// POST - Initier un transfert d'appel
export async function POST(request: NextRequest) {
  try {
    // Rate limiting spécial pour les transferts
    const rateLimitResult = await rateLimitMiddleware(request, 'API_DEFAULT');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
    
    const body = await request.json();
    
    // Validation stricte du body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    const { callId, reason, priority, context } = body;
    
    // Validation callId
    if (!callId || typeof callId !== 'string' || !/^[0-9a-f-]{36}$/i.test(callId)) {
      return NextResponse.json(
        { error: 'Valid callId required' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Récupérer les détails de l'appel
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        business: {
          include: {
            stores: {
              select: { id: true }
            }
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            orderCount: true
          }
        }
      }
    });
    
    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    // Vérifier que l'appel est encore actif
    if (call.status !== 'active') {
      return NextResponse.json(
        { error: `Cannot transfer call with status: ${call.status}` },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Validation des paramètres optionnels
    const validReasons = ['user_request', 'ai_escalation', 'keyword_trigger', 'manual'];\n    const validPriorities = ['low', 'normal', 'high', 'urgent'];\n    \n    if (reason && !validReasons.includes(reason)) {\n      return NextResponse.json(\n        { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },\n        { status: 400, headers: rateLimitResult.headers }\n      );\n    }\n    \n    if (priority && !validPriorities.includes(priority)) {\n      return NextResponse.json(\n        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },\n        { status: 400, headers: rateLimitResult.headers }\n      );\n    }
    
    // Construire la requête de transfert
    const transferRequest: CallTransferRequest = {
      callId,
      telnyxCallId: call.telnyxCallId!,
      businessId: call.businessId,
      storeId: call.business.stores[0]?.id || '', // Premier store par défaut
      reason: reason || 'user_request',
      priority: priority || 'normal',
      context: context || `Transfert demandé pour l'appel ${callId}`,
      customerInfo: call.customer ? {
        name: `${call.customer.firstName} ${call.customer.lastName}`.trim(),
        phone: call.customer.phone,
        previousInteractions: call.customer.orderCount
      } : undefined
    };
    
    // Initier le transfert
    console.log(`📞 Initiation transfert d'appel: ${callId} (raison: ${transferRequest.reason})`);
    
    const transferResult = await CallForwardingService.transferCallToHuman(transferRequest);
    
    if (transferResult.success) {
      // Mettre à jour le statut de l'appel
      await prisma.call.update({
        where: { id: callId },
        data: {
          status: transferResult.transferId ? 'transferred' : 'queued',
          metadata: {
            ...call.metadata,
            transferredAt: new Date().toISOString(),
            transferReason: transferRequest.reason,
            transferId: transferResult.transferId,
            queuePosition: transferResult.queuePosition,
            estimatedWaitTime: transferResult.estimatedWaitTime
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        message: transferResult.transferId 
          ? 'Call successfully transferred to agent'
          : 'Call added to queue - agent will answer shortly',
        data: {
          transferred: !!transferResult.transferId,
          transferId: transferResult.transferId,
          queuePosition: transferResult.queuePosition,
          estimatedWaitTime: transferResult.estimatedWaitTime
        }
      }, { headers: rateLimitResult.headers });
      
    } else {
      // Logger l'échec du transfert
      await prisma.call.update({
        where: { id: callId },
        data: {
          metadata: {
            ...call.metadata,
            transferAttemptedAt: new Date().toISOString(),
            transferReason: transferRequest.reason,
            transferError: transferResult.error
          }
        }
      });
      
      return NextResponse.json({
        success: false,
        error: transferResult.error || 'Transfer failed',
        data: {
          transferred: false,
          reason: transferResult.error
        }
      }, { status: 400, headers: rateLimitResult.headers });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du transfert d\'appel:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during call transfer' 
      },
      { status: 500 }
    );
  }
}

// GET - Vérifier le statut d'un transfert
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimitMiddleware(request, 'API_DEFAULT');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    
    if (!callId || !/^[0-9a-f-]{36}$/i.test(callId)) {
      return NextResponse.json(
        { error: 'Valid callId parameter required' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Récupérer l'appel avec ses métadonnées
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        id: true,
        status: true,
        telnyxCallId: true,
        metadata: true,
        createdAt: true,
        endedAt: true
      }
    });
    
    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    const metadata = call.metadata as any || {};
    
    return NextResponse.json({
      success: true,
      data: {
        callId: call.id,
        status: call.status,
        createdAt: call.createdAt,
        endedAt: call.endedAt,
        transfer: {
          attempted: !!metadata.transferAttemptedAt,
          successful: !!metadata.transferredAt,
          transferredAt: metadata.transferredAt,
          reason: metadata.transferReason,
          transferId: metadata.transferId,
          queuePosition: metadata.queuePosition,
          estimatedWaitTime: metadata.estimatedWaitTime,
          error: metadata.transferError
        }
      }
    }, { headers: rateLimitResult.headers });
    
  } catch (error) {
    console.error('❌ Erreur GET transfer status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}