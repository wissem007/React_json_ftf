#!/bin/bash

set -e

echo "🚀 Déploiement de l'application Football..."

# Variables
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# Vérifications
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Fichier .env manquant!"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Fichier docker-compose.prod.yml manquant!"
    exit 1
fi

# Chargement des variables
source $ENV_FILE

echo "📦 Pull des dernières images..."
docker-compose -f $COMPOSE_FILE pull

echo "🔨 Build des images..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "⬇️ Arrêt des anciens conteneurs..."
docker-compose -f $COMPOSE_FILE down

echo "🗂️ Nettoyage des ressources inutilisées..."
docker system prune -f

echo "⬆️ Démarrage des nouveaux conteneurs..."
docker-compose -f $COMPOSE_FILE up -d

echo "⏳ Attente du démarrage des services..."
sleep 30

echo "🏥 Vérification de la santé des services..."
docker-compose -f $COMPOSE_FILE ps

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur : https://$DOMAIN_NAME"
echo "📊 API disponible sur : https://api.$DOMAIN_NAME"