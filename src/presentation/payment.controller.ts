import { Request, Response } from 'express'
import { PaymentService } from '../application/payment.service'

export class PaymentController {
    constructor(private service: PaymentService) {}

    // Middleware Connect Wrapper
    static unwrapConnect(req: Request, res: Response, next: any) {
        if (req.body?.apiKey && req.body?.payload) {
            req.body = req.body.payload
            res.locals.isFromConnect = true
        }
        next()
    }

    // ✅ CORRECTION : Format standard Connect
    private formatResponse(res: Response, data: any, message: string) {
        if (res.locals.isFromConnect) {
            // Format attendu par Connect
            return res.json({
                success: true,
                status: 'success',
                message: message,
                payload: data  // ← Les données métier dans "payload"
            })
        } else {
            // API publique : format standard
            return res.json({
                success: true,
                message: message,
                data: data
            })
        }
    }

    private formatError(res: Response, error: Error, statusCode = 500) {
        if (res.locals.isFromConnect) {
            return res.status(statusCode).json({
                success: false,
                status: 'error',
                message: error.message,
                payload: {}
            })
        } else {
            return res.status(statusCode).json({
                success: false,
                message: error.message
            })
        }
    }

    // POST /trigger-sync
    triggerSync = async (req: Request, res: Response) => {
        try {
            const date = req.body.executionDate || new Date().toISOString().split('T')[0]
            const result = await this.service.runMonthlyProcess(date)
            return this.formatResponse(res, result, 'Synchronisation terminée')
        } catch (error: any) {
            return this.formatError(res, error)
        }
    }

    // POST /api/payment
    processUnit = async (req: Request, res: Response) => {
        try {
            if (!req.body.invoiceRef || !req.body.amount)
                throw new Error('Données manquantes')
            
            const result = await this.service.processPayment(req.body)
            return this.formatResponse(res, result, 'Paiement traité avec succès')
        } catch (error: any) {
            return this.formatError(res, error)
        }
    }

    // GET /api/payment/:ref
    getStatus = async (req: Request, res: Response) => {
        try {
            const result = await this.service.getTransactionStatus(req.params.ref as string)
            
            if (!result) {
                throw new Error('Transaction non trouvée')
            }
            
            return this.formatResponse(res, result, 'Statut récupéré avec succès')
        } catch (error: any) {
            return this.formatError(res, error, 404)
        }
    }
}