# 🚀 Guide de Déploiement Kalliky avec Docker

## 📋 Prérequis sur votre serveur

- Ubuntu 20.04+ ou Debian 11+
- 2GB RAM minimum (4GB recommandé)
- 20GB d'espace disque
- Accès SSH root ou sudo

## 🔧 Installation Rapide

### 1. Transférer les fichiers sur votre serveur

```bash
# Depuis votre Mac, transférer le dossier kalliky
scp -r /Users/mohamedkameldhakwani/kalliky2/kalliky root@207.180.219.180:/opt/

# Ou avec rsync (plus efficace)
rsync -avz --exclude node_modules --exclude .next /Users/mohamedkameldhakwani/kalliky2/kalliky/ root@207.180.219.180:/opt/kalliky/
```

### 2. Se connecter au serveur

```bash
ssh root@207.180.219.180
cd /opt/kalliky
```

### 3. Rendre le script exécutable et le lancer

```bash
chmod +x setup-server.sh
./setup-server.sh
```

## 📝 Configuration Manuelle

### 1. Installer Docker et Docker Compose

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configurer les variables d'environnement

Editez le fichier `.env` avec vos vraies clés :

```bash
nano /opt/kalliky/.env
```

Variables importantes à configurer :
- `JWT_SECRET` : Générer avec `openssl rand -base64 32`
- `OPENAI_API_KEY` : Votre clé OpenAI
- `STRIPE_SECRET_KEY` : Votre clé Stripe
- `TELNYX_API_KEY` : Votre clé Telnyx
- `SMTP_*` : Configuration email

### 3. Lancer les services

```bash
# Construire et démarrer tous les services
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps

# Voir les logs
docker-compose logs -f
```

## 🔍 Vérification

### Tester les services

```bash
# PostgreSQL
docker exec kalliky_postgres psql -U kalliky_user -d kalliky_prod -c "\dt"

# Redis
docker exec kalliky_redis redis-cli -a kalliky_redis_pass_2024 ping

# Application
curl http://localhost:3000
```

### Accéder à l'application

- Local sur le serveur : http://localhost:3000
- Depuis l'extérieur : http://207.180.219.180:3000

## 🛠️ Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart app

# Voir les logs d'un service
docker-compose logs -f postgres
docker-compose logs -f app

# Accéder à un conteneur
docker exec -it kalliky_app sh
docker exec -it kalliky_postgres psql -U kalliky_user

# Reconstruire après modification du code
docker-compose up -d --build app

# Nettoyer complètement (attention aux données!)
docker-compose down -v
```

## 🔐 Sécurité

### 1. Configurer le firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. Changer les mots de passe par défaut

Dans `docker-compose.yml`, changez :
- `POSTGRES_PASSWORD`
- Redis password dans la commande

### 3. Configurer HTTPS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com
```

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs app

# Reconstruire
docker-compose down
docker-compose up -d --build
```

### Erreur de base de données

```bash
# Réinitialiser la base
docker-compose down -v
docker-compose up -d
docker exec kalliky_app npx prisma migrate deploy
```

### Port déjà utilisé

```bash
# Trouver ce qui utilise le port
sudo lsof -i :3000
# Tuer le processus
sudo kill -9 [PID]
```

## 📊 Monitoring

### Voir l'utilisation des ressources

```bash
# CPU et mémoire des conteneurs
docker stats

# Espace disque
df -h
docker system df
```

### Logs centralisés

```bash
# Sauvegarder les logs
docker-compose logs > kalliky_logs_$(date +%Y%m%d).txt
```

## 🔄 Mise à jour

```bash
# Sauvegarder la base de données
docker exec kalliky_postgres pg_dump -U kalliky_user kalliky_prod > backup_$(date +%Y%m%d).sql

# Mettre à jour le code
git pull  # ou transférer les nouveaux fichiers

# Reconstruire et redémarrer
docker-compose up -d --build

# Appliquer les migrations
docker exec kalliky_app npx prisma migrate deploy
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f`
2. Vérifiez l'état des services : `docker-compose ps`
3. Testez la connectivité : `docker exec kalliky_app curl http://postgres:5432`
4. Vérifiez l'espace disque : `df -h`

## 🎯 Checklist Finale

- [ ] Docker et Docker Compose installés
- [ ] Fichiers transférés dans /opt/kalliky
- [ ] Variables d'environnement configurées
- [ ] Services démarrés avec docker-compose
- [ ] Base de données migrée
- [ ] Application accessible sur le port 3000
- [ ] Firewall configuré
- [ ] Backups configurés
- [ ] Monitoring en place

---

**Note**: Gardez ce document à jour avec vos configurations spécifiques !