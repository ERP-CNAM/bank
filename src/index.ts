import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { env } from './config/env'
import { ConnectAdapter } from './infrastructure/adapters/connect.adapter'
import { FileGenerator } from './infrastructure/generators/file.generator'
import { JsonTransactionRepository } from './infrastructure/repositories/json.repository'
import { PaymentService } from './application/payment.service'
import { PaymentController } from './presentation/payment.controller'

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

// --- Routes ---
app.get('/ping', (req, res) =>
    res.json({ success: true, message: 'Bank Online' }),
)
app.post('/trigger-sync', controller.triggerSync)
app.post('/api/payment', controller.processUnit)
app.get('/api/payment/:ref', controller.getStatus)

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

    if (env.CRON_ENABLED === 'true') {
        const cronSchedule = env.CRON_SCHEDULE || '0 2 1 * *'

        console.log(`CRON activé avec la planification : ${cronSchedule}`)
        
        if (!cron.validate(cronSchedule)) {
            console.error(`❌ Format CRON invalide : ${cronSchedule}`)
            console.error(`   Format attendu : "minute heure jour mois jour_semaine"`)
            console.error(`   Exemple : "0 2 1 * *" (1er de chaque mois à 2h)`)
        } else {
            cron.schedule(cronSchedule, async () => {
                const executionDate = new Date().toISOString().split('T')[0]
                console.log(``)
                console.log(`╔════════════════════════════════════════════════════╗`)
                console.log(`║      DÉCLENCHEMENT AUTOMATIQUE DU BATCH MENSUEL    ║`)
                console.log(`║   Date d'exécution : ${executionDate}              ║`)
                console.log(`╚════════════════════════════════════════════════════╝`)
                console.log(``)

                try {
                    const result = await service.runMonthlyProcess(executionDate)
                    console.log(`Batch mensuel terminé avec succès`)
                    console.log(`Résultat :`, result)
                } catch (error: any) {
                    console.error(`Erreur lors du batch mensuel :`, error.message)
                }
            })

            console.log(`Planification CRON configurée`)
            console.log(`   Prochaine exécution : ${getNextCronExecution(cronSchedule)}`)
        }
    } else {
        console.log(`⏸CRON désactivé (CRON_ENABLED=${env.CRON_ENABLED})`)
        console.log(`   Pour activer le batch automatique, définir CRON_ENABLED=true dans .env`)
    }
})

function getNextCronExecution(schedule: string): string {
    try {
        return "Calculé par node-cron (voir logs au démarrage)"
    } catch (e) {
        return "Non calculable"
    }
}