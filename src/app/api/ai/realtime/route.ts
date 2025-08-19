// ============================================================================
// API OPENAI REALTIME - Gestion des sessions IA temps réel
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { OpenAIRealtimeService } from '@/lib/openai-realtime';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

// POST - Démarrer une session Realtime
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimitMiddleware(request, 'AI_ANALYSIS');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { callId, businessId, storeId, customInstructions } = body;
    
    const result = await OpenAIRealtimeService.startRealtimeSession(
      callId,
      businessId,
      storeId,
      customInstructions
    );
    
    return NextResponse.json({
      success: result.success,
      data: result.sessionId ? { sessionId: result.sessionId } : undefined,
      error: result.error
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Stats des sessions
export async function GET() {
  try {
    const stats = OpenAIRealtimeService.getActiveSessionsStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}