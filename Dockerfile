# Build stage
FROM node:22-alpine AS builder

WORKDIR /erp-cnam-bank

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
FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /erp-cnam-bank

ENV NODE_ENV=production

# Copie uniquement les fichiers nécessaires depuis le stage de build
COPY --from=builder /erp-cnam-bank/package*.json ./
# Installation uniquement des dépendances de production
RUN npm install --production

# Copie du code compilé (le dossier dist)
# Note: Si votre tsconfig.json a "outDir": "./dist", la structure sera préservée
COPY --from=builder /erp-cnam-bank/dist ./dist

# Création des répertoires pour les fichiers générés (volumes docker)
# Cela évite les erreurs de permissions si le dossier n'existe pas
RUN mkdir -p public/invoices public/sepa public/cb data

# Changement de propriétaire pour l'utilisateur non-root "node"
RUN chown -R node:node /erp-cnam-bank

# Utilisateur non-root pour la sécurité
USER node

# Le port sur lequel l'application écoute (défini dans env.ts mais utile pour doc)
EXPOSE 3004

# Commande de démarrage
# Vérifiez si votre build génère dist/index.js ou dist/src/index.js
CMD ["node", "dist/src/index.js"]