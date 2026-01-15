# Projet ERP Group Bank 🪙💰

## Présentation du groupe BANK

Bienvenue dans la section du groupe `BANK` du projet création d'un ERP.

Le groupe `BANK` doit s'occuper des informations suivantes :

-   Génération de Fichier SEPA de demande de prélèvement bancaire.
-   Génération de demande de prélèvement bancaire par carte bleue.
-   Intégration des relevés bancaires attestant du paiement des clients ou du rejet du paiement.
-   Envoi l’information du bon prélèvement ou du rejet de paiement aux groupes qui ont besoin de cette info.
-   Ce groupe aura également à faire la génération de la facture PDF et FacturX à transmettre dans le cadre de la facturation électronique (format fictif du mandat SEPA et FacturX Json)

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
