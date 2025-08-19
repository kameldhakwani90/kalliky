# 🚀 Guide de Mise en Production - Kalliky

## 📋 Checklist Avant Production

### 1. Variables d'Environnement (.env.production)

```bash
# ✅ Database
DATABASE_URL="postgresql://user:password@votre-serveur/kalliky_prod"
SHADOW_DATABASE_URL="postgresql://user:password@votre-serveur/kalliky_shadow"

# ✅ Application
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"
NEXT_PUBLIC_API_URL="https://votre-domaine.com"
NEXTAUTH_URL="https://votre-domaine.com"

# ✅ Sécurité
JWT_SECRET="[GÉNÉRER UN SECRET FORT]"  # Utiliser: openssl rand -base64 32
NEXTAUTH_SECRET="[GÉNÉRER UN SECRET FORT]"

# ✅ Email (SMTP Gmail ou autre)
EMAIL_FROM="noreply@votre-domaine.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-application"  # Pas le mot de passe Gmail, mais un mot de passe d'application

# ✅ Stripe (Mode LIVE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."  # ⚠️ Remplacer par clé LIVE
STRIPE_SECRET_KEY="sk_live_..."  # ⚠️ Remplacer par clé LIVE
STRIPE_WEBHOOK_SECRET="whsec_..."  # ⚠️ À obtenir après création du webhook

# IDs des Prix Stripe (Mode LIVE)
STRIPE_STARTER_PRICE_ID="price_live_starter..."  # ⚠️ Créer en mode LIVE
STRIPE_PRO_BASE_PRICE_ID="price_live_pro_base..."
STRIPE_PRO_USAGE_PRICE_ID="price_live_pro_usage..."
STRIPE_BUSINESS_PRICE_ID="price_live_business..."

# ✅ Telnyx (Si utilisé)
TELNYX_API_KEY="KEY_LIVE_..."
TELNYX_PHONE_NUMBER_POOL_ID="..."
TELNYX_WEBHOOK_URL="https://votre-domaine.com/api/telnyx/webhook"
```

---

## 🔧 Configuration Stripe Production

### Étape 1: Passer en Mode Live
1. Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
2. Activez votre compte (vérification d'identité requise)
3. Basculez sur "Mode Live" (toggle en haut)

### Étape 2: Créer les Produits/Prix en LIVE
Recréez vos 3 produits en mode LIVE :

#### Plan STARTER
- Nom: `Kalliky Starter`
- Prix: `129 EUR / mois`
- Notez l'ID: `price_...`

#### Plan PRO
- Nom: `Kalliky Pro`
- Prix de base: `329 EUR / mois`
- Prix usage: `1 EUR / commande`
- Notez les IDs

#### Plan BUSINESS
- Nom: `Kalliky Business`
- Prix: `800 EUR / mois` (ou sur devis)
- Notez l'ID

### Étape 3: Configurer le Webhook
1. Allez dans **Développeurs → Webhooks**
2. **+ Ajouter un endpoint**
3. URL: `https://votre-domaine.com/api/stripe/webhook`
4. Événements à écouter:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiez le **Signing secret**: `whsec_...`

### Étape 4: Activer le Customer Portal
1. **Paramètres → Customer portal**
2. Configurez les options
3. Activez le portail

---

## 📧 Configuration Email (Gmail)

### Option 1: Gmail avec Mot de Passe d'Application
1. Activez la validation en 2 étapes sur votre compte Google
2. Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Créez un mot de passe d'application
4. Utilisez ce mot de passe dans `SMTP_PASS`

### Option 2: Service Email Professionnel
- SendGrid: [sendgrid.com](https://sendgrid.com)
- Mailgun: [mailgun.com](https://mailgun.com)
- Amazon SES: [aws.amazon.com/ses](https://aws.amazon.com/ses)

---

## 📱 Configuration Telnyx (Téléphonie)

1. Créez un compte sur [telnyx.com](https://telnyx.com)
2. Achetez des numéros de téléphone
3. Créez une application TeXML
4. Configurez les webhooks:
   - Voice: `https://votre-domaine.com/api/telnyx/voice`
   - SMS: `https://votre-domaine.com/api/telnyx/sms`
5. Récupérez votre API Key

---

## 🚀 Déploiement

### Option 1: Vercel (Recommandé pour Next.js)

```bash
# Installation CLI Vercel
npm i -g vercel

# Déploiement
vercel --prod

# Variables d'environnement
# À configurer dans dashboard.vercel.com
```

### Option 2: VPS avec Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build et run
docker build -t kalliky .
docker run -p 3000:3000 --env-file .env.production kalliky
```

### Option 3: Railway/Render
1. Connectez votre repo GitHub
2. Ajoutez les variables d'environnement
3. Deploy automatique à chaque push

---

## 🗄️ Base de Données Production

### PostgreSQL Hébergé
- **Supabase**: [supabase.com](https://supabase.com) (Gratuit jusqu'à 500MB)
- **Neon**: [neon.tech](https://neon.tech) (Gratuit jusqu'à 3GB)
- **Railway**: [railway.app](https://railway.app)
- **DigitalOcean**: [digitalocean.com](https://digitalocean.com)

### Migration de la DB
```bash
# Appliquer les migrations en production
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# (Optionnel) Seed initial pour l'admin
npx prisma db seed
```

---

## ✅ Tests Avant Go-Live

### 1. Test Complet d'Inscription
- [ ] Page signup fonctionne
- [ ] Redirection Stripe OK
- [ ] Paiement traité
- [ ] Compte activé
- [ ] Email de bienvenue reçu

### 2. Test Espace Client
- [ ] Login fonctionne
- [ ] Dashboard charge correctement
- [ ] Profil modifiable
- [ ] Changement de plan
- [ ] Téléchargement factures

### 3. Test Espace Admin
- [ ] Login admin
- [ ] Voir les nouveaux clients
- [ ] Modifier les settings
- [ ] Envoyer des emails

### 4. Test Webhooks
```bash
# Tester avec Stripe CLI
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

---

## 🔒 Sécurité

### Headers de Sécurité (next.config.js)
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### Rate Limiting
Installer et configurer un rate limiter pour les APIs sensibles :
```bash
npm install express-rate-limit
```

---

## 📊 Monitoring

### 1. Logs et Erreurs
- **Sentry**: [sentry.io](https://sentry.io) pour tracking d'erreurs
- **LogRocket**: [logrocket.com](https://logrocket.com) pour session replay

### 2. Analytics
- **Google Analytics**: Pour le trafic
- **Mixpanel**: Pour les événements utilisateur
- **Stripe Dashboard**: Pour les métriques business

### 3. Uptime Monitoring
- **UptimeRobot**: [uptimerobot.com](https://uptimerobot.com)
- **Pingdom**: [pingdom.com](https://pingdom.com)

---

## 🚨 Rollback Plan

En cas de problème :

1. **Backup DB avant déploiement**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

2. **Garder l'ancienne version**
```bash
git tag -a v1.0.0 -m "Version avant production"
git push origin v1.0.0
```

3. **Rollback rapide**
```bash
git checkout v1.0.0
vercel --prod
```

---

## 📞 Support Post-Launch

### Hotline Support
- Email urgences: `urgent@kalliky.com`
- Téléphone: +33 X XX XX XX XX
- Slack/Discord pour l'équipe

### Documentation
- [ ] Guide utilisateur client
- [ ] Guide administrateur
- [ ] FAQ
- [ ] Vidéos tutoriels

---

## 📝 Notes Importantes

1. **Ne JAMAIS commiter les fichiers `.env` dans Git**
2. **Toujours tester en staging avant production**
3. **Faire des backups réguliers de la DB**
4. **Monitorer les coûts Stripe/Telnyx**
5. **Prévoir un plan de communication pour le lancement**

---

## 🎯 Checklist Finale

- [ ] Toutes les variables d'environnement configurées
- [ ] Stripe en mode LIVE avec produits créés
- [ ] Webhook Stripe configuré et testé
- [ ] Email SMTP fonctionnel
- [ ] Base de données migrée
- [ ] SSL/HTTPS activé
- [ ] DNS configuré
- [ ] Backups automatiques configurés
- [ ] Monitoring en place
- [ ] Tests complets passés
- [ ] Documentation prête
- [ ] Équipe briefée

---

## 🚀 GO LIVE!

Une fois tout vérifié :
```bash
# Déploiement final
npm run build
npm run start

# ou avec Vercel
vercel --prod
```

**Bonne chance pour le lancement ! 🎉**

---

*Document créé le : 2024*
*Dernière mise à jour : À chaque changement majeur*