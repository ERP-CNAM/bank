export interface ITransactionRepository {
    save(transaction: any): Promise<void>
    get(ref: string): Promise<any | null>
}
