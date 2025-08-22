# Plan d'implémentation - Refonte système Services Kalliky

## 1. Analyse de l'existant

### 1.1 Architecture actuelle

#### Modèles de base de données
- **UniversalService** : Représente actuellement un "domaine" mais devrait être un service
- **SubService** : Mal nommé, représente des services dans un domaine
- **ServiceOption** : Options payantes (add-ons)
- **ServiceBooking** : Réservations
- **ServiceVariant** : Nouvelle table pour les variantes (sous-utilisée)
- **ServiceResource** : Employés de type 'EMPLOYEE' avec metadata
- **Product** : Catalogue produits avec variations, composition, etc.

#### Système de cache Redis
- Cache complet des données boutique dans `store:cache:{storeId}`
- Inclut produits, services, consultations, ressources
- TTL de 6h pour le cache principal
- Invalidation manuelle ou automatique sur mise à jour

#### APIs existantes
- `/api/products` : CRUD produits avec variations et compositions
- `/api/universal-services` : CRUD services (mal nommé)
- `/api/universal-services-extended/[serviceId]/variants` : Gestion des variantes

### 1.2 Points forts à conserver
✅ Système de cache Redis performant et bien structuré
✅ Modèle Product complet avec variations et compositions
✅ Authentification JWT fonctionnelle
✅ Gestion des employés via ServiceResource

### 1.3 Problèmes identifiés
❌ Confusion UniversalService/SubService/ServiceVariant
❌ Pas de liaison entre services et produits du catalogue
❌ Configuration trop complexe avec 6 options techniques
❌ Manque d'adaptation selon le type de boutique
❌ Duplication de données entre services et produits

## 2. Nouvelle architecture proposée

### 2.1 Structure simplifiée

```
Store (Boutique)
├── Service (ex-UniversalService renommé)
│   ├── LinkedProducts (via ProductService)
│   ├── ServiceOption (options/add-ons payants)
│   ├── ServiceResource (employés/équipements)
│   └── ServiceBooking (réservations)
└── Product (catalogue existant)
    ├── ProductVariation (prix/tailles)
    ├── CompositionStep (personnalisation)
    └── type: 'retail' | 'food' | 'service' | 'rental'
```

### 2.2 Changements de base de données

#### Modifications des modèles existants

```prisma
// Renommer UniversalService → Service
model Service {
  id          String @id @default(uuid())
  storeId     String
  name        String
  description String?
  icon        String?
  color       String?
  isActive    Boolean @default(true)
  order       Int @default(0)
  
  // Nouveau : type de service selon le métier
  serviceType ServiceType @default(STANDARD) // STANDARD, RENTAL, CONSULTATION, etc.
  
  // Configuration simplifiée (plus de pattern complexe)
  settings    Json @default("{}")
  
  // Relations
  store       Store @relation(fields: [storeId], references: [id])
  linkedProducts ProductService[]
  options     ServiceOption[]
  resources   ServiceResource[]
  bookings    ServiceBooking[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([storeId, name])
  @@index([storeId, isActive])
}

// Nouvelle table de liaison produits-services
model ProductService {
  id        String @id @default(uuid())
  productId String
  serviceId String
  isActive  Boolean @default(true)
  order     Int @default(0)
  
  product   Product @relation(fields: [productId], references: [id])
  service   Service @relation(fields: [serviceId], references: [id])
  
  @@unique([productId, serviceId])
  @@index([serviceId, isActive])
}

// Ajout de champs au modèle Product existant
model Product {
  // Champs existants...
  
  // Nouveaux champs pour intégration services
  productType    ProductType? @default(RETAIL) // RETAIL, RENTAL, SERVICE_ITEM
  isBookable     Boolean @default(false)
  bookingSettings Json? // durée, capacité, etc.
  
  // Relations
  serviceLinks   ProductService[]
}

// ServiceResource modifié pour gérer employés ET équipements
model ServiceResource {
  id          String @id @default(uuid())
  serviceId   String
  type        ResourceType // EMPLOYEE, EQUIPMENT, LOCATION
  
  // Pour les employés (lien avec ServiceResource existant)
  employeeId  String?
  
  // Pour les équipements/lieux
  name        String?
  description String?
  capacity    Int?
  stock       Int? // pour équipements avec stock limité
  
  isRequired  Boolean @default(true)
  metadata    Json? // horaires, contraintes, etc.
  
  service     Service @relation(fields: [serviceId], references: [id])
  employee    ServiceResource? @relation(fields: [employeeId], references: [id])
  
  @@index([serviceId, type])
}
```

#### Suppression des modèles
- **SubService** : Supprimé (remplacé par ProductService)
- **ServiceVariant** : Supprimé (utilise Product directement)

### 2.3 Migration des données

```sql
-- 1. Renommer UniversalService en Service
ALTER TABLE "UniversalService" RENAME TO "Service";

-- 2. Créer la table de liaison ProductService
CREATE TABLE "ProductService" (
  id VARCHAR(36) PRIMARY KEY,
  "productId" VARCHAR(36) NOT NULL,
  "serviceId" VARCHAR(36) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  UNIQUE("productId", "serviceId")
);

-- 3. Migrer les SubService vers ProductService
-- (créer des produits depuis les SubService puis les lier)

-- 4. Ajouter les nouveaux champs à Product
ALTER TABLE "Product" 
  ADD COLUMN "productType" VARCHAR(20) DEFAULT 'RETAIL',
  ADD COLUMN "isBookable" BOOLEAN DEFAULT false,
  ADD COLUMN "bookingSettings" JSONB;
```

## 3. Implémentation par phases

### Phase 1 : Préparation (Sans casser l'existant)

#### 1.1 Créer les nouvelles structures
- [ ] Créer table ProductService
- [ ] Ajouter champs productType et isBookable à Product
- [ ] Créer enums ServiceType et ProductType

#### 1.2 APIs parallèles
- [ ] Créer `/api/services` (nouveau) parallèle à `/api/universal-services`
- [ ] Créer `/api/services/[id]/products` pour lier produits
- [ ] Créer `/api/services/[id]/resources` pour gérer ressources

### Phase 2 : Migration progressive

#### 2.1 Interface utilisateur
- [ ] Dupliquer DomainesTab.tsx → ServicesTab.tsx avec nouvelle logique
- [ ] Créer ProductLinkModal pour lier produits aux services
- [ ] Adapter l'interface selon le type de boutique

#### 2.2 Migration des données
- [ ] Script de migration UniversalService → Service
- [ ] Script de conversion SubService → Product + ProductService
- [ ] Migration des ServiceVariant vers Product

### Phase 3 : Intégration Redis

#### 3.1 Adapter le cache
```typescript
// Structure cache adaptée
interface StoreCache {
  services: Service[];           // Services simples
  products: Product[];           // Produits avec type
  productServiceLinks: {         // Liens services-produits
    [serviceId: string]: string[] // productIds
  };
  serviceResources: {            // Ressources par service
    [serviceId: string]: ServiceResource[]
  };
}
```

#### 3.2 Synchronisation
- [ ] Invalider cache sur modification service
- [ ] Invalider cache sur liaison produit-service
- [ ] Maintenir cohérence stock produits/disponibilité services

### Phase 4 : Gestion des disponibilités

#### 4.1 Algorithme de réservation
```typescript
async function checkServiceAvailability(
  serviceId: string,
  productId: string,
  date: Date,
  options: string[]
): Promise<AvailabilityStatus> {
  // 1. Vérifier produit disponible
  const product = await checkProductStock(productId);
  
  // 2. Vérifier options en stock
  const optionsAvailable = await checkOptionsStock(options);
  
  // 3. Vérifier ressources (employés, équipements)
  const resources = await checkResourcesAvailability(serviceId, date);
  
  // 4. Retourner statut consolidé
  return {
    available: product.available && optionsAvailable && resources.available,
    conflicts: [...],
    alternatives: [...]
  };
}
```

#### 4.2 Gestion des conflits
- [ ] Lock optimiste Redis pour éviter double-réservation
- [ ] TTL sur réservations temporaires (panier)
- [ ] Système de suggestions alternatives

### Phase 5 : Interface adaptative

#### 5.1 Templates par métier
```typescript
const BUSINESS_TEMPLATES = {
  RENTAL: {
    serviceLabel: "Type de location",
    productLabel: "Véhicule",
    optionLabel: "Équipements",
    bookingLabel: "Réservation"
  },
  BEAUTY: {
    serviceLabel: "Prestation",
    productLabel: "Soin",
    optionLabel: "Options",
    bookingLabel: "Rendez-vous"
  },
  RESTAURANT: {
    serviceLabel: "Service",
    productLabel: "Table",
    optionLabel: "Suppléments",
    bookingLabel: "Réservation"
  }
};
```

#### 5.2 Configuration simplifiée
- [ ] Supprimer les 6 options complexes
- [ ] Interface en 3 étapes : Service → Produits → Options
- [ ] Templates préconfigurés par métier

## 4. Points d'attention critiques

### 4.1 Ne pas casser l'existant
- **Catalogue produits** : Conserver toute la logique actuelle
- **Redis** : Adapter sans casser le cache des appels IA
- **APIs** : Maintenir compatibilité ascendante temporairement

### 4.2 Performance
- **Cache** : Optimiser structure pour éviter N+1 queries
- **Batch loading** : Charger services + produits liés en une fois
- **Indexes** : Ajouter indexes sur ProductService

### 4.3 Cohérence des données
- **Stock** : Synchroniser stock produit ↔ disponibilité service
- **Prix** : Le prix vient du produit, pas du service
- **Réservations** : Bloquer produit + ressources simultanément

## 5. Plan de test

### 5.1 Tests unitaires
- [ ] Liaison produit-service
- [ ] Calcul disponibilité avec ressources
- [ ] Gestion conflits de réservation

### 5.2 Tests d'intégration
- [ ] Flow complet réservation avec produit + options + ressources
- [ ] Invalidation cache Redis
- [ ] Migration données existantes

### 5.3 Tests de performance
- [ ] Charge sur endpoints avec cache
- [ ] Temps de réponse check disponibilité
- [ ] Consommation mémoire Redis

## 6. Rollback plan

Si problème majeur :
1. Garder tables UniversalService/SubService intactes
2. APIs parallèles permettent switch rapide
3. Cache Redis avec versioning pour rollback
4. Feature flag pour activer/désactiver nouvelle architecture

## 7. Timeline estimée

- **Phase 1** : 2-3 jours (préparation sans risque)
- **Phase 2** : 3-4 jours (migration progressive)
- **Phase 3** : 2 jours (intégration Redis)
- **Phase 4** : 2-3 jours (disponibilités)
- **Phase 5** : 2 jours (interface adaptative)
- **Tests** : 2-3 jours
- **Buffer** : 2 jours

**Total : ~15-20 jours**

## 8. Prochaines étapes immédiates

1. **Valider** ce plan avec l'équipe
2. **Créer** branch feature/services-refactor
3. **Commencer** Phase 1 (sans risque)
4. **Tester** en parallèle de l'existant
5. **Migrer** progressivement

## Notes importantes

- **Priorité 1** : Ne pas casser le catalogue produits existant
- **Priorité 2** : Maintenir performance Redis/IA
- **Priorité 3** : Simplifier l'UX pour l'utilisateur final

Ce plan permet une migration progressive et sûre vers une architecture plus claire et maintenable, tout en préservant les fonctionnalités existantes.