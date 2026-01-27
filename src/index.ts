import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { env } from './config/env'
import { ConnectAdapter } from './infrastructure/adapters/connect.adapter'
import { FileGenerator } from './infrastructure/generators/file.generator'
import { JsonTransactionRepository } from './infrastructure/repositories/json.repository'
import { PaymentService } from './application/payment.service'
import { PaymentController } from './presentation/payment.controller'
import { FileController } from './presentation/file.controller'
const app = express()
app.use(cors())
app.use(express.json())
app.use(PaymentController.unwrapConnect)

// Injection des dépendances
const connectAdapter = new ConnectAdapter()
const fileGenerator = new FileGenerator()
const transactionRepo = new JsonTransactionRepository()
const service = new PaymentService(
    connectAdapter,
    fileGenerator,
    transactionRepo,
)
const controller = new PaymentController(service)
const fileController = new FileController()

// --- Routes ---
app.get('/ping', (req, res) =>
    res.json({ success: true, message: 'Bank Online' }),
)
app.post('/trigger-sync', controller.triggerSync)
app.post('/api/payment', controller.processUnit)
app.get('/api/payment/:ref', controller.getStatus)

app.get('/api/files/invoice/:filename', fileController.downloadInvoice)
app.get('/api/files/sepa/:filename', fileController.downloadSepa)
app.get('/api/files/cb/:filename', fileController.downloadCb)
app.get('/api/files', fileController.listFiles)

// --- Lancement ---
app.listen(env.BANK_PORT, async () => {
    console.log(`=========================================`)
    console.log(`🏦 BANK Service démarré sur le port ${env.BANK_PORT}`)
    console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'dev'}`)
    console.log(`🐋 Docker IP : ${env.CONNECT_URL || 'not set'}`)
    console.log(`=========================================`)

    // Enregistrement asynchrone auprès de Connect
    await connectAdapter.registerService([
        { path: 'trigger-sync', method: 'POST', permission: 0 },
        { path: 'api/payment', method: 'POST', permission: 0 },
        { path: 'api/payment/{ref}', method: 'GET', permission: 0 },
        { path: 'ping', method: 'GET', permission: 0 },
    ])
})