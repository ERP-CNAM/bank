# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances (y compris les devDependencies pour le build TypeScript)
RUN npm install

# Copie du reste du code source
COPY . .

# Build de l'application TypeScript
# Assurez-vous que votre script "build" dans package.json est "tsc" ou équivalent
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copie uniquement les fichiers nécessaires depuis le stage de build
COPY --from=builder /app/package*.json ./
# Installation uniquement des dépendances de production
RUN npm install --production

# Copie du code compilé (le dossier dist)
# Note: Si votre tsconfig.json a "outDir": "./dist", la structure sera préservée
COPY --from=builder /app/dist ./dist

# Création des répertoires pour les fichiers générés (volumes docker)
# Cela évite les erreurs de permissions si le dossier n'existe pas
RUN mkdir -p public/invoices public/sepa public/cb data

# Changement de propriétaire pour l'utilisateur non-root "node"
RUN chown -R node:node /app

# Utilisateur non-root pour la sécurité
USER node

# Le port sur lequel l'application écoute (défini dans env.ts mais utile pour doc)
EXPOSE 3000

# Commande de démarrage
# Vérifiez si votre build génère dist/index.js ou dist/src/index.js
CMD ["node", "dist/src/index.js"]