import { Request, Response } from 'express'
import { PaymentService } from '../application/payment.service'

export class PaymentController {
    constructor(private service: PaymentService) {}

    // Middleware Connect Wrapper
    static unwrapConnect(req: Request, res: Response, next: any) {
        if (req.body?.apiKey && req.body?.payload) {
            req.body = req.body.payload
        }
        next()
    }

    // POST /trigger-sync
    triggerSync = async (req: Request, res: Response) => {
        try {
            const date =
                req.body.executionDate || new Date().toISOString().split('T')[0]
            const result = await this.service.runMonthlyProcess(date)
            res.json({
                success: true,
                message: 'Synchronisation terminée',
                data: result,
            })
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message })
        }
    }

    // POST /api/payment
    processUnit = async (req: Request, res: Response) => {
        try {
            if (!req.body.invoiceRef || !req.body.amount)
                throw new Error('Données manquantes')
            const result = await this.service.processPayment(req.body)
            res.json({
                success: true,
                data: result
            })
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message })
        }
    }

    // GET /api/payment/:ref
getStatus = async (req: Request, res: Response) => {
        try {
            const result = await this.service.getTransactionStatus(req.params.ref as string);
            if (result) {
                res.json({
                    success: true,
                    message: 'Statut récupéré avec succès',
                    data: result, // Changé 'payload' en 'data'
                });
            } else {
                res.status(404).json({ success: false, message: 'Non trouvé' });
            }
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
