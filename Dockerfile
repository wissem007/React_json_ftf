# Utiliser une image Node.js officielle comme base
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code de l'application
COPY . .

# Exposer le port sur lequel l'application va tourner
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "start"]