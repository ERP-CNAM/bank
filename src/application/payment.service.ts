// import { callService } from '../infrastructure/adapters/connect.adapter'
// import { InvoiceService } from '../invoices/invoice.service'
// import { SepaService } from '../modules/payments/sepa.service'
// import { DataManager } from '../utils/data.manager'
import { IBankProvider } from '../domain/interfaces/IBankProvider.js'
import { IFileGenerator } from '../domain/interfaces/IFileGenerator.js'
import { ITransactionRepository } from '../domain/interfaces/ITransactionRepository.js'

export class PaymentService {
    constructor(
        private bankProvider: IBankProvider,
        private fileGenerator: IFileGenerator,
        private repo: ITransactionRepository,
    ) {}

    // Méthode principale déclenchée manuellement ou par cron
    async runMonthlyProcess(executionDate: string) {
        console.log(
            `🚀 Démarrage du traitement bancaire pour le : ${executionDate}`,
        )

        // 1. Récupérer les ordres de prélèvements depuis le module BACK (via Connect)
        // La route GET du back attend "executionDate" en query param
        // Connect transforme le payload en query params pour les GET (selon le standard Connect/Back)
        let orders
        try {
            orders = await this.bankProvider.fetchDirectDebits(executionDate)
        } catch (e: any) {
            return {
                success: false,
                message: `Impossible de récupérer les ordres du BACK: ${e.message}`,
            }
        }

        if (!orders?.length)
            return { success: true, message: 'Aucun ordre à traiter' }

        console.log(`📦 ${orders.length} ordres reçus.`)

        // 2. Séparer SEPA et Carte
        const sepaOrders = orders.filter((o: any) => o.paymentMethod === 'SEPA')
        const cardOrders = orders.filter((o: any) => o.paymentMethod === 'CARD')

        const sepaFile = this.fileGenerator.generateBankingFile(
            sepaOrders,
            'SEPA',
            executionDate,
        )
        const cardFile = this.fileGenerator.generateBankingFile(
            cardOrders,
            'CARD',
            executionDate,
        )
        // 3. Traitement & Génération factures individuelles
        const updates = []
        for (const order of orders) {
            // Génération docs (PDF/FacturX)
            await this.fileGenerator.generateInvoice(order)

            // Simulation résultat (10% échec)
            const isRejected = Math.random() < 0.1
            const status = isRejected ? 'REJECTED' : 'EXECUTED'

            // Sauvegarde locale
            await this.repo.save({
                ...order,
                status: isRejected ? 'REJECTED' : 'COMPLETED',
                processedAt: new Date().toISOString(),
            })

            updates.push({
                invoiceId: order.invoiceId,
                status,
                rejectionReason: isRejected ? 'Solde insuffisant' : null,
            })
        }
        // 4. Notification Back
        console.log(`📤 Envoi des mises à jour de paiement au BACK...`)
        try {
            await this.bankProvider.notifyPaymentUpdates(updates)
            console.log('✅ Back notifié avec succès.')
        } catch (e) {
            console.error('❌ Echec de la notification au BACK:')
        }

        return {
            success: true,
            count: orders.length,
            files: { sepaFile, cardFile },
        }
    }

    async processPayment(data: any) {
        console.log(`Traitement unitaire en cours : ${data.invoiceRef}`)
        const files = await this.fileGenerator.generateInvoice(data)
        const isSuccess = data.amount < 2000

        // 1. Initialisation de la transaction
        const transaction = {
            ...data,
            status: isSuccess ? 'COMPLETED' : 'REJECTED',
            receivedAt: new Date().toISOString(),
            files,
        }

        // Sauvegarde initiale
        await this.repo.save(transaction)

        if (data.invoiceId) {
            await this.bankProvider
                .notifyPaymentUpdates([
                    {
                        invoiceId: data.invoiceId,
                        status: isSuccess ? 'EXECUTED' : 'REJECTED',
                        rejectionReason: isSuccess ? null : 'Rejet simulé',
                    },
                ])
                .catch(console.error)
        }

        return transaction
    }

    async getTransactionStatus(ref: string) {
        return this.repo.get(ref)
    }
}
