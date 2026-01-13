import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';


import { PaymentRequestDTO } from './modules/payments/payment.request';
import { processPayment } from './modules/payments/payment.processor';
import { BankOperationDTO } from './modules/payments/bank.response';
import { notifyMoney } from './modules/notifications/notifier';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 4004;
const CONNECT_URL = process.env.CONNECT_URL || 'http://localhost:3000';
const CONNECT_API_KEY = process.env.CONNECT_API_KEY || 'changethis';


/**
 * Enregistrement du service BANK
 */
async function registerService(): Promise<void> {
  try {
    await axios.post(`${CONNECT_URL}/register`, {
      name: 'BANK',
      description: 'Gestion des paiements et prélèvements',
      version: '1.0.0',
      routes: [
        {
          path: '/payment/process',
          method: 'POST',
          permission: 2
        }
      ],
      overrideIp: 'host.docker.internal',
      listeningPort: PORT,
      apiKey: CONNECT_API_KEY
    });

    console.log('BANK enregistré auprès de CONNECT');
  } catch (error) {
    console.error('Erreur enregistrement BANK', error);
  }
}

/**
 * Route appelée par CONNECT
 */
app.post('/payment/process', async (req, res) => {
  const { apiKey, payload } = req.body;

  // 🔐 Sécurité : vérifier que l'appel vient bien de CONNECT
  if (apiKey !== CONNECT_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      payload: null
    });
  }

  try {
    // 📥 Payload métier venant de BACK
    const paymentRequest = payload as PaymentRequestDTO;

    // ⚙️ Traitement du paiement
    const operation: BankOperationDTO = processPayment(paymentRequest);

    // 🔔 Notification MONEY via CONNECT
    await notifyMoney(operation);

    // 📤 Réponse standard CONNECT
    return res.status(200).json({
      success: true,
      message: 'Payment processed',
      payload: operation
    });

  } catch (error) {
    console.error('Erreur traitement paiement', error);

    return res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      payload: null
    });
  }
});

/**
 * Démarrage serveur
 */
app.listen(PORT, async () => {
  console.log(`🏦 BANK démarré sur le port ${PORT}`);
  await registerService();
});