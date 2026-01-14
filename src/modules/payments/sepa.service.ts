import { create } from 'xmlbuilder2';
import fs from 'fs';
import path from 'path';

export class SepaService {
    private folder = path.join(__dirname, '../../../public/sepa');

    constructor() {
        if (!fs.existsSync(this.folder)) fs.mkdirSync(this.folder, { recursive: true });
    }

    public createXml(data: any): string {
        // Création d'un XML bancaire simplifié
        const doc = create({ version: '1.0' })
            .ele('Document')
                .ele('CstmrDrctDbtInitn')
                    .ele('GrpHdr')
                        .ele('MsgId').txt(`MSG-${Date.now()}`).up()
                        .ele('CreDtTm').txt(new Date().toISOString()).up()
                    .up()
                    .ele('PmtInf')
                        .ele('PmtInfId').txt(data.invoiceRef).up()
                        .ele('Dbtr')
                            .ele('Nm').txt(data.clientName || 'Unknown').up()
                            .ele('IBAN').txt(data.iban || 'FR76...').up()
                        .up()
                        .ele('RmtInf')
                            .ele('Ustrd').txt(`Paiement Facture ${data.invoiceRef}`).up()
                        .up()
                    .up()
                .up()
            .up();

        const xmlString = doc.end({ prettyPrint: true });
        const filename = `SEPA_${data.invoiceRef}.xml`;
        const filepath = path.join(this.folder, filename);

        fs.writeFileSync(filepath, xmlString);
        return filepath;
    }
}