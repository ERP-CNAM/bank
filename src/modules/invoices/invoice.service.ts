import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

export class InvoiceService {
    private folder = path.join(__dirname, '../../../public/invoices')

    constructor() {
        if (!fs.existsSync(this.folder)) {
            fs.mkdirSync(this.folder, { recursive: true })
        }
    }

    // Génère PDF et FacturX JSON
    async processInvoiceDocuments(orders: any[]) {
        const generated = []
        for (const order of orders) {
            const pdf = await this.createPdf(order)
            const facturx = await this.createFacturX(order)
            generated.push({ ref: order.invoiceRef, pdf, facturx })
        }
        return generated
    }

    public async createFacturX(order: any): Promise<string> {
        // Format Fictif JSON pour FacturX
        const data = {
            type: 'FACTUR-X-MINIMUM',
            id: order.invoiceRef,
            date: new Date().toISOString(),
            seller: { name: 'GAMERS ERP' },
            buyer: { id: order.userId, name: order.clientName },
            total: order.amount,
            currency: 'EUR',
            paymentMethod: order.paymentMethod,
        }

        const filename = `${order.invoiceRef}_FX.json`
        fs.writeFileSync(
            path.join(this.folder, filename),
            JSON.stringify(data, null, 2),
        )
        return filename
    }

    public createPdf(data: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument()
            const filename = `FACT_${data.invoiceRef}.pdf`
            const filepath = path.join(this.folder, filename)
            const stream = fs.createWriteStream(filepath)

            doc.pipe(stream)

            // En-tête
            doc.fontSize(20).text('FACTURE GAMERS ERP', { align: 'center' })
            doc.moveDown()

            // Détails
            doc.fontSize(12)
            doc.text(`Référence : ${data.invoiceRef}`)
            doc.text(`Date      : ${new Date().toLocaleDateString()}`)
            doc.moveDown()

            doc.text(`Client    : ${data.clientName || 'Client Inconnu'}`)
            doc.text(`ID Client : ${data.userId}`)
            doc.moveDown()

            // Montant
            doc.fontSize(14).text(`Montant à payer : ${data.amount} EUR`, {
                align: 'right',
            })
            doc.fontSize(10).text(`Moyen de paiement : ${data.paymentMethod}`, {
                align: 'right',
            })

            doc.end()

            stream.on('finish', () => resolve(filename))
            stream.on('error', (err) => reject(err))
        })
    }
}
