// ============================================================================
// API CALL FORWARDING - Configuration et gestion du transfert d'appels
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { CallForwardingService, CallForwardingConfig } from '@/lib/call-forwarding';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { prisma } from '@/lib/prisma';

// GET - Récupérer la configuration de call forwarding
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 'API_DEFAULT');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId parameter required' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Validation UUID
    if (!/^[0-9a-f-]{36}$/i.test(storeId)) {
      return NextResponse.json(
        { error: 'Invalid storeId format' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Vérifier que la boutique existe et appartient à l'utilisateur
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        business: {
          select: { ownerId: true }
        }
      }
    });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    // TODO: Vérifier authentification et autorisation
    // const userId = await getUserFromRequest(request);
    // if (store.business.ownerId !== userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }
    
    const config = (store.settings as any)?.callForwarding || {
      enabled: false,
      forwardToNumbers: [],
      maxRingTime: 30,
      workingHours: {
        enabled: false,
        timezone: 'Europe/Paris',
        schedule: {}
      },
      escalationRules: {
        enabled: false,
        triggerKeywords: [],
        maxAIAttempts: 3
      },
      queueSettings: {
        enabled: false,
        maxWaitTime: 300,
        announcementInterval: 60
      }
    };
    
    return NextResponse.json({
      success: true,
      data: config
    }, { headers: rateLimitResult.headers });
    
  } catch (error) {
    console.error('❌ Erreur GET call forwarding config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Configurer le call forwarding
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
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
    
    const { storeId, config } = body;
    
    // Validation storeId
    if (!storeId || typeof storeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(storeId)) {
      return NextResponse.json(
        { error: 'Valid storeId required' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Validation config
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Valid config required' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Vérifier que la boutique existe
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        business: {
          select: { ownerId: true }
        }
      }
    });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }
    
    // Validation spécifique de la configuration
    const validationResult = validateCallForwardingConfig(config);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: `Invalid config: ${validationResult.error}` },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Configurer le call forwarding
    await CallForwardingService.configureCallForwarding(storeId, config);
    
    return NextResponse.json({
      success: true,
      message: 'Call forwarding configuration updated successfully'
    }, { headers: rateLimitResult.headers });
    
  } catch (error) {
    console.error('❌ Erreur POST call forwarding config:', error);
    
    if (error instanceof Error && error.message.includes('Au moins un numéro')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateCallForwardingConfig(config: any): { valid: boolean; error?: string } {
  // Validation enabled
  if (typeof config.enabled !== 'boolean') {
    return { valid: false, error: 'enabled must be boolean' };
  }
  
  // Validation forwardToNumbers
  if (!Array.isArray(config.forwardToNumbers)) {
    return { valid: false, error: 'forwardToNumbers must be array' };
  }
  
  if (config.enabled && config.forwardToNumbers.length === 0) {
    return { valid: false, error: 'At least one forward number required when enabled' };
  }
  
  // Validation des numéros de téléphone
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  for (const number of config.forwardToNumbers) {
    if (typeof number !== 'string' || !phoneRegex.test(number)) {
      return { valid: false, error: `Invalid phone number: ${number}` };
    }
  }
  
  // Validation maxRingTime
  if (typeof config.maxRingTime !== 'number' || config.maxRingTime < 10 || config.maxRingTime > 120) {
    return { valid: false, error: 'maxRingTime must be between 10 and 120 seconds' };
  }
  
  // Validation workingHours
  if (config.workingHours && typeof config.workingHours !== 'object') {
    return { valid: false, error: 'workingHours must be object' };
  }
  
  if (config.workingHours) {
    if (typeof config.workingHours.enabled !== 'boolean') {
      return { valid: false, error: 'workingHours.enabled must be boolean' };
    }
    
    if (config.workingHours.enabled) {
      if (!config.workingHours.timezone || typeof config.workingHours.timezone !== 'string') {
        return { valid: false, error: 'workingHours.timezone required when enabled' };
      }
      
      if (!config.workingHours.schedule || typeof config.workingHours.schedule !== 'object') {
        return { valid: false, error: 'workingHours.schedule required when enabled' };
      }
    }
  }
  
  // Validation escalationRules
  if (config.escalationRules && typeof config.escalationRules !== 'object') {
    return { valid: false, error: 'escalationRules must be object' };
  }
  
  if (config.escalationRules) {
    if (typeof config.escalationRules.enabled !== 'boolean') {
      return { valid: false, error: 'escalationRules.enabled must be boolean' };
    }
    
    if (config.escalationRules.enabled) {
      if (!Array.isArray(config.escalationRules.triggerKeywords)) {
        return { valid: false, error: 'escalationRules.triggerKeywords must be array' };
      }
      
      if (typeof config.escalationRules.maxAIAttempts !== 'number' || 
          config.escalationRules.maxAIAttempts < 1 || 
          config.escalationRules.maxAIAttempts > 10) {
        return { valid: false, error: 'escalationRules.maxAIAttempts must be between 1 and 10' };
      }
    }
  }
  
  // Validation queueSettings
  if (config.queueSettings && typeof config.queueSettings !== 'object') {
    return { valid: false, error: 'queueSettings must be object' };
  }
  
  if (config.queueSettings) {
    if (typeof config.queueSettings.enabled !== 'boolean') {
      return { valid: false, error: 'queueSettings.enabled must be boolean' };
    }
    
    if (config.queueSettings.enabled) {
      if (typeof config.queueSettings.maxWaitTime !== 'number' || 
          config.queueSettings.maxWaitTime < 60 || 
          config.queueSettings.maxWaitTime > 1800) {
        return { valid: false, error: 'queueSettings.maxWaitTime must be between 60 and 1800 seconds' };
      }
      
      if (typeof config.queueSettings.announcementInterval !== 'number' || 
          config.queueSettings.announcementInterval < 30 || 
          config.queueSettings.announcementInterval > 300) {
        return { valid: false, error: 'queueSettings.announcementInterval must be between 30 and 300 seconds' };
      }
    }
  }
  
  return { valid: true };
}