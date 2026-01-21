export interface TransactionResult {
    status: 'COMPLETED' | 'REJECTED' | 'PROCESSING'
    processedAt: string
    files?: {
        pdf?: string
        facturx?: string
        sepa?: string
        cb?: string
    }
    error?: string
}
