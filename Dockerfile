# Build stage
FROM node:22-alpine AS builder

WORKDIR /erp-bank

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances (y compris les devDependencies pour le build TypeScript)
RUN npm install

# Copie du reste du code source
COPY . .

# Build de l'application TypeScript
RUN npm run build

# Suppression des dépendances de développement pour alléger l'image finale
RUN npm prune --production

# Production stage
FROM node:22-alpine AS runner
WORKDIR /erp-bank

ENV NODE_ENV=production

RUN mkdir -p public/invoices public/sepa public/cb data

# Copie uniquement les fichiers nécessaires depuis le stage de build
COPY --from=builder /erp-bank/package*.json ./

# Copie du code compilé (le dossier dist)
COPY --from=builder /erp-bank/dist ./dist
COPY --from=builder /erp-bank/node_modules ./node_modules

# Copie des fichiers statiques nécessaires
COPY --from=builder /erp-bank/public ./public
COPY --from=builder /erp-bank/data ./data

RUN chown -R node:node /erp-bank

# Utilisateur non-root pour la sécurité
USER node

# Le port sur lequel l'application écoute (défini dans env.ts mais utile pour doc)
EXPOSE 3004

CMD ["node","dist/index.js"]