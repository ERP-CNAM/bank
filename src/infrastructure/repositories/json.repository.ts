import fs from 'fs'
import path from 'path'
import { ITransactionRepository } from '../../domain/interfaces/ITransactionRepository'

export class JsonTransactionRepository implements ITransactionRepository {
    private dbPath: string

    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'transactions.json')
        const dir = path.dirname(this.dbPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        if (!fs.existsSync(this.dbPath)) fs.writeFileSync(this.dbPath, '[]')
    }

    private load(): any[] {
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'))
        } catch {
            return []
        }
    }

    async save(transaction: any): Promise<void> {
        const all = this.load()
        const index = all.findIndex(
            (t: any) => t.invoiceRef === transaction.invoiceRef,
        )
        if (index >= 0) all[index] = transaction
        else all.push(transaction)
        fs.writeFileSync(this.dbPath, JSON.stringify(all, null, 2))
    }

    async get(ref: string): Promise<any | null> {
        return this.load().find((t: any) => t.invoiceRef === ref) || null
    }
}
