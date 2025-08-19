# 🤖 Kalliky - Assistant Téléphonique IA

**Plateforme d'assistant téléphonique IA pour entreprises**

Kalliky permet aux entreprises (restaurants, salons, cabinets de consultation, etc.) de traiter automatiquement les appels entrants avec une IA conversationnelle avancée.

## ✨ Fonctionnalités

### 🎯 **Gestion d'Appels Intelligente**
- 📞 Réception et traitement automatique des appels
- 🤖 IA conversationnelle avec OpenAI GPT-4o-mini
- 📝 Transcription et analyse automatique
- 🔄 Transfert vers humain si nécessaire

### 🍕 **Multi-Métiers Supportés**
- **Restaurants** : Prise de commandes, réservations
- **Salons de beauté** : Réservations, consultations
- **Cabinets** : Rendez-vous, consultations spécialisées
- **Commerce** : Renseignements, services client

### 🧠 **Intelligence Artificielle Avancée**
- Contexte personnalisé par boutique
- Analyse post-appel automatique (commandes, services, signalements)
- Cache Redis optimisé pour performance
- Prompts intelligents adaptés au métier

### 💰 **Modèle SaaS Complet**
- Plans FREE, PRO, ENTERPRISE
- Paiements Stripe automatisés
- Commissions transparentes
- Facturation automatique

## 🏗️ Architecture Technique

### Stack Principale
- **Frontend** : Next.js 14 + TypeScript + Tailwind CSS
- **Backend** : Node.js + Prisma ORM
- **Base de Données** : PostgreSQL
- **Cache** : Redis
- **IA** : OpenAI GPT-4o-mini
- **Téléphonie** : Telnyx Voice API
- **Paiements** : Stripe

### Intégrations
- 📞 **Telnyx** - Infrastructure téléphonique
- 🤖 **OpenAI** - Intelligence artificielle
- 💳 **Stripe** - Gestion paiements
- 📧 **Resend** - Emails transactionnels

## 🚀 Mise en Production

### Prérequis
```bash
Node.js 18+
PostgreSQL
Redis
```

### Variables d'Environnement
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="sk-..."
TELNYX_API_KEY="..."
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"
```

### Installation
```bash
# Clone et install
git clone [repository-privé]
cd kalliky
npm install

# Base de données
npx prisma migrate dev
npx prisma generate

# Démarrage
npm run dev
```

## 📊 Flux d'Utilisation

1. **Inscription** → Choix plan → Paiement → Auto-création compte + numéro Telnyx
2. **Configuration** → Upload menu IA → Paramétrage services
3. **Réception d'appel** → Webhook Telnyx → IA traitement → Sauvegarde résultats
4. **Dashboard** → Analytics temps réel → Gestion clients → Tickets

## 🎯 Cas d'Usage Typiques

### Restaurant "Pizza Mario"
- Client appelle pour commander
- IA reconnaît les plats du menu
- Prend la commande avec customisations
- Gère livraison/retrait
- Sauvegarde automatique en base

### Salon "Beauty Center"
- Cliente appelle pour rendez-vous
- IA consulte planning disponible
- Réserve créneau approprié
- Confirme par SMS
- Met à jour agenda automatiquement

## 🔧 Architecture des Données

```
Users → Businesses → Stores
  ↓         ↓         ↓
Subscriptions    Products/Services
  ↓               ↓
Calls ←→ AI Analysis ←→ Orders/Consultations
```

## 🛡️ Sécurité & Performance

- ✅ Validation stricte des inputs
- ✅ Rate limiting sur APIs critiques
- ✅ Chiffrement des données sensibles
- ✅ Cache Redis intelligent
- ✅ Optimisation requêtes base
- ✅ Monitoring temps réel

## 📈 Métriques

- **Performance** : Réponse < 200ms
- **Disponibilité** : 99.9% uptime
- **Scalabilité** : 1000+ appels simultanés
- **Précision IA** : 95%+ satisfaction client

## 🏷️ Versions

- **v2.0-stable** - Version actuelle de production
- Architecture complète + IA avancée + Cache optimisé

## 📞 Support

Pour toute question technique ou commerciale, contactez l'équipe de développement.

---

**© 2024 Mohamed Kamel Dhakwani - Tous droits réservés**

*Plateforme propriétaire - Usage commercial soumis à licence*
