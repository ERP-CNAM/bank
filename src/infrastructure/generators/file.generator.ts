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

            // En-tête
            doc.fontSize(20)
                .text('FACTURE GAMERS ERP', { align: 'center' })
                .moveDown()

            // Contenu
            doc.fontSize(12).text(`Référence : ${data.invoiceRef}`)
            doc.text(`Date      : ${new Date().toLocaleDateString()}`)
            doc.moveDown()

            doc.text(`Client : ${data.clientName} (ID: ${data.userId})`)
            doc.moveDown()

            // Montant
            doc.fontSize(14).text(`Montant à payer : ${data.amount} EUR`, {
                align: 'right',
            })
            doc.fontSize(10).text(`Moyen de paiement : ${data.paymentMethod}`, {
                align: 'right',
            })

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
            currency: 'EUR',
            paymentMethod: data.paymentMethod,
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
                .ele('CreDtTm')
                .txt(new Date().toISOString())
                .up()
                .ele('NbOfTx')
                .txt(String(orders.length))
                .up()
                .ele('CtrlSum')
                .txt(
                    String(
                        orders.reduce(
                            (acc: number, o: any) => acc + o.amount,
                            0,
                        ),
                    ),
                )
                .up()
                .ele('InitgPty')
                .ele('Nm')
                .txt('GAMERS ERP')
                .up()
                .up()
                .up()

            // Ajout des transactions
            for (const order of orders) {
                doc.root()
                    .first()
                    .ele('PmtInf')
                    .ele('PmtInfId')
                    .txt(order.invoiceRef)
                    .up()
                    .ele('PmtMtd')
                    .txt('DD')
                    .up() // Direct Debit
                    .ele('ReqdColltnDt')
                    .txt(executionDate)
                    .up()
                    .ele('DrctDbtTxInf')
                    .ele('PmtId')
                    .ele('EndToEndId')
                    .txt(order.id)
                    .up()
                    .up()
                    .ele('InstdAmt', { Ccy: 'EUR' })
                    .txt(String(order.amount))
                    .up()
                    .ele('Dbtr')
                    .ele('Nm')
                    .txt('Client-' + order.userId)
                    .up()
                    .up()
                    .up()
                    .up()
            }

            const xml = doc.end({ prettyPrint: true })
            fs.writeFileSync(path.join(this.baseDir, 'sepa', filename), xml)
            console.log(`[SEPA] File generated: ${filename}`)
            return filename
        } else {
            const filename = `CB_${executionDate}_${Date.now()}.json`
            const content = {
                batchId: `CB-${Date.now()}`,
                date: executionDate,
                merchant: 'GAMERS ERP',
                transactions: orders.map((o) => ({
                    ref: o.invoiceRef,
                    amount: o.amount,
                    currency: 'EUR',
                })),
            }
            fs.writeFileSync(
                path.join(this.baseDir, 'cb', filename),
                JSON.stringify(content, null, 2),
            )
            console.log(`[CARD] File generated: ${filename}`)
            return filename
        }
    }
}
