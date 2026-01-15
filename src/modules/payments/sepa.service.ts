import { create } from 'xmlbuilder2'
import fs from 'fs'
import path from 'path'

export class SepaService {
    private sepaFolder = path.join(__dirname, '../../../public/sepa')
    private cbFolder = path.join(__dirname, '../../../public/cb')

    constructor() {
        if (!fs.existsSync(this.sepaFolder))
            fs.mkdirSync(this.sepaFolder, { recursive: true })
        if (!fs.existsSync(this.cbFolder))
            fs.mkdirSync(this.cbFolder, { recursive: true })
    }

    public generateSepaFile(orders: any[], executionDate: string): string {
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
                    orders.reduce((acc: number, o: any) => acc + o.amount, 0),
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

        const xmlString = doc.end({ prettyPrint: true })
        const filename = `SEPA_${executionDate}_${Date.now()}.xml`
        const filepath = path.join(this.sepaFolder, filename)

        fs.writeFileSync(filepath, xmlString)
        console.log(`[SEPA] File generated: ${filename}`)
        return filename
    }

    // Génération Fichier demande CB (Format fictif JSON)
    public generateCardFile(orders: any[], executionDate: string): string {
        const content = {
            batchId: `CB-${Date.now()}`,
            date: executionDate,
            merchant: 'GAMERS ERP',
            transactions: orders.map((o) => ({
                ref: o.invoiceRef,
                amount: o.amount,
                currency: 'EUR',
                token: 'CARD_TOKEN_123', // Fictif
            })),
        }

        const filename = `CB_${executionDate}_${Date.now()}.json`
        const filepath = path.join(this.cbFolder, filename)

        fs.writeFileSync(filepath, JSON.stringify(content, null, 2))
        console.log(`[CARD] File generated: ${filename}`)
        return filename
    }
}
