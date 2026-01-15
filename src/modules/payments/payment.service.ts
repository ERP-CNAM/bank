import { callService } from '../../core/connect'
import { InvoiceService } from '../invoices/invoice.service'
import { SepaService } from './sepa.service'
import { DataManager } from '../../utils/data.manager'
import { notifyMoney } from '../notifications/notifier'
import { BankOperationDTO } from './bank.response'

export class PaymentService {
    private invoiceService = new InvoiceService()
    private sepaService = new SepaService()
    private dataManager = new DataManager()

    // Méthode principale déclenchée manuellement ou par cron
    public async runMonthlyProcess(executionDate: string) {
        console.log(
            `🚀 Démarrage du traitement bancaire pour le : ${executionDate}`,
        )

        // 1. Récupérer les ordres de prélèvements depuis le module BACK (via Connect)
        // La route GET du back attend "executionDate" en query param
        // Connect transforme le payload en query params pour les GET (selon le standard Connect/Back)
        let orders: any[] = []
        try {
            orders = await callService(
                'BACK',
                'exports/banking/direct-debits',
                'GET',
                { executionDate },
            )
        } catch (e) {
            console.error(
                'Erreur lors de la récupération des ordres depuis BACK. Utilisation de données vides.',
            )
            return {
                success: false,
                message: 'Impossible de récupérer les ordres du BACK',
            }
        }

        if (!orders || orders.length === 0) {
            console.log('Aucun ordre de prélèvement reçu.')
            return { success: true, message: 'Aucun ordre à traiter' }
        }

        console.log(`📦 ${orders.length} ordres reçus.`)

        // 2. Séparer SEPA et Carte
        const sepaOrders = orders.filter((o: any) => o.paymentMethod === 'SEPA')
        const cardOrders = orders.filter((o: any) => o.paymentMethod === 'CARD')

        // 3. Générer les fichiers bancaires (SEPA XML / CB Json)
        const sepaFile =
            sepaOrders.length > 0
                ? this.sepaService.generateSepaFile(sepaOrders, executionDate)
                : null
        const cardFile =
            cardOrders.length > 0
                ? this.sepaService.generateCardFile(cardOrders, executionDate)
                : null

        // 4. Générer les factures (PDF/FacturX) pour archivage
        await this.invoiceService.processInvoiceDocuments(orders)

        // 5. Simulation traitement & Préparation Notification MONEY
        const moneyOperations: BankOperationDTO[] = []

        // Ici, on simule que la banque a traité les fichiers et nous renvoie des statuts
        const updates = orders.map((order: any) => {
            // Simulation : 10% de rejet aléatoire
            const isRejected = Math.random() < 0.1

            const status = isRejected ? 'REJECTED' : 'EXECUTED'
            const reason = isRejected ? 'Solde insuffisant' : null

            // Sauvegarde locale dans bank/data/transactions.json
            this.dataManager.save({
                ...order,
                status,
                processedAt: new Date().toISOString(),
                files: { sepa: sepaFile, cb: cardFile },
            })

            // Construction de l'objet pour MONEY
            moneyOperations.push({
                executionDate: executionDate,
                invoiceRef: order.invoiceRef, // Le champ doit correspondre (invoiceRef ou id selon le BACK)
                amount: order.amount,
                paymentMethod: order.paymentMethod,
                status: isRejected ? 'REJECTED' : 'PAID', // Money attend souvent 'PAID' au lieu de 'EXECUTED'
            })

            // Format attendu par le BACK pour le webhook
            return {
                invoiceId: order.invoiceId, // Attention: le back envoie invoiceId, vérifiez bien le modèle t_DirectDebitOrder du back
                status: status,
                rejectionReason: reason,
            }
        })

        // 6. Envoyer les résultats au BACK (et implicitement aux autres via le BACK qui mettra à jour les statuts)
        console.log(`📤 Envoi des mises à jour de paiement au BACK...`)
        try {
            await callService('BACK', 'bank/payment-updates', 'POST', updates)
            console.log('✅ BACK notifié avec succès.')
        } catch (e) {
            console.error('❌ Echec de la notification au BACK')
        }

        // Notification MONEY. On envoie toutes les opérations d'un coup
        if (moneyOperations.length > 0) {
            await notifyMoney(moneyOperations)
        }

        return {
            success: true,
            processed: orders.length,
            files: { sepa: sepaFile, card: cardFile },
        }
    }

    public async processPayment(data: any) {
        // 1. Initialisation de la transaction
        const transaction = {
            ...data,
            status: 'PROCESSING',
            receivedAt: new Date().toISOString(),
            files: {} as any,
        }

        // Sauvegarde initiale
        this.dataManager.save(transaction)

        try {
            console.log(`[BANK] Traitement de la facture ${data.invoiceRef}`)

            // 2. Génération des documents de facturation (Consigne: PDF + FacturX)
            const pdfPath = await this.invoiceService.createPdf(data)
            const facturxPath = await this.invoiceService.createFacturX(data)

            transaction.files.pdf = pdfPath
            transaction.files.facturx = facturxPath

            // 3. Génération des fichiers bancaires (Consigne: SEPA ou CB)
            // Note: SepaService a été adapté pour gérer des listes, on lui passe un tableau d'un élément
            const executionDate = new Date().toISOString().split('T')[0]

            if (data.paymentMethod === 'SEPA') {
                const sepaFile = this.sepaService.generateSepaFile(
                    [data],
                    executionDate,
                )
                transaction.files.sepa = sepaFile
            } else if (data.paymentMethod === 'CARD') {
                const cbFile = this.sepaService.generateCardFile(
                    [data],
                    executionDate,
                )
                transaction.files.cb = cbFile
            }

            // 4. Simulation du résultat bancaire (Intégration relevés)
            // Si montant > 2000, on simule un rejet pour l'exemple, sinon succès
            const isSuccess = data.amount < 2000

            transaction.status = isSuccess ? 'COMPLETED' : 'REJECTED'
            transaction.processedAt = new Date().toISOString()

            // Sauvegarde finale
            this.dataManager.save(transaction)

            console.log(
                `[BANK] Résultat pour ${data.invoiceRef}: ${transaction.status}`,
            )
            return transaction
        } catch (error: any) {
            console.error('[BANK] Erreur:', error)
            transaction.status = 'ERROR'
            transaction.error = error.message
            this.dataManager.save(transaction)
            throw error
        }
    }

    public getTransactionStatus(ref: string) {
        return this.dataManager.get(ref)
    }
}
