
import { InvoiceService } from '../invoices/invoice.service';
import { SepaService } from './sepa.service';
import { DataManager } from '../../utils/data.manager';

export class PaymentController {
    private invoiceService = new InvoiceService();
    private sepaService = new SepaService();
    private dataManager = new DataManager();

    public async processPayment(data: any) {
        // 1. Enregistrer que la demande est reçue
        const transaction = {
            ...data,
            status: 'PROCESSING',
            receivedAt: new Date().toISOString()
        };
        this.dataManager.save(transaction);

        try {
            // 2. Générer le PDF (Obligatoire)
            const pdfPath = await this.invoiceService.createPdf(data);

            // 3. Générer le SEPA (Seulement si méthode = SEPA)
            let sepaPath = null;
            if (data.paymentMethod === 'SEPA') {
                sepaPath = this.sepaService.createXml(data);
            }

            // 4. Mettre à jour le statut final
            // Simulation : Si le montant est > 1000, on simule un échec (juste pour l'exemple)
            const success = data.amount < 1000;

            transaction.status = success ? 'COMPLETED' : 'REJECTED';
            transaction.files = {
                pdf: pdfPath,
                sepa: sepaPath
            };
            
            this.dataManager.save(transaction);
            return transaction;

        } catch (error) {
            transaction.status = 'ERROR';
            this.dataManager.save(transaction);
            throw error;
        }
    }

    public getTransactionStatus(ref: string) {
        return this.dataManager.get(ref);
    }
}