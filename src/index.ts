import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { env } from './config/env'
import { registerService } from './core/connect'
import { PaymentService } from './modules/payments/payment.service'

const app = express()
app.use(cors())
app.use(express.json())

const paymentService = new PaymentService()

// Middleware pour gérer le format d'enveloppe de Connect
app.use((req: Request, res: Response, next: NextFunction) => {
    // Si la requête vient de Connect, le payload est à l'intérieur
    if (req.body && req.body.payload && req.body.apiKey) {
        req.body = req.body.payload
    }
    next()
})

// --- Helper pour réponse standardisée ---
const sendResponse = (
    res: Response,
    success: boolean,
    message: string,
    payload: any = null,
) => {
    res.json({
        success: success,
        status: success ? 'success' : 'error',
        message: message,
        payload: payload,
    })
    console.log(`Response sent: status: ${success} - ${message}`)
}

// Route de santé
app.get('/ping', (req, res) => {
    sendResponse(res, true, 'Service Bank is online')
})

// Route principale pour déclencher le cycle de facturation/prélèvement
// A appeler avec { "executionDate": "2026-07-01" }
app.post('/trigger-sync', async (req, res) => {
    try {
        const date =
            req.body.executionDate || new Date().toISOString().split('T')[0]
        const result = await paymentService.runMonthlyProcess(date)
        sendResponse(res, true, 'Synchronisation mensuelle terminée', result)
    } catch (error: any) {
        console.error('Erreur trigger-sync:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * Route pour tester la création de facture et paiement unitairement (sans passer par le flux complet BACK)
 * Utile pour le développement et les tests manuels.
 */
app.post('/api/payment', async (req, res) => {
    try {
        if (!req.body.invoiceRef || !req.body.amount) {
            throw new Error('Données manquantes (invoiceRef ou amount)')
        }
        // Appel au contrôleur unitaire
        const result = await paymentService.processPayment(req.body)
        sendResponse(res, true, 'Paiement unitaire traité', result)
    } catch (error: any) {
        console.error('Erreur /api/payment:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

app.get('/api/payment/:ref', (req, res) => {
    const result = paymentService.getTransactionStatus(req.params.ref)
    if (result) {
        sendResponse(res, true, 'Transaction trouvée', result)
    } else {
        res.status(404).json({ success: false, message: 'Non trouvé' })
    }
})

// Lancement
app.listen(env.BANK_PORT, () => {
    console.log(`=========================================`)
    console.log(`🏦 BANK Service démarré sur le port ${env.BANK_PORT}`)
    console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'dev'}`)
    console.log(`🐋 Docker IP : ${env.CONNECT_URL || 'not set'}`)
    console.log(`=========================================`)
    // Attendre que les autres services soient prêts dans Docker
    setTimeout(() => {
        registerService()
    }, 5000)
})
