#!/bin/bash

set -e

# Variables
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="football-postgres"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

echo "💾 Backup de la base de données..."

# Backup de la base de données
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup des volumes Docker
echo "📦 Backup des volumes..."
docker run --rm -v football-app_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/volumes_backup_$DATE.tar.gz /data

# Backup des configurations
echo "⚙️ Backup des configurations..."
tar czf $BACKUP_DIR/config_backup_$DATE.tar.gz docker-compose.prod.yml .env nginx/ scripts/

echo "🧹 Nettoyage des anciens backups (>7 jours)..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup terminé: $DATE"