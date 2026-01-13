import express, { Request, Response } from 'express';
import cors from 'cors';
import { PaymentController } from './modules/payments/payment.controller';

const app = express();
const port = 3004; // Port officiel du Groupe 4

app.use(cors());
app.use(express.json());

const controller = new PaymentController();

// --- Fonction pour répondre au format standard Connect ---
const sendResponse = (res: Response, success: boolean, message: string, payload: any = null) => {
    res.json({
        success: success,
        status: success ? "success" : "error",
        message: message,
        payload: payload
    });
};

// --- Routes ---

// 1. Check de santé (pour Connect)
app.get('/', (req, res) => {
    sendResponse(res, true, "Service Bank is online");
});

// 2. Recevoir un paiement
app.post('/api/payment', async (req, res) => {
    try {
        console.log("Reçu demande:", req.body);
        if (!req.body.invoiceRef || !req.body.amount) {
            throw new Error("Données manquantes (invoiceRef ou amount)");
        }

        const result = await controller.processPayment(req.body);
        sendResponse(res, true, "Traitement effectué", result);
    } catch (error: any) {
        console.error(error);
        sendResponse(res, false, error.message || "Erreur interne");
    }
});

// 3. Vérifier un statut
app.get('/api/payment/:ref', (req, res) => {
    const result = controller.getTransactionStatus(req.params.ref);
    if (result) {
        sendResponse(res, true, "Transaction trouvée", result);
    } else {
        sendResponse(res, false, "Transaction inconnue");
    }
});

// Lancement
app.listen(port, () => {
    console.log(`=========================================`);
    console.log(`[BANK] Serveur démarré sur le port ${port}`);
    console.log(`[BANK] Prêt à recevoir des requêtes`);
    console.log(`=========================================`);
});