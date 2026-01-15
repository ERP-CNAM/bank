export interface BankOperationDTO {
    executionDate: string
    invoiceRef: string
    amount: number
    paymentMethod: 'SEPA' | 'CARD'
    status: 'PAID' | 'REJECTED'
}
