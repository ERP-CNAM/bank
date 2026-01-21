export interface TransactionDTO {
    invoiceRef: string
    invoiceId?: string // UUID venant du back
    amount: number
    clientName: string
    userId: string
    paymentMethod: 'SEPA' | 'CARD'
    iban?: string
    executionDate?: string
}
