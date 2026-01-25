#!/bin/sh
set -e

# On s'assure que les dossiers existent
mkdir -p /erp-bank/public/invoices
mkdir -p /erp-bank/public/sepa
mkdir -p /erp-bank/public/cb
mkdir -p /erp-bank/data

# On force l'appartenance des dossiers à l'utilisateur node
# Cela va corriger les permissions sur le volume monté
chown -R node:node /erp-bank/public
chown -R node:node /erp-bank/data

# On lance la commande demandée (CMD du Dockerfile) en tant qu'utilisateur 'node'
# 'su-exec' est l'équivalent léger de 'sudo' pour Alpine
exec su-exec node "$@"