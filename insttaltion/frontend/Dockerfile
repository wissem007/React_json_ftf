# Multi-stage build
FROM node:18-alpine as builder

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# Image finale avec Nginx
FROM nginx:alpine

# Installer curl pour health check
RUN apk --no-cache add curl

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

# Démarrage
CMD ["nginx", "-g", "daemon off;"]