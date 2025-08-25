#!/bin/bash

# =============================================================================
# SCRIPT D'INSTALLATION SÉCURISÉ POUR APPLICATION SPRING BOOT + REACT + POSTGRESQL
# Debian 11 avec sécurité renforcée et HTTPS Let's Encrypt
# =============================================================================

set -e  # Arrête le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables de configuration (À MODIFIER SELON VOS BESOINS)
APP_NAME="football-app"
APP_USER="football"
APP_DIR="/opt/$APP_NAME"
DOMAIN_NAME=""  # À remplir : exemple.com
EMAIL=""        # À remplir : admin@exemple.com
DB_NAME="football_db"
DB_USER="football_user"
DB_PASSWORD=""  # Sera généré automatiquement
SSH_PORT="2222"  # Port SSH personnalisé pour la sécurité

# =============================================================================
# 1. VÉRIFICATIONS PRÉALABLES
# =============================================================================

check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier que le script est exécuté en tant que root ou avec sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root ou avec sudo"
        exit 1
    fi
    
    # Vérifier les variables obligatoires
    if [[ -z "$DOMAIN_NAME" ]]; then
        read -p "Entrez votre nom de domaine (ex: monsite.com): " DOMAIN_NAME
    fi
    
    if [[ -z "$EMAIL" ]]; then
        read -p "Entrez votre email pour Let's Encrypt: " EMAIL
    fi
    
    # Générer un mot de passe pour la base de données
    if [[ -z "$DB_PASSWORD" ]]; then
        DB_PASSWORD=$(openssl rand -base64 32)
        log_info "Mot de passe DB généré automatiquement"
    fi
    
    log_success "Prérequis vérifiés"
}

# =============================================================================
# 2. MISE À JOUR ET INSTALLATION DES DÉPENDANCES
# =============================================================================

install_dependencies() {
    log_info "Mise à jour du système et installation des dépendances..."
    
    # Mise à jour du système
    apt update && apt upgrade -y
    
    # Installation des outils de base
    apt install -y curl wget gnupg2 software-properties-common apt-transport-https \
                   ufw fail2ban unattended-upgrades apt-listchanges \
                   htop tree git zip unzip
    
    log_success "Dépendances installées"
}

# =============================================================================
# 3. SÉCURISATION DU SERVEUR
# =============================================================================

secure_server() {
    log_info "Configuration de la sécurité du serveur..."
    
    # Configuration du pare-feu UFW
    log_info "Configuration du pare-feu UFW..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow $SSH_PORT/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw --force enable
    
    # Configuration de Fail2Ban
    log_info "Configuration de Fail2Ban..."
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = $SSH_PORT
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
logpath = /var/log/nginx/error.log

[nginx-botsearch]
enabled = true
logpath = /var/log/nginx/error.log
EOF
    
    # Configuration des mises à jour automatiques
    log_info "Configuration des mises à jour automatiques..."
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF
    
    # Sécurisation SSH (si pas déjà fait)
    log_info "Sécurisation SSH..."
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
    
    # Modification du port SSH
    sed -i "s/#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
    sed -i "s/Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
    
    # Autres configurations SSH sécurisées
    grep -q "PermitRootLogin" /etc/ssh/sshd_config && sed -i "s/PermitRootLogin yes/PermitRootLogin no/" /etc/ssh/sshd_config
    grep -q "PasswordAuthentication" /etc/ssh/sshd_config && sed -i "s/#PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config
    echo "MaxAuthTries 3" >> /etc/ssh/sshd_config
    echo "ClientAliveInterval 300" >> /etc/ssh/sshd_config
    echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config
    
    systemctl restart ssh
    systemctl restart fail2ban
    
    log_success "Serveur sécurisé"
}

# =============================================================================
# 4. INSTALLATION DE JAVA
# =============================================================================

install_java() {
    log_info "Installation de Java 17..."
    apt install -y openjdk-17-jdk
    
    # Configuration de JAVA_HOME
    echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> /etc/environment
    source /etc/environment
    
    log_success "Java installé: $(java -version 2>&1 | head -1)"
}

# =============================================================================
# 5. INSTALLATION DE NODE.JS
# =============================================================================

install_nodejs() {
    log_info "Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt install -y nodejs
    
    log_success "Node.js installé: $(node --version)"
}

# =============================================================================
# 6. INSTALLATION ET CONFIGURATION DE POSTGRESQL
# =============================================================================

install_postgresql() {
    log_info "Installation et configuration de PostgreSQL..."
    
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    # Configuration de PostgreSQL
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    # Sécurisation de PostgreSQL
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$(openssl rand -base64 32)';"
    
    # Configuration des accès
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
    
    # Sauvegarde des informations de connexion
    cat > $APP_DIR/db_config.txt << EOF
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASSWORD
Connection String: jdbc:postgresql://localhost:5432/$DB_NAME
EOF
    
    systemctl restart postgresql
    
    log_success "PostgreSQL configuré"
}

# =============================================================================
# 7. INSTALLATION DE NGINX
# =============================================================================

install_nginx() {
    log_info "Installation et configuration de Nginx..."
    
    apt install -y nginx
    
    # Configuration de sécurité pour Nginx
    cat > /etc/nginx/conf.d/security.conf << EOF
# Sécurité Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

# Masquer la version Nginx
server_tokens off;

# Limites de taille
client_max_body_size 10M;

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
EOF
    
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx installé et configuré"
}

# =============================================================================
# 8. CRÉATION DE L'UTILISATEUR APPLICATION
# =============================================================================

create_app_user() {
    log_info "Création de l'utilisateur application..."
    
    # Créer l'utilisateur système
    useradd -r -s /bin/false $APP_USER || log_info "Utilisateur $APP_USER déjà existant"
    
    # Créer les dossiers
    mkdir -p $APP_DIR/{backend,frontend,logs,backups}
    chown -R $APP_USER:$APP_USER $APP_DIR
    chmod 755 $APP_DIR
    
    log_success "Utilisateur $APP_USER créé"
}

# =============================================================================
# 9. CONFIGURATION DU SERVICE SYSTEMD
# =============================================================================

create_systemd_service() {
    log_info "Configuration du service systemd..."
    
    cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=$APP_NAME Spring Boot Application
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/java -jar -Xmx512m -Xms256m $APP_DIR/backend/target/*.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$APP_NAME

# Variables d'environnement
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/$DB_NAME
Environment=SPRING_DATASOURCE_USERNAME=$DB_USER
Environment=SPRING_DATASOURCE_PASSWORD=$DB_PASSWORD

# Sécurité
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable $APP_NAME
    
    log_success "Service systemd configuré"
}

# =============================================================================
# 10. INSTALLATION DE CERTBOT (LET'S ENCRYPT)
# =============================================================================

install_certbot() {
    log_info "Installation de Certbot pour Let's Encrypt..."
    
    apt install -y certbot python3-certbot-nginx
    
    log_success "Certbot installé"
}

# =============================================================================
# 11. CONFIGURATION NGINX AVEC SSL
# =============================================================================

configure_nginx_ssl() {
    log_info "Configuration de Nginx avec SSL..."
    
    # Configuration initiale sans SSL
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Redirection vers HTTPS (sera activée après l'obtention du certificat)
    # return 301 https://\$server_name\$request_uri;

    # Frontend React
    location / {
        root /var/www/$APP_NAME;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Sécurité - bloquer les fichiers sensibles
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(sql|log|conf)$ {
        deny all;
    }
}
EOF
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Créer le dossier web
    mkdir -p /var/www/$APP_NAME
    chown -R www-data:www-data /var/www/$APP_NAME
    
    # Page temporaire
    cat > /var/www/$APP_NAME/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>$APP_NAME - Installation en cours</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>$APP_NAME</h1>
        <p>Installation en cours... L'application sera bientôt disponible.</p>
    </div>
</body>
</html>
EOF
    
    nginx -t && systemctl reload nginx
    
    log_success "Configuration Nginx créée"
}

# =============================================================================
# 12. OBTENTION DU CERTIFICAT SSL
# =============================================================================

setup_ssl() {
    log_info "Obtention du certificat SSL Let's Encrypt..."
    
    # Obtenir le certificat
    certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL
    
    if [ $? -eq 0 ]; then
        log_success "Certificat SSL obtenu avec succès"
        
        # Activer la redirection HTTPS
        sed -i 's/# return 301 https:/return 301 https:/' /etc/nginx/sites-available/$APP_NAME
        systemctl reload nginx
        
        # Configurer le renouvellement automatique
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
    else
        log_error "Erreur lors de l'obtention du certificat SSL"
        log_warning "Vérifiez que votre domaine pointe vers ce serveur"
    fi
}

# =============================================================================
# 13. SCRIPTS DE MAINTENANCE
# =============================================================================

create_maintenance_scripts() {
    log_info "Création des scripts de maintenance..."
    
    # Script de déploiement
    cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash
APP_NAME="football-app"
APP_DIR="/opt/$APP_NAME"

cd $APP_DIR

echo "🚀 Déploiement en cours..."

# Pull des modifications (si repo git)
if [ -d ".git" ]; then
    git pull origin main
fi

# Build du frontend
if [ -d "frontend" ]; then
    cd frontend
    npm ci --only=production
    npm run build
    sudo cp -r dist/* /var/www/$APP_NAME/
    cd ..
fi

# Build du backend
if [ -d "backend" ]; then
    cd backend
    ./mvnw clean package -DskipTests
    cd ..
fi

# Redémarrage des services
sudo systemctl restart $APP_NAME
sudo systemctl reload nginx

echo "✅ Déploiement terminé!"
EOF

    # Script de backup
    cat > $APP_DIR/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="$APP_DIR/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

# Backup de la base de données
pg_dump -h localhost -U $DB_USER $DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup des fichiers de configuration
tar -czf \$BACKUP_DIR/config_backup_\$DATE.tar.gz /etc/nginx/sites-available/$APP_NAME /etc/systemd/system/$APP_NAME.service

# Nettoyage des anciens backups (garde 7 jours)
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup terminé: \$DATE"
EOF

    # Script de monitoring
    cat > $APP_DIR/status.sh << EOF
#!/bin/bash
echo "=== STATUS $APP_NAME ==="
echo "Service: \$(systemctl is-active $APP_NAME)"
echo "Nginx: \$(systemctl is-active nginx)"
echo "PostgreSQL: \$(systemctl is-active postgresql)"
echo "Certificat SSL: \$(certbot certificates | grep $DOMAIN_NAME || echo 'Aucun')"
echo "Espace disque: \$(df -h / | tail -1)"
echo "RAM: \$(free -h | grep Mem)"
echo "UFW: \$(ufw status | head -1)"
EOF

    # Permissions
    chmod +x $APP_DIR/*.sh
    chown $APP_USER:$APP_USER $APP_DIR/*.sh
    
    # Programmer le backup quotidien
    (crontab -u $APP_USER -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -u $APP_USER -
    
    log_success "Scripts de maintenance créés"
}

# =============================================================================
# 14. FONCTION PRINCIPALE
# =============================================================================

main() {
    log_info "🚀 Début de l'installation de $APP_NAME"
    
    check_prerequisites
    install_dependencies
    secure_server
    install_java
    install_nodejs
    install_postgresql
    install_nginx
    install_certbot
    create_app_user
    create_systemd_service
    configure_nginx_ssl
    setup_ssl
    create_maintenance_scripts
    
    log_success "🎉 Installation terminée!"
    
    # Affichage des informations importantes
    cat << EOF

=============================================================================
📋 RÉSUMÉ DE L'INSTALLATION
=============================================================================
🌐 Domaine: https://$DOMAIN_NAME
📁 Dossier app: $APP_DIR
👤 Utilisateur: $APP_USER
🔒 Port SSH: $SSH_PORT
📧 Email Let's Encrypt: $EMAIL

📊 INFORMATIONS BASE DE DONNÉES:
Nom: $DB_NAME
Utilisateur: $DB_USER
Mot de passe: $DB_PASSWORD

🛠️ COMMANDES UTILES:
Statut: sudo systemctl status $APP_NAME
Logs: sudo journalctl -u $APP_NAME -f
Redémarrer: sudo systemctl restart $APP_NAME
Déployer: $APP_DIR/deploy.sh
Status: $APP_DIR/status.sh
Backup: $APP_DIR/backup.sh

📁 FICHIERS DE CONFIGURATION:
- Service: /etc/systemd/system/$APP_NAME.service
- Nginx: /etc/nginx/sites-available/$APP_NAME
- DB config: $APP_DIR/db_config.txt

⚠️  PROCHAINES ÉTAPES:
1. Transférez vos fichiers dans $APP_DIR/
2. Compilez votre application
3. Démarrez le service: sudo systemctl start $APP_NAME
4. Testez: https://$DOMAIN_NAME

🔐 SÉCURITÉ CONFIGURÉE:
✅ Pare-feu UFW activé
✅ Fail2Ban configuré
✅ SSH sécurisé (port $SSH_PORT)
✅ Certificat SSL installé
✅ Headers de sécurité Nginx
✅ Mises à jour automatiques

=============================================================================
EOF
}

# Exécuter le script principal
main "$@"
