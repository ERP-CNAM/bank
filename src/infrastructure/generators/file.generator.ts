import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import { create } from 'xmlbuilder2'
import { IFileGenerator } from '../../domain/interfaces/IFileGenerator.js'

export class FileGenerator implements IFileGenerator {
    private baseDir: string

    constructor() {
        this.baseDir = path.join(process.cwd(), 'public')
        ;['invoices', 'sepa', 'cb'].forEach((d) => {
            const p = path.join(this.baseDir, d)
            if (!fs.existsSync(p)) {
                fs.mkdirSync(p, { recursive: true })
            }
        })
    }

    // Génère PDF et FacturX JSON
    async generateInvoice(
        data: any,
    ): Promise<{ pdf: string; facturx: string }> {
        const pdfName = `FACT_${data.invoiceRef}.pdf`
        const jsonName = `${data.invoiceRef}_FX.json`

        // PDF Generation
        await new Promise<void>((resolve, reject) => {
            const doc = new PDFDocument()
            const stream = fs.createWriteStream(
                path.join(this.baseDir, 'invoices', pdfName),
            )
            doc.pipe(stream)
            doc.fontSize(20)
                .text('FACTURE GAMERS ERP', { align: 'center' })
                .moveDown()
            doc.fontSize(12).text(`Ref: ${data.invoiceRef}`)
            doc.text(`Client: ${data.clientName}`)
            doc.text(`Montant: ${data.amount} EUR`)
            doc.end()
            stream.on('finish', resolve)
            stream.on('error', reject)
        })

        // FacturX JSON
        const fxData = {
            type: 'FACTUR-X-MINIMUM',
            id: data.invoiceRef,
            date: new Date().toISOString(),
            seller: { name: 'GAMERS ERP' },
            buyer: { id: data.userId, name: data.clientName },
            total: data.amount,
        }
        fs.writeFileSync(
            path.join(this.baseDir, 'invoices', jsonName),
            JSON.stringify(fxData, null, 2),
        )

        return { pdf: pdfName, facturx: jsonName }
    }

    generateBankingFile(
        orders: any[],
        type: 'SEPA' | 'CARD',
        executionDate: string,
    ): string {
        if (orders.length === 0) return ''

        if (type === 'SEPA') {
            const filename = `SEPA_${executionDate}_${Date.now()}.xml`
            const doc = create({ version: '1.0' })
                .ele('Document', {
                    xmlns: 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02',
                })
                .ele('CstmrDrctDbtInitn')
                .ele('GrpHdr')
                .ele('MsgId')
                .txt(`MSG-${Date.now()}`)
                .up()
                .up()

            const xml = doc.end({ prettyPrint: true })
            fs.writeFileSync(path.join(this.baseDir, 'sepa', filename), xml)
            return filename
        } else {
            const filename = `CB_${executionDate}_${Date.now()}.json`
            const content = {
                batchId: `CB-${Date.now()}`,
                transactions: orders.map((o) => ({
                    ref: o.invoiceRef,
                    amount: o.amount,
                })),
            }
            fs.writeFileSync(
                path.join(this.baseDir, 'cb', filename),
                JSON.stringify(content, null, 2),
            )
            return filename
        }
    }
}
