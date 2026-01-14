import fs from 'fs';
import path from 'path';

// Chemin vers le fichier qui stockera les transactions
const DB_PATH = path.join(__dirname, '../../data/transactions.json');

export class DataManager {
    constructor() {
        // Crée le dossier data s'il n'existe pas
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Crée le fichier vide s'il n'existe pas
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify([]));
        }
    }

    // Lire toutes les transactions
    public load(): any[] {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    // Sauvegarder ou mettre à jour une transaction
    public save(transaction: any): void {
        const all = this.load();
        const index = all.findIndex((t: any) => t.invoiceRef === transaction.invoiceRef);
        
        if (index >= 0) {
            all[index] = transaction; // Mise à jour
        } else {
            all.push(transaction); // Nouveau
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(all, null, 2));
    }

    // Trouver une transaction par sa référence
    public get(ref: string): any {
        return this.load().find((t: any) => t.invoiceRef === ref);
    }
}