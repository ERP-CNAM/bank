# Projet ERP Group Bank 🪙💰

## Présentation du groupe BANK

Bienvenue dans la section du groupe `BANK` du projet création d'un ERP.

Le groupe `BANK` doit s'occuper des informations suivantes :

- Génération de Fichier SEPA de demande de prélèvement bancaire.
- Génération de demande de prélèvement bancaire par carte bleue.
- Intégration des relevés bancaires attestant du paiement des clients ou du rejet du paiement.
- Envoi l’information du bon prélèvement ou du rejet de paiement aux groupes qui ont besoin de cette info.
- Ce groupe aura également à faire la génération de la facture PDF et FacturX à transmettre dans le cadre de la facturation électronique (format fictif du mandat SEPA et FacturX Json)

## Mise en place du projet

### Lancer le projet

Vous pouvez cloner le projet et vous rendre dans le répertoire local.

```bash
git clone https://github.com/ERP-CNAM/bank.git
cd bank
```

Avant tout il faudra établir le fichier d'environnement `.env`.
Vous pouvez copier le fichier d'exemple :

```bash
cp .env.example .env
```

Afin de lancer le serveur il faudra d'abord créer les dépendances :

```bash
npm install
```

Pour lancer le serveur local saisir la commande suivante :

```bash
npm run dev
```

Le serveur se lance sur le `port 3004` et va de suite se connceter avec les autres services via `CONNECT`

Ex :

> 🔄 Tentative d'enregistrement de BANK auprès de Connect (http://localhost:8000)...

> ✅ Service enregistré correctement

### Création d'une facture en local

Afin de créer une facture on peut tester notre serveur local en utilisant la commande PowerShell suivante :

```bash
Invoke-RestMethod -Uri "http://localhost:3004/api/payment" -Method Post -ContentType "application/json" -Body '{"invoiceRef": "TEST-LOCAL-001", "amount": 49.99, "clientName": "Testeur BG", "userId": "user-123", "paymentMethod": "SEPA", "iban": "FR761234567890"}'
```

Pour l'utilisation de MAC/Linux :

```bash
curl -X POST "http://localhost:3004/api/payment" -H "Content-Type: application/json" -d '{"invoiceRef": "TEST-LOCAL-001", "amount": 49.99, "clientName": "Testeur BG", "userId": "user-123", "paymentMethod": "SEPA", "iban": "FR761234567890"}'
```

Avec cette commande on aura un repertoire `public/` qui sera genéré et qui va contenir les factures en PDF et Json ainsi que le repertoire `data/` qui contient le fichier `transactions.json` qui retranscrit toutes les transactions effectuées.

## Docker

Faisant partie d'un groupe de services, le service BANK peut être lancé via Docker Compose depuis le répertoire principal du projet ERP.

Cloner le projet principal ERP et s'y rendre :

```bash
git clone https://github.com/ERP-CNAM/erp.git
cd erp
```

Ici nous pouvons lancer tous les services via Docker Compose :

```bash
docker-compose up --build
```

### Tester le service BANK via Docker

Une fois les services lancés, nous pouvons tester le service BANK en passant par le service CONNECT.

Si vous utilisez Postman ou Bruno, vous pouvez faire une requête `POST` vers l'URL suivante :

```bash
http://erp-connect:8000/connect
```

Cette requête doit être faite toujours avec un body JSON qui prend les paramètres suivants :

```json
{
    "apiKey": "changethis",
    "clientName": "TEST_UNITAIRE_1",
    "clientVersion": "1.0.0",
    "serviceName": "[nom_du_service]",
    "path": "[route_api]",
    "debug": true,
    "payload": {}
}
```

#### Pour créer une facture via Docker

Pour créer une facture via Docker, il faudra lancer la route `POST` `http://erp-connect:8000/connect` avec le body suivant :

```json
{
    "apiKey": "changethis",
    "clientName": "TEST_UNITAIRE_1",
    "clientVersion": "1.0.0",
    "serviceName": "BANK",
    "path": "/api/payment",
    "debug": true,
    "payload": {
        "invoiceId": "2c9cbd24-8d0a-48de-988d-f5127dae585e",
        "invoiceRef": "TEST-UNITAIRE-01",
        "amount": 15.0,
        "clientName": "Testeur Unitaire",
        "userId": "u-12345",
        "paymentMethod": "SEPA",
        "iban": "FR761234567890"
    }
}
```

Cette commande generera une facture dans le repertoire `public/` du service BANK et enregistrera la transaction dans le fichier `data/transactions.json`.

#### Pour lancer le batch mensuel via Docker

Une fois qu'on crée des transactions, on peut lancer le batch mensuel qui va synchroniser les paiements en attente.

Pour lancer le batch mensuel via Docker, il faudra lancer la route `POST` `http://erp-connect:8000/connect` avec le body suivant :

```json
{
    "apiKey": "changethis",
    "clientName": "TEST_UNITAIRE_1",
    "clientVersion": "1.0.0",
    "serviceName": "BANK",
    "path": "/trigger-sync",
    "debug": true,
    "payload": {
        "executionDate": "2024-06-15"
    }
}
```
