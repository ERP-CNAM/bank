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

    private async createFacturX(order: any): Promise<string> {
        // Format Fictif JSON pour FacturX
        const data = {
            type: 'FACTUR-X-MINIMUM',
            id: order.invoiceRef,
            date: new Date().toISOString(),
            seller: { name: 'GAMERS ERP' },
            buyer: { id: order.userId },
            total: order.amount,
            currency: 'EUR',
        }

        const filename = `${order.invoiceRef}_FX.json`
        fs.writeFileSync(
            path.join(this.folder, filename),
            JSON.stringify(data, null, 2),
        )
        return filename
    }

    private createPdf(order: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument()
            const filename = `${order.invoiceRef}.pdf`
            const filepath = path.join(this.folder, filename)
            const stream = fs.createWriteStream(filepath)

            doc.pipe(stream)

            doc.fontSize(20).text('FACTURE', { align: 'center' })
            doc.moveDown()
            doc.fontSize(12).text(`Ref: ${order.invoiceRef}`)
            doc.text(`Date: ${new Date().toLocaleDateString()}`)
            doc.text(`Client ID: ${order.userId}`)
            doc.moveDown()
            doc.text(`Montant à prélever: ${order.amount} EUR`)
            doc.moveDown()
            doc.text(`Mode de paiement: ${order.paymentMethod}`)

            doc.end()

            stream.on('finish', () => resolve(filename))
            stream.on('error', reject)
        })
    }
}
