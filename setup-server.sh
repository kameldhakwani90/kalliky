#!/bin/bash

# Script d'installation complète de Kalliky sur votre serveur
# À exécuter sur votre serveur Linux (Ubuntu/Debian)

set -e

echo "🚀 Installation de Kalliky sur le serveur"
echo "========================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Mise à jour du système
echo -e "${YELLOW}📦 Mise à jour du système...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Installation de Docker si nécessaire
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installation de Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo -e "${GREEN}✅ Docker est déjà installé${NC}"
fi

# 3. Installation de Docker Compose si nécessaire
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Installation de Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}✅ Docker Compose est déjà installé${NC}"
fi

# 4. Installation de Git si nécessaire
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Installation de Git...${NC}"
    sudo apt install -y git
else
    echo -e "${GREEN}✅ Git est déjà installé${NC}"
fi

# 5. Création du répertoire d'application
echo -e "${YELLOW}📁 Création du répertoire d'application...${NC}"
sudo mkdir -p /opt/kalliky
sudo chown $USER:$USER /opt/kalliky
cd /opt/kalliky

# 6. Clonage ou mise à jour du code
if [ -d ".git" ]; then
    echo -e "${YELLOW}🔄 Mise à jour du code...${NC}"
    git pull
else
    echo -e "${YELLOW}📥 Clonage du repository...${NC}"
    # Remplacer par votre URL de repository si vous en avez un
    echo -e "${RED}⚠️  Vous devez uploader votre code manuellement dans /opt/kalliky${NC}"
fi

# 7. Configuration du firewall
echo -e "${YELLOW}🔥 Configuration du firewall...${NC}"
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js (temporaire pour tests)
sudo ufw allow 5432/tcp  # PostgreSQL (si accès externe nécessaire)
sudo ufw --force enable

# 8. Création du fichier .env si nécessaire
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Création du fichier .env...${NC}"
    cp .env.production .env
    echo -e "${RED}⚠️  N'oubliez pas de configurer les variables dans .env${NC}"
fi

# 9. Génération d'un JWT secret sécurisé
echo -e "${YELLOW}🔐 Génération d'un JWT secret...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET généré: $JWT_SECRET"
echo -e "${RED}⚠️  Ajoutez ce JWT_SECRET dans votre fichier .env${NC}"

# 10. Création du réseau Docker
echo -e "${YELLOW}🌐 Création du réseau Docker...${NC}"
docker network create kalliky_network 2>/dev/null || true

# 11. Lancement des services
echo -e "${YELLOW}🚀 Lancement des services Docker...${NC}"
docker-compose up -d

# 12. Attente que PostgreSQL soit prêt
echo -e "${YELLOW}⏳ Attente du démarrage de PostgreSQL...${NC}"
sleep 10

# 13. Création de la base shadow pour Prisma
echo -e "${YELLOW}🗄️ Création de la base shadow...${NC}"
docker exec kalliky_postgres psql -U kalliky_user -d kalliky_prod -c "CREATE DATABASE kalliky_shadow;" 2>/dev/null || true

# 14. Application des migrations Prisma
echo -e "${YELLOW}📊 Application des migrations Prisma...${NC}"
docker exec kalliky_app npx prisma migrate deploy

# 15. Vérification des services
echo -e "${YELLOW}🔍 Vérification des services...${NC}"
docker-compose ps

# 16. Affichage des logs
echo -e "${YELLOW}📋 Logs de l'application (Ctrl+C pour quitter)...${NC}"
docker-compose logs -f app

echo -e "${GREEN}✅ Installation terminée !${NC}"
echo ""
echo "📌 Prochaines étapes:"
echo "1. Configurez les variables dans /opt/kalliky/.env"
echo "2. Redémarrez les services: docker-compose restart"
echo "3. Accédez à l'application sur http://votre-ip:3000"
echo "4. Configurez un nom de domaine et SSL avec Nginx"
echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Redémarrer: docker-compose restart"
echo "  - Arrêter: docker-compose down"
echo "  - Reconstruire: docker-compose up -d --build"