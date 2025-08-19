# 🔧 CORRECTIONS DÉTAILLÉES - VERSION 2.0

## 📋 Table des Matières

1. [Corrections Critiques](#corrections-critiques)
2. [Améliorations API](#améliorations-api)
3. [Optimisations Performance](#optimisations-performance)
4. [Sécurité Renforcée](#sécurité-renforcée)
5. [Plan d'Exécution](#plan-dexécution)

---

## 🚨 Corrections Critiques

### 1. **Méthode Dupliquée Redis** - `src/lib/redis.ts`

**🐛 PROBLÈME :**
```typescript
// Ligne 379-383
async getActiveCallsCount(businessId: string): Promise<number> {
  // ... code ...
}

// Ligne 387-391 - DUPLIQUÉE ❌
async getActiveCallsCount(businessId: string): Promise<number> {
  // ... même code ...
}
```

**✅ CORRECTION :**
- Supprimer la méthode dupliquée (lignes 387-391)
- Garder seulement la première implémentation
- **Impact :** Évite conflit TypeScript + erreurs runtime

**📁 Fichiers à modifier :**
- `src/lib/redis.ts` → `src/lib/redis.ts-old` (backup)

---

### 2. **Gestion Erreurs JSON APIs** 

**🐛 PROBLÈME :**
```typescript
// Dans plusieurs APIs - Parsing non sécurisé
const body = await request.json(); // Peut planter si JSON invalide ❌
```

**✅ CORRECTION :**
```typescript
// Parsing sécurisé avec try/catch
try {
  const body = await request.json();
  // Validation des champs requis
  if (!body.field) throw new Error('Champ requis manquant');
} catch (error) {
  return NextResponse.json(
    { error: 'Format JSON invalide', details: error.message },
    { status: 400 }
  );
}
```

**📁 APIs à corriger :**
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/restaurant/profile/route.ts`
- `src/app/api/stores/route.ts`

---

### 3. **Validation Inputs Manquante**

**🐛 PROBLÈME :**
```typescript
// Pas de validation des paramètres URL
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; 
  // Utilisation directe sans validation ❌
  const user = await prisma.user.findUnique({ where: { id } });
}
```

**✅ CORRECTION :**
```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  // Validation UUID
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json(
      { error: 'ID invalide' },
      { status: 400 }
    );
  }
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }
}
```

---

## 🔧 Améliorations API

### 4. **API Rate Limiting**

**🚨 PROBLÈME :**
Aucune protection contre les attaques par déni de service

**✅ SOLUTION :**
```typescript
// Nouveau helper: src/lib/rate-limiter.ts
import { redis } from './redis';

export async function rateLimiter(
  key: string, 
  limit: number, 
  windowMs: number
): Promise<boolean> {
  const current = await redis.incr(`rate:${key}`);
  
  if (current === 1) {
    await redis.expire(`rate:${key}`, Math.ceil(windowMs / 1000));
  }
  
  return current <= limit;
}

// Usage dans APIs critiques:
export async function POST(request: NextRequest) {
  const ip = request.ip || '127.0.0.1';
  
  if (!await rateLimiter(ip, 10, 60000)) { // 10 req/min
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429 }
    );
  }
  // ... rest of API
}
```

**📁 APIs à protéger :**
- `src/app/api/auth/login/route.ts` - 5 req/min
- `src/app/api/auth/register/route.ts` - 3 req/min
- `src/app/api/telnyx/webhook/route.ts` - 100 req/min
- `src/app/api/stripe/webhook/route.ts` - 50 req/min

---

### 5. **Webhooks Signature Verification**

**🚨 PROBLÈME :**
```typescript
// Pas de vérification signature - risque sécurité ❌
export async function POST(request: NextRequest) {
  const payload = await request.json();
  // Traitement direct sans vérification origine
}
```

**✅ CORRECTION Telnyx :**
```typescript
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('telnyx-signature-ed25519');
  const timestamp = request.headers.get('telnyx-timestamp');
  const body = await request.text();
  
  // Vérifier signature
  if (!verifyTelnyxSignature(signature, timestamp, body)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
  }
  
  const payload = JSON.parse(body);
  // ... traitement sécurisé
}

function verifyTelnyxSignature(signature: string, timestamp: string, body: string): boolean {
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  const signedPayload = timestamp + '|' + body;
  
  // Vérification Ed25519
  return crypto.verify(
    'ed25519',
    Buffer.from(signedPayload),
    publicKey,
    Buffer.from(signature, 'base64')
  );
}
```

---

### 6. **Amélioration Gestion d'Erreurs**

**✅ SOLUTION Standard :**
```typescript
// Helper global: src/lib/api-response.ts
export class APIResponse {
  static success(data: any, status = 200) {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status });
  }
  
  static error(message: string, status = 500, details?: any) {
    console.error(`API Error (${status}):`, message, details);
    
    return NextResponse.json({
      success: false,
      error: message,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    }, { status });
  }
}

// Usage dans toutes les APIs:
export async function POST(request: NextRequest) {
  try {
    const data = await processRequest(request);
    return APIResponse.success(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return APIResponse.error(error.message, 400, error.details);
    }
    return APIResponse.error('Erreur serveur', 500);
  }
}
```

---

## ⚡ Optimisations Performance

### 7. **Requêtes N+1 Prisma**

**🐛 PROBLÈME :**
```typescript
// Requête N+1 - Inefficace ❌
const orders = await prisma.order.findMany();
for (const order of orders) {
  const customer = await prisma.customer.findUnique({
    where: { id: order.customerId }
  }); // N requêtes supplémentaires!
}
```

**✅ CORRECTION :**
```typescript
// Utiliser include/select - 1 seule requête ✅
const orders = await prisma.order.findMany({
  include: {
    customer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    }
  }
});
```

**📁 APIs à optimiser :**
- `src/app/api/orders/route.ts`
- `src/app/api/restaurant/customers/route.ts`
- `src/app/api/tickets/[ticketId]/route.ts`

---

### 8. **Cache Intelligent**

**✅ SOLUTION :**
```typescript
// Cache avec invalidation automatique
export async function getCachedData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl = 3600
): Promise<T> {
  const cached = await redisService.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const fresh = await fetcher();
  await redisService.setEx(key, ttl, JSON.stringify(fresh));
  return fresh;
}

// Usage:
const storeStats = await getCachedData(
  `store:stats:${storeId}`,
  () => calculateStoreStats(storeId),
  1800 // 30min cache
);
```

---

## 🔐 Sécurité Renforcée

### 9. **Protection CSRF**

**✅ SOLUTION :**
```typescript
// Middleware CSRF: src/middleware/csrf.ts
import { NextRequest, NextResponse } from 'next/server';

export function csrfMiddleware(request: NextRequest) {
  const token = request.headers.get('X-CSRF-Token');
  const sessionToken = request.cookies.get('session')?.value;
  
  if (!token || !verifyCSRFToken(token, sessionToken)) {
    return NextResponse.json(
      { error: 'Token CSRF invalide' },
      { status: 403 }
    );
  }
}
```

---

### 10. **Input Sanitization**

**✅ SOLUTION :**
```typescript
// Helper: src/lib/sanitizer.ts
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprime < et >
    .slice(0, 1000); // Limite longueur
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Usage dans APIs:
const { email, name } = await request.json();

if (!validateEmail(email)) {
  return APIResponse.error('Email invalide', 400);
}

const sanitizedName = sanitizeInput(name);
```

---

## 📅 Plan d'Exécution

### **Phase 1 : Corrections Critiques (2h)**
1. ✅ Backup automatique des fichiers
2. 🔧 Corriger méthode dupliquée Redis
3. 🔧 Sécuriser parsing JSON des APIs principales
4. 🔧 Ajouter validation UUID sur paramètres critiques

### **Phase 2 : Sécurité (3h)**
1. 🔧 Implémenter rate limiting 
2. 🔧 Vérification signatures webhooks
3. 🔧 Protection CSRF
4. 🔧 Input sanitization

### **Phase 3 : Performance (2h)**
1. 🔧 Optimiser requêtes N+1
2. 🔧 Cache intelligent avec invalidation
3. 🔧 Indices base de données manquants

### **Phase 4 : Tests & Validation (1h)**
1. 🧪 Tests automatisés des corrections
2. 🧪 Validation sécurité
3. 🧪 Tests de performance

---

## ✅ Checklist de Validation

- [ ] Backup des fichiers créé (extension .old)
- [ ] Méthode Redis dupliquée supprimée
- [ ] APIs principales sécurisées (parsing + validation)
- [ ] Rate limiting implémenté sur APIs critiques
- [ ] Webhooks signatures vérifiées
- [ ] Requêtes N+1 optimisées
- [ ] Cache intelligent activé
- [ ] Tests passent sans erreur
- [ ] Performance améliorée (mesures avant/après)

---

## 🎯 Résultat Attendu

Après ces corrections :
- ✅ **Sécurité renforcée** - Protection contre attaques communes
- ✅ **Performance améliorée** - Réduction 50%+ temps réponse APIs
- ✅ **Stabilité garantie** - Moins d'erreurs runtime
- ✅ **Code maintenable** - Standards de qualité respectés

**Total estimé : 8 heures de développement + tests**