import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { registerService } from './core/connect'
import { PaymentService } from './modules/payments/payment.service'

const app = express()
app.use(cors())
app.use(express.json())

const paymentService = new PaymentService()

// Middleware pour gérer le format d'enveloppe de Connect
app.use((req: any, res: any, next: any) => {
    // Si la requête vient de Connect, le payload est à l'intérieur
    if (req.body && req.body.payload && req.body.apiKey) {
        req.body = req.body.payload
    }
    next()
})

// Route de santé
app.get('/ping', (req, res) => {
    res.json({ success: true, message: 'Pong from BANK' })
})

// Route principale pour déclencher le cycle de facturation/prélèvement
// A appeler avec { "executionDate": "2026-07-01" }
app.post('/trigger-sync', async (req, res) => {
    try {
        const date =
            req.body.executionDate || new Date().toISOString().split('T')[0]
        const result = await paymentService.runMonthlyProcess(date)
        res.json({ success: true, payload: result })
    } catch (error: any) {
        console.error(error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Lancement
app.listen(env.PORT, () => {
    console.log(`🏦 BANK Service listening on port ${env.PORT}`)
    // Attendre que les autres services soient prêts dans Docker
    setTimeout(() => {
        registerService()
    }, 5000)
})
