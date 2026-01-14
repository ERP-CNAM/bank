import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class InvoiceService {
    private folder = path.join(__dirname, '../../../public/invoices');

    constructor() {
        if (!fs.existsSync(this.folder)) fs.mkdirSync(this.folder, { recursive: true });
    }

    public createPdf(data: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const filename = `FACT_${data.invoiceRef}.pdf`;
            const filepath = path.join(this.folder, filename);
            
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Design simple de la facture
            doc.fontSize(20).text('FACTURE CLOUD GAMING', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Référence : ${data.invoiceRef}`);
            doc.text(`Client : ${data.clientName || 'Client Inconnu'}`);
            doc.text(`Date : ${new Date().toLocaleDateString()}`);
            doc.moveDown();
            doc.fontSize(16).text(`Montant Total : ${data.amount} €`, { align: 'right' });

            doc.end();

            stream.on('finish', () => resolve(filepath));
            stream.on('error', (err) => reject(err));
        });
    }
}